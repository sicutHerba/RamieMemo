'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';

export default function Header() {
  const { lang } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExplorePage, setIsExplorePage] = useState(false);

  useEffect(() => {
    // Check if we're on the explore page
    const checkExplorePage = () => {
      const path = window.location.pathname || '/';
      const normalizedPath = path.replace(basePath || '', '');
      setIsExplorePage(normalizedPath === '/explore' || normalizedPath === '/explore/');
    };
    
    checkExplorePage();
    window.addEventListener('popstate', checkExplorePage);
    
    return () => window.removeEventListener('popstate', checkExplorePage);
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Don't update header state when modal is open
          if (document.body.hasAttribute('data-modal-open')) {
            ticking = false;
            return;
          }
          
          const scrollY = window.scrollY;
          
          // Only enable header minimizing on explore page
          if (!isExplorePage) {
            setIsScrolled(false);
          } else {
            // Use different thresholds to create a stable range (hysteresis)
            // When expanded, need to scroll past 80px to minimize
            // When minimized, need to scroll back below 20px to expand
            if (!isScrolled && scrollY > 80) {
              setIsScrolled(true);
            } else if (isScrolled && scrollY < 20) {
              setIsScrolled(false);
            }
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Only listen to scroll on explore page for header minimizing
    if (isExplorePage) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isScrolled, isExplorePage]);

  return (
    <header className={`w-full bg-white border-b border-gray-200 transition-all duration-200 ease-out fixed top-0 z-50 shadow-sm ${isScrolled ? 'py-1' : ''}`} style={{ margin: 0, padding: 0 }}>
      <div className={`container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 flex items-center justify-between transition-all duration-200 ease-out ${isScrolled ? 'py-1' : 'py-3 sm:py-6'}`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <a href={`${basePath}/`} className="hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src={`${basePath}/icon.svg`} 
              alt="Ramie Memo" 
              className={`transition-all duration-200 ease-out ${isScrolled ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-12 h-12 sm:w-16 sm:h-16'}`}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              fetchPriority="high"
              decoding="async"
            />
          </a>
          <div className="min-w-0 flex-1">
            <h1 className={`transition-all duration-200 ease-out ${isScrolled ? 'text-sm sm:text-base' : 'text-base sm:text-xl lg:text-2xl'} truncate`}>
              <a href={`${basePath}/`} className="hover:opacity-80 transition-opacity">
                苧麻备忘录 Ramie Memo
              </a>
            </h1>
            <p className={`text-gray-600 transition-all duration-200 ease-out overflow-hidden ${isScrolled ? 'text-xs h-0 opacity-0' : 'text-xs sm:text-sm md:text-base h-4 sm:h-5 md:h-6 opacity-100'}`} suppressHydrationWarning>
              丝缕交织，草木绵延<span className="hidden sm:inline"> Threads entwine, grasses endure</span>
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
          {/* Desktop Navigation */}
          <a 
            href={`${basePath}/`}
            className="text-gray-700 hover:text-black transition-colors text-sm sm:text-base hidden md:inline"
            suppressHydrationWarning
          >
            {lang === 'zh' ? '今日' : 'Today'}
          </a>
          <a 
            href={`${basePath}/explore`}
            className="text-gray-700 hover:text-black transition-colors text-sm sm:text-base hidden sm:inline"
            suppressHydrationWarning
          >
            {lang === 'zh' ? '浏览' : 'Explore'}
          </a>
          <a 
            href={`${basePath}/about`}
            className="text-gray-700 hover:text-black transition-colors text-sm sm:text-base hidden md:inline"
            suppressHydrationWarning
          >
            {lang === 'zh' ? '关于' : 'About'}
          </a>

          {/* Mobile Menu Button */}
          <div className="relative sm:hidden" style={{ zIndex: 1 }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-black transition-colors"
              style={{ position: 'relative', zIndex: 1 }}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <a 
                    href={`${basePath}/`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    {lang === 'zh' ? '今日' : 'Today'}
                  </a>
                  <a 
                    href={`${basePath}/explore`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    {lang === 'zh' ? '浏览' : 'Explore'}
                  </a>
                  <a 
                    href={`${basePath}/about`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    {lang === 'zh' ? '关于' : 'About'}
                  </a>
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
