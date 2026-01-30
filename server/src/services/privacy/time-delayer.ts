/**
 * Time Delayer Service
 *
 * Implements privacy-protecting time delays for location-based content.
 * Delays publication by 24-72 hours to prevent real-time tracking.
 *
 * This prevents "follow the hunter" behavior where bad actors could
 * monitor the feed to track hunters in real-time.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default delay in hours */
export const DEFAULT_DELAY_HOURS = 48;

/** Minimum delay in hours (for user override) */
export const MIN_DELAY_HOURS = 24;

/** Maximum delay in hours */
export const MAX_DELAY_HOURS = 72;

/** Delay categories by content sensitivity */
export const DELAY_CATEGORIES = {
    /** Low sensitivity - general observations */
    low: 24,
    /** Medium sensitivity - species sightings */
    medium: 48,
    /** High sensitivity - rare/protected species */
    high: 72,
} as const;

/** Species requiring extended delay */
const HIGH_SENSITIVITY_SPECIES = [
    'wolf',
    'luchs',
    'wildkatze',
    'seeadler',
    'uhu',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DelayConfig {
    defaultHours: number;
    minHours: number;
    maxHours: number;
    species?: string;
}

export interface DelayResult {
    observedAt: Date;
    publishAt: Date;
    delayHours: number;
    reason: string;
}

// ---------------------------------------------------------------------------
// Delay Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the publication time for an observation
 *
 * @param observedAt - When the observation occurred
 * @param delayHours - Delay in hours (default: DEFAULT_DELAY_HOURS)
 * @returns Publication timestamp
 */
export function calculatePublishTime(
    observedAt: Date,
    delayHours: number = DEFAULT_DELAY_HOURS
): Date {
    const clampedDelay = clampDelay(delayHours);
    return new Date(observedAt.getTime() + clampedDelay * 60 * 60 * 1000);
}

/**
 * Clamp delay hours to valid range
 */
export function clampDelay(hours: number): number {
    return Math.max(MIN_DELAY_HOURS, Math.min(MAX_DELAY_HOURS, hours));
}

/**
 * Get appropriate delay based on species sensitivity
 *
 * @param species - Species identifier
 * @returns Delay in hours
 */
export function getDelayForSpecies(species: string): number {
    if (HIGH_SENSITIVITY_SPECIES.includes(species.toLowerCase())) {
        return DELAY_CATEGORIES.high;
    }
    return DELAY_CATEGORIES.medium;
}

/**
 * Calculate delay with full result details
 */
export function calculateDelayResult(
    observedAt: Date,
    species?: string,
    userPreferredDelay?: number
): DelayResult {
    let delayHours = DEFAULT_DELAY_HOURS;
    let reason = 'Standard-Verzögerung für Datenschutz';

    // Check species-based delay
    if (species) {
        const speciesDelay = getDelayForSpecies(species);
        if (speciesDelay > delayHours) {
            delayHours = speciesDelay;
            reason = `Erweiterte Verzögerung für geschützte Art (${species})`;
        }
    }

    // Apply user preference if higher
    if (userPreferredDelay && userPreferredDelay > delayHours) {
        delayHours = clampDelay(userPreferredDelay);
        reason = 'Benutzerdefinierte Verzögerung';
    }

    const publishAt = calculatePublishTime(observedAt, delayHours);

    return {
        observedAt,
        publishAt,
        delayHours,
        reason,
    };
}

// ---------------------------------------------------------------------------
// Publication Checks
// ---------------------------------------------------------------------------

/**
 * Check if content is ready to be published
 *
 * @param publishAt - Scheduled publish time
 * @param now - Current time (default: new Date())
 * @returns Whether content can be published
 */
export function isReadyToPublish(publishAt: Date, now: Date = new Date()): boolean {
    return now >= publishAt;
}

/**
 * Get time remaining until publication
 *
 * @param publishAt - Scheduled publish time
 * @param now - Current time
 * @returns Remaining time in various units
 */
export function getTimeUntilPublish(
    publishAt: Date,
    now: Date = new Date()
): {
    ready: boolean;
    remainingMs: number;
    remainingHours: number;
    remainingMinutes: number;
    displayString: string;
} {
    const remainingMs = Math.max(0, publishAt.getTime() - now.getTime());
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    let displayString: string;
    if (remainingMs === 0) {
        displayString = 'Bereit zur Veröffentlichung';
    } else if (remainingHours > 0) {
        displayString = `Wird in ${remainingHours}h ${remainingMinutes}min veröffentlicht`;
    } else {
        displayString = `Wird in ${remainingMinutes} Minuten veröffentlicht`;
    }

    return {
        ready: remainingMs === 0,
        remainingMs,
        remainingHours,
        remainingMinutes,
        displayString,
    };
}

// ---------------------------------------------------------------------------
// Randomization (Anti-Pattern Detection)
// ---------------------------------------------------------------------------

/**
 * Add random jitter to delay to prevent pattern detection
 * Varies delay by ±2 hours to obscure exact observation times
 *
 * @param baseDelayHours - Base delay in hours
 * @param jitterHours - Maximum jitter (default: 2)
 * @returns Jittered delay
 */
export function addDelayJitter(
    baseDelayHours: number,
    jitterHours: number = 2
): number {
    const jitter = (Math.random() - 0.5) * 2 * jitterHours;
    return clampDelay(baseDelayHours + jitter);
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

/**
 * Filter items to only those ready for publication
 */
export function filterReadyToPublish<T extends { publishAt: Date | string }>(
    items: T[],
    now: Date = new Date()
): T[] {
    return items.filter(item => {
        const publishAt = typeof item.publishAt === 'string'
            ? new Date(item.publishAt)
            : item.publishAt;
        return isReadyToPublish(publishAt, now);
    });
}

/**
 * Get items pending publication with their remaining time
 */
export function getPendingItems<T extends { publishAt: Date | string }>(
    items: T[],
    now: Date = new Date()
): Array<T & { remainingHours: number }> {
    return items
        .map(item => {
            const publishAt = typeof item.publishAt === 'string'
                ? new Date(item.publishAt)
                : item.publishAt;
            const remaining = getTimeUntilPublish(publishAt, now);
            return {
                ...item,
                remainingHours: remaining.remainingHours,
            };
        })
        .filter(item => item.remainingHours > 0)
        .sort((a, b) => a.remainingHours - b.remainingHours);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
    DEFAULT_DELAY_HOURS,
    MIN_DELAY_HOURS,
    MAX_DELAY_HOURS,
    DELAY_CATEGORIES,
    calculatePublishTime,
    clampDelay,
    getDelayForSpecies,
    calculateDelayResult,
    isReadyToPublish,
    getTimeUntilPublish,
    addDelayJitter,
    filterReadyToPublish,
    getPendingItems,
};
