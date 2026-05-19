#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * issue-to-memo.js
 *
 * Parse a GitHub Issue (created via .github/ISSUE_TEMPLATE/new-memo.yml)
 * into a memo JSON file and (optionally) write it into the data tree.
 *
 * Env:
 *   ISSUE_BODY        Raw issue body markdown produced by the issue form.
 *   ISSUE_NUMBER      (optional) GitHub issue number, used for commit/PR messages.
 *
 * Flags:
 *   --dry-run         Parse + validate only; do not write any files. Exits non-zero on error.
 *   --out-summary <p> Write a short human-readable preview to file path <p> (markdown).
 *
 * Exits with code 0 on success, non-zero on parse/validation failure.
 * Prints the resulting memo ID and file path on success (one per line, key=value).
 */

const fs = require('fs');
const path = require('path');

const TYPE_NAME_BY_NUM = { 1: 'figure', 2: 'event', 3: 'legal_case', 4: 'quote', 5: 'other' };
const VALID_TYPE_NUMS = [1, 2, 3, 4, 5];

// Map of issue-form field labels (as they appear in the rendered issue body)
// to internal keys. Match by a stable substring.
const FIELD_MATCHERS = [
  { key: 'title_zh', match: /标题\s*\/\s*Title/i },
  { key: 'content_zh', match: /内容\s*\/\s*Content/i },
  { key: 'type', match: /类型\s*\/\s*Type/i },
  { key: 'date', match: /日期\s*\/\s*Date/i },
  { key: 'tags_zh', match: /标签\s*\/\s*Tags/i },
  { key: 'sources', match: /来源\s*\/\s*Sources/i },
  { key: 'images', match: /图片\s*\/\s*Images/i },
  { key: 'related_memos', match: /相关备忘录\s*\/\s*Related\s*Memos/i },
];

const NO_RESPONSE = /^_no response_$/i;

function parseIssueBody(body) {
  const fields = {};
  if (!body) return fields;
  // Split on level-3 headings.
  const parts = body.split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const lines = part.split(/\r?\n/);
    const heading = (lines.shift() || '').trim();
    const value = lines.join('\n').trim();
    const matcher = FIELD_MATCHERS.find((m) => m.match.test(heading));
    if (!matcher) continue;
    if (!value || NO_RESPONSE.test(value)) {
      fields[matcher.key] = '';
    } else {
      fields[matcher.key] = value;
    }
  }
  return fields;
}

function parseTypeValue(raw) {
  if (!raw) return null;
  const m = raw.match(/^(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return VALID_TYPE_NUMS.includes(n) ? n : null;
}

function parseTags(raw) {
  if (!raw) return [];
  return raw
    .split(/[,，\n\r]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseRelatedMemos(raw) {
  if (!raw) return [];
  return raw
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (/^memo_\d{4}$/.test(t) ? t : null))
    .filter(Boolean);
}

function parseSources(raw) {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*\|\s*/);
      // Accept three shapes:
      //   URL
      //   Title | URL
      //   Title | URL | Archived URL
      // For the URL-only form we set title = url as a marker; the publish
      // pipeline runs fetch-source-titles.js which replaces these with the
      // real <title> from the page.
      let title;
      let url;
      let archived;
      if (parts.length === 1) {
        const sole = parts[0];
        if (!/^https?:\/\//i.test(sole)) return null;
        title = sole;
        url = sole;
      } else {
        [title, url, archived] = parts;
        if (!title || !url) return null;
      }
      const src = { title, url };
      if (archived) src.archived = archived;
      return src;
    })
    .filter(Boolean);
}

function parseImages(raw) {
  if (!raw) return [];
  // Walk the textarea line by line. Each `![alt](url)` image becomes one entry.
  // A blockquote line (`> caption`) on the immediately following non-blank line
  // is taken as the caption; otherwise alt text is used as the caption only if
  // it looks like prose (no file extension).
  const lines = raw.split(/\r?\n/);
  const out = [];
  const imgRe = /!\[([^\]]*)\]\(\s*<?([^\s>)]+)>?(?:\s+"[^"]*")?\s*\)/g;
  for (let i = 0; i < lines.length; i++) {
    imgRe.lastIndex = 0;
    let m;
    while ((m = imgRe.exec(lines[i])) !== null) {
      const alt = (m[1] || '').trim();
      const url = (m[2] || '').trim();
      if (!url) continue;
      // Look ahead for a blockquote caption on the next non-blank line, but
      // only if that line is itself not an image (otherwise it belongs to the
      // next image's context).
      let caption = '';
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (next.startsWith('>') && !/!\[[^\]]*\]\(/.test(next)) {
          caption = next.replace(/^>+\s*/, '').trim();
        }
        break;
      }
      if (!caption && alt && !/\.(png|jpe?g|gif|webp|svg|bmp|avif|heic)$/i.test(alt)) {
        caption = alt;
      }
      const entry = { url };
      if (caption) entry.caption = { zh: caption };
      out.push(entry);
    }
  }
  return out;
}

function memoFolder(memoNum) {
  return (memoNum % 256).toString(16).padStart(2, '0');
}

function findNextMemoId(baseDir) {
  let maxNum = 0;
  for (let i = 0; i < 256; i++) {
    const folder = i.toString(16).padStart(2, '0');
    const dir = path.join(baseDir, folder);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^memo_(\d{4})\.json$/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return maxNum + 1;
}

function buildMemo(fields, memoNum) {
  const errors = [];

  const titleZh = (fields.title_zh || '').trim();
  if (!titleZh) errors.push('Missing required field: Title (zh).');

  const contentZh = (fields.content_zh || '').trim();
  if (!contentZh) errors.push('Missing required field: Content (zh).');

  const typeNum = parseTypeValue(fields.type);
  if (typeNum === null) errors.push('Missing or invalid Type. Choose one of the dropdown options.');

  const dateRaw = (fields.date || '').trim();
  let date = null;
  if (dateRaw) {
    if (!/^\d{4}$/.test(dateRaw)) {
      errors.push(`Invalid Date: "${dateRaw}". Use MMDD format like "0512" or leave blank.`);
    } else {
      date = dateRaw;
    }
  }

  const tagsZh = parseTags(fields.tags_zh);
  const relatedMemos = parseRelatedMemos(fields.related_memos);
  const sources = parseSources(fields.sources);
  const images = parseImages(fields.images);

  if (!sources.length) {
    errors.push('At least one source is required. Add one line in the form `Title | URL`.');
  }
  // Lightly sanity-check malformed source lines so contributors get feedback.
  if (fields.sources) {
    const totalLines = fields.sources.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
    if (totalLines > sources.length) {
      errors.push(`Some source lines couldn't be parsed. Each line must be \`Title | URL\` (with optional \` | ArchivedURL\`). Parsed ${sources.length} of ${totalLines}.`);
    }
  }
  if (fields.images) {
    const hasImageMarkdown = /!\[[^\]]*\]\(\s*\S+\s*\)/.test(fields.images);
    if (hasImageMarkdown && images.length === 0) {
      errors.push('Image markdown was found but couldn\'t be parsed. Each image should look like `![alt](url)` on its own line.');
    }
  }

  const memo = {
    id: `memo_${String(memoNum).padStart(4, '0')}`,
    type: typeNum,
    updatedAt: new Date().toISOString(),
    title: { zh: titleZh },
    content: { zh: contentZh },
    date,
    tags: { zh: tagsZh },
  };
  if (images.length) memo.images = images;
  if (relatedMemos.length) memo.relatedMemos = relatedMemos;
  if (sources.length) memo.sources = sources;

  return { memo, errors };
}

function writeSummary(outPath, { memo, folder, filePath, errors, recognizedAnyField }) {
  const lines = [];
  lines.push('## 📝 备忘录提交预览 / Memo Submission Preview');
  lines.push('');

  if (!recognizedAnyField) {
    lines.push('👋 你好，感谢你想要为「苧麻备忘录」贡献内容！');
    lines.push('');
    lines.push('我没能在这个 Issue 中识别出备忘录表单的字段。如果你是想提交一条新的备忘录，请改用我们的结构化模板，');
    lines.push('它会指引你填好必要的字段（标题、内容、类型、来源…），并自动生成预览：');
    lines.push('');
    lines.push('👉 **[使用「提交新备忘录」模板](../../issues/new?template=new-memo.yml)**');
    lines.push('');
    lines.push('如果这个 Issue 本来不是要提交备忘录（例如 bug 报告、讨论），请让维护者移除 `memo-submission` 标签即可，机器人会停止打扰。');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('Hi! Thanks for wanting to contribute to RamieMemo.');
    lines.push('');
    lines.push('I couldn\'t find the memo-form fields in this issue. If you meant to submit a new memo, please use our structured template — it walks you through the required fields (title, content, type, source…) and auto-generates a preview:');
    lines.push('');
    lines.push('👉 **[Open a new memo with the template](../../issues/new?template=new-memo.yml)**');
    lines.push('');
    lines.push('If this issue is not a memo submission (bug report, discussion, etc.), just ask a maintainer to remove the `memo-submission` label and the bot will stay out of your way.');
    fs.writeFileSync(outPath, lines.join('\n'));
    return;
  }

  if (errors.length) {
    lines.push('哎呀 — 我读取了你的提交，但还差一点点就能通过校验。请帮我修正以下问题，然后**编辑此 Issue**（点击右上角 `···` → Edit）即可重新校验：');
    lines.push('');
    lines.push('### ❌ 需要修正 / Please fix');
    for (const e of errors) lines.push(`- ${e}`);
    lines.push('');
    lines.push('> 提示：所有必填字段必须有内容；日期是 4 位 `MMDD`（例如 `0512`）或留空；类型必须从下拉菜单中选择。');
    lines.push('> Tip: required fields must be non-empty; date is 4 digits `MMDD` (e.g. `0512`) or blank; type must be chosen from the dropdown.');
    lines.push('');
  } else {
    lines.push('✅ **解析成功！** 等待维护者审核。维护者审核通过后会添加 **`approved`** 标签，机器人将自动创建 PR 合入主分支。');
    lines.push('');
    lines.push('✅ Parsed successfully. A maintainer will review and add the **`approved`** label to publish; a PR will be opened automatically.');
    lines.push('');
  }
  lines.push('### 📋 解析结果 / Parsed metadata');
  lines.push('');
  lines.push(`- **ID**: \`${memo.id}\``);
  lines.push(`- **Folder**: \`${folder}\``);
  lines.push(`- **Type**: \`${memo.type ?? 'null'}\` (${TYPE_NAME_BY_NUM[memo.type] || 'unknown'})`);
  lines.push(`- **Date**: \`${memo.date || 'null'}\``);
  lines.push(`- **Tags (zh)**: ${memo.tags.zh.length ? memo.tags.zh.map((t) => '`' + t + '`').join(', ') : '_(none)_'}`);
  if (memo.relatedMemos) {
    lines.push(`- **Related memos**: ${memo.relatedMemos.map((t) => '`' + t + '`').join(', ')}`);
  }
  if (memo.sources) {
    lines.push(`- **Sources**: ${memo.sources.length}`);
  }
  if (memo.images) {
    lines.push(`- **Images**: ${memo.images.length}`);
  }
  lines.push(`- **Target file**: \`${filePath}\``);
  lines.push('');
  lines.push('<details><summary>Parsed JSON</summary>');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(memo, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('</details>');
  fs.writeFileSync(outPath, lines.join('\n'));
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const summaryIdx = args.indexOf('--out-summary');
  const summaryPath = summaryIdx >= 0 ? args[summaryIdx + 1] : null;

  const body = process.env.ISSUE_BODY || '';
  if (!body.trim()) {
    console.error('ISSUE_BODY env var is empty.');
    process.exit(2);
  }

  const baseDir = path.join(__dirname, '..', 'public', 'data', 'memos');
  const fields = parseIssueBody(body);
  const recognizedAnyField = Object.keys(fields).length > 0;
  const memoNum = findNextMemoId(baseDir);
  const { memo, errors } = buildMemo(fields, memoNum);
  if (!recognizedAnyField) {
    errors.unshift('No memo-form fields were recognized in this issue. Please use the "Submit New Memo" issue template.');
  }
  const folder = memoFolder(memoNum);
  const targetDir = path.join(baseDir, folder);
  const targetFile = path.join(targetDir, `${memo.id}.json`);
  const relFile = path.relative(path.join(__dirname, '..'), targetFile).split(path.sep).join('/');

  if (summaryPath) {
    writeSummary(summaryPath, { memo, folder, filePath: relFile, errors, recognizedAnyField });
  }

  if (errors.length) {
    console.error('Validation errors:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }

  console.log(`memo_id=${memo.id}`);
  console.log(`memo_folder=${folder}`);
  console.log(`memo_file=${relFile}`);
  console.log(`memo_type=${TYPE_NAME_BY_NUM[memo.type]}`);
  // Sanitize for $GITHUB_OUTPUT: single line, no leading/trailing whitespace.
  const titleZhOneLine = (memo.title && memo.title.zh ? memo.title.zh : '').replace(/\s+/g, ' ').trim();
  console.log(`memo_title_zh=${titleZhOneLine}`);

  if (dryRun) {
    console.log('Dry run: no files written.');
    return;
  }

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (fs.existsSync(targetFile)) {
    console.error(`Refusing to overwrite existing file: ${relFile}`);
    process.exit(3);
  }
  fs.writeFileSync(targetFile, JSON.stringify(memo, null, 2) + '\n');
  console.log(`Wrote ${relFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { parseIssueBody, buildMemo, memoFolder, findNextMemoId };
