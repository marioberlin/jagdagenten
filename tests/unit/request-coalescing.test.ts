import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Request Coalescing / Stampede Protection
 * @see docs/IMPLEMENTATION_PLAN.md - Item 2.1 Request Coalescing
 */

// Simulate the cache's getOrSet with stampede protection
class MockCache {
    private cache = new Map<string, unknown>();
    private inFlight = new Map<string, Promise<unknown>>();
    public fetchCount = 0;

    async getOrSet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        // Check cache first
        const cached = this.cache.get(key);
        if (cached !== undefined) {
            return cached as T;
        }

        // Stampede protection: if already fetching, wait for that request
        if (this.inFlight.has(key)) {
            return this.inFlight.get(key) as Promise<T>;
        }

        // Create the fetch promise
        const promise = (async () => {
            try {
                this.fetchCount++;
                const value = await fetcher();
                this.cache.set(key, value);
                return value;
            } finally {
                this.inFlight.delete(key);
            }
        })();

        this.inFlight.set(key, promise);
        return promise;
    }

    clear() {
        this.cache.clear();
        this.inFlight.clear();
        this.fetchCount = 0;
    }

    getCacheSize() {
        return this.cache.size;
    }
}

describe('Request Coalescing', () => {
    let cache: MockCache;

    beforeEach(() => {
        cache = new MockCache();
    });

    describe('Stampede Protection', () => {
        it('coalesces concurrent identical requests', async () => {
            // Simulate slow API call
            const slowFetcher = async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return 'API response';
            };

            // Fire 5 concurrent requests for the same key
            const results = await Promise.all([
                cache.getOrSet('key1', slowFetcher),
                cache.getOrSet('key1', slowFetcher),
                cache.getOrSet('key1', slowFetcher),
                cache.getOrSet('key1', slowFetcher),
                cache.getOrSet('key1', slowFetcher),
            ]);

            // All should get the same result
            expect(results).toEqual([
                'API response',
                'API response',
                'API response',
                'API response',
                'API response',
            ]);

            // But only ONE fetch should have occurred
            expect(cache.fetchCount).toBe(1);
        });

        it('makes separate requests for different keys', async () => {
            const fetcher = async (key: string) => `response for ${key}`;

            await Promise.all([
                cache.getOrSet('key1', () => fetcher('key1')),
                cache.getOrSet('key2', () => fetcher('key2')),
                cache.getOrSet('key3', () => fetcher('key3')),
            ]);

            // Each unique key should trigger its own fetch
            expect(cache.fetchCount).toBe(3);
        });

        it('returns cached value without new fetch', async () => {
            const fetcher = vi.fn().mockResolvedValue('cached value');

            // First call - should fetch
            await cache.getOrSet('key1', fetcher);
            expect(fetcher).toHaveBeenCalledTimes(1);

            // Second call - should return cached
            const result = await cache.getOrSet('key1', fetcher);
            expect(result).toBe('cached value');
            expect(fetcher).toHaveBeenCalledTimes(1); // Still only 1 call
        });

        it('handles fetch errors without caching', async () => {
            let callCount = 0;
            const failingFetcher = async () => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('API error');
                }
                return 'success on retry';
            };

            // First call fails
            await expect(cache.getOrSet('key1', failingFetcher)).rejects.toThrow('API error');

            // Second call should retry (not return cached error)
            const result = await cache.getOrSet('key1', failingFetcher);
            expect(result).toBe('success on retry');
        });
    });

    describe('Hash-based Cache Keys', () => {
        // Simulate hash function (matches Bun.hash behavior)
        function hashPrompt(prompt: string): string {
            // Simple hash for testing - production uses Bun.hash
            let hash = 0;
            for (let i = 0; i < prompt.length; i++) {
                const char = prompt.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        }

        it('generates consistent hashes for same input', () => {
            const prompt = 'What is the price of Bitcoin?';
            const hash1 = hashPrompt(prompt);
            const hash2 = hashPrompt(prompt);

            expect(hash1).toBe(hash2);
        });

        it('generates different hashes for different inputs', () => {
            const hash1 = hashPrompt('What is Bitcoin?');
            const hash2 = hashPrompt('What is Ethereum?');

            expect(hash1).not.toBe(hash2);
        });

        it('creates provider-specific cache keys', () => {
            const prompt = 'Hello world';
            const hash = hashPrompt(prompt);

            const claudeKey = `ai:claude:${hash}`;
            const geminiKey = `ai:gemini:${hash}`;

            expect(claudeKey).not.toBe(geminiKey);
            expect(claudeKey).toContain('claude');
            expect(geminiKey).toContain('gemini');
        });
    });

    describe('Concurrent Request Scenarios', () => {
        it('handles race condition when cache miss during in-flight', async () => {
            let resolveFirst: () => void;
            const firstPromise = new Promise<void>(r => { resolveFirst = r; });

            const results: string[] = [];

            // First request starts fetching
            const p1 = cache.getOrSet('raceKey', async () => {
                await firstPromise; // Wait for signal
                return 'first result';
            }).then(r => results.push(r as string));

            // Second request comes in while first is in-flight
            const p2 = cache.getOrSet('raceKey', async () => {
                return 'second result'; // This should NOT be called
            }).then(r => results.push(r as string));

            // Complete first request
            resolveFirst!();

            await Promise.all([p1, p2]);

            // Both should get the first result
            expect(results).toEqual(['first result', 'first result']);
            expect(cache.fetchCount).toBe(1);
        });

        it('allows new fetch after previous completes', async () => {
            const fetcher1 = vi.fn().mockResolvedValue('result 1');
            const fetcher2 = vi.fn().mockResolvedValue('result 2');

            // First request
            await cache.getOrSet('key', fetcher1);
            expect(fetcher1).toHaveBeenCalledTimes(1);

            // Clear cache
            cache.clear();

            // Second request should fetch again
            const result = await cache.getOrSet('key', fetcher2);
            expect(result).toBe('result 2');
            expect(fetcher2).toHaveBeenCalledTimes(1);
        });
    });
});
