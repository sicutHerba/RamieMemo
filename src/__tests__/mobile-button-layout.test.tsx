import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';

// Mock the context
jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', toggleLang: jest.fn() }),
}));

// Mock data functions
jest.mock('@/lib/data', () => ({
  loadMemoIndex: jest.fn(() => Promise.resolve({
    memos: [],
    stats: { total: 0, byYear: {}, byMonth: {}, byDay: {} }
  })),
  getMemoForDate: jest.fn(() => Promise.resolve(null)),
  selectFeaturedMemo: jest.fn(() => null)
}));

describe('Mobile Button Layout', () => {
  it('should display buttons with correct layout: Explore full width, Today and Random split 50/50', async () => {
    const { container } = render(<Home />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Get button container (inside main element, not header)
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    
    // Get buttons specifically from main content area
    const exploreLink = mainElement?.querySelector('a[href="/explore"]');
    const todayButton = screen.getByRole('button', { name: /today|今日/i });
    const randomButton = screen.getByRole('button', { name: /random|随机/i });
    
    expect(exploreLink).toBeInTheDocument();
    expect(todayButton).toBeInTheDocument();
    expect(randomButton).toBeInTheDocument();
    
    // Verify Explore takes full width
    expect(exploreLink?.className).toMatch(/w-full/);
    
    // Verify Today and Random have flex-1 (split equally in flex container)
    expect(todayButton?.className).toMatch(/flex-1/);
    expect(randomButton?.className).toMatch(/flex-1/);
    
    // Verify they are in the same flex container
    const todayParent = todayButton?.parentElement;
    const randomParent = randomButton?.parentElement;
    expect(todayParent).toBe(randomParent);
    expect(todayParent?.className).toMatch(/flex/);
  });
});
