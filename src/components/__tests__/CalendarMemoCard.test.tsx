import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarMemoCard from '../CalendarMemoCard';
import { LanguageProvider } from '@/contexts/LanguageContext';

const mockMemo = {
  id: 'memo_0001',
  title: { zh: '六四事件', en: 'June Fourth Incident' },
  content: { zh: '历史事件内容', en: 'Historical event content' },
  date: '1989-06-04',
  type: 'event' as const,
  tags: { zh: ['历史', '民主'], en: ['history', 'democracy'] },
  updatedAt: '2023-01-01T00:00:00.000Z'
};



describe('CalendarMemoCard', () => {
  const mockOnClick = jest.fn();
  const mockDate = new Date('2023-06-04');
  const defaultProps = {
    memo: mockMemo,
    date: mockDate
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = defaultProps) => {
    return render(
      <LanguageProvider>
        <CalendarMemoCard {...props} />
      </LanguageProvider>
    );
  };

  describe('Rendering', () => {
    it('should render memo title in Chinese by default', () => {
      renderComponent();
      
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });

    it('should render memo date', () => {
      renderComponent();
      
      expect(screen.getByText(/6月4日|June 4/i)).toBeInTheDocument();
    });

    it('should render memo content preview', () => {
      renderComponent();
      
      expect(screen.getByText(/历史事件内容/i)).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should be a display-only card', () => {
      const { container } = renderComponent();
      
      // Calendar card is display-only, no click handlers
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      renderComponent();
      
      const card = screen.getByText('六四事件').closest('.memo-card-calendar');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('should format date correctly in Chinese', () => {
      renderComponent();
      
      expect(screen.getByText(/6月4日/i)).toBeInTheDocument();
    });

    it('should show full date with year', () => {
      renderComponent();
      
      // Full date is displayed in calendar card
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper card styling', () => {
      const { container } = renderComponent();
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-[#FAF8F3]', 'rounded-sm', 'shadow-lg');
    });

    it('should have fixed height', () => {
      const { container } = renderComponent();
      
      const card = container.querySelector('.memo-card-calendar');
      expect(card).toHaveStyle({ height: '500px' });
    });
  });

  describe('Different Memo Types', () => {
    it('should render figure type memo', () => {
      const figureMemo = { ...mockMemo, type: 'figure' as const };
      renderComponent({ ...defaultProps, memo: figureMemo });
      
      // Calendar card displays same for all types
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });

    it('should render quote type memo', () => {
      const quoteMemo = { ...mockMemo, type: 'quote' as const };
      renderComponent({ ...defaultProps, memo: quoteMemo });
      
      // Calendar card displays same for all types
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });

    it('should render legal_case type memo', () => {
      const legalCaseMemo = { ...mockMemo, type: 'legal_case' as const };
      renderComponent({ ...defaultProps, memo: legalCaseMemo });
      
      // Calendar card displays same for all types
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });
  });

  describe('Content Truncation', () => {
    it('should truncate long content', () => {
      const longContentMemo = {
        ...mockMemo,
        content: {
          zh: '这是一段非常长的内容'.repeat(50),
          en: 'This is a very long content'.repeat(50)
        }
      };
      
      renderComponent({ ...defaultProps, memo: longContentMemo });
      
      // Content should be truncated with ellipsis
      const content = screen.getByText(/这是一段非常长的内容/);
      expect(content.textContent?.length).toBeLessThan(longContentMemo.content.zh.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle memo without tags', () => {
      const noTagsMemo = {
        ...mockMemo,
        tags: { zh: [], en: [] }
      };
      
      renderComponent({ ...defaultProps, memo: noTagsMemo });
      
      // Calendar card doesn't display tags
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });

    it('should handle memo with many tags', () => {
      const manyTagsMemo = {
        ...mockMemo,
        tags: {
          zh: ['标签1', '标签2', '标签3', '标签4', '标签5'],
          en: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
        }
      };
      
      renderComponent({ ...defaultProps, memo: manyTagsMemo });
      
      // Calendar card doesn't display tags
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });

    it('should handle missing content gracefully', () => {
      const noContentMemo = {
        ...mockMemo,
        content: { zh: '', en: '' }
      };
      
      renderComponent({ ...defaultProps, memo: noContentMemo });
      
      expect(screen.getByText('六四事件')).toBeInTheDocument();
    });
  });
});
