import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoModalContent from '../MemoModalContent';
import { LanguageProvider } from '@/contexts/LanguageContext';
import * as dataModule from '@/lib/data';

// Mock the data loading functions
jest.mock('@/lib/data', () => ({
  loadMemo: jest.fn(),
  loadMemoIndex: jest.fn(),
  loadMultipleMemos: jest.fn(),
}));

const mockLoadMemo = dataModule.loadMemo as jest.MockedFunction<typeof dataModule.loadMemo>;
const mockLoadMemoIndex = dataModule.loadMemoIndex as jest.MockedFunction<typeof dataModule.loadMemoIndex>;
const mockLoadMultipleMemos = dataModule.loadMultipleMemos as jest.MockedFunction<typeof dataModule.loadMultipleMemos>;

// Mock html-to-image for MemoCard
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mockImageData')
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined)
  }
});

const mockMemo = {
  id: 'memo_0001',
  title: { zh: '测试 Memo', en: 'Test Memo' },
  content: { zh: '测试内容', en: 'Test Content' },
  date: '2023-06-15',
  type: 'event' as const,
  tags: { zh: ['标签1'], en: ['tag1'] },
  updatedAt: '2023-01-01T00:00:00.000Z',
  relatedMemos: ['memo_0002', 'memo_0003']
};

const mockRelatedMemo1 = {
  id: 'memo_0002',
  title: { zh: '相关 Memo 1', en: 'Related Memo 1' },
  content: { zh: '相关内容 1', en: 'Related Content 1' },
  date: null,
  type: 'figure' as const,
  tags: { zh: [], en: [] },
  updatedAt: '2023-01-01T00:00:00.000Z'
};

const mockRelatedMemo2 = {
  id: 'memo_0003',
  title: { zh: '相关 Memo 2', en: 'Related Memo 2' },
  content: { zh: '相关内容 2', en: 'Related Content 2' },
  date: null,
  type: 'quote' as const,
  tags: { zh: [], en: [] },
  updatedAt: '2023-01-01T00:00:00.000Z'
};

const mockIndex = {
  version: '1.0',
  lastUpdated: '2023-01-01T00:00:00.000Z',
  totalMemos: 3,
  folderCount: 256,
  memos: [
    {
      id: 'memo_0001',
      title: { zh: '测试 Memo', en: 'Test Memo' },
      date: '2023-06-15',
      type: 'event' as const,
      tags: { zh: ['标签1'], en: ['tag1'] },
      folder: '01',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'memo_0002',
      title: { zh: '相关 Memo 1', en: 'Related Memo 1' },
      date: null,
      type: 'figure' as const,
      tags: { zh: [], en: [] },
      folder: '02',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'memo_0003',
      title: { zh: '相关 Memo 2', en: 'Related Memo 2' },
      date: null,
      type: 'quote' as const,
      tags: { zh: [], en: [] },
      folder: '03',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ],
  tags: {
    zh: { '标签1': 1 },
    en: { 'tag1': 1 }
  },
  types: {
    event: 1,
    figure: 1,
    quote: 1,
    legal_case: 0
  },
  withDates: 1,
  withoutDates: 2
};

describe('MemoModalContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadMemo.mockResolvedValue(mockMemo);
    mockLoadMemoIndex.mockResolvedValue(mockIndex);
    mockLoadMultipleMemos.mockResolvedValue([mockRelatedMemo1, mockRelatedMemo2]);
  });

  const renderComponent = (memoId = 'memo_0001') => {
    return render(
      <LanguageProvider>
        <MemoModalContent initialMemoId={memoId} />
      </LanguageProvider>
    );
  };

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      renderComponent();
      
      expect(screen.getByText(/加载中|loading/i)).toBeInTheDocument();
    });

    it('should load memo data on mount', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockLoadMemo).toHaveBeenCalledWith('memo_0001');
        expect(mockLoadMemoIndex).toHaveBeenCalled();
      });
    });

    it('should display memo content after loading', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
    });

    it('should load related memos if they exist', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(mockLoadMultipleMemos).toHaveBeenCalledWith(['memo_0002', 'memo_0003']);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when memo fails to load', async () => {
      mockLoadMemo.mockRejectedValueOnce(new Error('Load failed'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/加载失败|failed/i)).toBeInTheDocument();
      });
    });

    it('should handle missing related memos gracefully', async () => {
      mockLoadMultipleMemos.mockResolvedValueOnce([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
    });

    it('should continue when related memos fail to load', async () => {
      mockLoadMultipleMemos.mockRejectedValueOnce(new Error('Related memos failed'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to related memo when clicked', async () => {
      renderComponent();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Click on related memo
      mockLoadMemo.mockResolvedValueOnce(mockRelatedMemo1);
      const relatedMemoLink = screen.getByText('相关 Memo 1');
      fireEvent.click(relatedMemoLink);
      
      await waitFor(() => {
        expect(mockLoadMemo).toHaveBeenCalledWith('memo_0002');
      });
    });

    it('should maintain navigation history', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Navigate to related memo
      mockLoadMemo.mockResolvedValueOnce(mockRelatedMemo1);
      const relatedMemoLink = screen.getByText('相关 Memo 1');
      fireEvent.click(relatedMemoLink);
      
      await waitFor(() => {
        expect(screen.getByText('相关 Memo 1')).toBeInTheDocument();
      });
      
      // Back button should appear
      const backButton = screen.queryByText(/返回|back/i);
      expect(backButton).toBeInTheDocument();
    });

    it('should navigate back through history', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Navigate forward
      mockLoadMemo.mockResolvedValueOnce(mockRelatedMemo1);
      const relatedMemoLink = screen.getByText('相关 Memo 1');
      fireEvent.click(relatedMemoLink);
      
      await waitFor(() => {
        expect(screen.getByText('相关 Memo 1')).toBeInTheDocument();
      });
      
      // Navigate back
      mockLoadMemo.mockResolvedValueOnce(mockMemo);
      const backButton = screen.getByText(/返回|back/i);
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(mockLoadMemo).toHaveBeenCalledWith('memo_0001');
      });
    });

    it('should scroll to top when navigating', async () => {
      const mockScrollTo = jest.fn();
      const mockElement = {
        scrollTop: 100,
        querySelector: jest.fn()
      };
      
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement as any);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Navigate to related memo
      mockLoadMemo.mockResolvedValueOnce(mockRelatedMemo1);
      const relatedMemoLink = screen.getByText('相关 Memo 1');
      fireEvent.click(relatedMemoLink);
      
      await waitFor(() => {
        expect(mockElement.scrollTop).toBe(0);
      });
    });
  });

  describe('Language Switching', () => {
    it('should have language context available', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Component successfully renders with LanguageProvider
      // Language switching behavior is tested at integration level
      expect(mockLoadMemo).toHaveBeenCalled();
    });
  });

  describe('Transitioning State', () => {
    it('should show transitioning state when navigating', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      // Make the next load slow to catch transitioning state
      mockLoadMemo.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockRelatedMemo1), 100))
      );
      
      const relatedMemoLink = screen.getByText('相关 Memo 1');
      fireEvent.click(relatedMemoLink);
      
      // Should not show full loading state, just transition
      expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle memo without related memos', async () => {
      const memoWithoutRelated = { ...mockMemo, relatedMemos: undefined };
      mockLoadMemo.mockResolvedValueOnce(memoWithoutRelated);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      expect(mockLoadMultipleMemos).not.toHaveBeenCalled();
    });

    it('should handle empty related memos array', async () => {
      const memoWithEmptyRelated = { ...mockMemo, relatedMemos: [] };
      mockLoadMemo.mockResolvedValueOnce(memoWithEmptyRelated);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('测试 Memo')).toBeInTheDocument();
      });
      
      expect(mockLoadMultipleMemos).not.toHaveBeenCalled();
    });
  });
});
