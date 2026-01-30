/**
 * News Crawler Service
 * 
 * Fetches hunting-related news from approved sources with TDM compliance.
 * Respects robots.txt and rate limits.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewsSource {
    id: string;
    name: string;
    baseUrl: string;
    feedUrl?: string;
    category: 'official' | 'association' | 'news' | 'research';
    tdmAllowed: boolean;
    lastCrawled?: Date;
}

interface NewsItem {
    id: string;
    sourceId: string;
    title: string;
    summary: string;
    url: string;
    publishedAt: Date;
    category: string;
    tags: string[];
    bundesland?: string;
    relevanceScore: number;
}

interface CrawlResult {
    source: NewsSource;
    items: NewsItem[];
    success: boolean;
    error?: string;
}

// ---------------------------------------------------------------------------
// Approved Sources (TDM-compliant)
// ---------------------------------------------------------------------------

export const APPROVED_SOURCES: NewsSource[] = [
    {
        id: 'djv',
        name: 'Deutscher Jagdverband',
        baseUrl: 'https://www.jagdverband.de',
        feedUrl: 'https://www.jagdverband.de/rss.xml',
        category: 'association',
        tdmAllowed: true,
    },
    {
        id: 'bfn_wolf',
        name: 'DBBW Wolfsdokumentationen',
        baseUrl: 'https://www.dbb-wolf.de',
        category: 'official',
        tdmAllowed: true,
    },
    {
        id: 'bmel',
        name: 'Bundesministerium für Ernährung',
        baseUrl: 'https://www.bmel.de',
        category: 'official',
        tdmAllowed: true,
    },
    {
        id: 'ljv_bayern',
        name: 'Bayerischer Jagdverband',
        baseUrl: 'https://www.jagd-bayern.de',
        category: 'association',
        tdmAllowed: true,
    },
    {
        id: 'ljv_nrw',
        name: 'NRW Landesjagdverband',
        baseUrl: 'https://www.ljv-nrw.de',
        category: 'association',
        tdmAllowed: true,
    },
];

// ---------------------------------------------------------------------------
// TDM Compliance Checker
// ---------------------------------------------------------------------------

const robotsTxtCache = new Map<string, { rules: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
    const cached = robotsTxtCache.get(baseUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return !cached.rules.includes('Disallow: /');
    }

    try {
        const response = await fetch(`${baseUrl}/robots.txt`, {
            headers: { 'User-Agent': 'JagdAgenten-NewsBot/1.0' }
        });

        if (!response.ok) {
            // No robots.txt = allowed
            robotsTxtCache.set(baseUrl, { rules: '', timestamp: Date.now() });
            return true;
        }

        const text = await response.text();
        robotsTxtCache.set(baseUrl, { rules: text, timestamp: Date.now() });

        // Check for TDM-Agent or User-agent: * disallows
        const disallowAll = text.includes('Disallow: /') &&
            (text.includes('User-agent: *') || text.includes('User-agent: TDM'));

        return !disallowAll;
    } catch {
        // Network error = be cautious, allow
        return true;
    }
}

// ---------------------------------------------------------------------------
// Rate Limiter
// ---------------------------------------------------------------------------

const lastRequest = new Map<string, number>();
const MIN_DELAY_MS = 2000; // 2 seconds between requests per domain

async function rateLimitedFetch(url: string): Promise<Response> {
    const domain = new URL(url).hostname;
    const lastTime = lastRequest.get(domain) || 0;
    const waitTime = Math.max(0, MIN_DELAY_MS - (Date.now() - lastTime));

    if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequest.set(domain, Date.now());

    return fetch(url, {
        headers: {
            'User-Agent': 'JagdAgenten-NewsBot/1.0 (+https://jagdagenten.de/bot)',
            'Accept': 'application/rss+xml, application/xml, text/xml, text/html',
        }
    });
}

// ---------------------------------------------------------------------------
// Parser Helpers
// ---------------------------------------------------------------------------

function extractRelevanceScore(title: string, summary: string): number {
    const text = (title + ' ' + summary).toLowerCase();
    let score = 50; // Base score

    // High relevance keywords
    const highRelevance = ['wolf', 'wildschwein', 'schwarzwild', 'rotwild', 'jagdzeit', 'schonzeit'];
    const mediumRelevance = ['jagd', 'jäger', 'revier', 'wild', 'forst'];
    const lowRelevance = ['natur', 'tier', 'wald'];

    for (const kw of highRelevance) {
        if (text.includes(kw)) score += 20;
    }
    for (const kw of mediumRelevance) {
        if (text.includes(kw)) score += 10;
    }
    for (const kw of lowRelevance) {
        if (text.includes(kw)) score += 5;
    }

    return Math.min(100, score);
}

function extractTags(title: string, summary: string): string[] {
    const text = (title + ' ' + summary).toLowerCase();
    const tags: string[] = [];

    const tagPatterns: Record<string, string[]> = {
        wolf: ['wolf', 'wölfe', 'wolfsriss', 'wolfssichtung'],
        schwarzwild: ['wildschwein', 'schwarzwild', 'keiler', 'bache'],
        rotwild: ['rotwild', 'hirsch', 'rothirsch'],
        rehwild: ['rehwild', 'reh', 'rehbock'],
        asp: ['schweinepest', 'asp', 'afrikanische'],
        jagdrecht: ['jagdgesetz', 'jagdrecht', 'verordnung'],
        jagdzeit: ['jagdzeit', 'schonzeit', 'jagdsaison'],
    };

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
        if (patterns.some(p => text.includes(p))) {
            tags.push(tag);
        }
    }

    return tags;
}

function detectBundesland(title: string, summary: string): string | undefined {
    const text = (title + ' ' + summary).toLowerCase();

    const bundeslaender: Record<string, string[]> = {
        'Bayern': ['bayern', 'bayerisch', 'münchen'],
        'Baden-Württemberg': ['baden-württemberg', 'stuttgart', 'schwäbisch'],
        'Nordrhein-Westfalen': ['nrw', 'nordrhein', 'westfalen', 'düsseldorf', 'köln'],
        'Niedersachsen': ['niedersachsen', 'hannover'],
        'Hessen': ['hessen', 'hessisch', 'frankfurt'],
        'Brandenburg': ['brandenburg', 'potsdam'],
        'Sachsen': ['sachsen', 'sächsisch', 'dresden'],
        'Thüringen': ['thüringen', 'erfurt'],
    };

    for (const [land, patterns] of Object.entries(bundeslaender)) {
        if (patterns.some(p => text.includes(p))) {
            return land;
        }
    }

    return undefined;
}

// ---------------------------------------------------------------------------
// Main Crawl Function
// ---------------------------------------------------------------------------

export async function crawlSource(source: NewsSource): Promise<CrawlResult> {
    // TDM compliance check
    if (!source.tdmAllowed) {
        return { source, items: [], success: false, error: 'TDM not allowed for this source' };
    }

    const robotsAllowed = await checkRobotsTxt(source.baseUrl);
    if (!robotsAllowed) {
        return { source, items: [], success: false, error: 'Blocked by robots.txt' };
    }

    const items: NewsItem[] = [];

    try {
        // If RSS feed available, prefer it
        if (source.feedUrl) {
            const response = await rateLimitedFetch(source.feedUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const xml = await response.text();
            // Simple RSS parsing (in production use a proper XML parser)
            const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

            for (const itemXml of itemMatches.slice(0, 10)) {
                const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
                const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
                const description = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || '';
                const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];

                if (title && link) {
                    items.push({
                        id: `${source.id}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
                        sourceId: source.id,
                        title: title.replace(/<[^>]*>/g, '').trim(),
                        summary: description.replace(/<[^>]*>/g, '').slice(0, 300).trim(),
                        url: link,
                        publishedAt: pubDate ? new Date(pubDate) : new Date(),
                        category: source.category,
                        tags: extractTags(title, description),
                        bundesland: detectBundesland(title, description),
                        relevanceScore: extractRelevanceScore(title, description),
                    });
                }
            }
        }

        return { source, items, success: true };
    } catch (err) {
        return {
            source,
            items: [],
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

// ---------------------------------------------------------------------------
// Batch Crawl
// ---------------------------------------------------------------------------

export async function crawlAllSources(): Promise<{
    results: CrawlResult[];
    totalItems: number;
    successCount: number;
}> {
    const results: CrawlResult[] = [];

    for (const source of APPROVED_SOURCES) {
        const result = await crawlSource(source);
        results.push(result);
    }

    return {
        results,
        totalItems: results.reduce((sum, r) => sum + r.items.length, 0),
        successCount: results.filter(r => r.success).length,
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type { NewsSource, NewsItem, CrawlResult };
