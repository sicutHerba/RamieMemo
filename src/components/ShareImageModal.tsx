'use client';

import { useEffect, useState, useRef } from 'react';
import { Memo } from '@/types/memo';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLabel } from '@/lib/labels';
import { toPng } from 'html-to-image';
import { formatDate } from '@/lib/utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memo: Memo;
  displayDate?: Date;
  captureElement?: HTMLElement | null;
}

export default function ShareImageModal({ isOpen, onClose, memo, displayDate, captureElement }: Props) {
  const { lang, t } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate image when modal opens
  useEffect(() => {
    if (isOpen) {
      setImageUrl(null);
      setCopyStatus('idle');
      setGenerationError(null);
      generateImage();
    }
  }, [isOpen]);

  const generateImage = async () => {
    if (!captureElement && !contentRef.current) {
      console.error('Content ref not available');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    let clone: HTMLDivElement | null = null;
    let wrapper: HTMLDivElement | null = null;
    try {
      const filter = (node: HTMLElement) => {
        if (!(node instanceof HTMLElement)) return true;
        if (node.dataset.shareExclude === 'true') return false;
        return !node.closest('[data-share-exclude="true"]');
      };

      if (captureElement) {
        clone = captureElement.cloneNode(true) as HTMLDivElement;
        clone.style.transform = 'none';
        clone.style.pointerEvents = 'none';

        clone.querySelectorAll('[data-share-exclude="true"]').forEach((node) => {
          node.remove();
        });

        // Handle images with potential CORS issues
        const images = clone.querySelectorAll('img');
        await Promise.all(Array.from(images).map(async (img) => {
          // Skip data URLs and relative URLs
          if (img.src.startsWith('data:') || img.src.startsWith('/')) {
            return;
          }

          try {
            // Test if image can be loaded with CORS
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              testImg.onload = resolve;
              testImg.onerror = reject;
              testImg.src = img.src;
            });
            
            // If successful, set crossOrigin on the clone's image
            img.crossOrigin = 'anonymous';
          } catch (error) {
            // If CORS fails, remove the image to prevent toPng from failing
            console.warn(`CORS issue with image: ${img.src}. Removing from share capture.`);
            const parent = img.parentElement;
            if (parent) {
              // Remove the entire image container
              parent.remove();
            }
          }
        }));

        const footer = document.createElement('div');
        footer.style.paddingTop = '12px';
        footer.style.marginTop = '12px';
        footer.style.borderTop = '1px solid #d1d5db';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'space-between';
        footer.style.alignItems = 'center';
        footer.style.fontSize = '13px';
        footer.style.color = '#6b7280';

        const idSpan = document.createElement('span');
        idSpan.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
        idSpan.textContent = memo.id.replace('memo_', '');

        const rightSection = document.createElement('div');
        rightSection.style.display = 'flex';
        rightSection.style.flexDirection = 'column';
        rightSection.style.alignItems = 'flex-end';
        rightSection.style.gap = '0px';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = '苧麻备忘录 Ramie Memo';

        const urlSpan = document.createElement('span');
        urlSpan.style.fontSize = '11px';
        urlSpan.style.color = '#9ca3af';
        urlSpan.textContent = 'sicutherba.github.io/RamieMemo';

        rightSection.appendChild(titleSpan);
        rightSection.appendChild(urlSpan);

        footer.appendChild(idSpan);
        footer.appendChild(rightSection);
        clone.appendChild(footer);
      } else {
        clone = contentRef.current?.cloneNode(true) as HTMLDivElement;
      }

      if (!clone) {
        return;
      }

      clone.style.display = 'block';
      clone.style.pointerEvents = 'none';

      wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      wrapper.style.width = '520px';
      wrapper.style.height = 'auto';
      wrapper.style.pointerEvents = 'none';

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      await new Promise(requestAnimationFrame);

      const dataUrl = await toPng(clone, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#FAF8F3',
        filter,
      });

      setImageUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setGenerationError(
        lang === 'zh' 
          ? `生成图片失败: ${errorMsg.includes('CORS') ? '图片跨域限制' : '请稍后重试'}`
          : `Failed to generate image: ${errorMsg.includes('CORS') ? 'Image CORS restriction' : 'Please try again'}`
      );
    } finally {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `memo_${memo.id}_${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!imageUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Check if clipboard API is available
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to copy image:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleClose = () => {
    setImageUrl(null);
    setCopyStatus('idle');
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      
      // Prevent body scroll on both desktop and mobile
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.setAttribute('data-modal-open', 'true');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      // Restore scroll position when modal closes
      if (isOpen) {
        const scrollY = scrollPositionRef.current;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.removeAttribute('data-modal-open');
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black bg-opacity-50"
      data-share-exclude="true"
      onClick={handleClose}
    >
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative w-full max-w-xl my-8 bg-[#F5F5F5] rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={getLabel('close', lang)}
            >
              ✕
            </button>

            {/* Content */}
            <div className="px-8 py-12 max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl mb-6 text-center">
                {getLabel('shareMemo', lang)}
              </h2>

              {/* Content for image generation - matching MemoCard design from today page */}
              {!captureElement && (
                <div 
                  ref={contentRef}
                  data-testid="share-capture-template"
                  style={{ 
                    width: '520px',
                    display: 'none',
                    pointerEvents: 'none',
                    backgroundColor: '#FAF8F3',
                    border: '1px solid transparent',
                    outline: '2px solid rgba(135, 154, 119, 0.4)',
                    outlineOffset: '-8px',
                    borderRadius: '2px',
                    padding: '24px',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                  }}
                >
                {/* Date */}
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: '#000',
                }}>
                  {formatDate((displayDate || new Date()).toISOString(), lang)}
                </h2>

                {/* Title */}
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: '#000',
                }}>
                  {t(memo.title)}
                </h2>

                {/* Content */}
                <div style={{
                  fontSize: '16px',
                  lineHeight: '1.625',
                  marginBottom: '16px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {t(memo.content)}
                </div>

                {/* Tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  {(memo.tags?.[lang] || memo.tags?.zh || []).map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        fontSize: '14px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  paddingTop: '12px',
                  marginTop: '12px',
                  borderTop: '1px solid #d1d5db',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#6b7280',
                }}>
                  <span style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif' }}>{memo.id.replace('memo_', '')}</span>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0px',
                  }}>
                    <span>苧麻备忘录 Ramie Memo</span>
                    <span style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                    }}>sicutherba.github.io/RamieMemo</span>
                  </div>
                </div>
              </div>
            )}

              {/* Generated image preview */}
              {imageUrl && !isGenerating && (
                <div className="mt-6">
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt="Share preview"
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Action buttons for desktop */}
                  {!isMobile && (
                    <div className="flex gap-4 mt-6 justify-center">
                      <button
                        onClick={handleDownload}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {getLabel('downloadImage', lang)}
                      </button>
                      <button
                        onClick={handleCopyImage}
                        className="px-6 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        {copyStatus === 'success' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : copyStatus === 'error' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        )}
                        {getLabel('copyImage', lang)}
                      </button>
                    </div>
                  )}

                  {/* Instruction for mobile */}
                  {isMobile && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        {lang === 'zh' ? '长按图片保存到相册' : 'Long press the image to save'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loading state - shown while generating */}
              {isGenerating && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">{getLabel('generatingImage', lang)}</p>
                  </div>
                </div>
              )}

              {/* Error state - shown when generation fails */}
              {!isGenerating && generationError && (
                <div className="mt-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-red-800 font-medium mb-1">
                          {lang === 'zh' ? '生成失败' : 'Generation Failed'}
                        </p>
                        <p className="text-sm text-red-700">{generationError}</p>
                        <button
                          onClick={generateImage}
                          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                        >
                          {lang === 'zh' ? '重试' : 'Retry'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
