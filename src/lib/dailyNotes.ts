/**
 * Daily Notes - Defines which memo to show on each day.
 *
 * Uses a fixed MM-DD calendar so the same sequence repeats every year.
 * No yearly maintenance required.
 */

import { dailyNotesCalendar } from './dailyNotes/calendar';

/**
 * Get memo ID for a specific date, year-agnostic.
 * Leap day (02-29) falls back to 02-28 if not explicitly mapped.
 * @param date - The date to get memo for
 * @returns memo ID if found, null if not assigned
 */
export function getMemoIdForDate(date: Date): string | null {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;

  const direct = dailyNotesCalendar[key];
  if (direct) return direct;

  // Leap-day safety net: if 02-29 isn't in the map, reuse 02-28.
  if (key === '02-29') return dailyNotesCalendar['02-28'] ?? null;

  return null;
}
