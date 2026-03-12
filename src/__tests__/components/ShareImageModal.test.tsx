import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareImageModal from '@/components/ShareImageModal';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Memo } from '@/types/memo';

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => Promise.resolve('data:image/png;base64,mock-image-data'))
}));

const mockMemo: Memo = {
  id: 'memo_test123',
  date: new Date('2026-02-05'),
  title: {
    zh: '测试备忘录',
    en: 'Test Memo'
  },
  content: {
    zh: '这是测试内容',
    en: 'This is test content'
  },
  tags: {
    zh: ['测试', '标签'],
    en: ['test', 'tag']
  },
  image: 'https://example.com/image.jpg',
  sources: []
};

describe('ShareImageModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    });
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <LanguageProvider>
        <ShareImageModal isOpen={false} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', async () => {
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/share memo|分享备忘录/i)).toBeInTheDocument();
    });
  });

  it('should generate and display image', async () => {
    const { toPng } = require('html-to-image');
    
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(toPng).toHaveBeenCalled();
    });

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const sharePreview = images.find(img => img.getAttribute('alt') === 'Share preview');
      expect(sharePreview).toBeInTheDocument();
    });
  });

  it('should show loading state while generating image', async () => {
    const { toPng } = require('html-to-image');
    toPng.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve('data:image/png;base64,mock-image-data'), 1000);
    }));

    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    expect(screen.getByText(/generating image|生成图片中/i)).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/close|关闭/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/close|关闭/i);
    await act(async () => {
      await user.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    await act(async () => {
      await user.keyboard('{Escape}');
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show desktop buttons on desktop', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    // Wait for image generation to complete
    await waitFor(() => {
      const sharePreview = screen.queryByAltText('Share preview');
      expect(sharePreview).toBeInTheDocument();
    }, { timeout: 3000 });

    // Now check for buttons
    expect(screen.getByText(/download image|下载图片/i)).toBeInTheDocument();
    expect(screen.getByText(/copy image|复制图片/i)).toBeInTheDocument();
  });

  it('should show mobile instructions on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Trigger resize event
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    // Trigger resize
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    // Wait for image generation to complete
    await waitFor(() => {
      const sharePreview = screen.queryByAltText('Share preview');
      expect(sharePreview).toBeInTheDocument();
    }, { timeout: 3000 });

    // Now check for mobile instructions
    expect(screen.getByText(/long press|长按/i)).toBeInTheDocument();
    expect(screen.queryByText(/download image|下载图片/i)).not.toBeInTheDocument();
  });

  it('should handle download button click', async () => {
    const user = userEvent.setup();
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return mockLink;
      }
      return originalCreateElement(tagName);
    });

    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    // Wait for image to be generated
    await waitFor(() => {
      const sharePreview = screen.queryByAltText('Share preview');
      expect(sharePreview).toBeInTheDocument();
    }, { timeout: 3000 });

    const downloadButton = screen.getByText(/download image|下载图片/i);
    await act(async () => {
      await user.click(downloadButton);
    });

    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toContain('memo_test123');
    expect(mockLink.href).toContain('data:image/png');

    createElementSpy.mockRestore();
  });

  it('should handle copy image button click', async () => {
    const user = userEvent.setup();
    const mockWrite = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { write: mockWrite }
    });
    (global as any).ClipboardItem = jest.fn((data) => data);
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob())
    });

    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    // Wait for image to be generated
    await waitFor(() => {
      const sharePreview = screen.queryByAltText('Share preview');
      expect(sharePreview).toBeInTheDocument();
    }, { timeout: 3000 });

    const copyButton = screen.getByText(/copy image|复制图片/i);
    await act(async () => {
      await user.click(copyButton);
    });

    // Button text should remain the same (icon swaps instead)
    await waitFor(() => {
      expect(screen.getByText(/copy image|复制图片/i)).toBeInTheDocument();
    });
  });

  it('should render memo content correctly', async () => {
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    // Content is in the hidden generation div
    await waitFor(() => {
      expect(screen.getAllByText('测试备忘录').length).toBeGreaterThan(0);
      expect(screen.getAllByText('这是测试内容').length).toBeGreaterThan(0);
    });
  });

  it('should render tags in the generated content', async () => {
    render(
      <LanguageProvider>
        <ShareImageModal isOpen={true} onClose={mockOnClose} memo={mockMemo} />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('#测试').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#标签').length).toBeGreaterThan(0);
    });
  });
});
