import { getMemoFolder, getMemoPath, getText, formatDate, matchesToday, getMemoTypeLabel, copyToClipboard, shareContent } from '../utils';

describe('Utils', () => {
  describe('getMemoFolder', () => {
    it('should return correct folder for memo ID', () => {
      expect(getMemoFolder('memo_0')).toBe('00');
      expect(getMemoFolder('memo_1')).toBe('01');
      expect(getMemoFolder('memo_255')).toBe('ff');
      expect(getMemoFolder('memo_256')).toBe('00');
      expect(getMemoFolder('memo_257')).toBe('01');
    });

    it('should work with number input', () => {
      expect(getMemoFolder(0)).toBe('00');
      expect(getMemoFolder(1)).toBe('01');
      expect(getMemoFolder(255)).toBe('ff');
    });

    it('should pad single digit hex values', () => {
      expect(getMemoFolder('memo_10')).toBe('0a');
      expect(getMemoFolder(15)).toBe('0f');
    });
  });

  describe('getMemoPath', () => {
    it('should return correct path for memo ID', () => {
      expect(getMemoPath('memo_0')).toBe('/data/memos/00/memo_0000.json');
      expect(getMemoPath('memo_1')).toBe('/data/memos/01/memo_0001.json');
      expect(getMemoPath('memo_123')).toBe('/data/memos/7b/memo_0123.json');
    });

    it('should pad memo numbers correctly', () => {
      expect(getMemoPath('memo_1')).toContain('memo_0001.json');
      expect(getMemoPath('memo_99')).toContain('memo_0099.json');
      expect(getMemoPath('memo_1234')).toContain('memo_1234.json');
    });
  });

  describe('getText', () => {
    const bilingualText = {
      zh: '中文',
      en: 'English'
    };

    it('should return Chinese text when lang is zh', () => {
      expect(getText(bilingualText, 'zh')).toBe('中文');
    });

    it('should return English text when lang is en', () => {
      expect(getText(bilingualText, 'en')).toBe('English');
    });
  });

  describe('formatDate', () => {
    it('should format date in Chinese', () => {
      const result = formatDate('2023-06-15', 'zh');
      expect(result).toContain('2023年');
      expect(result).toContain('6月');
      expect(result).toContain('15日');
    });

    it('should format date in English', () => {
      const result = formatDate('2023-06-15', 'en');
      expect(result).toContain('June');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });

    it('should handle null date', () => {
      expect(formatDate(null, 'zh')).toBe('无日期');
      expect(formatDate(null, 'en')).toBe('No date');
    });

    it('should handle undefined date', () => {
      expect(formatDate(undefined, 'zh')).toBe('无日期');
      expect(formatDate(undefined, 'en')).toBe('No date');
    });

    it('should handle empty string', () => {
      expect(formatDate('', 'zh')).toBe('无日期');
      expect(formatDate('', 'en')).toBe('No date');
    });
  });

  describe('matchesToday', () => {
    it('should match today\'s date', () => {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${today.getFullYear()}-${month}-${day}`;
      
      expect(matchesToday(dateString)).toBe(true);
    });

    it('should not match different date', () => {
      expect(matchesToday('2023-01-01')).toBe(false);
    });

    it('should handle null date', () => {
      expect(matchesToday(null)).toBe(false);
    });

    it('should handle undefined date', () => {
      expect(matchesToday(undefined)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(matchesToday('')).toBe(false);
    });
  });

  describe('getMemoTypeLabel', () => {
    it('should return correct label for event in Chinese', () => {
      expect(getMemoTypeLabel('event', 'zh')).toBe('历史事件');
    });

    it('should return correct label for event in English', () => {
      expect(getMemoTypeLabel('event', 'en')).toBe('Event');
    });

    it('should return correct label for quote in Chinese', () => {
      expect(getMemoTypeLabel('quote', 'zh')).toBe('名言');
    });

    it('should return correct label for figure in English', () => {
      expect(getMemoTypeLabel('figure', 'en')).toBe('Figure');
    });

    it('should return correct label for legal_case in Chinese', () => {
      expect(getMemoTypeLabel('legal_case', 'zh')).toBe('法律案件');
    });

    it('should return type as-is for unknown types', () => {
      expect(getMemoTypeLabel('unknown', 'zh')).toBe('unknown');
      expect(getMemoTypeLabel('custom', 'en')).toBe('custom');
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
      
      // Suppress console errors for tests
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should copy text to clipboard', async () => {
      const text = 'Test text';
      const result = await copyToClipboard(text);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('should return false on error', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Failed'));
      
      const result = await copyToClipboard('test');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle empty string', async () => {
      const result = await copyToClipboard('');
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });
  });

  describe('shareContent', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should share content when Web Share API is available', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: mockShare });

      const result = await shareContent('Title', 'Text', 'http://example.com');
      
      expect(result).toBe(true);
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Title',
        text: 'Text',
        url: 'http://example.com'
      });
    });

    it('should return false when Web Share API is not available', async () => {
      Object.assign(navigator, { share: undefined });

      const result = await shareContent('Title', 'Text', 'http://example.com');
      expect(result).toBe(false);
    });

    it('should return false when share is cancelled', async () => {
      const mockShare = jest.fn().mockRejectedValue(new Error('AbortError'));
      Object.assign(navigator, { share: mockShare });

      const result = await shareContent('Title', 'Text', 'http://example.com');
      expect(result).toBe(false);
    });
  });
});
