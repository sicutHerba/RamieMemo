'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import MemoCard from '@/components/MemoCard';
import { Memo, MemoIndex } from '@/types/memo';
import { loadMemo, loadMultipleMemos, loadMemoIndex } from '@/lib/data';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MemoDetailClient({ memoId }: { memoId: string }) {
  const { lang } = useLanguage();
  
  const [memo, setMemo] = useState<Memo | null>(null);
  const [relatedMemos, setRelatedMemos] = useState<Memo[]>([]);
  const [index, setIndex] = useState<MemoIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const loadData = async () => {
      try {
        setLoading(true);
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
          }
        }
      } catch (err) {
        console.error('Failed to load memo:', err);
        setError(lang === 'zh' ? '加载失败' : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [memoId, lang]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-6 lg:px-12 xl:px-24 py-8 mt-[80px] sm:mt-[104px]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">
              {lang === 'zh' ? '加载中...' : 'Loading...'}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error || !memo) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-6 lg:px-12 xl:px-24 py-8 mt-[80px] sm:mt-[104px]">
          <div className="text-center py-12">
            <p className="text-red-600 text-xl mb-4">{error || '未找到'}</p>
            <a href={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/explore`} className="btn-primary">
              {lang === 'zh' ? '返回浏览' : 'Back to Explore'}
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-6 lg:px-12 xl:px-24 py-8 mt-[80px] sm:mt-[104px]">
        {/* Main Memo */}
        <MemoCard memo={memo} hideViewDetails={true} noAnimation={true} index={index || undefined} />

        {/* Related Memos */}
        {relatedMemos.length > 0 && (
          <div className="mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {relatedMemos.map(related => (
                <a
                  key={related.id}
                  href={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/memo/${related.id}`}
                  className="block p-4 border border-gray-300 rounded hover:shadow-md transition-shadow"
                >
                  <h3 className="text-base font-semibold mb-2">
                    {related.title?.[lang] || related.title?.zh || ''}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {related.content?.[lang] || related.content?.zh || ''}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
