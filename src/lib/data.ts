import { Memo, MemoIndex, MemoMetadata } from '@/types/memo';
import { getMemoPath, matchesToday } from './utils';
import { MemoNotFoundError, MemoIndexLoadError, NetworkError } from './errors';
import { getTagLabel, getTagId } from './tagLabels';
import { getMemoIdForDate } from './dailyNotes';

/**
 * Load the memo index (metadata for ALL memos)
 * 
 * @returns Promise resolving to the memo index
 * @throws {MemoIndexLoadError} When the index cannot be loaded
 * @throws {NetworkError} When the network request fails
 */
export async function loadMemoIndex(): Promise<MemoIndex> {
  const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
  
  try {
    const response = await fetch(`${basePath}/data/memos/index.json`);
    
    if (!response.ok) {
      throw new NetworkError(
        `Failed to load memo index: ${response.statusText}`,
        response.status
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      throw error;
    }
    throw new MemoIndexLoadError('Unable to load memo index');
  }
}

/**
 * Load a single memo by ID
 * 
 * @param memoId - The unique identifier of the memo
 * @returns Promise resolving to the full memo
 * @throws {MemoNotFoundError} When the memo doesn't exist
 * @throws {NetworkError} When the network request fails
 */
export async function loadMemo(memoId: string): Promise<Memo> {
  const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
  const path = getMemoPath(memoId);
  
  try {
    const response = await fetch(`${basePath}${path}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new MemoNotFoundError(memoId);
      }
      throw new NetworkError(
        `Failed to load memo ${memoId}: ${response.statusText}`,
        response.status
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof MemoNotFoundError || error instanceof NetworkError) {
      throw error;
    }
    throw new MemoNotFoundError(memoId);
  }
}

/**
 * Load multiple memos by IDs
 * 
 * @param memoIds - Array of memo identifiers to load
 * @returns Promise resolving to array of memos (skips failed loads)
 * @remarks Failed memo loads are logged but don't fail the entire operation
 */
export async function loadMultipleMemos(memoIds: string[]): Promise<Memo[]> {
  if (!memoIds || memoIds.length === 0) {
    return [];
  }
  
  const promises = memoIds.map(async (id) => {
    try {
      return await loadMemo(id);
    } catch (error) {
      console.error(`Failed to load memo ${id}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  return results.filter((memo): memo is Memo => memo !== null);
}

/**
 * Select a featured memo for the main page
 * Fixed per day based on date, or random if forceRandom is true
 * 
 * @param forceRandom - If true, selects a random memo; otherwise uses day-based selection
 * @returns Promise resolving to a featured memo
 * @throws {MemoIndexLoadError} When the memo index cannot be loaded
 */
export async function selectFeaturedMemo(forceRandom = false): Promise<Memo> {
  const index = await loadMemoIndex();
  
  if (!index.memos || index.memos.length === 0) {
    throw new MemoIndexLoadError('Memo index is empty');
  }
  
  let selectedMetadata: MemoMetadata;
  
  if (forceRandom) {
    // Random memo
    const randomIndex = Math.floor(Math.random() * index.memos.length);
    selectedMetadata = index.memos[randomIndex];
  } else {
    // Fixed based on day of year
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Use day of year as seed for consistent daily selection
    const memoIndex = dayOfYear % index.memos.length;
    selectedMetadata = index.memos[memoIndex];
  }
  
  // Load the full memo content
  return loadMemo(selectedMetadata.id);
}

/**
 * Simple hash function for strings
 * Returns a consistent positive integer for the same input
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get memo for a specific date
 * Uses daily notes mapping if available, otherwise falls back to hash-based selection
 * Same date will ALWAYS return same memo, regardless of navigation path
 * 
 * @param date - The date to get memo for
 * @returns Promise resolving to the memo for that date
 * @throws {MemoIndexLoadError} When the memo index cannot be loaded
 */
export async function getMemoForDate(date: Date): Promise<Memo> {
  // First, try to get memo from daily notes mapping
  const memoId = getMemoIdForDate(date);
  if (memoId) {
    try {
      return await loadMemo(memoId);
    } catch (error) {
      console.warn(`Daily note memo ${memoId} not found, falling back to hash-based selection`);
    }
  }
  
  // Fall back to hash-based selection
  const index = await loadMemoIndex();
  
  if (!index.memos || index.memos.length === 0) {
    throw new MemoIndexLoadError('Memo index is empty');
  }
  
  // Create consistent date string (YYYY-MM-DD) in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  // Hash the date string to get consistent index
  const hash = hashString(dateString);
  const memoIndex = hash % index.memos.length;
  const selectedMetadata = index.memos[memoIndex];
  
  // Load the full memo content
  return loadMemo(selectedMetadata.id);
}

/**
 * Check if query is a memo ID pattern and normalize it
 * Tries to match IDs with different zero-padding formats
 * 
 * @param query - Search query string
 * @returns Normalized memo ID (e.g., "memo_0023") if query is an ID pattern, null otherwise
 */
export function normalizeMemoIdQuery(query: string): string | null {
  const trimmed = query.trim();
  
  // Only match pure numbers like "123"
  if (/^\d+$/.test(trimmed)) {
    // Try common padding formats: memo_23, memo_0023, memo_00023
    return trimmed;
  }
  
  return null;
}

/**
 * Find memo by numeric ID, trying different zero-padding formats
 */
function findMemoById(index: MemoIndex, numericId: string): MemoMetadata | undefined {
  // Try different padding formats
  const paddingFormats = [
    `memo_${numericId}`,                                    // memo_23
    `memo_${numericId.padStart(4, '0')}`,                  // memo_0023
    `memo_${numericId.padStart(5, '0')}`,                  // memo_00023
  ];
  
  for (const format of paddingFormats) {
    const memo = index.memos.find(m => m.id === format);
    if (memo) return memo;
  }
  
  return undefined;
}

/**
 * Search memos in the index (lightweight, no content loading)
 * 
 * @param index - The memo index to search
 * @param query - Search query string
 * @param lang - Language to search in ('zh' or 'en')
 * @returns Array of matching memo metadata
 */
export function searchMemos(
  index: MemoIndex,
  query: string,
  lang: 'zh' | 'en'
): MemoMetadata[] {
  if (!query?.trim()) {
    return index.memos;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Check if query is a memo ID
  const numericId = normalizeMemoIdQuery(query);
  if (numericId) {
    const memo = findMemoById(index, numericId);
    // If exact ID found, return it; otherwise fall back to regular search
    if (memo) {
      return [memo];
    }
  }
  
  // Regular text search in title and tags
  return index.memos.filter(memo => {
    const title = memo.title?.[lang] || memo.title?.zh || '';
    const tags = memo.tags?.[lang] || memo.tags?.zh || [];
    
    const searchText = `
      ${title} 
      ${tags.join(' ')}
    `.toLowerCase();
    
    return searchText.includes(lowerQuery);
  });
}

/**
 * Search memos with full content (async, loads content on demand)
 * More powerful but slower - use with debouncing
 */
export async function searchMemosFullContent(
  index: MemoIndex,
  query: string,
  lang: 'zh' | 'en'
): Promise<MemoMetadata[]> {
  if (!query.trim()) return index.memos;
  
  // Check if query is a memo ID - if exact match found, return immediately
  const numericId = normalizeMemoIdQuery(query);
  if (numericId) {
    const memo = findMemoById(index, numericId);
    if (memo) {
      return [memo];
    }
    // If no exact ID match, continue with regular search
  }
  
  const lowerQuery = query.toLowerCase();
  const results: MemoMetadata[] = [];
  
  // First, do quick title/tag search
  const quickMatches = searchMemos(index, query, lang);
  
  // For non-matches, check content
  const toCheck = index.memos.filter(m => !quickMatches.includes(m));
  
  // Load content for remaining memos (in batches for performance)
  const batchSize = 50;
  for (let i = 0; i < toCheck.length; i += batchSize) {
    const batch = toCheck.slice(i, i + batchSize);
    const memos = await Promise.all(
      batch.map(async (metadata) => {
        try {
          const memo = await loadMemo(metadata.id);
          const content = memo.content?.[lang] || memo.content?.zh || '';
          const contentMatch = content.toLowerCase().includes(lowerQuery);
          return contentMatch ? metadata : null;
        } catch {
          return null;
        }
      })
    );
    results.push(...memos.filter(m => m !== null) as MemoMetadata[]);
  }
  
  // Combine quick matches with content matches
  return [...quickMatches, ...results];
}

/**
 * Filter memos by type
 */
export function filterByType(
  memos: MemoMetadata[],
  type: string | null
): MemoMetadata[] {
  if (!type) return memos;
  return memos.filter(memo => memo.type === type);
}

/**
 * Filter memos by tags - searches across both languages
 * 
 * @param memos - Array of memo metadata to filter
 * @param tagIds - Array of tag IDs or display names to filter by
 * @param lang - Current language (used for fallback matching)
 * @returns Filtered memos that match any of the specified tags
 */
export function filterByTags(
  memos: MemoMetadata[],
  tagIds: string[],
  lang: 'zh' | 'en'
): MemoMetadata[] {
  if (tagIds.length === 0) return memos;
  
  return memos.filter(memo => 
    tagIds.some(tagId => {
      // Normalize the tagId (in case it's a display name)
      const normalizedId = getTagId(tagId);
      
      // Check if the normalized tag ID matches any tag in either language
      const matchesZh = memo.tags.zh?.some(tag => getTagId(tag) === normalizedId) || false;
      const matchesEn = memo.tags.en?.some(tag => getTagId(tag) === normalizedId) || false;
      
      // Also check direct match for backward compatibility
      const directMatch = (memo.tags.zh?.includes(tagId) || false) || (memo.tags.en?.includes(tagId) || false);
      
      return matchesZh || matchesEn || directMatch;
    })
  );
}

/**
 * Filter memos by date range
 */
export function filterByDateRange(
  memos: MemoMetadata[],
  startDate: string | null,
  endDate: string | null
): MemoMetadata[] {
  if (!startDate && !endDate) return memos;
  
  return memos.filter(memo => {
    if (!memo.date) return false;
    if (startDate && memo.date < startDate) return false;
    if (endDate && memo.date > endDate) return false;
    return true;
  });
}

/**
 * Filter memos by date presence
 */
export function filterByDatePresence(
  memos: MemoMetadata[],
  filter: 'all' | 'with-date' | 'without-date'
): MemoMetadata[] {
  if (filter === 'all') return memos;
  if (filter === 'with-date') return memos.filter(m => m.date !== null && m.date !== undefined);
  return memos.filter(m => m.date === null || m.date === undefined);
}

/**
 * Sort memos
 */
export function sortMemos(
  memos: MemoMetadata[],
  sortBy: 'title' | 'recent',
  lang: 'zh' | 'en',
  direction: 'asc' | 'desc' = 'desc'
): MemoMetadata[] {
  const sorted = [...memos];
  
  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => {
        const titleA = a.title?.[lang] || a.title?.zh || '';
        const titleB = b.title?.[lang] || b.title?.zh || '';
        const comparison = titleA.localeCompare(titleB);
        return direction === 'desc' ? -comparison : comparison;
      });
    case 'recent':
      return sorted.sort((a, b) => {
        // Sort by updatedAt timestamp
        // Handle undefined updatedAt with fallback
        const aTime = a.updatedAt || '1970-01-01T00:00:00.000Z';
        const bTime = b.updatedAt || '1970-01-01T00:00:00.000Z';
        const comparison = bTime.localeCompare(aTime);
        return direction === 'desc' ? comparison : -comparison;
      });
    default:
      return sorted;
  }
}

/**
 * Get similar memos based on shared tags (for "More Like This" feature)
 * Excludes the current memo and returns up to N memos
 */
export function getSimilarMemos(
  index: MemoIndex,
  currentMemoId: string,
  lang: 'zh' | 'en',
  count: number = 2
): MemoMetadata[] {
  const currentMemo = index.memos.find(m => m.id === currentMemoId);
  if (!currentMemo) return [];

  const currentTags = new Set(currentMemo.tags?.[lang] || currentMemo.tags?.zh || []);
  
  // Score memos by tag overlap
  const scored = index.memos
    .filter(m => m.id !== currentMemoId)
    .map(memo => {
      const memoTags = memo.tags?.[lang] || memo.tags?.zh || [];
      const sharedTags = memoTags.filter(tag => currentTags.has(tag)).length;
      return { memo, score: sharedTags };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // If we have scored memos, return top N
  if (scored.length >= count) {
    return scored.slice(0, count).map(item => item.memo);
  }

  // If not enough scored memos, fill with random memos
  const remaining = index.memos
    .filter(m => m.id !== currentMemoId && !scored.find(s => s.memo.id === m.id))
    .sort(() => Math.random() - 0.5);

  const result = scored.map(item => item.memo);
  result.push(...remaining.slice(0, count - result.length));
  
  return result.slice(0, count);
}
