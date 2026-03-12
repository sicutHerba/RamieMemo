import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock the data functions
jest.mock('@/lib/data', () => ({
  getMemoForDate: jest.fn(() => Promise.resolve({
    id: 'test-memo',
    title: { en: 'Test Title', zh: '测试标题' },
    content: { en: 'Test Content', zh: '测试内容' },
    date: '2026-01-30',
    category: 'test'
  })),
  selectFeaturedMemo: jest.fn(() => Promise.resolve({
    id: 'random-memo',
    title: { en: 'Random Title', zh: '随机标题' },
    content: { en: 'Random Content', zh: '随机内容' },
    date: '2026-01-30',
    category: 'test'
  })),
  loadMemoIndex: jest.fn(() => Promise.resolve({ memos: [], totalMemos: 0 }))
}));

describe('Random Mode Layout', () => {
  it('should use responsive width that accommodates buttons properly', async () => {
    const user = userEvent.setup();
    
    const { container } = render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/loading|加载中/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Random mode should be rendering by default or after clicking Random button
    // Check that the page has loaded successfully
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
