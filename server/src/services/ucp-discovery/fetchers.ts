/**
 * UCP Profile & Agent Card Fetchers
 *
 * Handles HTTP fetching with:
 * - TLS verification
 * - Redirect following
 * - ETag/Last-Modified support for conditional requests
 * - Rate limiting awareness
 */

import { createHash } from 'crypto';
import type { DEFAULT_CRAWLER_CONFIG, UCPFetchResult, AgentCardFetch } from './types.js';

// ============================================================================
// Fetch Options
// ============================================================================

export interface FetchOptions {
  etag?: string;
  lastModified?: string;
  timeout?: number;
}

export interface FetchResult {
  success: boolean;
  statusCode: number;
  url: string;
  finalUrl: string;
  latencyMs: number;
  headers: Record<string, string>;
  body?: string;
  bodySha256?: string;
  error?: string;
}

// ============================================================================
// Core Fetcher
// ============================================================================

export async function fetchWithOptions(
  url: string,
  options: FetchOptions = {},
  config: Partial<typeof DEFAULT_CRAWLER_CONFIG> = {}
): Promise<FetchResult> {
  const timeout = options.timeout || config.requestTimeout || 15000;
  const userAgent = config.userAgent || 'UCPDiscovery/1.0 (+https://ucp.dev/crawler)';

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': 'application/json',
  };

  // Conditional request headers
  if (options.etag) {
    headers['If-None-Match'] = options.etag;
  }
  if (options.lastModified) {
    headers['If-Modified-Since'] = options.lastModified;
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      return {
        success: true,
        statusCode: 304,
        url,
        finalUrl: response.url,
        latencyMs,
        headers: responseHeaders,
      };
    }

    // Read body
    const body = await response.text();
    const bodySha256 = createHash('sha256').update(body).digest('hex');

    return {
      success: response.ok,
      statusCode: response.status,
      url,
      finalUrl: response.url,
      latencyMs,
      headers: responseHeaders,
      body,
      bodySha256,
      error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Categorize error
    let errorType = 'FETCH_ERROR';
    if (errorMessage.includes('abort')) {
      errorType = 'TIMEOUT';
    } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
      errorType = 'TLS_ERROR';
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      errorType = 'DNS_ERROR';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      errorType = 'CONNECTION_REFUSED';
    }

    return {
      success: false,
      statusCode: 0,
      url,
      finalUrl: url,
      latencyMs,
      headers: {},
      error: `${errorType}: ${errorMessage}`,
    };
  }
}

// ============================================================================
// UCP Profile Fetcher
// ============================================================================

/**
 * Fetches /.well-known/ucp profile from a domain
 */
export async function fetchUCPProfile(
  merchantId: string,
  domain: string,
  options: FetchOptions = {},
  config: Partial<typeof DEFAULT_CRAWLER_CONFIG> = {}
): Promise<UCPFetchResult> {
  const url = `https://${domain}/.well-known/ucp`;

  const result = await fetchWithOptions(url, options, config);

  // Parse JSON if successful
  let bodyJson: unknown = undefined;
  if (result.success && result.body) {
    try {
      bodyJson = JSON.parse(result.body);
    } catch {
      // Invalid JSON will be caught by validator
    }
  }

  return {
    id: `fetch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    merchantId,
    fetchedAt: new Date().toISOString(),
    url,
    finalUrl: result.finalUrl,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    etag: result.headers['etag'],
    lastModified: result.headers['last-modified'],
    cacheControl: result.headers['cache-control'],
    bodySha256: result.bodySha256,
    bodyJson,
    error: result.error,
  };
}

// ============================================================================
// Agent Card Fetcher
// ============================================================================

/**
 * Fetches A2A Agent Card from a URL
 */
export async function fetchAgentCard(
  merchantId: string,
  agentCardUrl: string,
  options: FetchOptions = {},
  config: Partial<typeof DEFAULT_CRAWLER_CONFIG> = {}
): Promise<AgentCardFetch> {
  const result = await fetchWithOptions(agentCardUrl, options, config);

  // Parse JSON if successful
  let bodyJson: unknown = undefined;
  if (result.success && result.body) {
    try {
      bodyJson = JSON.parse(result.body);
    } catch {
      // Invalid JSON will be caught by validator
    }
  }

  return {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    merchantId,
    fetchedAt: new Date().toISOString(),
    url: agentCardUrl,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    bodySha256: result.bodySha256,
    bodyJson,
    error: result.error,
  };
}

// ============================================================================
// Batch Fetcher with Concurrency Control
// ============================================================================

interface BatchFetchOptions {
  concurrency?: number;
  perDomainConcurrency?: number;
  delayMs?: number;
}

/**
 * Fetches multiple UCP profiles with concurrency control
 */
export async function fetchUCPProfilesBatch(
  domains: Array<{ merchantId: string; domain: string }>,
  options: BatchFetchOptions = {}
): Promise<UCPFetchResult[]> {
  const {
    concurrency = 50,
    perDomainConcurrency = 2,
    delayMs = 100,
  } = options;

  const results: UCPFetchResult[] = [];
  const domainCounts = new Map<string, number>();

  // Simple queue-based concurrency control
  let active = 0;
  let index = 0;

  const processNext = async (): Promise<void> => {
    if (index >= domains.length) return;

    const current = domains[index++];
    const tld = getETLDPlus1(current.domain);

    // Check per-domain limit
    const domainCount = domainCounts.get(tld) || 0;
    if (domainCount >= perDomainConcurrency) {
      // Defer this domain
      domains.push(current);
      await processNext();
      return;
    }

    domainCounts.set(tld, domainCount + 1);
    active++;

    try {
      const result = await fetchUCPProfile(current.merchantId, current.domain);
      results.push(result);

      // Small delay to be polite
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } finally {
      active--;
      domainCounts.set(tld, (domainCounts.get(tld) || 1) - 1);
    }
  };

  // Start initial batch
  const workers = Array(Math.min(concurrency, domains.length))
    .fill(null)
    .map(() => {
      const work = async () => {
        while (index < domains.length || active > 0) {
          if (active < concurrency && index < domains.length) {
            await processNext();
          } else {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      };
      return work();
    });

  await Promise.all(workers);

  return results;
}

/**
 * Extracts eTLD+1 from a domain (simplified)
 */
function getETLDPlus1(domain: string): string {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;

  // Handle common multi-part TLDs
  const multiPartTLDs = ['co.uk', 'com.au', 'co.jp', 'co.nz', 'org.uk'];
  const lastTwo = parts.slice(-2).join('.');

  if (multiPartTLDs.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}
