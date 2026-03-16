const fs = require('fs');
const path = require('path');

// Directory containing memo files
const MEMOS_DIR = path.join(__dirname, '..', 'public', 'data', 'memos');

// Statistics
let stats = {
  totalFiles: 0,
  filesWithIssues: 0,
  fixedFiles: 0,
  errors: []
};

// Function to clean content
function cleanContent(content) {
  let hasIssues = false;
  let original = content;
  
  // 1. Replace Windows line endings (\r\n) with Unix line endings (\n)
  if (content.includes('\r\n')) {
    hasIssues = true;
    content = content.replace(/\r\n/g, '\n');
  }
  
  // 2. Remove any remaining carriage returns
  if (content.includes('\r')) {
    hasIssues = true;
    content = content.replace(/\r/g, '');
  }
  
  // 3. Remove trailing whitespace at end of content
  const trimmed = content.trimEnd();
  if (trimmed !== content) {
    hasIssues = true;
    content = trimmed;
  }
  
  return { content, hasIssues, changed: original !== content };
}

// Function to process a single memo file
function processFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const memo = JSON.parse(fileContent);
    
    let fileHasIssues = false;
    let fileChanged = false;
    
    // Clean content.zh if it exists
    if (memo.content && memo.content.zh) {
      const result = cleanContent(memo.content.zh);
      if (result.hasIssues) {
        fileHasIssues = true;
      }
      if (result.changed) {
        memo.content.zh = result.content;
        fileChanged = true;
      }
    }
    
    // Clean content.en if it exists
    if (memo.content && memo.content.en) {
      const result = cleanContent(memo.content.en);
      if (result.hasIssues) {
        fileHasIssues = true;
      }
      if (result.changed) {
        memo.content.en = result.content;
        fileChanged = true;
      }
    }
    
    if (fileHasIssues) {
      stats.filesWithIssues++;
      const relativePath = path.relative(MEMOS_DIR, filePath);
      console.log(`Found issues in: ${relativePath}`);
    }
    
    // Write back to file if changed
    if (fileChanged) {
      fs.writeFileSync(filePath, JSON.stringify(memo, null, 2) + '\n', 'utf8');
      stats.fixedFiles++;
      const relativePath = path.relative(MEMOS_DIR, filePath);
      console.log(`  ✓ Fixed: ${relativePath}`);
    }
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

// Function to recursively process all memo files
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip index.json file, process subdirectories
      if (entry.name !== 'index.json') {
        processDirectory(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json') {
      stats.totalFiles++;
      processFile(fullPath);
    }
  }
}

// Main execution
console.log('Starting to scan memo files for blank row issues...\n');
console.log('Checking for:');
console.log('  - Windows line endings (\\r\\n)');
console.log('  - Carriage returns (\\r)');
console.log('  - Trailing whitespace\n');

processDirectory(MEMOS_DIR);

// Print summary
console.log('\n' + '='.repeat(60));
console.log('Summary:');
console.log('='.repeat(60));
console.log(`Total memo files scanned: ${stats.totalFiles}`);
console.log(`Files with issues found: ${stats.filesWithIssues}`);
console.log(`Files fixed: ${stats.fixedFiles}`);

if (stats.errors.length > 0) {
  console.log(`\nErrors encountered: ${stats.errors.length}`);
  stats.errors.forEach(err => {
    console.error(`  - ${err.file}: ${err.error}`);
  });
}

console.log('\nDone!');
