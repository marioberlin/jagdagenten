/**
 * Date conversion utilities for iCloud API
 *
 * iCloud uses a special date array format:
 * [dateNumber, year, month, day, hour, minute, offset]
 */

import type { ICloudDateArray } from '../types/calendar';

/**
 * Convert a JavaScript Date to iCloud date array format
 */
export function dateToArray(date: Date | null | undefined): ICloudDateArray | null {
  if (!date) return null;

  // If already an array, return as-is
  if (Array.isArray(date)) {
    return date as unknown as ICloudDateArray;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  // Calculate date number as YYYYMMDD integer
  const dateNumber = parseInt(
    date.toISOString().slice(0, 10).replace(/-/g, ''),
    10
  );

  // Get timezone offset in minutes (positive = west of UTC)
  // iCloud seems to use 720 as a default (UTC)
  const offset = -date.getTimezoneOffset(); // Invert because getTimezoneOffset returns opposite sign

  return [dateNumber, year, month, day, hour, minute, offset || 720];
}

/**
 * Convert an iCloud date array to JavaScript Date
 */
export function arrayToDate(array: ICloudDateArray | Date | null | undefined): Date | null {
  if (!array) return null;

  // If already a Date, return as-is
  if (array instanceof Date) {
    return array;
  }

  // Validate array format
  if (!Array.isArray(array) || array.length < 6) {
    return null;
  }

  const [, year, month, day, hour, minute] = array;

  // Create date in local timezone
  // Note: month is 1-indexed in iCloud format, but 0-indexed in JavaScript
  return new Date(year, month - 1, day, hour, minute);
}

/**
 * Convert an iCloud date array to ISO string
 */
export function arrayToISOString(array: ICloudDateArray | null | undefined): string | null {
  const date = arrayToDate(array);
  return date ? date.toISOString() : null;
}

/**
 * Convert an ISO string to iCloud date array
 */
export function isoStringToArray(isoString: string | null | undefined): ICloudDateArray | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : dateToArray(date);
}

/**
 * Get an all-day date array (time components are 0)
 */
export function dateToAllDayArray(date: Date): ICloudDateArray {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const dateNumber = parseInt(
    date.toISOString().slice(0, 10).replace(/-/g, ''),
    10
  );

  return [dateNumber, year, month, day, 0, 0, 720];
}

/**
 * Calculate duration in minutes between two iCloud date arrays
 */
export function calculateDuration(
  startDate: ICloudDateArray,
  endDate: ICloudDateArray
): number {
  const start = arrayToDate(startDate);
  const end = arrayToDate(endDate);

  if (!start || !end) return 0;

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Add minutes to an iCloud date array
 */
export function addMinutes(
  dateArray: ICloudDateArray,
  minutes: number
): ICloudDateArray {
  const date = arrayToDate(dateArray);
  if (!date) return dateArray;

  date.setMinutes(date.getMinutes() + minutes);
  return dateToArray(date)!;
}

/**
 * Check if a date array represents an all-day event
 */
export function isAllDayDate(dateArray: ICloudDateArray): boolean {
  // All-day events typically have 0 for hour and minute
  return dateArray[4] === 0 && dateArray[5] === 0;
}

/**
 * Format a date array for display
 */
export function formatDateArray(
  dateArray: ICloudDateArray,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = arrayToDate(dateArray);
  if (!date) return '';

  return date.toLocaleString(undefined, options);
}

/**
 * Get start and end of day as date arrays
 */
export function getDayBounds(date: Date): {
  start: ICloudDateArray;
  end: ICloudDateArray;
} {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: dateToArray(startOfDay)!,
    end: dateToArray(endOfDay)!,
  };
}

/**
 * Get start and end of week as date arrays
 */
export function getWeekBounds(
  date: Date,
  weekStartsOn: 0 | 1 = 0 // 0 = Sunday, 1 = Monday
): {
  start: ICloudDateArray;
  end: ICloudDateArray;
} {
  const day = date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    start: dateToArray(startOfWeek)!,
    end: dateToArray(endOfWeek)!,
  };
}

/**
 * Get start and end of month as date arrays
 */
export function getMonthBounds(date: Date): {
  start: ICloudDateArray;
  end: ICloudDateArray;
} {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    start: dateToArray(startOfMonth)!,
    end: dateToArray(endOfMonth)!,
  };
}

/**
 * Parse iCloud timestamp (milliseconds since epoch)
 */
export function parseTimestamp(timestamp: number | undefined): Date | null {
  if (timestamp === undefined || timestamp === null) return null;
  return new Date(timestamp);
}

/**
 * Get current date as iCloud date array
 */
export function now(): ICloudDateArray {
  return dateToArray(new Date())!;
}

/**
 * Compare two iCloud date arrays
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareDateArrays(
  a: ICloudDateArray,
  b: ICloudDateArray
): -1 | 0 | 1 {
  const dateA = arrayToDate(a);
  const dateB = arrayToDate(b);

  if (!dateA || !dateB) return 0;

  const timeA = dateA.getTime();
  const timeB = dateB.getTime();

  if (timeA < timeB) return -1;
  if (timeA > timeB) return 1;
  return 0;
}
