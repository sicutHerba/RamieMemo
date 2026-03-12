import { filterByTags, sortMemos } from '../data';
import { MemoMetadata } from '@/types/memo';

describe('Filtering and Sorting', () => {
  const mockMemos: MemoMetadata[] = [
    {
      id: 'memo_0001',
      title: { zh: '测试1', en: 'Test1' },
      date: '2023-01-01',
      type: 'event',
      tags: { zh: ['人权', '民主'], en: ['Human Rights', 'Democracy'] },
      folder: '01',
      updatedAt: '2023-01-01T10:00:00.000Z'
    },
    {
      id: 'memo_0002',
      title: { zh: '测试2', en: 'Test2' },
      date: '2023-06-01',
      type: 'quote',
      tags: { zh: ['言论自由', '艺术'], en: ['Freedom of Speech', 'Art'] },
      folder: '02',
      updatedAt: '2023-06-01T10:00:00.000Z'
    },
    {
      id: 'memo_0003',
      title: { zh: '测试3', en: 'Test3' },
      date: null,
      type: 'figure',
      tags: { zh: ['人权', '法律'], en: ['Human Rights', 'Legal'] },
      folder: '03',
      updatedAt: '2024-01-01T10:00:00.000Z'
    }
  ];

  describe('filterByTags', () => {
    it('should filter by Chinese tag', () => {
      const results = filterByTags(mockMemos, ['人权'], 'zh');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('memo_0001');
      expect(results[1].id).toBe('memo_0003');
    });

    it('should filter by English tag', () => {
      const results = filterByTags(mockMemos, ['Human Rights'], 'en');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('memo_0001');
      expect(results[1].id).toBe('memo_0003');
    });

    it('should work across both languages (Chinese tag matches English display)', () => {
      // Filtering with Chinese tag should work even when displaying in English
      const results = filterByTags(mockMemos, ['人权'], 'en');
      expect(results).toHaveLength(2);
    });

    it('should work across both languages (English tag matches Chinese display)', () => {
      // Filtering with English tag should work even when displaying in Chinese
      const results = filterByTags(mockMemos, ['Human Rights'], 'zh');
      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const results = filterByTags(mockMemos, ['nonexistent'], 'zh');
      expect(results).toHaveLength(0);
    });

    it('should return all memos when tag array is empty', () => {
      const results = filterByTags(mockMemos, [], 'zh');
      expect(results).toHaveLength(3);
    });

    it('should handle multiple tags (OR logic)', () => {
      const results = filterByTags(mockMemos, ['人权', '艺术'], 'zh');
      expect(results).toHaveLength(3); // All three have at least one of these tags
    });
  });

  describe('sortMemos', () => {
    it('should sort by recent (newest first)', () => {
      const results = sortMemos([...mockMemos], 'recent', 'zh', 'desc');
      expect(results[0].id).toBe('memo_0003'); // 2024
      expect(results[1].id).toBe('memo_0002'); // 2023-06
      expect(results[2].id).toBe('memo_0001'); // 2023-01
    });

    it('should sort by recent (oldest first)', () => {
      const results = sortMemos([...mockMemos], 'recent', 'zh', 'asc');
      expect(results[0].id).toBe('memo_0001'); // 2023-01
      expect(results[1].id).toBe('memo_0002'); // 2023-06
      expect(results[2].id).toBe('memo_0003'); // 2024
    });

    it('should sort by title in Chinese', () => {
      const results = sortMemos([...mockMemos], 'title', 'zh', 'asc');
      expect(results[0].title.zh).toBe('测试1');
      expect(results[1].title.zh).toBe('测试2');
      expect(results[2].title.zh).toBe('测试3');
    });

    it('should sort by title in English', () => {
      const results = sortMemos([...mockMemos], 'title', 'en', 'asc');
      expect(results[0].title.en).toBe('Test1');
      expect(results[1].title.en).toBe('Test2');
      expect(results[2].title.en).toBe('Test3');
    });

    it('should sort by title descending', () => {
      const results = sortMemos([...mockMemos], 'title', 'zh', 'desc');
      expect(results[0].title.zh).toBe('测试3');
      expect(results[1].title.zh).toBe('测试2');
      expect(results[2].title.zh).toBe('测试1');
    });
  });
});


