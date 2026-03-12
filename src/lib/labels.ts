// UI labels in both languages
// Centralized location for all UI text throughout the application

import { BilingualText } from '@/types/memo';

type Labels = {
  [key: string]: BilingualText;
}

export const labels: Labels = {
  // Header
  appTitle: { zh: '中国备忘录', en: 'China Memo' },
  home: { zh: '首页', en: 'Home' },
  explore: { zh: '浏览', en: 'Explore' },
  about: { zh: '关于', en: 'About' },
  
  // Explore page
  exploreTitle: { zh: '浏览全部备忘录', en: 'Explore All Memos' },
  memosShown: { zh: '条备忘录，', en: 'memos shown,' },
  sortBy: { zh: '排序：', en: 'sort by' },
  sortRecent: { zh: '最新', en: 'Recent' },

  sortTitle: { zh: '标题', en: 'Title' },
  searchPlaceholder: { zh: '搜索标题、标签或内容...', en: 'Search titles, tags, or content...' },
  searching: { zh: '搜索中...', en: 'Searching...' },
  loading: { zh: '加载中...', en: 'Loading...' },
  previousPage: { zh: '上一页', en: 'Previous' },
  nextPage: { zh: '下一页', en: 'Next' },
  
  // Memo card
  sources: { zh: '来源：', en: 'Sources:' },
  relatedFigures: { zh: '相关人物：', en: 'Related Figures:' },
  copyText: { zh: '复制文本', en: 'Copy Text' },
  copied: { zh: '已复制！', en: 'Copied!' },
  copyLink: { zh: '复制链接', en: 'Copy Link' },
  linkCopied: { zh: '链接已复制！', en: 'Link Copied!' },
  share: { zh: '分享', en: 'Share' },
  shareImage: { zh: '分享图片', en: 'Share Image' },
  pressToSave: { zh: '长按保存', en: 'Press to Save' },
  downloadImage: { zh: '下载图片', en: 'Download Image' },
  copyImage: { zh: '复制图片', en: 'Copy Image' },
  imageCopied: { zh: '图片已复制到剪贴板', en: 'Image copied to clipboard' },
  copyImageFailed: { zh: '复制图片失败', en: 'Failed to copy image' },
  close: { zh: '关闭', en: 'Close' },
  viewDetails: { zh: '详情', en: 'Detail' },
  shareMemo: { zh: '分享备忘录', en: 'Share Memo' },
  generatingImage: { zh: '生成图片中...', en: 'Generating image...' },
  
  // Memo modal
  moreLikeThis: { zh: '相关备忘录', en: 'Related Memos' },
  relatedNotes: { zh: '相关备忘录', en: 'Related Memos' },
  back: { zh: '返回', en: 'Back' },
  loadFailed: { zh: '加载失败', en: 'Failed to load' },
  
  // Memo types
  event: { zh: '事件', en: 'Event' },
  quote: { zh: '语录', en: 'Quote' },
  figure: { zh: '人物', en: 'Figure' },
  legalCase: { zh: '法律案例', en: 'Legal Case' },
  
  // Tags
  tagPrefix: { zh: '#', en: '#' },
  
  // Date filter
  allDates: { zh: '所有日期', en: 'All Dates' },
  withDate: { zh: '有日期', en: 'With Date' },
  withoutDate: { zh: '无日期', en: 'Without Date' },
};

/**
 * Get a label in the specified language
 */
export function getLabel(key: string, lang: 'zh' | 'en'): string {
  return labels[key]?.[lang] || key;
}

/**
 * Get a label object (BilingualText)
 */
export function getLabelObject(key: string): BilingualText {
  return labels[key] || { zh: key, en: key };
}
