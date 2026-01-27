/**
 * Seed Providers for UCP Merchant Discovery
 *
 * Multiple seed providers that discover merchant domains from:
 * - AwesomeUCP Merchants directory (GitHub)
 * - UCP Tools directory
 * - UCPChecker directory
 * - Search engine results (optional)
 */

import type { SourceType, Region } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface DiscoveredDomain {
  domain: string;
  sourceType: SourceType;
  sourceUrl: string;
  discoveredAt: string;
  metadata?: Record<string, unknown>;
}

export interface SeedProvider {
  name: string;
  sourceType: SourceType;
  fetch(): Promise<DiscoveredDomain[]>;
}

// ============================================================================
// Domain Normalization
// ============================================================================

/**
 * Normalizes a domain to canonical form:
 * - Lowercase
 * - Strip scheme/path/query
 * - Convert Unicode to punycode
 * - Remove leading www.
 */
export function normalizeDomain(input: string): string {
  try {
    // Handle URLs
    let domain = input.trim().toLowerCase();

    // Extract hostname from URL if needed
    if (domain.includes('://')) {
      const url = new URL(domain);
      domain = url.hostname;
    }

    // Remove www. prefix
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    // Remove trailing dots
    domain = domain.replace(/\.+$/, '');

    // Convert to ASCII (punycode) for international domains
    // Note: In Bun/Node, URL automatically handles punycode
    const url = new URL(`https://${domain}`);
    return url.hostname;
  } catch {
    // If parsing fails, return cleaned input
    return input.trim().toLowerCase().replace(/^www\./, '');
  }
}

/**
 * Extracts domain from a URL string
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return normalizeDomain(parsed.hostname);
  } catch {
    return null;
  }
}

/**
 * Infers region from domain ccTLD
 */
export function inferRegionFromDomain(domain: string): Region {
  const tld = domain.split('.').pop()?.toLowerCase();

  // EU country codes
  const euTLDs = [
    'de', 'fr', 'it', 'es', 'nl', 'be', 'at', 'pt', 'gr', 'pl',
    'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'si', 'lt', 'lv', 'ee',
    'fi', 'se', 'dk', 'ie', 'lu', 'mt', 'cy', 'eu'
  ];

  if (euTLDs.includes(tld || '')) return 'EU';
  if (tld === 'us' || tld === 'gov') return 'US';
  if (tld === 'ca') return 'CA';

  // Generic TLDs - can't determine region
  return 'OTHER';
}

// ============================================================================
// AwesomeUCP Provider
// ============================================================================

const AWESOME_UCP_README = 'https://raw.githubusercontent.com/awesomeucp/merchants/main/README.md';
const AWESOME_UCP_MERCHANTS_JSON = 'https://raw.githubusercontent.com/awesomeucp/merchants/main/merchants.json';

export class AwesomeUCPProvider implements SeedProvider {
  name = 'AwesomeUCP Merchants';
  sourceType: SourceType = 'github_dir';

  async fetch(): Promise<DiscoveredDomain[]> {
    const domains: DiscoveredDomain[] = [];
    const now = new Date().toISOString();

    try {
      // Try JSON endpoint first
      const jsonResponse = await fetch(AWESOME_UCP_MERCHANTS_JSON, {
        headers: { 'User-Agent': 'UCPDiscovery/1.0' },
      });

      if (jsonResponse.ok) {
        const data = await jsonResponse.json() as { merchants?: { domain: string; region?: string }[] };
        if (data.merchants && Array.isArray(data.merchants)) {
          for (const merchant of data.merchants) {
            if (merchant.domain) {
              domains.push({
                domain: normalizeDomain(merchant.domain),
                sourceType: this.sourceType,
                sourceUrl: AWESOME_UCP_MERCHANTS_JSON,
                discoveredAt: now,
                metadata: { region: merchant.region },
              });
            }
          }
          return domains;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch AwesomeUCP JSON, trying README:', e);
    }

    // Fallback: parse README for URLs
    try {
      const readmeResponse = await fetch(AWESOME_UCP_README, {
        headers: { 'User-Agent': 'UCPDiscovery/1.0' },
      });

      if (readmeResponse.ok) {
        const readme = await readmeResponse.text();

        // Extract URLs from markdown links: [text](url)
        const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let match;

        while ((match = urlRegex.exec(readme)) !== null) {
          const url = match[2];
          const domain = extractDomain(url);

          if (domain && !domain.includes('github.com')) {
            domains.push({
              domain,
              sourceType: this.sourceType,
              sourceUrl: AWESOME_UCP_README,
              discoveredAt: now,
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch AwesomeUCP README:', e);
    }

    return domains;
  }
}

// ============================================================================
// UCPTools Provider
// ============================================================================

const UCP_TOOLS_DIRECTORY = 'https://ucptools.dev/directory';

export class UCPToolsProvider implements SeedProvider {
  name = 'UCP Tools Directory';
  sourceType: SourceType = 'ucptools';

  async fetch(): Promise<DiscoveredDomain[]> {
    const domains: DiscoveredDomain[] = [];
    const now = new Date().toISOString();

    try {
      const response = await fetch(UCP_TOOLS_DIRECTORY, {
        headers: {
          'User-Agent': 'UCPDiscovery/1.0',
          'Accept': 'text/html,application/json',
        },
      });

      if (!response.ok) {
        console.warn(`UCPTools returned ${response.status}`);
        return domains;
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // JSON response
        const data = await response.json() as { merchants?: { url: string }[] };
        if (data.merchants) {
          for (const merchant of data.merchants) {
            const domain = extractDomain(merchant.url);
            if (domain) {
              domains.push({
                domain,
                sourceType: this.sourceType,
                sourceUrl: UCP_TOOLS_DIRECTORY,
                discoveredAt: now,
              });
            }
          }
        }
      } else {
        // HTML response - extract URLs
        const html = await response.text();

        // Look for merchant links in the HTML
        // Pattern: href="https://example.com" or data-domain="example.com"
        const hrefRegex = /href=["'](https?:\/\/[^"'\s]+)["']/g;
        const domainRegex = /data-domain=["']([^"']+)["']/g;

        let match;
        const seen = new Set<string>();

        while ((match = hrefRegex.exec(html)) !== null) {
          const domain = extractDomain(match[1]);
          if (domain && !seen.has(domain) && !domain.includes('ucptools.dev')) {
            seen.add(domain);
            domains.push({
              domain,
              sourceType: this.sourceType,
              sourceUrl: UCP_TOOLS_DIRECTORY,
              discoveredAt: now,
            });
          }
        }

        while ((match = domainRegex.exec(html)) !== null) {
          const domain = normalizeDomain(match[1]);
          if (!seen.has(domain)) {
            seen.add(domain);
            domains.push({
              domain,
              sourceType: this.sourceType,
              sourceUrl: UCP_TOOLS_DIRECTORY,
              discoveredAt: now,
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch UCPTools directory:', e);
    }

    return domains;
  }
}

// ============================================================================
// UCPChecker Provider
// ============================================================================

const UCP_CHECKER_URL = 'https://ucpchecker.com/';

export class UCPCheckerProvider implements SeedProvider {
  name = 'UCP Checker Directory';
  sourceType: SourceType = 'ucpchecker';

  async fetch(): Promise<DiscoveredDomain[]> {
    const domains: DiscoveredDomain[] = [];
    const now = new Date().toISOString();

    try {
      const response = await fetch(UCP_CHECKER_URL, {
        headers: {
          'User-Agent': 'UCPDiscovery/1.0',
          'Accept': 'text/html,application/json',
        },
      });

      if (!response.ok) {
        console.warn(`UCPChecker returned ${response.status}`);
        return domains;
      }

      const html = await response.text();

      // Look for validated merchant domains
      // Pattern varies by site, adjust as needed
      const domainPatterns = [
        /data-domain=["']([^"']+)["']/g,
        /class=["']merchant[^"']*["'][^>]*>([^<]+)</g,
        /validated[^>]*>([a-z0-9.-]+\.[a-z]{2,})</gi,
      ];

      const seen = new Set<string>();

      for (const pattern of domainPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const potentialDomain = match[1];
          // Basic domain validation
          if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(potentialDomain)) {
            const domain = normalizeDomain(potentialDomain);
            if (!seen.has(domain) && !domain.includes('ucpchecker.com')) {
              seen.add(domain);
              domains.push({
                domain,
                sourceType: this.sourceType,
                sourceUrl: UCP_CHECKER_URL,
                discoveredAt: now,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch UCPChecker:', e);
    }

    return domains;
  }
}

// ============================================================================
// Search Engine Provider (Optional)
// ============================================================================

export class SearchProvider implements SeedProvider {
  name = 'Search Engine';
  sourceType: SourceType = 'search';

  // Search queries for discovering UCP merchants
  // Unused until search API is configured
  static readonly SEARCH_QUERIES = [
    'inurl:/.well-known/ucp',
    '"dev.ucp.shopping" inurl:/.well-known/ucp',
    'site:.well-known/ucp filetype:json',
  ];

  async fetch(): Promise<DiscoveredDomain[]> {
    // Note: This is a placeholder. In production, you'd use a search API
    // like Google Custom Search, Bing API, or SerpAPI
    console.log('Search provider not implemented - requires API key');
    return [];
  }
}

// ============================================================================
// Manual Provider (for testing/adding known merchants)
// ============================================================================

export class ManualProvider implements SeedProvider {
  name = 'Manual Entry';
  sourceType: SourceType = 'manual';

  private domains: string[];

  constructor(domains: string[] = []) {
    this.domains = domains;
  }

  async fetch(): Promise<DiscoveredDomain[]> {
    const now = new Date().toISOString();
    return this.domains.map(domain => ({
      domain: normalizeDomain(domain),
      sourceType: this.sourceType,
      sourceUrl: 'manual',
      discoveredAt: now,
    }));
  }
}

// ============================================================================
// Aggregate Provider
// ============================================================================

export async function fetchAllSeeds(): Promise<DiscoveredDomain[]> {
  const providers: SeedProvider[] = [
    new AwesomeUCPProvider(),
    new UCPToolsProvider(),
    new UCPCheckerProvider(),
  ];

  const results = await Promise.allSettled(
    providers.map(p => p.fetch())
  );

  const domains: DiscoveredDomain[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const domain of result.value) {
        if (!seen.has(domain.domain)) {
          seen.add(domain.domain);
          domains.push(domain);
        }
      }
    }
  }

  return domains;
}
