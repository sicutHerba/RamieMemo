#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * fetch-source-titles.js
 *
 * Walks a memo JSON file. For every entry in `sources[]` whose `title` equals
 * its `url` (the marker produced by `issue-to-memo.js` when the contributor
 * provided a URL with no title), this script GETs the page and replaces the
 * placeholder with the `<title>` tag's text. Already-titled sources are left
 * alone.
 *
 * Usage: node scripts/fetch-source-titles.js <path-to-memo.json>
 *
 * Failures for individual URLs are non-fatal: the placeholder URL stays and
 * the script logs a warning. This keeps the publish pipeline going even when
 * an external page is briefly unreachable.
 */

const fs = require('fs');
const path = require('path');
const { safeGet } = require('./lib/safe-http');

const MAX_BYTES = 512 * 1024; // 512 KB is plenty to find <title>
const HTML_ACCEPT = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8';

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&[a-z]+;|&#?\w+;/gi, (e) => HTML_ENTITIES[e.toLowerCase()] || e);
}

function extractTitle(html) {
  // Strip <script>/<style> so we don't grab a title-like string from JS.
  const cleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
  // Prefer og:title (often cleaner than <title>).
  const og = cleaned.match(/<meta\s+[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i)
    || cleaned.match(/<meta\s+[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:title["']/i);
  if (og && og[1]) return cleanTitle(og[1]);
  const m = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m && m[1]) return cleanTitle(m[1]);
  return null;
}

function cleanTitle(raw) {
  return decodeEntities(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200); // hard cap to avoid runaway titles
}

async function enrich(memoPath, { allowHttp } = {}) {
  const memo = JSON.parse(fs.readFileSync(memoPath, 'utf8'));
  if (!Array.isArray(memo.sources) || memo.sources.length === 0) {
    console.log('No sources to enrich.');
    return memo;
  }

  let changed = false;
  for (let i = 0; i < memo.sources.length; i++) {
    const src = memo.sources[i];
    if (!src || !src.url) continue;
    // Marker: title === url means contributor only gave a URL.
    if (src.title && src.title !== src.url) {
      console.log(`sources[${i}]: title already set, skipping`);
      continue;
    }
    try {
      console.log(`sources[${i}]: fetching ${src.url}`);
      const { contentType, body } = await safeGet(src.url, {
        allowHttp,
        accept: HTML_ACCEPT,
        maxBytes: MAX_BYTES,
      });
      if (!/^(text\/html|application\/xhtml)/i.test(contentType)) {
        console.warn(`sources[${i}]: non-HTML response (${contentType}); leaving title as URL`);
        continue;
      }
      const title = extractTitle(body.toString('utf8'));
      if (!title) {
        console.warn(`sources[${i}]: no <title> found; leaving title as URL`);
        continue;
      }
      console.log(`sources[${i}]: -> "${title}"`);
      src.title = title;
      changed = true;
    } catch (e) {
      console.warn(`sources[${i}]: fetch failed (${e.message}); leaving title as URL`);
    }
  }

  if (changed) {
    fs.writeFileSync(memoPath, JSON.stringify(memo, null, 2) + '\n');
    console.log(`Updated ${memoPath}`);
  } else {
    console.log('No source titles changed.');
  }
  return memo;
}

function main() {
  const args = process.argv.slice(2);
  const allowHttp = args.includes('--allow-http');
  const memoPath = args.find((a) => !a.startsWith('--'));
  if (!memoPath) {
    console.error('Usage: fetch-source-titles.js <path-to-memo.json> [--allow-http]');
    process.exit(2);
  }
  if (!fs.existsSync(memoPath)) {
    console.error(`File not found: ${memoPath}`);
    process.exit(2);
  }
  enrich(memoPath, { allowHttp }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { enrich, extractTitle };
