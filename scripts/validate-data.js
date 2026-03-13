const fs = require('fs');
const path = require('path');

/**
 * Validate all memo files for correct structure and data
 */

const VALID_TYPES = [1, 2, 3, 4, 5]; // 1=figure, 2=event, 3=legal_case, 4=quote, 5=other

function getMemoFolder(memoNum) {
  return (memoNum % 256).toString(16).padStart(2, '0');
}

function validateMemo(memo, filePath) {
  const errors = [];

  // Required fields
  if (!memo.id) errors.push('Missing id');
  if (!memo.title) errors.push('Missing title');
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

  // Date format (if provided) - MMDD format or null
  if (memo.date !== null && memo.date !== undefined) {
    if (!/^\d{4}$/.test(memo.date)) {
      errors.push(`Invalid date format: ${memo.date} (should be MMDD format like "1203" or null)`);
    }
  }

  // Valid type (numeric)
  if (memo.type && !VALID_TYPES.includes(memo.type)) {
    errors.push(`Invalid type: ${memo.type} (must be one of: ${VALID_TYPES.join(', ')})`);
  }

  // Title must have zh field (en is optional)
  if (memo.title) {
    if (!memo.title.zh) {
      errors.push('Title must have zh field');
    }
  }

  // Content must have zh field if present (en is optional)
  if (memo.content) {
    if (!memo.content.zh) {
      errors.push('Content must have zh field');
    }
  }

  // Tags must have zh array (en is optional)
  if (memo.tags) {
    if (!memo.tags.zh) {
      errors.push('Tags must have zh array');
    }
    if (memo.tags.zh && !Array.isArray(memo.tags.zh)) {
      errors.push('tags.zh must be an array');
    }
  }

  // Check relatedMemos if present
  if (memo.relatedMemos && !Array.isArray(memo.relatedMemos)) {
    errors.push('relatedMemos must be an array');
  }

  // Check sources if present
  if (memo.sources) {
    if (!Array.isArray(memo.sources)) {
      errors.push('sources must be an array');
    } else {
      memo.sources.forEach((source, idx) => {
        if (!source.title) errors.push(`Source ${idx} missing title`);
        if (!source.url) errors.push(`Source ${idx} missing url`);
      });
    }
  }

  return errors;
}

function validateAllMemos() {
  console.log('🔍 Validating all memos...\n');

  const baseDir = path.join(__dirname, '..', 'public', 'data', 'memos');
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
