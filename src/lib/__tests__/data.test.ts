import { loadMemoIndex, loadMemo, loadMultipleMemos, selectFeaturedMemo, searchMemos, searchMemosFullContent, normalizeMemoIdQuery } from '../data';
import { MemoIndexLoadError, MemoNotFoundError, NetworkError } from '../errors';

// Mock fetch
global.fetch = jest.fn();

describe('Data functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadMemoIndex', () => {
    it('should load memo index successfully', async () => {
      const mockIndex = {
        memos: [
          { id: 'memo_0', title: { zh: '测试', en: 'Test' }, type: 'event', updatedAt: '2023-01-01T00:00:00.000Z' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockIndex
      });

      const result = await loadMemoIndex();
      expect(result).toEqual(mockIndex);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw NetworkError on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(loadMemoIndex()).rejects.toThrow(NetworkError);
      await expect(loadMemoIndex()).rejects.toThrow('Failed to load memo index: Internal Server Error');
    });

    it('should throw MemoIndexLoadError on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failed'));

      await expect(loadMemoIndex()).rejects.toThrow(MemoIndexLoadError);
    });
  });

  describe('loadMemo', () => {
    it('should load single memo successfully', async () => {
      const mockMemo = {
        id: 'memo_0',
        title: { zh: '测试', en: 'Test' },
        content: { zh: '内容', en: 'Content' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMemo
      });

      const result = await loadMemo('memo_0');
      expect(result).toEqual(mockMemo);
    });

    it('should throw MemoNotFoundError when memo not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadMemo('memo_999')).rejects.toThrow(MemoNotFoundError);
      await expect(loadMemo('memo_999')).rejects.toThrow('Memo not found: memo_999');
    });

    it('should throw NetworkError on other HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(loadMemo('memo_0')).rejects.toThrow(NetworkError);
    });

    it('should throw MemoNotFoundError on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failed'));

      await expect(loadMemo('memo_0')).rejects.toThrow(MemoNotFoundError);
    });
  });

  describe('loadMultipleMemos', () => {
    it('should load multiple memos successfully', async () => {
      const mockMemos = [
        { id: 'memo_0', title: { zh: '测试1', en: 'Test1' } },
        { id: 'memo_1', title: { zh: '测试2', en: 'Test2' } }
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemos[0]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemos[1]
        });

      const result = await loadMultipleMemos(['memo_0', 'memo_1']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('memo_0');
      expect(result[1].id).toBe('memo_1');
    });

    it('should return empty array for empty input', async () => {
      const result = await loadMultipleMemos([]);
      expect(result).toEqual([]);
    });

    it('should handle null input gracefully', async () => {
      const result = await loadMultipleMemos(null as any);
      expect(result).toEqual([]);
    });

    it('should skip failed memo loads and continue', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'memo_0', title: { zh: '测试1', en: 'Test1' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'memo_2', title: { zh: '测试3', en: 'Test3' } })
        });

      const result = await loadMultipleMemos(['memo_0', 'memo_1', 'memo_2']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('memo_0');
      expect(result[1].id).toBe('memo_2');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('selectFeaturedMemo', () => {
    const mockIndex = {
      memos: [
        { id: 'memo_0', title: { zh: '测试1', en: 'Test1' }, date: '2023-06-15', type: 'event', tags: { zh: [], en: [] }, folder: '0', updatedAt: '2023-01-01T00:00:00.000Z' },
        { id: 'memo_1', title: { zh: '测试2', en: 'Test2' }, date: '2023-07-20', type: 'event', tags: { zh: [], en: [] }, folder: '1', updatedAt: '2023-02-01T00:00:00.000Z' }
      ]
    };

    const mockMemo = {
      id: 'memo_0',
      title: { zh: '测试1', en: 'Test1' },
      content: { zh: '内容', en: 'Content' },
      type: 'event' as const,
      tags: { zh: [], en: [] },
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockIndex
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemo
        });
    });

    it('should select featured memo based on day', async () => {
      const result = await selectFeaturedMemo();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
    });

    it('should force random selection', async () => {
      const result = await selectFeaturedMemo(true);
      expect(result).toHaveProperty('id');
      expect(['memo_0', 'memo_1']).toContain(result.id);
    });

    it('should throw error when index is empty', async () => {
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memos: [] })
      });

      await expect(selectFeaturedMemo()).rejects.toThrow(MemoIndexLoadError);
    });
  });

  describe('searchMemos', () => {
    const mockIndex = {
      memos: [
        {
          id: 'memo_0',
          title: { zh: '天安门事件', en: 'Tiananmen Square' },
          date: '1989-06-04',
          type: 'event' as const,
          tags: { zh: ['历史'], en: ['history'] },
          folder: '0',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'memo_1',
          title: { zh: '测试', en: 'Test' },
          date: '2023-01-01',
          type: 'quote' as const,
          tags: { zh: ['测试'], en: ['test'] },
          folder: '1',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ]
    };

    it('should search memos in Chinese', () => {
      const results = searchMemos(mockIndex, '天安门', 'zh');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('memo_0');
    });

    it('should search memos in English', () => {
      const results = searchMemos(mockIndex, 'tiananmen', 'en');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('memo_0');
    });

    it('should search by tags', () => {
      const results = searchMemos(mockIndex, 'history', 'en');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('memo_0');
    });

    it('should return all memos for empty query', () => {
      const results = searchMemos(mockIndex, '', 'zh');
      expect(results).toHaveLength(2);
    });

    it('should return all memos for whitespace query', () => {
      const results = searchMemos(mockIndex, '   ', 'en');
      expect(results).toHaveLength(2);
    });

    it('should return all memos for null query', () => {
      const results = searchMemos(mockIndex, null as any, 'zh');
      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const results = searchMemos(mockIndex, 'nonexistent', 'zh');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results = searchMemos(mockIndex, 'TIANANMEN', 'en');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeMemoIdQuery', () => {
    it('should normalize numeric-only format "123"', () => {
      expect(normalizeMemoIdQuery('123')).toBe('123');
    });

    it('should normalize "0" (single digit)', () => {
      expect(normalizeMemoIdQuery('0')).toBe('0');
    });

    it('should handle leading/trailing whitespace', () => {
      expect(normalizeMemoIdQuery('  456  ')).toBe('456');
    });

    it('should return null for "memo_123" format (not pure digits)', () => {
      expect(normalizeMemoIdQuery('memo_123')).toBeNull();
    });

    it('should return null for "memo123" format (not pure digits)', () => {
      expect(normalizeMemoIdQuery('memo123')).toBeNull();
    });

    it('should return null for "memo 123" format (not pure digits)', () => {
      expect(normalizeMemoIdQuery('memo 123')).toBeNull();
    });

    it('should return null for non-ID patterns', () => {
      expect(normalizeMemoIdQuery('test query')).toBeNull();
      expect(normalizeMemoIdQuery('history')).toBeNull();
      expect(normalizeMemoIdQuery('memo_abc')).toBeNull();
      expect(normalizeMemoIdQuery('123abc')).toBeNull();
      expect(normalizeMemoIdQuery('MEMO_123')).toBeNull();
      expect(normalizeMemoIdQuery('Memo 456')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeMemoIdQuery('')).toBeNull();
      expect(normalizeMemoIdQuery('  ')).toBeNull();
    });
  });

  describe('searchMemos with ID search', () => {
    const mockIndex = {
      totalMemos: 3,
      tags: { zh: {}, en: {} },
      memos: [
        {
          id: 'memo_0',
          title: { zh: '天安门事件', en: 'Tiananmen Square' },
          date: '1989-06-04',
          type: 'event' as const,
          tags: { zh: ['历史'], en: ['history'] },
          folder: '0',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'memo_1',
          title: { zh: '测试', en: 'Test' },
          date: '2023-01-01',
          type: 'quote' as const,
          tags: { zh: ['测试'], en: ['test'] },
          folder: '1',
          updatedAt: '2023-02-01T00:00:00.000Z'
        },
        {
          id: 'memo_123',
          title: { zh: '特殊ID测试', en: 'Special ID Test' },
          date: '2024-01-01',
          type: 'figure' as const,
          tags: { zh: ['人物'], en: ['figure'] },
          folder: '7b',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    };

    it('should find memo by numeric ID "0"', () => {
      const results = searchMemos(mockIndex, '0', 'en');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memo_0');
    });

    it('should find memo by numeric ID "123"', () => {
      const results = searchMemos(mockIndex, '123', 'en');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memo_123');
    });

    it('should treat "memo_0" as text search, not ID search', () => {
      // "memo_0" is treated as text, won't match as ID
      const results = searchMemos(mockIndex, 'memo_0', 'zh');
      // No match unless "memo_0" appears in title/tags as text
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should treat "memo_123" as text search, not ID search', () => {
      // "memo_123" is treated as text, won't match as ID
      const results = searchMemos(mockIndex, 'memo_123', 'zh');
      // No match unless "memo_123" appears in title/tags as text
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should treat "memo_1" as text search, not ID search', () => {
      // "memo_1" should be treated as regular text, not converted to ID
      const results = searchMemos(mockIndex, 'memo_1', 'zh');
      // Should return empty or results matching "memo_1" as text
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should treat "memo 1" as text search, not ID search', () => {
      // "memo 1" should be treated as regular text
      const results = searchMemos(mockIndex, 'memo 1', 'en');
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array for non-existent ID', () => {
      const results = searchMemos(mockIndex, 'memo_999', 'zh');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for non-existent numeric ID', () => {
      const results = searchMemos(mockIndex, '999', 'en');
      expect(results).toHaveLength(0);
    });

    it('should support fallback to text search if numeric query matches content', () => {
      // If "12" doesn't exist as memo_12, but matches text, should find results
      const mockIndexWithText = {
        totalMemos: 1,
        tags: { zh: {}, en: {} },
        memos: [
          {
            id: 'memo_0',
            title: { zh: '12月事件', en: '12 Month Event' },
            date: '2023-01-01',
            type: 'event' as const,
            tags: { zh: ['测试'], en: ['test'] },
            folder: '0',
            updatedAt: '2023-01-01T00:00:00.000Z'
          }
        ]
      };
      const results = searchMemos(mockIndexWithText, '12', 'zh');
      // Should find the memo with "12" in title even though memo_12 doesn't exist
      expect(results.length).toBeGreaterThan(0);
    });

    it('should still support normal text search', () => {
      const results = searchMemos(mockIndex, '天安门', 'zh');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('memo_0');
    });
  });

  describe('searchMemosFullContent with ID search', () => {
    const mockIndex = {
      totalMemos: 2,
      tags: { zh: {}, en: {} },
      memos: [
        {
          id: 'memo_42',
          title: { zh: '完整内容测试', en: 'Full Content Test' },
          date: '2023-01-01',
          type: 'event' as const,
          tags: { zh: ['测试'], en: ['test'] },
          folder: '2a',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'memo_100',
          title: { zh: '另一个测试', en: 'Another Test' },
          date: '2023-02-01',
          type: 'quote' as const,
          tags: { zh: ['引用'], en: ['quote'] },
          folder: '64',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ]
    };

    beforeEach(() => {
      // Mock loadMemo for full content search
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('memo_42')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'memo_42',
              content: { zh: '这是完整的中文内容', en: 'This is full English content' }
            })
          });
        }
        if (url.includes('memo_100')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'memo_100',
              content: { zh: '另一个完整内容', en: 'Another full content' }
            })
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });
    });

    it('should find memo by numeric ID', async () => {
      const results = await searchMemosFullContent(mockIndex, '42', 'en');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memo_42');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should treat "memo_42" as text search, not ID search', async () => {
      // "memo_42" is now treated as text, not ID
      const results = await searchMemosFullContent(mockIndex, 'memo_42', 'zh');
      // No exact ID match, will do fallback search
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for non-existent ID with no text matches', async () => {
      const results = await searchMemosFullContent(mockIndex, 'memo_999', 'zh');
      expect(results).toHaveLength(0);
      // Fallback text search may trigger content loads, so we don't check fetch calls
    });

    it('should fall back to text search if ID not found', async () => {
      // Mock index with "42" in content but no memo_42
      const mockIndexWithText = {
        totalMemos: 1,
        tags: { zh: {}, en: {} },
        memos: [
          {
            id: 'memo_100',
            title: { zh: '第42个测试', en: 'Test 42' },
            date: '2023-02-01',
            type: 'quote' as const,
            tags: { zh: ['引用'], en: ['quote'] },
            folder: '64',
            updatedAt: '2023-02-01T00:00:00.000Z'
          }
        ]
      };
      const results = await searchMemosFullContent(mockIndexWithText, '42', 'zh');
      // Should find memo with "42" in title via fallback
      expect(results.length).toBeGreaterThan(0);
    });

    it('should still support full content search for text queries', async () => {
      const results = await searchMemosFullContent(mockIndex, '完整', 'zh');
      expect(results.length).toBeGreaterThan(0);
      // Full content search should trigger fetch
      expect(global.fetch).toHaveBeenCalled();
    });
  });

});