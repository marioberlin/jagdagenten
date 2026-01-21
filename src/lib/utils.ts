/**
 * Utility functions for class name merging
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS class deduplication
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
