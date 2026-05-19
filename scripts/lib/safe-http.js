/* eslint-disable no-console */
/**
 * safe-http.js — SSRF-safe HTTP(S) GET used by image localization and source
 * title fetching.
 *
 * Safeguards:
 *   - https:// only by default (http:// allowed only with allowHttp:true).
 *   - Hostname is DNS-resolved up front. Only public unicast addresses
 *     (IPv4 + IPv6) pass. Any private/loopback/link-local/multicast result
 *     causes a rejection, including the *mixed* case (DNS rebinding).
 *   - Request is made directly to the vetted IP with Host header + TLS SNI,
 *     so there is no second DNS resolution window for an attacker to flip.
 *   - Each redirect hop is independently re-vetted.
 *   - Hard size cap and request timeout.
 */

const dns = require('dns');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 30_000;

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  if (lower.startsWith('ff')) return true; // multicast
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — fall through to v4 check.
  const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped) return isPrivateIPv4(v4Mapped[1]);
  return false;
}

function isPrivateAddress(addr, family) {
  if (family === 4) return isPrivateIPv4(addr);
  if (family === 6) return isPrivateIPv6(addr);
  return true;
}

function resolveSafe(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true }, (err, addrs) => {
      if (err) return reject(err);
      const safe = addrs.find((a) => !isPrivateAddress(a.address, a.family));
      if (!safe) return reject(new Error(`refused: ${hostname} resolves only to private/loopback addresses`));
      if (addrs.some((a) => isPrivateAddress(a.address, a.family))) {
        return reject(new Error(`refused: ${hostname} resolves to a mix of public and private addresses (possible DNS rebinding)`));
      }
      resolve(safe);
    });
  });
}

function fetchOnce(urlStr, { allowHttp, accept, maxBytes, timeoutMs, userAgent }) {
  return new Promise(async (resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch (e) {
      return reject(new Error(`invalid URL: ${urlStr}`));
    }
    if (u.protocol !== 'https:' && !(allowHttp && u.protocol === 'http:')) {
      return reject(new Error(`refused scheme ${u.protocol} (use https://)`));
    }
    let addr;
    try {
      addr = await resolveSafe(u.hostname);
    } catch (e) {
      return reject(e);
    }

    const lib = u.protocol === 'https:' ? https : http;
    const reqOpts = {
      host: addr.address,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      family: addr.family,
      headers: {
        Host: u.host,
        'User-Agent': userAgent || 'ramie-memo-bot/1.0 (+https://github.com/sicutHerba/RamieMemo)',
        Accept: accept || '*/*',
      },
      timeout: timeoutMs || DEFAULT_TIMEOUT_MS,
    };
    if (u.protocol === 'https:') reqOpts.servername = u.hostname;

    const req = lib.request(reqOpts, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        return resolve({ redirect: new URL(res.headers.location, urlStr).toString() });
      }
      if (status !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${status} from ${urlStr}`));
      }
      const len = Number(res.headers['content-length'] || 0);
      if (len && maxBytes && len > maxBytes) {
        res.destroy();
        return reject(new Error(`content-length ${len} exceeds limit ${maxBytes}`));
      }
      const chunks = [];
      let total = 0;
      res.on('data', (c) => {
        total += c.length;
        if (maxBytes && total > maxBytes) {
          res.destroy(new Error(`body exceeds limit ${maxBytes}`));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => {
        resolve({
          statusCode: status,
          contentType: res.headers['content-type'] || '',
          body: Buffer.concat(chunks),
        });
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function safeGet(urlStr, opts = {}) {
  const maxRedirects = opts.maxRedirects || DEFAULT_MAX_REDIRECTS;
  let current = urlStr;
  for (let hops = 0; hops <= maxRedirects; hops++) {
    const r = await fetchOnce(current, opts);
    if (r.redirect) {
      current = r.redirect;
      continue;
    }
    return { ...r, finalUrl: current };
  }
  throw new Error(`too many redirects starting from ${urlStr}`);
}

module.exports = { safeGet, resolveSafe, isPrivateIPv4, isPrivateIPv6, isPrivateAddress };
