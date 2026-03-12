import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import * as dataModule from '@/lib/data';

// Mock the data module
jest.mock('@/lib/data');

// Mock html-to-image
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mockImageData')
}));

const mockMemo1 = {
  id: 'memo_001',
  title: { en: 'First Memo', zh: '第一个备忘录' },
  content: { en: 'First content', zh: '第一个内容' },
  tags: { zh: ['测试'], en: ['test'] },
  type: 'event' as const,
  date: '2024-01-01',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const mockMemo2 = {
  id: 'memo_002',
  title: { en: 'Second Memo', zh: '第二个备忘录' },
  content: { en: 'Second content', zh: '第二个内容' },
  tags: { zh: ['测试'], en: ['test'] },
  type: 'event' as const,
  date: '2024-01-02',
  updatedAt: '2024-01-02T00:00:00.000Z'
};

const mockIndex = {
  version: '1.0',
  lastUpdated: '2024-01-01T00:00:00.000Z',
  totalMemos: 2,
  folderCount: 256,
  memos: [
    {
      id: 'memo_001',
      title: { en: 'First Memo', zh: '第一个备忘录' },
      date: '2024-01-01',
      type: 'event' as const,
      tags: { zh: ['测试'], en: ['test'] },
      folder: '01',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'memo_002',
      title: { en: 'Second Memo', zh: '第二个备忘录' },
      date: '2024-01-02',
      type: 'event' as const,
      tags: { zh: ['测试'], en: ['test'] },
      folder: '02',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ],
  tags: { zh: {}, en: {} },
  types: {},
  withDates: 2,
  withoutDates: 0
};

describe('Share Button Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dataModule.getMemoForDate as jest.Mock).mockResolvedValue(mockMemo1);
    (dataModule.loadMemoIndex as jest.Mock).mockResolvedValue(mockIndex);
    (dataModule.selectFeaturedMemo as jest.Mock).mockResolvedValue(mockMemo1);
  });

  it('should display share button in random mode', async () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/加载中|Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Click Random button
    const randomButton = screen.getByRole('button', { name: /随机|Random/i });
    await userEvent.click(randomButton);

    // Wait for memo to load
    await waitFor(() => {
      expect(screen.getByText(/First Memo|第一个备忘录/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that share button exists
    const shareButtons = screen.getAllByText(/分享|Share/i);
    expect(shareButtons.length).toBeGreaterThan(0);
  });

  it('should display memo content in random mode', async () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/加载中|Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const randomButton = screen.getByRole('button', { name: /随机|Random/i });
    await userEvent.click(randomButton);

    await waitFor(() => {
      expect(screen.getByText(/First content|第一个内容/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should switch between memos when clicking random again', async () => {
    (dataModule.selectFeaturedMemo as jest.Mock)
      .mockResolvedValueOnce(mockMemo1)
      .mockResolvedValueOnce(mockMemo2);

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/加载中|Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const randomButton = screen.getByRole('button', { name: /随机|Random/i });
    
    // First click
    await userEvent.click(randomButton);
    await waitFor(() => {
      expect(screen.getByText(/First Memo|第一个备忘录/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Second click
    await userEvent.click(randomButton);
    await waitFor(() => {
      expect(screen.getByText(/Second Memo|第二个备忘录/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
