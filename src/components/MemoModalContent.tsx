'use client';

import { useState, useEffect } from 'react';
import MemoCard from '@/components/MemoCard';
import { Memo, MemoIndex } from '@/types/memo';
import { loadMemo, loadMemoIndex, loadMultipleMemos } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/labels';

type Props = {
  initialMemoId: string;
}

export default function MemoModalContent({ initialMemoId }: Props) {
  const { lang } = useLanguage();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [relatedMemos, setRelatedMemos] = useState<Memo[]>([]);
  const [index, setIndex] = useState<MemoIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initialMemoId]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadMemoData = async (memoId: string, isNavigation = false) => {
    try {
      // For navigation within modal, use transitioning state instead of loading
      if (isNavigation) {
        setTransitioning(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Load main memo and index
      const [memoData, indexData] = await Promise.all([
        loadMemo(memoId),
        loadMemoIndex()
      ]);
      setMemo(memoData);
      setIndex(indexData);
      
      // Load related memos if they exist
      if (memoData.relatedMemos && memoData.relatedMemos.length > 0) {
        try {
          const related = await loadMultipleMemos(memoData.relatedMemos);
          setRelatedMemos(related);
        } catch (err) {
          console.warn('Failed to load some related memos:', err);
          setRelatedMemos([]);
        }
      } else {
        setRelatedMemos([]);
      }
    } catch (err) {
      console.error('Failed to load memo:', err);
      setError(getLabel('loadFailed', lang));
    } finally {
      setLoading(false);
      setTransitioning(false);
    }
  };

  useEffect(() => {
    loadMemoData(initialMemoId, false);
  }, [lang]);

  const handleRelatedMemoClick = (memoId: string) => {
    loadMemoData(memoId, true);
    // Add to navigation history
    const newHistory = navigationHistory.slice(0, currentIndex + 1);
    newHistory.push(memoId);
    setNavigationHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    
    // Scroll modal content to top
    const modalContent = document.querySelector('.modal-content-scroll');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousMemoId = navigationHistory[newIndex];
      setCurrentIndex(newIndex);
      loadMemoData(previousMemoId, true);
      
      // Scroll modal content to top
      const modalContent = document.querySelector('.modal-content-scroll');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">
          {getLabel('loading', lang)}
        </p>
      </div>
    );
  }

  if (error || !memo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-xl mb-4">{error || '未找到'}</p>
      </div>
    );
  }

  return (
    <div className={transitioning ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-200'}>
      {/* Back Button */}
      {currentIndex > 0 && (
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            ← {getLabel('back', lang)}
          </button>
        </div>
      )}

      {/* Main Memo */}
      <div className="w-full">
        <MemoCard memo={memo} hideViewDetails={true} noAnimation={true} onRelatedNoteClick={handleRelatedMemoClick} index={index || undefined} />
      </div>

      {/* Related Memos */}
      {relatedMemos.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedMemos.map(related => (
              <button
                key={related.id}
                onClick={() => handleRelatedMemoClick(related.id)}
                className="block p-4 border border-gray-300 rounded hover:shadow-md transition-shadow text-left"
              >
                <h3 className="text-base font-semibold mb-2">
                  {related.title?.[lang] || related.title?.zh || ''}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {related.content?.[lang] || related.content?.zh || ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
