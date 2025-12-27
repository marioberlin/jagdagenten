import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn utility', () => {
    it('merges class names', () => {
        const result = cn('bg-red-500', 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('handles conditional classes', () => {
        const isActive = true;
        const result = cn('base', isActive && 'active');
        expect(result).toBe('base active');
    });

    it('removes false/undefined conditionals', () => {
        const isFalse = false;
        const result = cn('base', isFalse && 'hidden', undefined, null);
        expect(result).toBe('base');
    });

    it('merges conflicting Tailwind classes (tailwind-merge)', () => {
        // tailwind-merge should dedupe conflicting utilities
        const result = cn('p-4', 'p-2');
        expect(result).toBe('p-2');
    });

    it('merges conflicting responsive classes', () => {
        const result = cn('text-sm', 'text-lg');
        expect(result).toBe('text-lg');
    });
});
