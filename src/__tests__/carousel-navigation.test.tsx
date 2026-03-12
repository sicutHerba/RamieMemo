import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock the data functions
jest.mock('@/lib/data', () => ({
  getMemoForDate: jest.fn((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return Promise.resolve({
      id: `memo-${dateStr}`,
      title: { en: `Title ${dateStr}`, zh: `标题 ${dateStr}` },
      content: { en: `Content ${dateStr}`, zh: `内容 ${dateStr}` },
      date: dateStr,
      category: 'test'
    });
  }),
  selectFeaturedMemo: jest.fn(),
  loadMemoIndex: jest.fn(() => Promise.resolve({ memos: [], totalMemos: 0 }))
}));

describe('Carousel Navigation - Date Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show correct dates on left card without flickering when clicking previous', async () => {
    const user = userEvent.setup();
    
    // Get current date for dynamic testing
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    const formatDate = (date: Date, lang: 'en' | 'zh') => {
      if (lang === 'zh') {
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click the Today button to ensure we're in today mode
    const todayButton = screen.getByRole('button', { name: /today|今日/i });
    await user.click(todayButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify we see today's date initially
    const todayEnglish = formatDate(today, 'en');
    const todayChinese = formatDate(today, 'zh');
    const todayRegex = new RegExp(`${todayEnglish}|${todayChinese}`, 'i');
    
    await waitFor(() => {
      const initialDates = screen.queryAllByText(todayRegex);
      expect(initialDates.length).toBeGreaterThan(0);
    });

    // Click previous (left card at position 1)
    const carouselItems = screen.getAllByTestId(/carousel-position-/);
    const leftCard = carouselItems.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
    expect(leftCard).toBeDefined();
    await user.click(leftCard!);

    // Should see yesterday's date
    const yesterdayEnglish = formatDate(yesterday, 'en');
    const yesterdayChinese = formatDate(yesterday, 'zh');
    const yesterdayRegex = new RegExp(`${yesterdayEnglish}|${yesterdayChinese}`, 'i');
    
    await waitFor(() => {
      const dates = screen.queryAllByText(yesterdayRegex);
      expect(dates.length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Click previous again (left card) - wait for animation to complete first
    await waitFor(() => {
      const carouselItems2 = screen.getAllByTestId(/carousel-position-/);
      const leftCard2 = carouselItems2.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
      expect(leftCard2).toBeDefined();
      // Check that pointer events are enabled (animation completed)
      expect(window.getComputedStyle(leftCard2!).pointerEvents).not.toBe('none');
    }, { timeout: 2000 });
    
    const carouselItems2 = screen.getAllByTestId(/carousel-position-/);
    const leftCard2 = carouselItems2.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
    await user.click(leftCard2!);

    // Should see day before yesterday
    const dayBeforeEnglish = formatDate(dayBeforeYesterday, 'en');
    const dayBeforeChinese = formatDate(dayBeforeYesterday, 'zh');
    const dayBeforeRegex = new RegExp(`${dayBeforeEnglish}|${dayBeforeChinese}`, 'i');
    
    await waitFor(() => {
      const dates = screen.queryAllByText(dayBeforeRegex);
      expect(dates.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should show correct dates on right card when clicking next', async () => {
    const user = userEvent.setup();
    
    // Get current date for dynamic testing
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    const formatDate = (date: Date, lang: 'en' | 'zh') => {
      if (lang === 'zh') {
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click the Today button to ensure we're in today mode
    const todayButton = screen.getByRole('button', { name: /today|今日/i });
    await user.click(todayButton);

    // Start from a day in the past so we can go forward
    // Click previous twice to get to day before yesterday
    const carouselItems1 = screen.getAllByTestId(/carousel-position-/);
    const leftCard1 = carouselItems1.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
    expect(leftCard1).toBeDefined();
    await user.click(leftCard1!);
    
    const yesterdayEnglish = formatDate(yesterday, 'en');
    const yesterdayChinese = formatDate(yesterday, 'zh');
    const yesterdayRegex = new RegExp(`${yesterdayEnglish}|${yesterdayChinese}`, 'i');
    
    await waitFor(() => {
      const dates = screen.queryAllByText(yesterdayRegex);
      expect(dates.length).toBeGreaterThan(0);
    });
    
    // Wait for animation to complete before second click
    await waitFor(() => {
      const carouselItems2a = screen.getAllByTestId(/carousel-position-/);
      const leftCard2a = carouselItems2a.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
      expect(leftCard2a).toBeDefined();
      expect(window.getComputedStyle(leftCard2a!).pointerEvents).not.toBe('none');
    }, { timeout: 2000 });
    
    const carouselItems2a = screen.getAllByTestId(/carousel-position-/);
    const leftCard2a = carouselItems2a.find(el => el.getAttribute('data-testid') === 'carousel-position-1');
    await user.click(leftCard2a!);
    
    const dayBeforeEnglish = formatDate(dayBeforeYesterday, 'en');
    const dayBeforeChinese = formatDate(dayBeforeYesterday, 'zh');
    const dayBeforeRegex = new RegExp(`${dayBeforeEnglish}|${dayBeforeChinese}`, 'i');
    
    await waitFor(() => {
      const dates = screen.queryAllByText(dayBeforeRegex);
      expect(dates.length).toBeGreaterThan(0);
    });

    // Wait for animation to complete before clicking next
    await waitFor(() => {
      const testItems = screen.getAllByTestId(/carousel-position-/);
      const testRightCard = testItems.find(el => el.getAttribute('data-testid') === 'carousel-position-3');
      expect(testRightCard).toBeDefined();
      expect(window.getComputedStyle(testRightCard!).pointerEvents).not.toBe('none');
    }, { timeout: 2000 });
    
    // Now click next (right card at position 3)
    const carouselItems3 = screen.getAllByTestId(/carousel-position-/);
    const rightCard = carouselItems3.find(el => el.getAttribute('data-testid') === 'carousel-position-3');
    expect(rightCard).toBeDefined();
    await user.click(rightCard!);

    // Should see yesterday's date
    await waitFor(() => {
      const dates = screen.queryAllByText(yesterdayRegex);
      expect(dates.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });
});
