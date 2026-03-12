const fs = require('fs');
const path = require('path');

/**
 * Validate all memo files for correct structure and data
 */

const VALID_TYPES = ['event', 'quote', 'figure', 'legal_case'];

function getMemoFolder(memoNum) {
  return (memoNum % 256).toString(16).padStart(2, '0');
}

function validateMemo(memo, filePath) {
  const errors = [];

  // Required fields
  if (!memo.id) errors.push('Missing id');
  if (!memo.title) errors.push('Missing title');
  if (!memo.content) errors.push('Missing content');
  if (!memo.type) errors.push('Missing type');
  if (!memo.tags) errors.push('Missing tags');

  // ID format
  if (memo.id && !/^memo_\d{4}$/.test(memo.id)) {
    errors.push(`Invalid ID format: ${memo.id} (should be memo_XXXX)`);
  }

  // Check if memo is in correct folder
  if (memo.id) {
    const memoNum = parseInt(memo.id.replace('memo_', ''));
    const expectedFolder = getMemoFolder(memoNum);
    const actualFolder = path.basename(path.dirname(filePath));
    if (expectedFolder !== actualFolder) {
      errors.push(`Memo in wrong folder. Expected: ${expectedFolder}, Actual: ${actualFolder}`);
    }
  }

  // Date format (if provided)
  if (memo.date !== null && memo.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(memo.date)) {
      errors.push(`Invalid date format: ${memo.date} (should be YYYY-MM-DD or null)`);
    }
  }

  // Valid type
  if (memo.type && !VALID_TYPES.includes(memo.type)) {
    errors.push(`Invalid type: ${memo.type} (must be one of: ${VALID_TYPES.join(', ')})`);
  }

  // Bilingual fields
  if (memo.title) {
    if (!memo.title.zh || !memo.title.en) {
      errors.push('Title must have both zh and en fields');
    }
  }

  if (memo.content) {
    if (!memo.content.zh || !memo.content.en) {
      errors.push('Content must have both zh and en fields');
    }
  }

  if (memo.tags) {
    if (!memo.tags.zh || !memo.tags.en) {
      errors.push('Tags must have both zh and en arrays');
    }
    if (memo.tags.zh && !Array.isArray(memo.tags.zh)) {
      errors.push('tags.zh must be an array');
    }
    if (memo.tags.en && !Array.isArray(memo.tags.en)) {
      errors.push('tags.en must be an array');
    }
    if (memo.tags.zh && memo.tags.zh.length === 0) {
      errors.push('Must have at least one Chinese tag');
    }
    if (memo.tags.en && memo.tags.en.length === 0) {
      errors.push('Must have at least one English tag');
    }
  }

  return errors;
}

function validateAllMemos() {
  console.log('🔍 Validating all memos...\n');

  const baseDir = path.join(__dirname, '..', 'data', 'memos');
  const allErrors = [];
  const ids = new Set();
  let totalMemos = 0;

  // Scan all 256 folders
  for (let i = 0; i < 256; i++) {
    const folderName = i.toString(16).padStart(2, '0');
    const folderPath = path.join(baseDir, folderName);

    if (!fs.existsSync(folderPath)) {
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      const filePath = path.join(folderPath, filename);
      totalMemos++;

      try {
        const memo = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Check for duplicate IDs
        if (ids.has(memo.id)) {
          allErrors.push(`${filePath}: Duplicate ID: ${memo.id}`);
        }
        ids.add(memo.id);

        // Validate memo structure
        const errors = validateMemo(memo, filePath);
        if (errors.length > 0) {
          allErrors.push(`${filePath}:\n  - ${errors.join('\n  - ')}`);
        }
      } catch (err) {
        allErrors.push(`${filePath}: Failed to parse JSON - ${err.message}`);
      }
    });
  }

  if (allErrors.length > 0) {
    console.error('❌ Validation failed:\n');
    allErrors.forEach(err => console.error(err + '\n'));
    process.exit(1);
  }

  console.log(`✅ All ${totalMemos} memos validated successfully!`);
}

validateAllMemos();
