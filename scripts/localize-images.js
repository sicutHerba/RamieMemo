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
 *   node scripts/localize-images.js <path-to-memo.json> [--allow-http]
 *
 * Network safety lives in scripts/lib/safe-http.js (SSRF defense, redirect
 * re-vetting, size cap). On top of that this script:
 *   - rejects responses whose Content-Type is not image/*
 *   - derives the file extension from the MIME type (URL path as fallback)
 *   - skips entries whose url already starts with "/"
 *
 * Exit codes:
 *   0  success (memo updated or no images to localize)
 *   1  download/validation failure for one or more images
 *   2  bad invocation
 */

const fs = require('fs');
const path = require('path');
const { safeGet } = require('./lib/safe-http');

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const IMAGE_ACCEPT = 'image/*,*/*;q=0.8';

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

function extFor(contentType, fallbackUrl) {
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (EXT_FOR_MIME[mime]) return EXT_FOR_MIME[mime];
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
      const { contentType, body, finalUrl } = await safeGet(url, {
        allowHttp,
        accept: IMAGE_ACCEPT,
        maxBytes: MAX_BYTES,
      });
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

module.exports = { localizeMemo };
