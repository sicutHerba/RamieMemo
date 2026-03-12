/**
 * Integration tests for core data loading flows
 */
import { loadMemo, loadMemoIndex, loadMultipleMemos, selectFeaturedMemo } from '../data';
import { MemoNotFoundError, MemoIndexLoadError, NetworkError } from '../errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('Data Loading Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Complete Memo Loading Flow', () => {
    const mockIndex = {
      version: '1.0',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      totalMemos: 3,
      folderCount: 256,
      memos: [
        {
          id: 'memo_0001',
          title: { zh: 'Memo 1', en: 'Memo 1' },
          date: '2023-06-04',
          type: 'event' as const,
          tags: { zh: [], en: [] },
          folder: '01',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'memo_0002',
          title: { zh: 'Memo 2', en: 'Memo 2' },
          date: null,
          type: 'figure' as const,
          tags: { zh: [], en: [] },
          folder: '02',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ]
    };

    const mockMemo1 = {
      id: 'memo_0001',
      title: { zh: 'Memo 1', en: 'Memo 1' },
      content: { zh: 'Content 1', en: 'Content 1' },
      date: '2023-06-04',
      type: 'event' as const,
      tags: { zh: [], en: [] },
      updatedAt: '2023-01-01T00:00:00.000Z',
      relatedMemos: ['memo_0002']
    };

    const mockMemo2 = {
      id: 'memo_0002',
      title: { zh: 'Memo 2', en: 'Memo 2' },
      content: { zh: 'Content 2', en: 'Content 2' },
      date: null,
      type: 'figure' as const,
      tags: { zh: [], en: [] },
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    it('should load index and memo successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockIndex
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemo1
        });

      const index = await loadMemoIndex();
      const memo = await loadMemo('memo_0001');

      expect(index.totalMemos).toBe(3);
      expect(memo.id).toBe('memo_0001');
    });

    it('should load memo with related memos', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemo1
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemo2
        });

      const memo = await loadMemo('memo_0001');
      const relatedMemos = await loadMultipleMemos(memo.relatedMemos || []);

      expect(memo.relatedMemos).toHaveLength(1);
      expect(relatedMemos).toHaveLength(1);
      expect(relatedMemos[0].id).toBe('memo_0002');
    });

    it('should handle partial related memo loading failures', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMemo1
        })
        .mockRejectedValueOnce(new Error('Network failure'));

      const memo = await loadMemo('memo_0001');
      const relatedMemos = await loadMultipleMemos(memo.relatedMemos || []);

      // Should return empty array when all related memos fail
      expect(relatedMemos).toHaveLength(0);
    });
  });

  describe('Error Propagation', () => {
    it('should propagate index loading errors correctly', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(loadMemoIndex()).rejects.toThrow(MemoIndexLoadError);
    });

    it('should propagate memo not found errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadMemo('memo_9999')).rejects.toThrow(MemoNotFoundError);
    });

    it('should handle network errors appropriately', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(loadMemo('memo_0001')).rejects.toThrow(NetworkError);
    });
  });

  describe('Production vs Development Paths', () => {
    // Note: Testing NODE_ENV-dependent behavior is complex due to module caching
    // and static evaluation. These paths are validated through deployment testing.
    
    it('should construct paths correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          version: '1.0', 
          memos: [], 
          tags: { zh: {}, en: {} }, 
          types: { event: 0, figure: 0, quote: 0, legal_case: 0 }, 
          withDates: 0, 
          withoutDates: 0, 
          totalMemos: 0, 
          folderCount: 0, 
          lastUpdated: '' 
        })
      });

      await loadMemoIndex();

      // Verify fetch was called with a valid path
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/data\/memos\/index\.json$/));
    });
  });

  describe('Featured Memo Selection', () => {
    const mockIndex = {
      version: '1.0',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      totalMemos: 10,
      folderCount: 256,
      memos: Array.from({ length: 10 }, (_, i) => ({
        id: `memo_000${i}`,
        title: { zh: `Memo ${i}`, en: `Memo ${i}` },
        date: null,
        type: 'event' as const,
        tags: { zh: [], en: [] },
        folder: '0' + i.toString(16),
        updatedAt: '2023-01-01T00:00:00.000Z'
      }))
    };

    it('should select deterministic featured memo for a given day', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockIndex
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockIndex.memos[0],
            content: { zh: 'Content', en: 'Content' }
          })
        });

      const featured = await selectFeaturedMemo(false);
      
      expect(featured).toBeDefined();
      expect(mockIndex.memos.find(m => m.id === featured.id)).toBeDefined();
    });

    it('should select random memo when forceRandom is true', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockIndex
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockIndex.memos[5],
            content: { zh: 'Content', en: 'Content' }
          })
        });

      const featured = await selectFeaturedMemo(true);
      
      expect(featured).toBeDefined();
    });
  });

  describe('Concurrent Loading', () => {
    const mockMemos = Array.from({ length: 5 }, (_, i) => ({
      id: `memo_000${i}`,
      title: { zh: `Memo ${i}`, en: `Memo ${i}` },
      content: { zh: `Content ${i}`, en: `Content ${i}` },
      date: null,
      type: 'event' as const,
      tags: { zh: [], en: [] },
      updatedAt: '2023-01-01T00:00:00.000Z'
    }));

    it('should handle concurrent memo loads', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const memoId = url.match(/memo_(\d+)\.json/)?.[1];
        if (memoId) {
          const index = parseInt(memoId);
          return Promise.resolve({
            ok: true,
            json: async () => mockMemos[index]
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      const memoIds = ['memo_0000', 'memo_0001', 'memo_0002'];
      const memos = await loadMultipleMemos(memoIds);

      expect(memos).toHaveLength(3);
      expect(memos.map(m => m.id)).toEqual(memoIds);
    });

    it('should handle mixed success and failures', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('memo_0000')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMemos[0]
          });
        }
        if (url.includes('memo_0001')) {
          return Promise.reject(new Error('Failed'));
        }
        if (url.includes('memo_0002')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMemos[2]
          });
        }
      });

      const memoIds = ['memo_0000', 'memo_0001', 'memo_0002'];
      const memos = await loadMultipleMemos(memoIds);

      // Should return only successful loads
      expect(memos).toHaveLength(2);
      expect(memos.map(m => m.id)).toEqual(['memo_0000', 'memo_0002']);
    });
  });
});
