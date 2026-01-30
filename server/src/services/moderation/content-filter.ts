/**
 * Content Filter Service
 *
 * Automated moderation for feed content.
 * Features:
 * - Location safety (block exact coords)
 * - Protected species flagging
 * - Keyword filtering (no marketplace)
 * - Defamation control
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentFilterResult {
    allowed: boolean;
    action: 'allow' | 'block' | 'flag' | 'require_tag';
    reason?: string;
    flaggedPatterns?: string[];
}

export interface ContentRule {
    id: string;
    ruleType: 'location_safety' | 'blocked_species' | 'keyword' | 'pattern';
    ruleValue: string;
    action: 'block' | 'flag' | 'require_tag' | 'delay';
    reason: string;
    isActive: boolean;
}

// ---------------------------------------------------------------------------
// Default Rules
// ---------------------------------------------------------------------------

const DEFAULT_RULES: ContentRule[] = [
    // Location safety
    {
        id: 'loc-1',
        ruleType: 'location_safety',
        ruleValue: 'exact_coordinates',
        action: 'block',
        reason: 'Exakte Koordinaten sind in öffentlichen Beiträgen nicht erlaubt',
        isActive: true,
    },
    {
        id: 'loc-2',
        ruleType: 'location_safety',
        ruleValue: 'stand_location',
        action: 'block',
        reason: 'Ansitzstandorte dürfen nicht öffentlich geteilt werden',
        isActive: true,
    },

    // Protected species
    {
        id: 'species-1',
        ruleType: 'blocked_species',
        ruleValue: 'wolf|luchs|wildkatze|seeadler|uhu',
        action: 'flag',
        reason: 'Geschützte Art erfordert Verifizierung',
        isActive: true,
    },

    // Marketplace prevention
    {
        id: 'market-1',
        ruleType: 'keyword',
        ruleValue: 'verkauf|kaufen|biete|suche waffe|munition zu verkaufen',
        action: 'block',
        reason: 'Keine Waffen- oder Munitionshandelsaktivitäten erlaubt',
        isActive: true,
    },
    {
        id: 'market-2',
        ruleType: 'keyword',
        ruleValue: 'tausche gegen|vb|festpreis|€|euro',
        action: 'flag',
        reason: 'Mögliche Handelsaktivität erkannt',
        isActive: true,
    },

    // Defamation control
    {
        id: 'defame-1',
        ruleType: 'pattern',
        ruleValue: 'wilderer|illegale jagd|poacher',
        action: 'require_tag',
        reason: 'Behauptungen erfordern Quellenangabe',
        isActive: true,
    },
];

// ---------------------------------------------------------------------------
// Content Filtering
// ---------------------------------------------------------------------------

/**
 * Check if content contains exact coordinates
 */
function containsExactCoordinates(text: string): boolean {
    // Match patterns like "52.1234, 13.5678" or "N52°30'12" E13°15'45""
    const decimalPattern = /\b\d{1,2}\.\d{4,}\s*,\s*\d{1,2}\.\d{4,}\b/;
    const dmsPattern = /[NS]\d{1,2}°\d{1,2}'\d{1,2}"\s+[EW]\d{1,2}°\d{1,2}'\d{1,2}"/i;
    const plusCode = /[A-Z0-9]{4}\+[A-Z0-9]{2,}/; // Google Plus Codes

    return decimalPattern.test(text) || dmsPattern.test(text) || plusCode.test(text);
}

/**
 * Check if content mentions protected species
 */
function mentionsProtectedSpecies(text: string): string[] {
    const protectedSpecies = ['wolf', 'luchs', 'wildkatze', 'seeadler', 'uhu', 'biber', 'fischotter'];
    const lowerText = text.toLowerCase();

    return protectedSpecies.filter(species => lowerText.includes(species));
}

/**
 * Check for marketplace language
 */
function containsMarketplaceLanguage(text: string): string[] {
    const marketplacePatterns = [
        'verkauf',
        'zu verkaufen',
        'kaufe',
        'suche',
        'biete',
        'tausche',
        'vb',
        'festpreis',
        ' €',
        ' euro',
        'preis',
    ];

    const lowerText = text.toLowerCase();
    return marketplacePatterns.filter(pattern => lowerText.includes(pattern));
}

/**
 * Main content filter function
 */
export function filterContent(
    content: string,
    rules: ContentRule[] = DEFAULT_RULES
): ContentFilterResult {
    const flaggedPatterns: string[] = [];
    let action: ContentFilterResult['action'] = 'allow';
    let reason: string | undefined;

    // Check each active rule
    for (const rule of rules.filter(r => r.isActive)) {
        let matched = false;

        switch (rule.ruleType) {
            case 'location_safety':
                if (rule.ruleValue === 'exact_coordinates' && containsExactCoordinates(content)) {
                    matched = true;
                }
                break;

            case 'blocked_species':
                const species = mentionsProtectedSpecies(content);
                if (species.length > 0) {
                    matched = true;
                    flaggedPatterns.push(...species);
                }
                break;

            case 'keyword':
                const keywords = rule.ruleValue.split('|');
                const lowerContent = content.toLowerCase();
                const matchedKeywords = keywords.filter(kw => lowerContent.includes(kw));
                if (matchedKeywords.length > 0) {
                    matched = true;
                    flaggedPatterns.push(...matchedKeywords);
                }
                break;

            case 'pattern':
                const patterns = rule.ruleValue.split('|');
                const matchedPatterns = patterns.filter(p =>
                    content.toLowerCase().includes(p.toLowerCase())
                );
                if (matchedPatterns.length > 0) {
                    matched = true;
                    flaggedPatterns.push(...matchedPatterns);
                }
                break;
        }

        if (matched) {
            // Block takes precedence over flag, flag over require_tag
            if (rule.action === 'block' && action !== 'block') {
                action = 'block';
                reason = rule.reason;
            } else if (rule.action === 'flag' && action === 'allow') {
                action = 'flag';
                reason = rule.reason;
            } else if (rule.action === 'require_tag' && action === 'allow') {
                action = 'require_tag';
                reason = rule.reason;
            }
        }
    }

    return {
        allowed: action !== 'block',
        action,
        reason,
        flaggedPatterns: flaggedPatterns.length > 0 ? flaggedPatterns : undefined,
    };
}

/**
 * Check if content is safe to publish immediately
 */
export function isSafeToPublish(content: string): boolean {
    const result = filterContent(content);
    return result.action === 'allow';
}

/**
 * Get sanitized content (strip potentially problematic elements)
 */
export function sanitizeContent(content: string): string {
    let sanitized = content;

    // Remove exact coordinates
    sanitized = sanitized.replace(/\b\d{1,2}\.\d{4,}\s*,\s*\d{1,2}\.\d{4,}\b/g, '[Koordinaten entfernt]');

    // Remove potential URLs to stand locations
    sanitized = sanitized.replace(
        /https?:\/\/[^\s]*(maps|goo\.gl|hochsitz|ansitz)[^\s]*/gi,
        '[Link entfernt]'
    );

    return sanitized;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
    filterContent,
    isSafeToPublish,
    sanitizeContent,
    containsExactCoordinates,
    mentionsProtectedSpecies,
    containsMarketplaceLanguage,
    DEFAULT_RULES,
};
