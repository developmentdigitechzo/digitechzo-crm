import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_MAP: Record<string, { iso: string; locale: string; symbol: string }> = {
  '₹': { iso: 'INR', locale: 'en-IN', symbol: '₹' },
  'INR': { iso: 'INR', locale: 'en-IN', symbol: '₹' },
  '$': { iso: 'USD', locale: 'en-US', symbol: '$' },
  'USD': { iso: 'USD', locale: 'en-US', symbol: '$' },
  '€': { iso: 'EUR', locale: 'de-DE', symbol: '€' },
  'EUR': { iso: 'EUR', locale: 'de-DE', symbol: '€' },
  '£': { iso: 'GBP', locale: 'en-GB', symbol: '£' },
  'GBP': { iso: 'GBP', locale: 'en-GB', symbol: '£' },
  '¥': { iso: 'JPY', locale: 'ja-JP', symbol: '¥' },
  'JPY': { iso: 'JPY', locale: 'ja-JP', symbol: '¥' },
  'AED': { iso: 'AED', locale: 'en-AE', symbol: 'AED' },
  'CAD': { iso: 'CAD', locale: 'en-CA', symbol: 'CA$' },
  'AUD': { iso: 'AUD', locale: 'en-AU', symbol: 'A$' },
  'SGD': { iso: 'SGD', locale: 'en-SG', symbol: 'S$' },
};

/**
 * Format currency amount with symbol safely without throwing RangeError
 */
export function formatCurrency(amount?: number | null, currency: string = 'INR'): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const rawCurr = (currency || 'INR').trim();
  const upperCurr = rawCurr.toUpperCase();

  const config = CURRENCY_MAP[rawCurr] || CURRENCY_MAP[upperCurr];

  if (config) {
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.iso,
        maximumFractionDigits: 0,
      }).format(safeAmount);
    } catch {
      return `${config.symbol} ${safeAmount.toLocaleString('en-IN')}`;
    }
  }

  // If it's a 3-letter ISO code, try formatting directly
  if (upperCurr.length === 3) {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: upperCurr,
        maximumFractionDigits: 0,
      }).format(safeAmount);
    } catch {
      // Fall through to fallback
    }
  }

  // Fail-safe graceful fallback: never throw RangeError
  return `${rawCurr || '₹'} ${safeAmount.toLocaleString('en-IN')}`;
}

/**
 * Format date string into readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time string into readable format
 */
export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  return timeString;
}

/**
 * Standard 30-minute business time slots from 08:00 AM to 09:00 PM
 */
export const STANDARD_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM'
];

/**
 * Get YYYY-MM-DD string in local timezone (safe from UTC day offset shifts)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse date string ('YYYY-MM-DD') and time string ('11:00 AM' or '14:30') into local Date
 */
export function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = (dateStr || getLocalDateString()).split('-').map(Number);
  const result = new Date(year, (month || 1) - 1, day || 1);

  if (!timeStr) {
    result.setHours(10, 0, 0, 0);
    return result;
  }

  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  result.setHours(10, 0, 0, 0);
  return result;
}

/**
 * Check if the specified date + time has already passed / is over
 */
export function isTimeOver(dateStr: string, timeStr: string, bufferMinutes = 0): boolean {
  if (!dateStr || !timeStr) return false;
  const todayStr = getLocalDateString();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const slotDate = parseTimeToDate(dateStr, timeStr);
  return slotDate.getTime() <= Date.now() + bufferMinutes * 60 * 1000;
}

/**
 * Format a time string ('16:30' or '4:30 PM') into a clean 12-hour string like '04:30 PM'
 */
export function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match12) return timeStr;

  let hours = parseInt(match12[1], 10);
  const minutes = match12[2];
  const ampm = match12[3]?.toUpperCase();

  if (ampm) {
    const h = hours % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // 24-hour time without AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${minutes} ${period}`;
}

/**
 * Get current local time formatted in 12-hour format e.g. '04:35 PM'
 */
export function getCurrentFormattedTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Get small red error message when time is overtime/declined, providing the correct time to select after
 */
export function getTimeOverMessage(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  if (!isTimeOver(dateStr, timeStr)) return null;

  const displayTime = formatDisplayTime(timeStr);
  const currentTime = getCurrentFormattedTime();
  return `Time Over: ${displayTime || 'Selected time'} has already passed today. Please select a time after ${currentTime}.`;
}

/**
 * Find the next available non-passed time slot for a date
 */
export function getNextAvailableTimeSlot(dateStr: string): string {
  const todayStr = getLocalDateString();
  if (dateStr > todayStr) {
    return '10:00 AM';
  }

  const futureSlot = STANDARD_TIME_SLOTS.find((slot) => !isTimeOver(dateStr, slot));
  return futureSlot || '09:00 AM';
}

/**
 * Get initial scheduling date (defaults to today, without forced time)
 */
export function getInitialScheduleDateTime(): { dueDate: string; dueTime: string } {
  return {
    dueDate: getLocalDateString(),
    dueTime: '',
  };
}


