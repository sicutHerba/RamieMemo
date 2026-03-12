// Core memo types based on design document

export type MemoType = 
  | "event"         // Historical events and important dates
  | "quote"         // Notable quotes and statements
  | "figure"        // Public figures and biographies
  | "legal_case";   // Legal cases and verdicts

export type BilingualText = {
  zh: string;       // Chinese text
  en: string;       // English text
}

export type Source = {
  title: string;
  url: string;
  archived?: string; // Archive.org link
}

export type ImageWithCaption = {
  url: string;
  caption?: BilingualText;
}

export type Memo = {
  id: string;                    // Unique identifier (memo_0001, memo_0002, etc.)
  title: BilingualText;          // Short title in both languages
  content: BilingualText;        // Main content in both languages (markdown supported)
  date?: string | null;          // ISO 8601 date (OPTIONAL - can be null for quotes, etc.)
  type: MemoType;
  tags: {
    zh: string[];                // Chinese tags
    en: string[];                // English tags
  };
  image?: string;                // Optional single image URL (for backward compatibility)
  images?: ImageWithCaption[];   // Optional multiple images with captions
  source?: string;               // Source information/attribution (optional)
  sources?: Source[];            // Reference sources with URLs (optional)
  links?: string[];              // External reference links (optional)
  relatedMemos?: string[];       // Array of related memo IDs (optional)
  updatedAt: string;             // ISO 8601 timestamp when memo was last updated
}

// Lightweight metadata for index (without full content)
export type MemoMetadata = {
  id: string;
  title: BilingualText;
  date?: string | null;
  type: MemoType;
  tags: {
    zh: string[];
    en: string[];
  };
  folder: string;               // Which hash folder contains this memo
  updatedAt: string;            // ISO 8601 timestamp when memo was last updated
}

// Index structure
export type MemoIndex = {
  version: string;
  lastUpdated: string;
  totalMemos: number;
  folderCount: number;
  memos: MemoMetadata[];        // ALL memo metadata (no content)
  tags: {
    zh: Record<string, number>;
    en: Record<string, number>;
  };
  types: Record<MemoType, number>;
  withDates: number;
  withoutDates: number;
}

// Language context
export type Language = 'zh' | 'en';

// Search/filter state
export type FilterState = {
  searchQuery: string;
  selectedTags: string[];
  selectedType: MemoType | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  hasDateFilter: 'all' | 'with-date' | 'without-date';
}
