'use client';

import { Memo } from '@/types/memo';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarMemoCardProps {
  memo: Memo;
  date: Date;
}

export default function CalendarMemoCard({ memo, date }: CalendarMemoCardProps) {
  const { lang } = useLanguage();

  // Format date
  const dateStr = lang === 'zh' 
    ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Truncate content to fit
  const maxLength = 400;
  const content = memo.content?.[lang] || memo.content?.zh || '';
  const truncatedContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;

  return (
    <div 
      className="memo-card-calendar bg-[#FAF8F3] rounded-sm shadow-lg overflow-hidden max-w-[320px] sm:max-w-[480px]"
      style={{ 
        width: '100%',
        height: '500px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Date Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {dateStr}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-3 pb-6 overflow-hidden">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          {memo.title?.[lang] || memo.title?.zh || ''}
        </h3>
        <div className="text-sm sm:text-base text-gray-700" style={{ lineHeight: '1.75' }}>
          {truncatedContent.split(/\n\n+/).map((paragraph, idx) => (
            <p key={idx} className={idx > 0 ? 'mt-2' : ''} style={{ whiteSpace: 'pre-wrap' }}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
