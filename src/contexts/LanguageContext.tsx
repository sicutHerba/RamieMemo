'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, BilingualText } from '@/types/memo';

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: BilingualText) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (text) => text.zh
});

// Get initial language from localStorage or default to Chinese
const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved === 'zh' || saved === 'en') {
      return saved;
    }
  }
  return 'zh';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLang);
    }
  };

  const t = (text: BilingualText) => text[lang];

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
