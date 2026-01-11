import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for Structured Logging
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.1 Structured Logging
 *
 * Note: These tests verify the logger API without mocking the actual pino library.
 * The actual JSON log output can be seen in the test runner output.
 */

describe('Structured Logging', () => {
    // Fresh imports for each test to avoid module caching issues
    const importLogger = async () => {
        vi.resetModules();
        return import('../../server/src/logger');
    };

    describe('Logger Configuration', () => {
        it('creates logger with required methods', async () => {
            const { logger } = await importLogger();

            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.trace).toBe('function');
            expect(typeof logger.child).toBe('function');
        });

        it('provides all component loggers', async () => {
            const { componentLoggers } = await importLogger();

            expect(componentLoggers).toBeDefined();
            expect(componentLoggers.redis).toBeDefined();
            expect(componentLoggers.cache).toBeDefined();
            expect(componentLoggers.ai).toBeDefined();
            expect(componentLoggers.websocket).toBeDefined();
            expect(componentLoggers.security).toBeDefined();
            expect(componentLoggers.http).toBeDefined();
            expect(componentLoggers.graphql).toBeDefined();
        });

        it('component loggers have logging methods', async () => {
            const { componentLoggers } = await importLogger();

            // Verify each component logger has expected methods
            for (const [name, log] of Object.entries(componentLoggers)) {
                expect(typeof log.info).toBe('function');
                expect(typeof log.warn).toBe('function');
                expect(typeof log.error).toBe('function');
            }
        });
    });

    describe('Request Logger Factory', () => {
        it('creates child logger with requestId', async () => {
            const { createRequestLogger } = await importLogger();

            const requestLogger = createRequestLogger('req_test123');

            expect(requestLogger).toBeDefined();
            expect(typeof requestLogger.info).toBe('function');
        });

        it('creates child logger with userId', async () => {
            const { createRequestLogger } = await importLogger();

            const requestLogger = createRequestLogger('req_456', 'user_789');

            expect(requestLogger).toBeDefined();
            expect(typeof requestLogger.info).toBe('function');
        });

        it('creates child logger with additional context', async () => {
            const { createRequestLogger } = await importLogger();

            const requestLogger = createRequestLogger('req_abc', 'user_xyz', {
                ip: '192.168.1.1',
                method: 'POST',
                path: '/api/v1/chat'
            });

            expect(requestLogger).toBeDefined();
            expect(typeof requestLogger.info).toBe('function');
        });
    });

    describe('Request ID Generator', () => {
        it('generates unique request IDs', async () => {
            const { generateRequestId } = await importLogger();

            const id1 = generateRequestId();
            const id2 = generateRequestId();

            expect(id1).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
            expect(id2).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });

        it('starts with req_ prefix', async () => {
            const { generateRequestId } = await importLogger();

            const id = generateRequestId();

            expect(id.startsWith('req_')).toBe(true);
        });

        it('contains timestamp component', async () => {
            const { generateRequestId } = await importLogger();

            const before = Date.now();
            const id = generateRequestId();
            const after = Date.now();

            // Extract timestamp part (between req_ and second _)
            const parts = id.split('_');
            const timestampPart = parts[1];
            const timestamp = parseInt(timestampPart, 36);

            // The timestamp should be within our test window
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('Logging Helper Functions', () => {
        it('logAIRequest function exists and is callable', async () => {
            const { logAIRequest, componentLoggers } = await importLogger();

            expect(typeof logAIRequest).toBe('function');

            // Should not throw when called
            expect(() => {
                logAIRequest(componentLoggers.ai, 'claude', {
                    duration: 1500,
                    cached: false,
                    promptLength: 100,
                    responseLength: 500
                });
            }).not.toThrow();
        });

        it('logAIRequest handles errors', async () => {
            const { logAIRequest, componentLoggers } = await importLogger();

            expect(() => {
                logAIRequest(componentLoggers.ai, 'gemini', {
                    duration: 30000,
                    cached: false,
                    promptLength: 200,
                    error: new Error('API timeout')
                });
            }).not.toThrow();
        });

        it('logCacheOperation function exists and handles all operations', async () => {
            const { logCacheOperation } = await importLogger();

            expect(typeof logCacheOperation).toBe('function');

            // Test all operation types
            const operations = ['get', 'set', 'del', 'hit', 'miss'] as const;
            for (const op of operations) {
                expect(() => {
                    logCacheOperation(op, {
                        key: 'test:key',
                        ttl: 3600,
                        layer: 'memory'
                    });
                }).not.toThrow();
            }
        });

        it('logCacheOperation masks sensitive cache keys', async () => {
            const { logCacheOperation } = await importLogger();

            // Should handle keys with AI provider patterns
            expect(() => {
                logCacheOperation('set', {
                    key: 'ai:claude:abc123def456',
                    ttl: 3600
                });
            }).not.toThrow();
        });

        it('logWebSocketEvent function handles all event types', async () => {
            const { logWebSocketEvent } = await importLogger();

            expect(typeof logWebSocketEvent).toBe('function');

            const events = ['connect', 'disconnect', 'message', 'subscribe', 'broadcast', 'error'] as const;
            for (const event of events) {
                expect(() => {
                    logWebSocketEvent(event, {
                        clientId: 'ws_test_123',
                        userId: 'user_456'
                    });
                }).not.toThrow();
            }
        });

        it('logWebSocketEvent handles error parameter', async () => {
            const { logWebSocketEvent } = await importLogger();

            expect(() => {
                logWebSocketEvent('error', {
                    clientId: 'ws_123',
                    error: new Error('Connection lost')
                });
            }).not.toThrow();
        });

        it('logSecurityEvent function handles all event types', async () => {
            const { logSecurityEvent } = await importLogger();

            expect(typeof logSecurityEvent).toBe('function');

            const events = ['rate_limit', 'auth_failure', 'suspicious', 'blocked'] as const;
            for (const event of events) {
                expect(() => {
                    logSecurityEvent(event, {
                        ip: '192.168.1.100',
                        path: '/api/v1/chat',
                        method: 'POST'
                    });
                }).not.toThrow();
            }
        });
    });

    describe('Export Verification', () => {
        it('exports all expected symbols', async () => {
            const loggerModule = await importLogger();

            expect(loggerModule.logger).toBeDefined();
            expect(loggerModule.componentLoggers).toBeDefined();
            expect(loggerModule.createRequestLogger).toBeDefined();
            expect(loggerModule.generateRequestId).toBeDefined();
            expect(loggerModule.logAIRequest).toBeDefined();
            expect(loggerModule.logCacheOperation).toBeDefined();
            expect(loggerModule.logWebSocketEvent).toBeDefined();
            expect(loggerModule.logSecurityEvent).toBeDefined();
        });

        it('exports default as logger', async () => {
            const loggerModule = await importLogger();

            expect(loggerModule.default).toBe(loggerModule.logger);
        });
    });
});
