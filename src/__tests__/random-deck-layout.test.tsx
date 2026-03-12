import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import * as dataModule from '@/lib/data';

// Mock the data module
jest.mock('@/lib/data');

const mockMemo = {
  id: 'memo_001',
  title: { en: 'Test Memo', zh: '测试备忘录' },
  content: { en: 'Test content', zh: '测试内容' },
  tags: { en: ['test'], zh: ['测试'] },
};

const mockIndex = { ids: ['memo_001'], lastModified: '2024-01-01' };

describe('Random Mode Deck Layout Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dataModule.getMemoForDate as jest.Mock).mockResolvedValue(mockMemo);
    (dataModule.loadMemoIndex as jest.Mock).mockResolvedValue(mockIndex);
    (dataModule.selectFeaturedMemo as jest.Mock).mockResolvedValue(mockMemo);
  });

  it('should keep deck cards contained within memo boundaries', async () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const randomButton = screen.getByRole('button', { name: /随机|Random/i });
    await act(async () => {
      await userEvent.click(randomButton);
    });

    await waitFor(() => {
      const allCards = document.querySelectorAll('.memo-card-no-animation');
      expect(allCards.length).toBeGreaterThan(0);

      // Find background deck cards
      const deckCards = Array.from(document.querySelectorAll('.memo-card-no-animation'))
        .filter((card) => (card.parentElement as HTMLElement)?.classList.contains('absolute'));
      
      // Should have exactly 2 background deck cards
      expect(deckCards).toHaveLength(2);

      // Verify deck cards are absolutely positioned (don't affect layout)
      deckCards.forEach((card) => {
        const parent = card.parentElement as HTMLElement | null;
        expect(parent).toBeTruthy();
        expect(parent?.classList.contains('absolute')).toBe(true);
        expect(parent?.style.zIndex).toBe('0');
      });
    });
  });

  it('should not add extra elements that increase deck container size', async () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const randomButton = screen.getByRole('button', { name: /随机|Random/i });
    await act(async () => {
      await userEvent.click(randomButton);
    });

    await waitFor(() => {
      // Find the random mode container (the div with shuffle cards)
      const container = screen.getByText(/Test Memo|测试备忘录/).closest('div[class*="relative"]')?.parentElement;
      
      expect(container).toBeInTheDocument();

      if (container) {
        // Count direct children - should be exactly 3:
        // 1. Background card 1 (absolute)
        // 2. Background card 2 (absolute)
        // 3. Main card (relative, defines height)
        const children = Array.from(container.children);
        expect(children).toHaveLength(3);

        // Verify last child is the main card with relative positioning
        const mainCard = children[2];
        expect(mainCard.className).toContain('relative');
        expect((mainCard as HTMLElement).style.zIndex).toBe('1');
      }
    });
  });
});
