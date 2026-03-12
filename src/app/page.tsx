'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import MemoCard from '@/components/MemoCard';
import CalendarMemoCard from '@/components/CalendarMemoCard';
import EmptyCalendarCard from '@/components/EmptyCalendarCard';
import Modal from '@/components/Modal';
import MemoModalContent from '@/components/MemoModalContent';
import ShareImageModal from '@/components/ShareImageModal';
import { Memo, MemoIndex } from '@/types/memo';
import { getMemoForDate, selectFeaturedMemo, loadMemoIndex } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/labels';

type ViewMode = 'today' | 'random';

// Utility function to normalize date (remove time)
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Utility function to check if date is not in future
const isNotFuture = (date: Date): boolean => {
  const today = normalizeDate(new Date());
  const normalized = normalizeDate(date);
  return normalized <= today;
};

// Check if date is within 2-week back limit from today
const isWithinBackLimit = (date: Date): boolean => {
  const today = normalizeDate(new Date());
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 2 weeks = 14 days
  const normalized = normalizeDate(date);
  return normalized >= twoWeeksAgo;
};

export default function HomePage() {
  const { lang } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Carousel: always 5 cards [far-left, left, center, right, far-right] with their dates
  const [carouselCards, setCarouselCards] = useState<{ memo: Memo | null; date: Date }[]>([]);
  
  const [index, setIndex] = useState<MemoIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Track touch movement to differentiate between tap and scroll
  const touchStartY = useRef<number>(0);
  const touchMoved = useRef<boolean>(false);

  const loadMemoForDate = async (date: Date, direction?: 'left' | 'right') => {
    if (direction) {
      // Start animation
      setSlideDirection(direction);
      setIsAnimating(true);
      
      if (direction === 'left') {
        // Press -> : Rotate left, add new card on far right
        const newRightDate = new Date(date);
        newRightDate.setDate(newRightDate.getDate() + 2);
        
        const newRightMemo = isNotFuture(newRightDate) ? await getMemoForDate(newRightDate) : null;
        
        setCarouselCards(prev => [...prev.slice(1), { memo: newRightMemo, date: newRightDate }]);
        setCurrentDate(date);
      } else {
        // Press <- : Rotate right, add new card on far left
        const newLeftDate = new Date(date);
        newLeftDate.setDate(newLeftDate.getDate() - 2);
        
        // Only load if within 2-week limit
        const newLeftMemo = isWithinBackLimit(newLeftDate) ? await getMemoForDate(newLeftDate) : null;
        
        setCarouselCards(prev => [{ memo: newLeftMemo, date: newLeftDate }, ...prev.slice(0, 4)]);
        setCurrentDate(date);
      }
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Reset animation
      setIsAnimating(false);
      setSlideDirection(null);
      setError(null);
    } else {
      // Initial load
      try {
        // Load 5 cards: [day-2, day-1, day, day+1, day+2]
        const cards: { memo: Memo | null; date: Date }[] = [];
        
        for (let offset = -2; offset <= 2; offset++) {
          const cardDate = new Date(date);
          cardDate.setDate(cardDate.getDate() + offset);
          
          // Check both future and 2-week back limits
          const memo = (isNotFuture(cardDate) && isWithinBackLimit(cardDate)) 
            ? await getMemoForDate(cardDate) 
            : null;
          cards.push({ memo, date: new Date(cardDate) });
        }
        
        setCarouselCards(cards);
        setError(null);
      } catch (err) {
        console.error('Failed to load memo:', err);
        setError(lang === 'zh' ? '加载失败，请刷新页面' : 'Failed to load, please refresh');
      }
    }
  };

  const loadRandomMemo = async () => {
    try {
      setViewMode('random');
      setError(null);
      const randomMemo = await selectFeaturedMemo(true);
      
      // Put random memo in center position, empty slots for others
      const now = new Date();
      const emptySlot = { memo: null, date: now };
      setCarouselCards([
        emptySlot,
        emptySlot,
        { memo: randomMemo, date: now },
        emptySlot,
        emptySlot
      ]);
      
      // Start shuffle animation
      setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }, 50);
    } catch (err) {
      console.error('Failed to load random memo:', err);
      setError(lang === 'zh' ? '加载失败，请刷新页面' : 'Failed to load, please refresh');
    }
  };

  const switchToTodayMode = () => {
    setViewMode('today');
    const today = new Date();
    setCurrentDate(today);
    loadMemoForDate(today);
  };

  const goToPreviousDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if going back would exceed 2-week limit
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    
    if (!isWithinBackLimit(newDate)) {
      return; // Don't allow navigation beyond 2 weeks back
    }
    
    loadMemoForDate(newDate, 'right');  // Go to PREV day: cards slide RIGHT, left card comes to center
  };

  const goToNextDay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent going to future dates
    if (!isNotFuture(new Date(currentDate.getTime() + 86400000))) {
      return;
    }
    
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    loadMemoForDate(newDate, 'left');
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    loadMemoForDate(today);
  };

  const isToday = () => currentDate.toDateString() === new Date().toDateString();
  
  const isFutureDisabled = () => !isNotFuture(new Date(currentDate.getTime() + 86400000));
  
  const isPastDisabled = () => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    return !isWithinBackLimit(previousDate);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMemoForDate(currentDate);
    loadMemoIndex().then(data => setIndex(data));
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-12 xl:px-24 py-4 sm:py-6 md:py-8 mt-[80px] sm:mt-[104px]" style={{ touchAction: 'pan-y pinch-zoom' }}>
        <div className="max-w-4xl mx-auto">
          
          {/* Three Main Buttons */}
          <div className="max-w-xs sm:max-w-sm mx-auto mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2">
            <div className="flex flex-col gap-2">
              {/* First Row: View All */}
              <a 
                href={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/explore`}
                className="px-4 sm:px-5 md:px-7 py-2.5 sm:py-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 w-full text-xs sm:text-sm md:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {lang === 'zh' ? '浏览全部' : 'Explore'}
              </a>
              
              {/* Second Row: Today and Random */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={switchToTodayMode}
                  className={`px-4 sm:px-5 md:px-7 py-2.5 sm:py-3 rounded transition-colors flex items-center justify-center gap-1.5 sm:gap-2 flex-1 text-xs sm:text-sm md:text-base ${
                    viewMode === 'today'
                      ? 'bg-black text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {lang === 'zh' ? '今日' : 'Today'}
                </button>
                
                <button
                  type="button"
                  onClick={loadRandomMemo}
                  className={`px-4 sm:px-5 md:px-7 py-2.5 sm:py-3 rounded transition-colors flex items-center justify-center gap-1.5 sm:gap-2 flex-1 text-xs sm:text-sm md:text-base ${
                    viewMode === 'random'
                      ? 'bg-black text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isAnimating && viewMode === 'random' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {lang === 'zh' ? '随机' : 'Random'}
                </button>
              </div>
            </div>
          </div>

          {/* Memo Display */}
          <div className="mb-8 relative mt-2 sm:mt-3">
            {loading && !isAnimating && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">
                  {lang === 'zh' ? '加载中...' : 'Loading...'}
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-12 text-red-600">
                {error}
              </div>
            )}

            {/* Today Mode: Calendar Cards with Carousel */}
            {viewMode === 'today' && carouselCards[2] && !loading && (
              <div className="relative mx-auto max-w-[320px] sm:max-w-[500px]" style={{ minHeight: '500px', perspective: '2000px', touchAction: 'pan-y' }}>
                {/* Always render all 5 card positions */}
                {[0, 1, 2, 3, 4].map((position) => {
                  const card = carouselCards[position];
                  if (!card || !card.memo) return null;
                  
                  const { memo, date: cardDate } = card;
                  
                  // Calculate styles based on position
                  let baseTransform = '';
                  let zIndex = 0;
                  let opacity = 1;
                  let className = 'relative';
                  
                  if (position === 0) {
                    // Far left
                    baseTransform = 'translateX(-100%) rotateY(50deg) scale(0.85)';
                    zIndex = 0;
                    opacity = 0;
                    className = 'absolute left-0 top-0';
                  } else if (position === 1) {
                    // Left - exiting to far left when slideDirection === 'left'
                    baseTransform = 'translateX(-40%) rotateY(35deg) scale(0.92)';
                    zIndex = 5;
                    opacity = 1;
                    className = 'absolute left-0 top-0';
                  } else if (position === 2) {
                    // Center - the incoming card during animation (highest z-index)
                    baseTransform = 'rotateY(0deg) scale(1) translateX(0)';
                    zIndex = 20;
                    opacity = 1;
                  } else if (position === 3) {
                    // Right - exiting to far right when slideDirection === 'right'
                    baseTransform = 'translateX(40%) rotateY(-35deg) scale(0.92)';
                    zIndex = 5;
                    opacity = 1;
                    className = 'absolute right-0 top-0';
                  } else {
                    // Far right
                    baseTransform = 'translateX(100%) rotateY(-50deg) scale(0.85)';
                    zIndex = 0;
                    opacity = 0;
                    className = 'absolute right-0 top-0';
                  }
                  
                  // Calculate animation properties for vivid effect
                  let duration = '700ms';
                  let delay = '0ms';
                  let timingFunction = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Material Design standard
                  
                  if (position === 2) {
                    // Center moves out with delay - waits for incoming card to start
                    duration = '450ms';
                    delay = '100ms'; // Wait a bit before moving
                    timingFunction = 'cubic-bezier(0.4, 0.0, 0.6, 1)'; // Fast out
                  } else if (slideDirection === 'left' && position === 3) {
                    // When sliding left, right card (position 3) starts first
                    duration = '550ms';
                    delay = '0ms'; // Start immediately
                    timingFunction = 'cubic-bezier(0.0, 0.0, 0.2, 1)'; // Smooth entrance
                  } else if (slideDirection === 'right' && position === 1) {
                    // When sliding right, left card (position 1) starts first
                    duration = '550ms';
                    delay = '0ms'; // Start immediately
                    timingFunction = 'cubic-bezier(0.0, 0.0, 0.2, 1)'; // Smooth entrance
                  } else if (position === 1 || position === 3) {
                    // Side cards that are exiting move slower
                    duration = '600ms';
                    delay = '0ms';
                    timingFunction = 'cubic-bezier(0.4, 0.0, 1, 1)'; // Slow exit
                  }
                  
                  return (
                    <div
                      key={`${memo.id}-${cardDate.toISOString()}`}
                      data-testid={`carousel-position-${position}`}
                      className={`${className} transition-all`}
                      style={{
                        width: '100%',
                        transform: baseTransform,
                        transformOrigin: position < 2 ? 'left center' : 'right center',
                        transitionDuration: duration,
                        transitionDelay: delay,
                        transitionTimingFunction: timingFunction,
                        zIndex,
                        opacity,
                        pointerEvents: (position === 1 || position === 2 || position === 3) && !slideDirection ? 'auto' : 'none',
                        cursor: !slideDirection ? 'pointer' : 'default',
                      }}
                      onClick={(e) => {
                        if (!slideDirection && !touchMoved.current) {
                          e.stopPropagation();
                          if (position === 1 && !isPastDisabled()) {
                            // Click left card -> go to previous day (if within 2-week limit)
                            goToPreviousDay(e);
                          } else if (position === 2) {
                            // Click center card -> open modal
                            setIsModalOpen(true);
                          } else if (position === 3 && !isFutureDisabled()) {
                            // Click right card -> go to next day (if not future)
                            goToNextDay(e);
                          }
                        }
                      }}
                      onTouchStart={(e) => {
                        touchStartY.current = e.touches[0].clientY;
                        touchMoved.current = false;
                      }}
                      onTouchMove={(e) => {
                        const touchY = e.touches[0].clientY;
                        if (Math.abs(touchY - touchStartY.current) > 10) {
                          touchMoved.current = true;
                        }
                      }}
                    >
                      {position === 2 ? (
                        <CalendarMemoCard memo={memo} date={cardDate} />
                      ) : (
                        <EmptyCalendarCard />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Random Mode: Full Memo with Shuffle Animation */}
            {viewMode === 'random' && carouselCards[2] && !loading && (
              <div className="relative px-3 sm:px-2 max-w-xs sm:max-w-2xl mx-auto mt-8 sm:mt-0" style={{ width: '100%' }}>
                {/* Background layer 1 - positioned absolutely, will stretch based on MemoCard height */}
                <div 
                  className={`absolute transition-all duration-500 ${isAnimating ? 'animate-shuffle-1' : ''}`}
                  style={{ 
                    top: '-4px', 
                    left: '-4px', 
                    right: '-4px', 
                    bottom: '0',
                    zIndex: 0,
                    transform: isAnimating ? 'rotate(2deg) translateX(-1px) translateY(-1px)' : 'rotate(1.5deg) translateX(-0.5px) translateY(-0.5px)',
                    pointerEvents: 'none'
                  }}
                >
                  <div className="memo-card-no-animation h-full w-full"></div>
                </div>
                
                {/* Background layer 2 - positioned absolutely, will stretch based on MemoCard height */}
                <div 
                  className={`absolute transition-all duration-500 ${isAnimating ? 'animate-shuffle-2' : ''}`}
                  style={{ 
                    top: '-8px', 
                    left: '-8px', 
                    right: '-8px', 
                    bottom: '0',
                    zIndex: 0,
                    transform: isAnimating ? 'rotate(-2.5deg) translateX(-2px) translateY(-2px)' : 'rotate(-2deg) translateX(-1px) translateY(-1px)',
                    pointerEvents: 'none'
                  }}
                >
                  <div className="memo-card-no-animation h-full w-full"></div>
                </div>

                {/* Main card - renders normally in flow, defines the container height */}
                <div className={`relative ${isAnimating ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`} style={{ zIndex: 1 }}>
                  {carouselCards[2]?.memo && (
                    <MemoCard memo={carouselCards[2].memo} hideViewDetails={true} noAnimation={true} index={index || undefined} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {carouselCards[2]?.memo && (
          <MemoModalContent initialMemoId={carouselCards[2].memo.id} />
        )}
      </Modal>

      {/* Share Image Modal */}
      {carouselCards[2]?.memo && (
        <ShareImageModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          memo={carouselCards[2].memo}
          displayDate={carouselCards[2].date}
        />
      )}
    </>
  );
}
