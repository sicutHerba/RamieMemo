import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoCard from '../MemoCard';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock html-to-image module to avoid jsdom issues
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mockImageData')
}));

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined)
  }
});

const mockMemo = {
  id: 'memo_0',
  title: { zh: '测试标题', en: 'Test Title' },
  content: { zh: '测试内容', en: 'Test Content' },
  date: '2023-06-15',
  type: 'event' as const,
  tags: { zh: ['标签1', '标签2'], en: ['tag1', 'tag2'] },
  source: '来源',
  updatedAt: '2023-01-01T00:00:00.000Z'
};

const mockMemoWithRelatedNotes = {
  ...mockMemo,
  relatedMemos: ['memo_0001', 'memo_0002', 'memo_0003']
};

const mockIndex = {
  version: '1.0',
  lastUpdated: '2023-01-01T00:00:00.000Z',
  totalMemos: 3,
  folderCount: 256,
  memos: [
    {
      id: 'memo_0001',
      title: { zh: '相关笔记1', en: 'Related Note 1' },
      date: null,
      type: 'figure' as const,
      tags: { zh: [], en: [] },
      folder: '01',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'memo_0002',
      title: { zh: '相关笔记2', en: 'Related Note 2' },
      date: null,
      type: 'quote' as const,
      tags: { zh: [], en: [] },
      folder: '02',
      updatedAt: '2023-01-02T00:00:00.000Z'
    },
    {
      id: 'memo_0003',
      title: { zh: '相关笔记3', en: 'Related Note 3' },
      date: null,
      type: 'event' as const,
      tags: { zh: [], en: [] },
      folder: '03',
      updatedAt: '2023-01-03T00:00:00.000Z'
    }
  ],
  tags: { zh: {}, en: {} },
  types: {},
  withDates: 0,
  withoutDates: 3
};

const renderWithLanguage = (component: React.ReactElement, lang: 'zh' | 'en' = 'zh') => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('MemoCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console errors for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render memo title and content', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const titles = screen.getAllByText('测试标题');
    expect(titles.length).toBeGreaterThan(0);
    const contents = screen.getAllByText('测试内容');
    expect(contents.length).toBeGreaterThan(0);
  });

  it('should not render date field (reserved for future featured today)', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    // Date should not be displayed in the UI
    const dates = screen.queryAllByText(/2023年6月15日/);
    expect(dates.length).toBe(0);
  });

  it('should render tags', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const tag1Elements = screen.getAllByText((content, element) => {
      return element?.textContent === '#标签1';
    });
    expect(tag1Elements.length).toBeGreaterThan(0);
    
    const tag2Elements = screen.getAllByText((content, element) => {
      return element?.textContent === '#标签2';
    });
    expect(tag2Elements.length).toBeGreaterThan(0);
  });

  it('should copy text to clipboard', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const copyButton = screen.getByRole('button', { name: '文本' });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('测试内容');
    });
  });

  it('should show copied confirmation', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const copyButton = screen.getByText('文本');
    fireEvent.click(copyButton);
    
    // Verify clipboard API was called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    
    // Button text should remain the same (icon swaps instead)
    expect(screen.getByText('文本')).toBeInTheDocument();
  });

  it('should toggle share menu', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const shareButton = screen.getByText('分享');
    fireEvent.click(shareButton);
    
    // Check that share modal appears
    await waitFor(() => {
      expect(screen.getByText('分享备忘录')).toBeInTheDocument();
    });
  });

  it('should render share button with black background', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);

    const shareButton = screen.getByRole('button', { name: '分享' });
    expect(shareButton.className).toMatch(/bg-black/);
    expect(shareButton.className).toMatch(/text-white/);
  });

  it('should display share modal with image preview', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const shareButton = screen.getByText('分享');
    fireEvent.click(shareButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('分享备忘录')).toBeInTheDocument();
    });
    
    // Check that image preview appears (mocked)
    await waitFor(() => {
      const images = screen.queryAllByAltText('Share preview');
      expect(images.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should remove excluded nodes from share capture', async () => {
    const { toPng } = require('html-to-image');

    renderWithLanguage(<MemoCard memo={mockMemo} />);

    const shareButton = screen.getByText('分享');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(toPng).toHaveBeenCalled();
    });

    const [capturedNode] = toPng.mock.calls[0];
    expect(capturedNode.querySelector('[data-share-exclude="true"]')).toBeNull();
  });

  it('should close share modal when close button is clicked', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const shareButton = screen.getByText('分享');
    fireEvent.click(shareButton);
    
    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText('分享备忘录')).toBeInTheDocument();
    });
    
    // Find and click close button using aria-label
    const closeButton = screen.getByLabelText(/关闭|close/i);
    fireEvent.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('分享备忘录')).not.toBeInTheDocument();
    });
  });

  it('should close share modal when clicking outside', async () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const shareButton = screen.getByText('分享');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText('分享备忘录')).toBeInTheDocument();
    });
    
    // Click the backdrop (parent div with onClick)
    const backdrop = screen.getByText('分享备忘录').closest('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      
      await waitFor(() => {
        expect(screen.queryByText('分享备忘录')).not.toBeInTheDocument();
      });
    }
  });

  it('should copy link to clipboard', async () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    });

    renderWithLanguage(<MemoCard memo={mockMemo} />);
    
    const linkButton = screen.getByText('链接');
    fireEvent.click(linkButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/memo/memo_0');
    });
    
    // Button text should remain the same (icon swaps instead)
    expect(screen.getByText('链接')).toBeInTheDocument();
  });

  it('should hide view details button when hideViewDetails is true', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} hideViewDetails={true} />);
    
    expect(screen.queryByText(/详情/i)).not.toBeInTheDocument();
  });

  it('should not have animation when noAnimation is true', () => {
    const { container } = renderWithLanguage(
      <MemoCard memo={mockMemo} noAnimation={true} />
    );
    
    const card = container.querySelector('.animate-fadeIn');
    expect(card).not.toBeInTheDocument();
  });

  it('should exclude memo id from share capture', () => {
    renderWithLanguage(<MemoCard memo={mockMemo} />);

    const memoId = screen.getByText('0');
    expect(memoId).toHaveAttribute('data-share-exclude', 'true');
  });

  it('should exclude actions row from share capture', () => {
    const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

    const actionsRow = container.querySelector('div.border-t.border-gray-300');
    expect(actionsRow).toHaveAttribute('data-share-exclude', 'true');
  });

  describe('Responsive Design', () => {
    it('should have responsive button layout classes', () => {
      const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

      // Check for responsive action buttons container
      const buttonContainer = container.querySelector('div[class*="flex-col sm:flex-row"]');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer?.className).toMatch(/flex-col/);
      expect(buttonContainer?.className).toMatch(/sm:flex-row/);
    });

    it('should have responsive button layout', () => {
      const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

      // Find action buttons container with responsive flex
      const buttonContainer = container.querySelector('.flex.flex-row.gap-2');
      expect(buttonContainer).toBeInTheDocument();
      
      // Check that buttons have responsive flex
      const buttons = container.querySelectorAll('button[class*="sm:flex-1"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have responsive padding on memo card', () => {
      const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

      // MemoCard uses global CSS class that applies responsive padding
      const memoCard = container.querySelector('.memo-card');
      expect(memoCard).toBeInTheDocument();
    });

    it('should have flex-shrink-0 on button icons to prevent squashing', () => {
      const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

      // Check SVG icons have flex-shrink-0 class
      const svgIcons = container.querySelectorAll('svg[class*="flex-shrink-0"]');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('should have truncate class on button text', () => {
      const { container } = renderWithLanguage(<MemoCard memo={mockMemo} />);

      // Check that button text has truncate class for long text handling
      const truncateSpans = container.querySelectorAll('span[class*="truncate"]');
      expect(truncateSpans.length).toBeGreaterThan(0);
    });
  });

  describe('Share Button', () => {
    it('should render share button', () => {
      renderWithLanguage(<MemoCard memo={mockMemo} />);
      
      const shareButton = screen.getByText(/分享|share/i);
      expect(shareButton).toBeInTheDocument();
    });

    it('should open share modal when share button is clicked', async () => {
      renderWithLanguage(<MemoCard memo={mockMemo} />);
      
      const shareButton = screen.getByText(/分享|share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText(/分享备忘录|share memo/i)).toBeInTheDocument();
      });
    });

    it('should close share modal when close button is clicked', async () => {
      renderWithLanguage(<MemoCard memo={mockMemo} />);
      
      // Open modal
      const shareButton = screen.getByText(/分享|share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText(/分享备忘录|share memo/i)).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText(/close|关闭/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/分享备忘录|share memo/i)).not.toBeInTheDocument();
      });
    });

    it('should still show share button when hideViewDetails is true', () => {
      renderWithLanguage(<MemoCard memo={mockMemo} hideViewDetails={true} />);
      
      // Share button should still be visible
      const shareButton = screen.getByText(/分享|share/i);
      expect(shareButton).toBeInTheDocument();
      
      // But detail link should be hidden
      const detailLink = screen.queryByText(/详情|detail/i);
      expect(detailLink).not.toBeInTheDocument();
    });
  });
});


