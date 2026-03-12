'use client';

export default function EmptyCalendarCard() {
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
      {/* Empty card - only shows green border outline */}
      <div className="flex-1" />
    </div>
  );
}
