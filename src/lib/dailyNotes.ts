/**
 * Daily Notes - Defines which memo to show on each day
 * Loads from separate year files for easy management
 * 
 * To add a new year:
 * 1. Create a new file: src/lib/dailyNotes/YYYY.ts
 * 2. Export dailyNotesYYYY with date-to-memo mappings
 * 3. Import and add to YEAR_MODULES below
 */

import { dailyNotes2026 } from './dailyNotes/2026';

/**
 * Registry of all available year modules
 * Add new years here as they become available
 */
const YEAR_MODULES: Record<number, Record<string, string>> = {
  2026: dailyNotes2026,
  // Add future years here:
  // 2027: dailyNotes2027,
  // 2028: dailyNotes2028,
};

/**
 * Get memo ID for a specific date
 * @param date - The date to get memo for
 * @returns memo ID if found, null if not assigned
 */
export function getMemoIdForDate(date: Date): string | null {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;
  
  // Get the year module
  const yearNotes = YEAR_MODULES[year];
  if (!yearNotes) return null;
  
  return yearNotes[key] || null;
}
