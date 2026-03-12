const fs = require('fs');
const path = require('path');

/**
 * Build index.json from all memo files
 * This script scans all 256 hash folders and creates a metadata index
 */

function getMemoFolder(memoNum) {
  return (memoNum % 256).toString(16).padStart(2, '0');
}

function buildIndex() {
  console.log('🔨 Building memo index...\n');

  const baseDir = path.join(__dirname, '..', 'public', 'data', 'memos');
  const memoMetadata = [];
  const tagCounts = { zh: {}, en: {} };
  const typeCounts = {};
  let withDates = 0;
  let withoutDates = 0;

  // Scan all 256 folders
  for (let i = 0; i < 256; i++) {
    const folderName = i.toString(16).padStart(2, '0');
    const folderPath = path.join(baseDir, folderName);

    if (!fs.existsSync(folderPath)) {
      continue;
    }

    // Read all JSON files in this folder
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      try {
        const filePath = path.join(folderPath, filename);
        const memo = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Validate memo has required fields
        if (!memo.id || !memo.title || !memo.type) {
          console.warn(`⚠️  Skipping invalid memo: ${filename}`);
          return;
        }

        // Extract metadata (no content)
        const metadata = {
          id: memo.id,
          title: memo.title,
          date: memo.date || null,
          type: memo.type,
          tags: memo.tags,
          folder: folderName,
          updatedAt: memo.updatedAt || new Date().toISOString() // Fallback for old memos
        };

        memoMetadata.push(metadata);

        // Count tags
        if (memo.tags) {
          if (memo.tags.zh) {
            memo.tags.zh.forEach(tag => {
              tagCounts.zh[tag] = (tagCounts.zh[tag] || 0) + 1;
            });
          }
          if (memo.tags.en) {
            memo.tags.en.forEach(tag => {
              tagCounts.en[tag] = (tagCounts.en[tag] || 0) + 1;
            });
          }
        }

        // Count types
        typeCounts[memo.type] = (typeCounts[memo.type] || 0) + 1;

        // Count dates
        if (memo.date) {
          withDates++;
        } else {
          withoutDates++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${filename}:`, err.message);
      }
    });
  }

  // Sort memos by ID
  memoMetadata.sort((a, b) => {
    const aNum = parseInt(a.id.replace('memo_', ''));
    const bNum = parseInt(b.id.replace('memo_', ''));
    return aNum - bNum;
  });

  // Build index
  const index = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalMemos: memoMetadata.length,
    folderCount: 256,
    memos: memoMetadata,
    tags: tagCounts,
    types: typeCounts,
    withDates,
    withoutDates
  };

  // Write index
  const indexPath = path.join(baseDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`✅ Built index with ${memoMetadata.length} memos`);
  console.log(`   Index size: ${(JSON.stringify(index).length / 1024).toFixed(2)} KB`);
  console.log(`   Types:`, typeCounts);
  console.log(`   With dates: ${withDates}, Without dates: ${withoutDates}`);
  console.log(`   Chinese tags: ${Object.keys(tagCounts.zh).length}`);
  console.log(`   English tags: ${Object.keys(tagCounts.en).length}\n`);
  
  console.log('✅ Index.json created at public/data/memos/index.json\n');
}

buildIndex();
