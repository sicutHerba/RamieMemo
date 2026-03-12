'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import MemoModalContent from '@/components/MemoModalContent';
import { MemoIndex, MemoMetadata } from '@/types/memo';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  loadMemoIndex,
  loadMemo,
  searchMemos,
  searchMemosFullContent,
  filterByTags, 
  filterByDatePresence,
  sortMemos 
} from '@/lib/data';
import { getText } from '@/lib/utils';
import { getLabel } from '@/lib/labels';
import { getTagLabel, getTagId } from '@/lib/tagLabels';
import { getRandomSearchKeyword } from '@/lib/searchKeywords';


export default function ExplorePage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
  const [index, setIndex] = useState<MemoIndex | null>(null);
  const [searchResults, setSearchResults] = useState<MemoMetadata[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<MemoMetadata[]>([]);
  const [memoContents, setMemoContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [actualSearchQuery, setActualSearchQuery] = useState('');
  const [suggestedKeyword, setSuggestedKeyword] = useState('');
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'with-date' | 'without-date'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'recent'>('recent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(() => {
    const pageParam = searchParams?.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const itemsPerPage = 24;

  // Update URL when state changes
  const updateURL = useCallback((updates: { page?: number; search?: string; tags?: string[]; dateFilter?: string; sortBy?: string; sortDirection?: string }) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (updates.page !== undefined) {
      if (updates.page === 1) {
        params.delete('page');
      } else {
        params.set('page', updates.page.toString());
      }
    }
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('q', updates.search);
      } else {
        params.delete('q');
      }
    }
    if (updates.tags !== undefined) {
      if (updates.tags.length > 0) {
        params.set('tags', updates.tags.join(','));
      } else {
        params.delete('tags');
      }
    }
    if (updates.dateFilter !== undefined) {
      if (updates.dateFilter !== 'all') {
        params.set('dateFilter', updates.dateFilter);
      } else {
        params.delete('dateFilter');
      }
    }
    if (updates.sortBy !== undefined) {
      if (updates.sortBy !== 'recent') {
        params.set('sortBy', updates.sortBy);
      } else {
        params.delete('sortBy');
      }
    }
    if (updates.sortDirection !== undefined) {
      if (updates.sortDirection !== 'desc') {
        params.set('sortDir', updates.sortDirection);
      } else {
        params.delete('sortDir');
      }
    }
    
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/explore${newURL}`, { scroll: false });
  }, [router, searchParams]);

  // Only load index on initial mount
  useEffect(() => {
    if (!index) {
      loadMemoIndex().then(data => {
        setIndex(data);
        setSearchResults(data.memos);
        setFilteredMemos(data.memos);
        setLoading(false);
        
        // Initialize from URL parameters
        const qParam = searchParams?.get('q');
        const tagsParam = searchParams?.get('tags');
        const dateFilterParam = searchParams?.get('dateFilter');
        const sortByParam = searchParams?.get('sortBy');
        const sortDirParam = searchParams?.get('sortDir');
        
        if (qParam) {
          setSearchQuery(qParam);
          setActualSearchQuery(qParam);
          setHasUserTyped(true);
        }
        if (tagsParam) {
          setSelectedTags(tagsParam.split(','));
        } else {
          // Check for legacy tag parameter
          const tagParam = searchParams?.get('tag');
          if (tagParam) {
            const tagId = getTagId(tagParam);
            setSelectedTags([tagId]);
          }
        }
        if (dateFilterParam) {
          setDateFilter(dateFilterParam as 'all' | 'with-date' | 'without-date');
        }
        if (sortByParam) {
          setSortBy(sortByParam as 'title' | 'recent');
        }
        if (sortDirParam) {
          setSortDirection(sortDirParam as 'asc' | 'desc');
        }
        
        // Set random search keyword if no query parameter
        if (!qParam) {
          const randomKeyword = getRandomSearchKeyword();
          setSuggestedKeyword(randomKeyword);
          setSearchQuery(randomKeyword);
        }
      });
    }
  }, []); // Only run once on mount

  // Handle language changes
  useEffect(() => {
    if (loading) return; // Skip on initial load
    
    // If search bar was used, reload the page
    if (hasUserTyped || actualSearchQuery) {
      window.location.reload();
      return;
    }
    
    // When switching language, keep selectedTags as-is (they are stored as tag IDs)
    // The UI will update to show the correct language labels
  }, [lang]);

  // Perform search when actualSearchQuery changes
  useEffect(() => {
    if (!index) return;

    const performSearch = async () => {
      let result = index.memos;

      // Apply search - use full content search if query exists
      if (actualSearchQuery) {
        setSearching(true);
        try {
          result = await searchMemosFullContent(index, actualSearchQuery, lang);
        } catch (err) {
          console.error('Search failed:', err);
          result = searchMemos(index, actualSearchQuery, lang);
        } finally {
          setSearching(false);
        }
      }

      setSearchResults(result);
    };

    // Only refresh search if user has actually typed (not just language change)
    if (hasUserTyped) {
      performSearch();
    }
  }, [index, actualSearchQuery, lang, hasUserTyped]);

  // Apply filters and sorting to search results (no searching UI)
  useEffect(() => {
    if (!index) return;

    let result = searchResults;

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = filterByTags(result, selectedTags, lang);
    }

    // Apply date filter
    result = filterByDatePresence(result, dateFilter);

    // Apply sorting
    result = sortMemos(result, sortBy, lang, sortDirection);

    setFilteredMemos(result);
    setPage(1); // Reset to first page when filters change
  }, [searchResults, selectedTags, dateFilter, sortBy, sortDirection, lang, index]);

  const paginatedMemos = filteredMemos.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredMemos.length / itemsPerPage);

  // Scroll to top when page changes (instant for mobile reliability)
  useEffect(() => {
    // Only scroll to top when page number actually changes from user action
    // Skip if this is just an initial mount or URL sync
    if (page !== 1) {
      window.scrollTo(0, 0);
    }
    updateURL({ page });
  }, [page, updateURL]);

  // Update URL when search query changes (debounced)
  useEffect(() => {
    if (!loading && index && hasUserTyped) {
      updateURL({ search: actualSearchQuery });
    }
  }, [actualSearchQuery, loading, index, updateURL, hasUserTyped]);

  // Update URL when tags change
  useEffect(() => {
    if (!loading && index) {
      updateURL({ tags: selectedTags });
    }
  }, [selectedTags, loading, index, updateURL]);

  // Update URL when filters change
  useEffect(() => {
    if (!loading && index) {
      updateURL({ dateFilter, sortBy, sortDirection });
    }
  }, [dateFilter, sortBy, sortDirection, loading, index, updateURL]);

  useEffect(() => {
    // FAST LOADING: Load content for current page first, then prefetch next pages
    const loadContents = async () => {
      // Filter memos that need content loaded
      const memosToLoad = paginatedMemos.filter(memo => {
        const contentKey = `${memo.id}_${lang}`;
        return !memoContents[contentKey];
      });

      if (memosToLoad.length === 0) {
        // If current page is loaded, prefetch next page in background
        prefetchNextPage();
        return;
      }

      // Load all current page memos in parallel
      const loadPromises = memosToLoad.map(async (memo) => {
        const contentKey = `${memo.id}_${lang}`;
        try {
          const fullMemo = await loadMemo(memo.id);
          // Different character limits for different languages
          const charLimit = lang === 'zh' ? 150 : 200;
          const contentText = fullMemo.content?.[lang] || fullMemo.content?.zh || '';
          return {
            key: contentKey,
            content: contentText.length > charLimit 
              ? contentText.substring(0, charLimit) + '...'
              : contentText
          };
        } catch (err) {
          console.error('Failed to load memo:', memo.id);
          return null;
        }
      });

      const results = await Promise.all(loadPromises);
      const contents: Record<string, string> = {};
      results.forEach(result => {
        if (result) {
          contents[result.key] = result.content;
        }
      });
      
      setMemoContents(prev => ({ ...prev, ...contents }));
      
      // After current page loads, prefetch next page in background
      prefetchNextPage();
    };

    // Prefetch next page content in background
    const prefetchNextPage = async () => {
      if (page >= totalPages) return;
      
      const nextPageStart = page * itemsPerPage;
      const nextPageEnd = nextPageStart + itemsPerPage;
      const nextPageMemos = filteredMemos.slice(nextPageStart, nextPageEnd);
      
      const memosToLoad = nextPageMemos.filter(memo => {
        const contentKey = `${memo.id}_${lang}`;
        return !memoContents[contentKey];
      });

      if (memosToLoad.length === 0) return;

      // Load next page in background (no await, fire and forget)
      Promise.all(memosToLoad.map(async (memo) => {
        const contentKey = `${memo.id}_${lang}`;
        try {
          const fullMemo = await loadMemo(memo.id);
          const charLimit = lang === 'zh' ? 150 : 200;
          const contentText = fullMemo.content?.[lang] || fullMemo.content?.zh || '';
          return {
            key: contentKey,
            content: contentText.length > charLimit 
              ? contentText.substring(0, charLimit) + '...'
              : contentText
          };
        } catch (err) {
          return null;
        }
      })).then(results => {
        const contents: Record<string, string> = {};
        results.forEach(result => {
          if (result) {
            contents[result.key] = result.content;
          }
        });
        setMemoContents(prev => ({ ...prev, ...contents }));
      });
    };
    
    if (paginatedMemos.length > 0) {
      loadContents();
    }
  }, [paginatedMemos, lang, page, totalPages, filteredMemos, memoContents, itemsPerPage]);

  const popularTags = index 
    ? Object.entries(index.tags?.[lang] || index.tags?.zh || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag]) => tag)
    : [];

  const toggleTag = (displayTag: string) => {
    // Convert display tag to tag ID for storage
    const tagId = getTagId(displayTag);
    
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 mt-[80px] sm:mt-[104px]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">
              {getLabel('loading', lang)}
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 py-6 sm:py-8 mt-[80px] sm:mt-[104px]">
        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            {getLabel('exploreTitle', lang)}
          </h1>
          
          {/* Combined row: Stats/Sort + Search Bar */}
          <div className="flex flex-col gap-3 mb-4 max-w-7xl">
            {/* Stats and Sort */}
            <div className="flex flex-wrap items-center gap-2 text-gray-600 text-xs sm:text-sm">
              <span className="whitespace-nowrap">
                {`${filteredMemos.length}/${index?.totalMemos || 0} ${getLabel('memosShown', lang)}`}
              </span>
              <span className="hidden sm:inline">{getLabel('sortBy', lang)}</span>
              <button
                onClick={() => {
                  if (sortBy === 'recent') {
                    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy('recent');
                    setSortDirection('desc');
                  }
                }}
                className={`hover:underline whitespace-nowrap ${sortBy === 'recent' ? 'font-semibold text-black' : ''}`}
              >
                {getLabel('sortRecent', lang)}{sortBy === 'recent' && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={() => {
                  if (sortBy === 'title') {
                    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy('title');
                    setSortDirection('desc');
                  }
                }}
                className={`hover:underline whitespace-nowrap ${sortBy === 'title' ? 'font-semibold text-black' : ''}`}
              >
                {getLabel('sortTitle', lang)}{sortBy === 'title' && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
              </button>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHasUserTyped(true);
                }}
                onFocus={(e) => {
                  if (!hasUserTyped) {
                    e.target.select();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setHasUserTyped(true);
                    setActualSearchQuery(searchQuery);
                  }
                }}
                placeholder={getLabel('searchPlaceholder', lang)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 hover:bg-white hover:text-black focus:bg-white focus:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {searching && (
            <p className="text-sm text-gray-500 mb-2">
              {getLabel('searching', lang)}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 max-w-7xl">
          {/* Popular Tags */}
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => {
              const count = index?.tags[lang]?.[tag] || 0;
              const tagId = getTagId(tag);
              const isSelected = selectedTags.includes(tagId);
              
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {getLabel('tagPrefix', lang)}{tag} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 max-w-7xl">
          {paginatedMemos.map(memo => (
            <button
              key={memo.id}
              onClick={() => {
                setSelectedMemoId(memo.id);
                setIsModalOpen(true);
              }}
              className="memo-card block h-full text-left w-full"
            >
              <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                {getText(memo.title, lang)}
              </h3>
              {memoContents[`${memo.id}_${lang}`] && (
                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-3">
                  {memoContents[`${memo.id}_${lang}`]}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                {(memo.tags?.[lang] || memo.tags?.zh || []).slice(0, 8).map(tag => (
                  <a
                    key={tag}
                    href={`${basePath}/explore?tag=${encodeURIComponent(tag)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    {getLabel('tagPrefix', lang)}{tag}
                  </a>
                ))}
                {(memo.tags?.[lang] || memo.tags?.zh || []).length > 8 && (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs text-gray-500">
                    +{(memo.tags?.[lang] || memo.tags?.zh || []).length - 8}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 items-center px-4">
            <button
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
              }}
              disabled={page === 1}
              className="p-1.5 sm:p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700">
              <input
                type="number"
                min="1"
                max={totalPages}
                defaultValue={page}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    const newPage = parseInt(input.value);
                    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
                      setPage(newPage);
                    }
                    // Reset to current page if invalid
                    input.value = page.toString();
                    input.blur();
                  }
                }}
                className="w-10 sm:w-12 px-1 sm:px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-xs sm:text-sm"
                key={page}
              />
              <span>/ {totalPages}</span>
            </div>
            <button
              onClick={() => {
                setPage(p => Math.min(totalPages, p + 1));
              }}
              disabled={page === totalPages}
              className="p-1.5 sm:p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Memo Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedMemoId && (
          <MemoModalContent 
            initialMemoId={selectedMemoId}
          />
        )}
      </Modal>
    </>
  );
}
