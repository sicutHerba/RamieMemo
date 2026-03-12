import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutPage from '@/app/about/page';
import MemoDetailClient from '@/app/memo/[id]/MemoDetailClient';
import { LanguageProvider } from '@/contexts/LanguageContext';

jest.mock('@/components/Header', () => () => <div data-testid="header" />);
jest.mock('@/components/MemoCard', () => () => <div data-testid="memo-card" />);

jest.mock('@/lib/data', () => ({
  loadMemo: jest.fn(() => Promise.resolve({
    id: 'memo_1',
    title: { zh: '测试标题', en: 'Test Title' },
    content: { zh: '测试内容', en: 'Test Content' },
    date: '2024-01-01',
    type: 'event',
    tags: { zh: [], en: [] },
    updatedAt: '2024-01-01T00:00:00.000Z',
    relatedMemos: []
  })),
  loadMemoIndex: jest.fn(() => Promise.resolve({
    totalMemos: 1,
    memos: []
  })),
  loadMultipleMemos: jest.fn(() => Promise.resolve([]))
}));

const renderWithLanguage = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('Page content rendering', () => {
  it('should render main content on about page', () => {
    const { container } = renderWithLanguage(<AboutPage />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main?.className).toMatch(/min-h-screen/);
  });

  it('should render main content on memo detail page', async () => {
    const { container } = renderWithLanguage(<MemoDetailClient memoId="memo_1" />);

    await waitFor(() => {
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
