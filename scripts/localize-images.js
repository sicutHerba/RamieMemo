#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * localize-images.js
 *
 * Walks a memo JSON file, downloads every remote image referenced by
 * `images[].url`, saves it under `public/images/memos/<memo_id>_<n>.<ext>`,
 * and rewrites the memo to use the local path. The site only ever serves
 * local images, so this step turns issue-form submissions into
 * production-shaped data.
 *
 * Usage:
 *   node scripts/localize-images.js <path-to-memo.json>
 *
 * Safeguards:
 *   - https:// only by default (http:// allowed only with --allow-http).
 *   - DNS lookup is forced to IPv4 + checked against loopback/private/link-local
 *     ranges before every request (including across redirects). This blocks
 *     SSRF to cloud metadata services (169.254.169.254) and local networks.
 *   - Hard size cap (default 10 MB).
 *   - Max 5 redirects.
 *   - Content-Type must start with `image/`; file extension is derived from it.
 *   - Local paths (starting with `/`) are left untouched.
 *
 * Exit codes:
 *   0  success (memo updated or no images to localize)
 *   1  download/validation failure for one or more images
 *   2  bad invocation
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 30_000;

const EXT_FOR_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'image/heic': 'heic',
};

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
        // Mixed result. Be conservative: reject.
        return reject(new Error(`refused: ${hostname} resolves to a mix of public and private addresses (possible DNS rebinding)`));
      }
      resolve(safe);
    });
  });
}

function fetchOnce(urlStr, { allowHttp }) {
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

    // Connect straight to the IP we just vetted. Setting Host (and servername
    // for TLS SNI) keeps virtual-hosting and certificate validation working
    // while neutralizing any DNS-rebinding window.
    const lib = u.protocol === 'https:' ? https : http;
    const reqOpts = {
      host: addr.address,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      family: addr.family,
      headers: {
        Host: u.host,
        'User-Agent': 'ramie-memo-bot/1.0 (+https://github.com/sicutHerba/RamieMemo)',
        Accept: 'image/*,*/*;q=0.8',
      },
      timeout: REQUEST_TIMEOUT_MS,
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
      if (len && len > MAX_BYTES) {
        res.destroy();
        return reject(new Error(`content-length ${len} exceeds limit ${MAX_BYTES}`));
      }
      const chunks = [];
      let total = 0;
      res.on('data', (c) => {
        total += c.length;
        if (total > MAX_BYTES) {
          res.destroy(new Error(`body exceeds limit ${MAX_BYTES}`));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => {
        resolve({ contentType: res.headers['content-type'] || '', body: Buffer.concat(chunks) });
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function downloadSafe(urlStr, opts) {
  let current = urlStr;
  for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
    const r = await fetchOnce(current, opts);
    if (r.redirect) {
      current = r.redirect;
      continue;
    }
    return { ...r, finalUrl: current };
  }
  throw new Error(`too many redirects starting from ${urlStr}`);
}

function extFor(contentType, fallbackUrl) {
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (EXT_FOR_MIME[mime]) return EXT_FOR_MIME[mime];
  // Last-resort: try the URL path.
  try {
    const p = new URL(fallbackUrl).pathname;
    const m = p.match(/\.([a-z0-9]{2,5})$/i);
    if (m) return m[1].toLowerCase();
  } catch (_) { /* ignore */ }
  return null;
}

function isRemote(url) {
  return /^https?:\/\//i.test(url);
}

async function localizeMemo(memoPath, { allowHttp }) {
  const memo = JSON.parse(fs.readFileSync(memoPath, 'utf8'));
  if (!Array.isArray(memo.images) || memo.images.length === 0) {
    console.log(`No images on ${memo.id || path.basename(memoPath)}, skipping.`);
    return memo;
  }

  const repoRoot = path.resolve(__dirname, '..');
  const imagesDir = path.join(repoRoot, 'public', 'images', 'memos');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const failures = [];
  for (let i = 0; i < memo.images.length; i++) {
    const entry = memo.images[i];
    const url = (entry && entry.url) || '';
    if (!url) {
      failures.push(`images[${i}] has no url`);
      continue;
    }
    if (!isRemote(url)) {
      console.log(`images[${i}]: keeping local path ${url}`);
      continue;
    }
    try {
      console.log(`images[${i}]: downloading ${url}`);
      const { contentType, body, finalUrl } = await downloadSafe(url, { allowHttp });
      if (!/^image\//i.test(contentType)) {
        throw new Error(`unexpected content-type "${contentType}" (must be image/*)`);
      }
      const ext = extFor(contentType, finalUrl);
      if (!ext) throw new Error(`could not determine file extension (content-type: ${contentType})`);
      const filename = `${memo.id}_${String(i + 1).padStart(2, '0')}.${ext}`;
      const outPath = path.join(imagesDir, filename);
      fs.writeFileSync(outPath, body);
      const publicPath = `/images/memos/${filename}`;
      entry.url = publicPath;
      console.log(`images[${i}]: saved -> ${publicPath} (${body.length} bytes)`);
    } catch (e) {
      failures.push(`images[${i}] (${url}): ${e.message}`);
    }
  }

  // Write the memo back regardless (any successfully localized entries should
  // be persisted). Trailing newline matches the rest of the data tree.
  fs.writeFileSync(memoPath, JSON.stringify(memo, null, 2) + '\n');

  if (failures.length) {
    console.error('Image localization failures:');
    for (const f of failures) console.error('  - ' + f);
    const err = new Error(`${failures.length} image(s) failed to localize`);
    err.failures = failures;
    throw err;
  }
  return memo;
}

function main() {
  const args = process.argv.slice(2);
  const allowHttp = args.includes('--allow-http');
  const memoPath = args.find((a) => !a.startsWith('--'));
  if (!memoPath) {
    console.error('Usage: localize-images.js <path-to-memo.json> [--allow-http]');
    process.exit(2);
  }
  if (!fs.existsSync(memoPath)) {
    console.error(`File not found: ${memoPath}`);
    process.exit(2);
  }
  localizeMemo(memoPath, { allowHttp }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { localizeMemo, isPrivateIPv4, isPrivateIPv6 };
