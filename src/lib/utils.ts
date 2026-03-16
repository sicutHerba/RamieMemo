import { Language, BilingualText } from '@/types/memo';

/**
 * Get the hash folder for a memo ID
 * Formula: memoId % 256 → hex
 */
export function getMemoFolder(memoId: string | number): string {
  const num = typeof memoId === 'string' 
    ? parseInt(memoId.replace('memo_', ''))
    : memoId;
  return (num % 256).toString(16).padStart(2, '0');
}

/**
 * Get the file path for a memo
 */
export function getMemoPath(memoId: string): string {
  const num = parseInt(memoId.replace('memo_', ''));
  const hash = getMemoFolder(num);
  const filename = `memo_${String(num).padStart(4, '0')}.json`;
  return `/data/memos/${hash}/${filename}`;
}

/**
 * Get text in the current language
 */
export function getText(text: BilingualText, lang: Language): string {
  return text?.[lang] || text?.zh || '';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined, lang: Language): string {
  if (!dateString) return lang === 'zh' ? '无日期' : 'No date';
  
  const date = new Date(dateString);
  if (lang === 'zh') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

/**
 * Get today's date in MM-DD format for matching
 */
export function getTodayMMDD(): string {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Check if a memo date matches today's month-day
 */
export function matchesToday(memoDate: string | null | undefined): boolean {
  if (!memoDate) return false;
  const memoMD = memoDate.substring(5); // Get MM-DD from YYYY-MM-DD
  return memoMD === getTodayMMDD();
}

/**
 * Get memo type display name
 */
export function getMemoTypeLabel(type: string, lang: Language): string {
  const labels = {
    event: { zh: '历史事件', en: 'Event' },
    quote: { zh: '名言', en: 'Quote' },
    figure: { zh: '人物', en: 'Figure' },
    legal_case: { zh: '法律案件', en: 'Legal Case' },
  };
  return labels[type as keyof typeof labels]?.[lang] || type;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Mobile fallback
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackErr) {
      console.error('Failed to copy:', err, fallbackErr);
      return false;
    }
  }
}

/**
 * Share via Web Share API if available
 */
export async function shareContent(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      console.error('Error sharing:', err);
      return false;
    }
  }
  return false;
}
