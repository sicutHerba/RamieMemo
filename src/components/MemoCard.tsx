'use client';

import { Memo, MemoIndex } from '@/types/memo';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate, copyToClipboard } from '@/lib/utils';
import { getLabel } from '@/lib/labels';
import { useState, useRef } from 'react';
import ShareImageModal from '@/components/ShareImageModal';

type Props = {
  memo: Memo;
  onRefresh?: () => void;
  hideViewDetails?: boolean;
  noAnimation?: boolean;
  onRelatedNoteClick?: (memoId: string) => void;
  index?: MemoIndex;
}

export default function MemoCard({ memo, onRefresh, hideViewDetails, noAnimation, onRelatedNoteClick, index }: Props) {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyText = async () => {
    const text = t(memo.content);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/memo/${memo.id}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div ref={cardRef} className={`memo-card max-w-3xl mx-auto ${noAnimation ? 'memo-card-no-animation' : ''}`}>
      {/* Visible card content */}
      <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">
        {t(memo.title)}
      </h2>

      {/* Content */}
      <div className="text-sm sm:text-base mb-3 sm:mb-4" style={{ lineHeight: '1.75' }}>
        {t(memo.content).split(/\n\n+/).map((paragraph, idx) => (
          <p key={idx} className={idx > 0 ? 'mt-2' : ''} style={{ whiteSpace: 'pre-wrap' }}>
            {paragraph}
          </p>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {(memo.tags?.[lang] || memo.tags?.zh || []).map(tag => (
          <a
            key={tag}
            href={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/explore?tag=${encodeURIComponent(tag)}`}
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {getLabel('tagPrefix', lang)}{tag}
          </a>
        ))}
      </div>

      {/* Sources and Links */}
      {memo.sources && memo.sources.length > 0 && (
        <div className="mb-4 text-sm space-y-1">
          {memo.sources.map((source, idx) => (
            <div key={idx}>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:underline"
              >
                {source.title}
              </a>
            </div>
          ))}
        </div>
      )}
      
      {memo.links && memo.links.length > 0 && (
        <div className="mb-4 text-sm space-y-1">
          {memo.links.map((link, idx) => (
            <div key={idx}>
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:underline break-all"
              >
                {link}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Images */}
      {memo.images && memo.images.length > 0 ? (
        <div className="mb-3 sm:mb-4 space-y-3">
          {memo.images.map((img, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center">
              <img 
                src={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}${img.url}`} 
                alt={img.caption ? t(img.caption) : t(memo.title)}
                className="w-full max-h-96 object-contain rounded"
                decoding="async"
              />
              {img.caption && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2 px-2 pb-2 text-center">
                  {t(img.caption)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : memo.image && (
        <div className="mb-3 sm:mb-4 flex items-center justify-center">
          <img 
            src={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}${memo.image}`} 
            alt={t(memo.title)}
            className="w-full max-h-96 object-contain rounded"
            decoding="async"
          />
        </div>
      )}

      {/* Actions */}
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 pt-4 border-t border-gray-300"
        data-share-exclude="true"
      >
        {/* Memo ID on the left */}
        <div className="text-sm text-gray-500 font-mono flex-shrink-0" data-share-exclude="true">
          {memo.id.replace('memo_', '')}
        </div>
        
        {/* Buttons on the right */}
        <div className="flex flex-row gap-2 w-full sm:flex-1" data-share-exclude="true">
          <button
            onClick={handleCopyText}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 w-full sm:flex-1"
            title={getLabel('copyText', lang)}
          >
            {copied ? (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
            <span className="truncate">
              {lang === 'zh' ? '文本' : 'Text'}
            </span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 w-full sm:flex-1"
            title={getLabel('copyLink', lang)}
          >
            {copiedLink ? (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
            <span className="truncate">
              {lang === 'zh' ? '链接' : 'Link'}
            </span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 text-sm border border-black bg-black text-white rounded hover:bg-gray-900 transition-colors flex items-center justify-center gap-1.5 w-full sm:flex-1"
            title={getLabel('share', lang)}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 16V4m0 0l-4 4m4-4l4 4" />
            </svg>
            <span className="truncate">
              {getLabel('share', lang)}
            </span>
          </button>
        </div>
      </div>

      {/* View Detail Link */}
      {!hideViewDetails && (
        <div className="mt-4 text-center" data-share-exclude="true">
          <a 
            href={`${process.env.NODE_ENV === 'production' ? '/RamieMemo' : ''}/memo/${memo.id}`}
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            {getLabel('viewDetails', lang)}
          </a>
        </div>
      )}

      <ShareImageModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        memo={memo}
        captureElement={cardRef.current}
      />

    </div>
  );
}
