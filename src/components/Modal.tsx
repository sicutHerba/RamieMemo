'use client';

import { useEffect, useRef } from 'react';
import { Memo } from '@/types/memo';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: Props) {
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative w-full max-w-3xl md:max-w-5xl my-8 bg-[#F5F5F5] rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Content */}
            <div className="modal-content-scroll px-4 sm:px-8 pt-8 pb-12 max-h-[85vh] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
