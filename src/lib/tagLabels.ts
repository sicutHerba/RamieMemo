import { BilingualText } from '@/types/memo';

/**
 * Tag labels for bilingual display
 * Maps internal tag IDs to display names in both languages
 */
type TagLabel = {
  id: string;
  label: BilingualText;
};

/**
 * Get tag label for display
 * Falls back to the tag itself if no label is defined
 */
export function getTagLabel(tag: string, lang: 'zh' | 'en'): string {
  const tagLabel = tagLabels.find(t => t.id === tag);
  return tagLabel ? tagLabel.label[lang] : tag;
}

/**
 * Get tag ID from display text in either language
 * Tries exact match first, then case-insensitive match
 */
export function getTagId(displayText: string): string {
  // Try exact match first
  let tagLabel = tagLabels.find(
    t => t.label.zh === displayText || t.label.en === displayText || t.id === displayText
  );
  
  if (tagLabel) {
    return tagLabel.id;
  }
  
  // Try case-insensitive match
  const lowerText = displayText.toLowerCase();
  tagLabel = tagLabels.find(
    t => t.label.zh.toLowerCase() === lowerText || 
         t.label.en.toLowerCase() === lowerText || 
         t.id.toLowerCase() === lowerText
  );
  
  if (tagLabel) {
    return tagLabel.id;
  }
  
  // Fallback: return normalized version of input (lowercase, spaces to dashes)
  return displayText.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Common tag labels across both languages
 * Add mappings here when Chinese and English tags represent the same concept
 */
const tagLabels: TagLabel[] = [
  // Core topics
  { id: 'legal', label: { zh: '司法', en: 'Legal' } },
  { id: 'judiciary', label: { zh: '法律', en: 'Judiciary' } },
  { id: 'quote', label: { zh: '名言', en: 'Quote' } },
  { id: 'human-rights', label: { zh: '人权', en: 'Human Rights' } },
  { id: 'censorship', label: { zh: '审查', en: 'Censorship' } },
  { id: 'literature', label: { zh: '文学', en: 'Literature' } },
  { id: 'freedom-of-speech', label: { zh: '言论自由', en: 'Freedom of Speech' } },
  { id: 'historical-event', label: { zh: '历史事件', en: 'Historical Event' } },
  { id: 'environment', label: { zh: '环境', en: 'Environment' } },
  { id: 'democracy-movement', label: { zh: '民主运动', en: 'Democracy Movement' } },
  { id: 'politics', label: { zh: '政治', en: 'Politics' } },
  { id: 'education', label: { zh: '教育', en: 'Education' } },
  { id: 'rights-defense', label: { zh: '维权', en: 'Rights Defense' } },
  { id: 'social-movement', label: { zh: '社会运动', en: 'Social Movement' } },
  { id: 'art', label: { zh: '艺术', en: 'Art' } },
  { id: 'press-freedom', label: { zh: '新闻自由', en: 'Press Freedom' } },
  
  // People
  { id: 'tan-zuoren', label: { zh: '谭作人', en: 'Tan Zuoren' } },
  { id: 'ai-weiwei', label: { zh: '艾未未', en: 'Ai Weiwei' } },
  { id: 'liu-xiaobo', label: { zh: '刘晓波', en: 'Liu Xiaobo' } },
  { id: 'lu-xun', label: { zh: '鲁迅', en: 'Lu Xun' } },
  { id: 'liu-xia', label: { zh: '刘霞', en: 'Liu Xia' } },
  
  // Additional concepts
  { id: 'democracy', label: { zh: '民主', en: 'Democracy' } },
  { id: 'freedom', label: { zh: '自由', en: 'Freedom' } },
  { id: 'protest', label: { zh: '抗议', en: 'Protest' } },
  { id: 'government', label: { zh: '政府', en: 'Government' } },
  { id: 'dissident', label: { zh: '异议人士', en: 'Dissident' } },
  { id: 'writer', label: { zh: '作家', en: 'Writer' } },
  { id: 'artist', label: { zh: '艺术家', en: 'Artist' } },
  { id: 'activist', label: { zh: '活动家', en: 'Activist' } },
];

export { tagLabels };
