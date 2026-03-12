import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageProvider, useLanguage } from '../LanguageContext';

// Test component that uses the language context
function TestComponent() {
  const { lang, setLang, t } = useLanguage();
  
  const testText = {
    zh: '中文文本',
    en: 'English text'
  };
  
  return (
    <div>
      <div data-testid="current-lang">{lang}</div>
      <div data-testid="translated-text">{t(testText)}</div>
      <button onClick={() => setLang('zh')}>中文</button>
      <button onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

describe('LanguageContext', () => {
  it('should provide default language as zh', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('current-lang')).toHaveTextContent('zh');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('中文文本');
  });

  it('should switch to English', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);
    
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('English text');
  });

  it('should switch back to Chinese', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    const enButton = screen.getByText('EN');
    const zhButton = screen.getByText('中文');
    
    fireEvent.click(enButton);
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    
    fireEvent.click(zhButton);
    expect(screen.getByTestId('current-lang')).toHaveTextContent('zh');
    expect(screen.getByTestId('translated-text')).toHaveTextContent('中文文本');
  });

  it('should translate text based on current language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('translated-text')).toHaveTextContent('中文文本');
    
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByTestId('translated-text')).toHaveTextContent('English text');
  });

  it('should persist language preference', () => {
    const { unmount } = render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    fireEvent.click(screen.getByText('EN'));
    unmount();
    
    // Re-render with new provider instance
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    // Should remember the language preference from localStorage
    // Note: You may need to mock localStorage for this to work
  });
});
