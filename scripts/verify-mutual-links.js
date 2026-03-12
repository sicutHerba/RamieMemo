const fs = require('fs');
const path = require('path');

/**
 * Verify that all related memos have mutual (bidirectional) links
 * If memo A links to memo B, then memo B should also link to memo A
 */
function verifyMutualLinks() {
  const dataDir = path.join(__dirname, '..', 'out', 'data', 'memos');
  
  if (!fs.existsSync(dataDir)) {
    console.log('❌ Data directory not found. Please build the project first with "npm run build"');
    process.exit(1);
  }
  
  // Collect all memos and their relationships
  const memoMap = new Map();
  const issues = [];
  
  console.log('🔍 Reading all memos...\n');
  
  // Read all folders (00-ff)
  for (let i = 0; i < 256; i++) {
    const folder = i.toString(16).padStart(2, '0');
    const folderPath = path.join(dataDir, folder);
    
    if (!fs.existsSync(folderPath)) continue;
    
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(folderPath, file);
      try {
        const memo = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        memoMap.set(memo.id, {
          relatedMemos: memo.relatedMemos || [],
          folder: folder,
          file: file
        });
      } catch (err) {
        console.error(`❌ Error reading ${file}:`, err.message);
      }
    }
  }
  
  console.log(`✓ Found ${memoMap.size} memos\n`);
  
  // Check for mutual links
  console.log('🔗 Verifying mutual links...\n');
  
  let totalLinks = 0;
  let missingLinks = 0;
  let orphanLinks = 0;
  
  for (const [memoId, memoData] of memoMap.entries()) {
    const { relatedMemos } = memoData;
    
    if (!relatedMemos || relatedMemos.length === 0) continue;
    
    totalLinks += relatedMemos.length;
    
    for (const relatedId of relatedMemos) {
      // Check if related memo exists
      if (!memoMap.has(relatedId)) {
        issues.push({
          type: 'orphan',
          memo: memoId,
          related: relatedId,
          message: `${memoId} → ${relatedId} (target doesn't exist)`
        });
        orphanLinks++;
        continue;
      }
      
      // Check if the link is mutual
      const relatedMemoData = memoMap.get(relatedId);
      if (!relatedMemoData.relatedMemos.includes(memoId)) {
        issues.push({
          type: 'missing',
          memo: memoId,
          related: relatedId,
          message: `${memoId} → ${relatedId} (missing reverse link ${relatedId} → ${memoId})`
        });
        missingLinks++;
      }
    }
  }
  
  // Display results
  console.log('📊 Summary:');
  console.log(`  Total memos: ${memoMap.size}`);
  console.log(`  Total links: ${totalLinks}`);
  console.log(`  Mutual pairs: ${(totalLinks - missingLinks - orphanLinks) / 2}`);
  console.log(`  Missing reverse links: ${missingLinks}`);
  console.log(`  Orphan links (target not found): ${orphanLinks}`);
  
  if (issues.length > 0) {
    console.log('\n\n⚠️  Issues found:\n');
    
    // Group by type
    const orphans = issues.filter(i => i.type === 'orphan');
    const missing = issues.filter(i => i.type === 'missing');
    
    if (orphans.length > 0) {
      console.log('🔴 Orphan links (target memo doesn\'t exist):');
      orphans.forEach(issue => console.log(`  ${issue.message}`));
      console.log('');
    }
    
    if (missing.length > 0) {
      console.log('🟡 Missing reverse links:');
      missing.forEach(issue => console.log(`  ${issue.message}`));
      console.log('');
    }
    
    console.log('\n💡 To fix these issues, you can:');
    console.log('   1. For missing reverse links: Run the fix-related-memos.js script on source data');
    console.log('   2. For orphan links: Remove invalid references or add the missing memos');
    console.log('   3. Then rebuild with "npm run build"\n');
  } else {
    console.log('\n✅ All mutual links are correct!\n');
  }
  
  return issues.length === 0;
}

const success = verifyMutualLinks();
process.exit(success ? 0 : 1);
