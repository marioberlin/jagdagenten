import { describe, it, expect } from 'vitest';
import { typeDefs } from '../../server/src/graphql/schema';
import { resolvers } from '../../server/src/graphql/resolvers';

/**
 * Tests for GraphQL Schema and Resolvers
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.3 GraphQL Schema Completion
 */

describe('GraphQL Schema', () => {
    describe('Type Definitions', () => {
        it('exports typeDefs string', () => {
            expect(typeof typeDefs).toBe('string');
            expect(typeDefs.length).toBeGreaterThan(1000);
        });

        it('defines Provider enum', () => {
            expect(typeDefs).toContain('enum Provider');
            expect(typeDefs).toContain('GEMINI');
            expect(typeDefs).toContain('CLAUDE');
        });

        it('defines TradeSide enum', () => {
            expect(typeDefs).toContain('enum TradeSide');
            expect(typeDefs).toContain('BUY');
            expect(typeDefs).toContain('SELL');
        });

        it('defines OrderType enum', () => {
            expect(typeDefs).toContain('enum OrderType');
            expect(typeDefs).toContain('MARKET');
            expect(typeDefs).toContain('LIMIT');
            expect(typeDefs).toContain('STOP_LOSS');
            expect(typeDefs).toContain('TAKE_PROFIT');
        });

        it('defines OrderStatus enum', () => {
            expect(typeDefs).toContain('enum OrderStatus');
            expect(typeDefs).toContain('PENDING');
            expect(typeDefs).toContain('FILLED');
            expect(typeDefs).toContain('CANCELLED');
        });

        it('defines HealingStatus enum', () => {
            expect(typeDefs).toContain('enum HealingStatus');
            expect(typeDefs).toContain('QUEUED');
            expect(typeDefs).toContain('ANALYZING');
            expect(typeDefs).toContain('COMPLETED');
        });

        it('defines OrchestrationStatus enum', () => {
            expect(typeDefs).toContain('enum OrchestrationStatus');
            expect(typeDefs).toContain('DECOMPOSING');
            expect(typeDefs).toContain('EXECUTING');
            expect(typeDefs).toContain('MERGING');
        });

        it('defines custom scalars', () => {
            expect(typeDefs).toContain('scalar DateTime');
            expect(typeDefs).toContain('scalar JSON');
        });

        it('defines ChatResponse type', () => {
            expect(typeDefs).toContain('type ChatResponse');
            expect(typeDefs).toContain('content: String!');
            expect(typeDefs).toContain('provider: Provider!');
            expect(typeDefs).toContain('cached: Boolean!');
        });

        it('defines MarketData type', () => {
            expect(typeDefs).toContain('type MarketData');
            expect(typeDefs).toContain('symbol: String!');
            expect(typeDefs).toContain('price: Float!');
            expect(typeDefs).toContain('change24h: Float!');
        });

        it('defines Portfolio type', () => {
            expect(typeDefs).toContain('type Portfolio');
            expect(typeDefs).toContain('totalValue: Float!');
            expect(typeDefs).toContain('positions: [Position!]!');
        });

        it('defines Trade type', () => {
            expect(typeDefs).toContain('type Trade');
            expect(typeDefs).toContain('side: TradeSide!');
            expect(typeDefs).toContain('type: OrderType!');
            expect(typeDefs).toContain('status: OrderStatus!');
        });

        it('defines ServerStatus type', () => {
            expect(typeDefs).toContain('type ServerStatus');
            expect(typeDefs).toContain('version: String!');
            expect(typeDefs).toContain('redis: RedisStatus!');
            expect(typeDefs).toContain('cache: CacheStatus!');
        });

        it('defines HealingSystemStatus type', () => {
            expect(typeDefs).toContain('type HealingSystemStatus');
            expect(typeDefs).toContain('queueTotal: Int!');
            expect(typeDefs).toContain('autoHealEnabled: Boolean!');
        });

        it('defines OrchestratorSystemStatus type', () => {
            expect(typeDefs).toContain('type OrchestratorSystemStatus');
            expect(typeDefs).toContain('activeSessions: Int!');
            expect(typeDefs).toContain('parallelExecution: Boolean!');
        });

        it('defines SandboxResult type', () => {
            expect(typeDefs).toContain('type SandboxResult');
            expect(typeDefs).toContain('exitCode: Int!');
            expect(typeDefs).toContain('stdout: String!');
            expect(typeDefs).toContain('timedOut: Boolean!');
        });
    });

    describe('Input Types', () => {
        it('defines ChatInput', () => {
            expect(typeDefs).toContain('input ChatInput');
            expect(typeDefs).toContain('messages: [MessageInput!]!');
            expect(typeDefs).toContain('provider: Provider');
        });

        it('defines MessageInput', () => {
            expect(typeDefs).toContain('input MessageInput');
            expect(typeDefs).toContain('role: String!');
            expect(typeDefs).toContain('content: String!');
        });

        it('defines TradeInput', () => {
            expect(typeDefs).toContain('input TradeInput');
            expect(typeDefs).toContain('symbol: String!');
            expect(typeDefs).toContain('side: TradeSide!');
            expect(typeDefs).toContain('quantity: Float!');
        });

        it('defines ErrorReportInput', () => {
            expect(typeDefs).toContain('input ErrorReportInput');
            expect(typeDefs).toContain('type: String!');
            expect(typeDefs).toContain('message: String!');
        });

        it('defines PRDInput', () => {
            expect(typeDefs).toContain('input PRDInput');
            expect(typeDefs).toContain('title: String!');
            expect(typeDefs).toContain('stories: [PRDStoryInput!]!');
        });

        it('defines PRDStoryInput', () => {
            expect(typeDefs).toContain('input PRDStoryInput');
            expect(typeDefs).toContain('acceptanceCriteria: [String!]!');
            expect(typeDefs).toContain('affectedFiles: [String!]!');
            expect(typeDefs).toContain('complexity: Int!');
        });
    });

    describe('Query Type', () => {
        it('defines chat query', () => {
            expect(typeDefs).toContain('chat(prompt: String!, provider: Provider): ChatResponse!');
        });

        it('defines serverStatus query', () => {
            expect(typeDefs).toContain('serverStatus: ServerStatus!');
        });

        it('defines portfolio query', () => {
            expect(typeDefs).toContain('portfolio: Portfolio!');
        });

        it('defines marketData query', () => {
            expect(typeDefs).toContain('marketData(symbols: [String!]!): [MarketData!]!');
        });

        it('defines priceHistory query', () => {
            expect(typeDefs).toContain('priceHistory(');
            expect(typeDefs).toContain('symbol: String!');
            expect(typeDefs).toContain('interval: String!');
        });

        it('defines watchlist query', () => {
            expect(typeDefs).toContain('watchlist: Watchlist!');
        });

        it('defines rateLimitInfo query', () => {
            expect(typeDefs).toContain('rateLimitInfo: RateLimitInfo!');
        });

        it('defines plugins query', () => {
            expect(typeDefs).toContain('plugins: [Plugin!]!');
        });

        it('defines healingStatus query', () => {
            expect(typeDefs).toContain('healingStatus: HealingSystemStatus!');
        });

        it('defines orchestratorStatus query', () => {
            expect(typeDefs).toContain('orchestratorStatus: OrchestratorSystemStatus!');
        });
    });

    describe('Mutation Type', () => {
        it('defines sendMessage mutation', () => {
            expect(typeDefs).toContain('sendMessage(input: ChatInput!): ChatResponse!');
        });

        it('defines sendParallelMessage mutation', () => {
            expect(typeDefs).toContain('sendParallelMessage(messages: [MessageInput!]!): ParallelChatResponse!');
        });

        it('defines createTrade mutation', () => {
            expect(typeDefs).toContain('createTrade(input: TradeInput!): Trade!');
        });

        it('defines cancelTrade mutation', () => {
            expect(typeDefs).toContain('cancelTrade(id: ID!): Trade!');
        });

        it('defines updateWatchlist mutation', () => {
            expect(typeDefs).toContain('updateWatchlist(symbols: [String!]!): Watchlist!');
        });

        it('defines submitErrorReport mutation', () => {
            expect(typeDefs).toContain('submitErrorReport(input: ErrorReportInput!): ErrorReport!');
        });

        it('defines startHealing mutation', () => {
            expect(typeDefs).toContain('startHealing(errorId: ID!): HealingPRD');
        });

        it('defines createOrchestrationSession mutation', () => {
            expect(typeDefs).toContain('createOrchestrationSession(input: PRDInput!): OrchestrationSessionSummary!');
        });

        it('defines executeOrchestrationSession mutation', () => {
            expect(typeDefs).toContain('executeOrchestrationSession(sessionId: ID!): OrchestrationSessionSummary!');
        });

        it('defines installPlugin mutation', () => {
            expect(typeDefs).toContain('installPlugin(pluginId: String!): Plugin!');
        });

        it('defines executeSandboxCommand mutation', () => {
            expect(typeDefs).toContain('executeSandboxCommand(');
            expect(typeDefs).toContain('pluginRoot: String!');
            expect(typeDefs).toContain('command: String!');
        });
    });

    describe('Subscription Type', () => {
        it('defines priceUpdates subscription', () => {
            expect(typeDefs).toContain('priceUpdates(symbols: [String!]!): MarketData!');
        });

        it('defines chatStream subscription', () => {
            expect(typeDefs).toContain('chatStream(prompt: String!, provider: Provider): String!');
        });

        it('defines healingProgress subscription', () => {
            expect(typeDefs).toContain('healingProgress(taskId: ID!): HealingPRD!');
        });

        it('defines orchestrationProgress subscription', () => {
            expect(typeDefs).toContain('orchestrationProgress(sessionId: ID!): OrchestrationSessionSummary!');
        });

        it('defines tradeUpdates subscription', () => {
            expect(typeDefs).toContain('tradeUpdates: Trade!');
        });
    });
});

describe('GraphQL Resolvers', () => {
    describe('Query Resolvers', () => {
        it('exports resolvers object', () => {
            expect(resolvers).toBeDefined();
            expect(resolvers.Query).toBeDefined();
            expect(resolvers.Mutation).toBeDefined();
        });

        it('serverStatus resolver returns valid structure', async () => {
            const result = await resolvers.Query.serverStatus();

            expect(result).toHaveProperty('version');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('redis');
            expect(result).toHaveProperty('cache');
            expect(result).toHaveProperty('telemetry');
        });

        it('portfolio resolver returns valid structure', async () => {
            const result = await resolvers.Query.portfolio();

            expect(result).toHaveProperty('totalValue');
            expect(result).toHaveProperty('totalCost');
            expect(result).toHaveProperty('totalPnl');
            expect(result).toHaveProperty('positions');
            expect(Array.isArray(result.positions)).toBe(true);
        });

        it('marketData resolver returns array of data', async () => {
            const result = await resolvers.Query.marketData(
                {},
                { symbols: ['BTC', 'ETH'] }
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0]).toHaveProperty('symbol');
            expect(result[0]).toHaveProperty('price');
        });

        it('priceHistory resolver returns array of price points', async () => {
            const result = await resolvers.Query.priceHistory(
                {},
                { symbol: 'BTC', interval: '1h', limit: 10 }
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeLessThanOrEqual(10);
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('timestamp');
                expect(result[0]).toHaveProperty('open');
                expect(result[0]).toHaveProperty('close');
            }
        });

        it('watchlist resolver returns valid structure', async () => {
            const result = await resolvers.Query.watchlist();

            expect(result).toHaveProperty('symbols');
            expect(result).toHaveProperty('marketData');
            expect(result).toHaveProperty('lastUpdated');
            expect(Array.isArray(result.symbols)).toBe(true);
        });

        it('rateLimitInfo resolver returns valid structure', async () => {
            const result = await resolvers.Query.rateLimitInfo();

            expect(result).toHaveProperty('limit');
            expect(result).toHaveProperty('remaining');
            expect(result).toHaveProperty('reset');
            expect(result).toHaveProperty('tier');
        });

        it('plugins resolver returns array', async () => {
            const result = await resolvers.Query.plugins();

            expect(Array.isArray(result)).toBe(true);
        });

        it('healingStatus resolver returns valid structure', async () => {
            const result = await resolvers.Query.healingStatus();

            expect(result).toHaveProperty('queueTotal');
            expect(result).toHaveProperty('activeHealing');
            expect(result).toHaveProperty('successCount');
            expect(result).toHaveProperty('autoHealEnabled');
        });

        it('orchestratorStatus resolver returns valid structure', async () => {
            const result = await resolvers.Query.orchestratorStatus();

            expect(result).toHaveProperty('activeSessions');
            expect(result).toHaveProperty('totalSessions');
            expect(result).toHaveProperty('parallelExecution');
            expect(result).toHaveProperty('maxConcurrent');
        });

        it('errorReports resolver returns array', async () => {
            const result = await resolvers.Query.errorReports({}, { limit: 10 });

            expect(Array.isArray(result)).toBe(true);
        });

        it('healingPRDs resolver returns array', async () => {
            const result = await resolvers.Query.healingPRDs({}, {});

            expect(Array.isArray(result)).toBe(true);
        });

        it('orchestrationSessions resolver returns array', async () => {
            const result = await resolvers.Query.orchestrationSessions({}, {});

            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Mutation Resolvers', () => {
        it('createTrade resolver returns trade with PENDING status', async () => {
            const input = {
                symbol: 'BTC',
                side: 'BUY',
                type: 'MARKET',
                quantity: 0.1
            };

            const result = await resolvers.Mutation.createTrade({}, { input });

            expect(result).toHaveProperty('id');
            expect(result.symbol).toBe('BTC');
            expect(result.side).toBe('BUY');
            expect(result.status).toBe('PENDING');
            expect(result.quantity).toBe(0.1);
        });

        it('cancelTrade resolver returns trade with CANCELLED status', async () => {
            const result = await resolvers.Mutation.cancelTrade({}, { id: 'trade_123' });

            expect(result).toHaveProperty('id');
            expect(result.status).toBe('CANCELLED');
        });

        it('updateWatchlist resolver returns updated watchlist', async () => {
            const result = await resolvers.Mutation.updateWatchlist(
                {},
                { symbols: ['BTC', 'ETH', 'SOL'] }
            );

            expect(result).toHaveProperty('symbols');
            expect(result.symbols).toEqual(['BTC', 'ETH', 'SOL']);
            expect(result).toHaveProperty('marketData');
        });

        it('submitErrorReport resolver returns error report', async () => {
            const input = {
                type: 'client_error',
                message: 'Test error message',
                componentName: 'TestComponent',
                url: '/test'
            };

            const result = await resolvers.Mutation.submitErrorReport({}, { input });

            expect(result).toHaveProperty('id');
            expect(result.type).toBe('client_error');
            expect(result.message).toBe('Test error message');
            expect(result.status).toBe('QUEUED');
        });

        it('createOrchestrationSession resolver returns session summary', async () => {
            const input = {
                title: 'Test PRD',
                summary: 'Test summary',
                stories: [{
                    title: 'Story 1',
                    description: 'Description',
                    acceptanceCriteria: ['Criterion 1'],
                    affectedFiles: ['src/test.ts'],
                    complexity: 2
                }]
            };

            const result = await resolvers.Mutation.createOrchestrationSession({}, { input });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('prdTitle');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('totalSubPrds');
        });

        it('installPlugin resolver returns plugin info', async () => {
            const result = await resolvers.Mutation.installPlugin(
                {},
                { pluginId: 'test-plugin' }
            );

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('isInstalled');
            expect(result.isInstalled).toBe(true);
        });

        it('uninstallPlugin resolver returns boolean', async () => {
            const result = await resolvers.Mutation.uninstallPlugin(
                {},
                { pluginId: 'test-plugin' }
            );

            expect(result).toBe(true);
        });

        it('executeSandboxCommand resolver returns sandbox result', async () => {
            const result = await resolvers.Mutation.executeSandboxCommand(
                {},
                { pluginRoot: '/tmp/test', command: 'echo test' }
            );

            expect(result).toHaveProperty('exitCode');
            expect(result).toHaveProperty('stdout');
            expect(result).toHaveProperty('stderr');
            expect(result).toHaveProperty('timedOut');
            expect(result).toHaveProperty('duration');
        });
    });

    describe('Subscription Resolvers', () => {
        it('defines subscription resolvers', () => {
            expect(resolvers.Subscription).toBeDefined();
            expect(resolvers.Subscription.priceUpdates).toBeDefined();
            expect(resolvers.Subscription.chatStream).toBeDefined();
            expect(resolvers.Subscription.healingProgress).toBeDefined();
            expect(resolvers.Subscription.orchestrationProgress).toBeDefined();
            expect(resolvers.Subscription.tradeUpdates).toBeDefined();
        });
    });

    describe('Custom Scalar Resolvers', () => {
        it('defines DateTime scalar', () => {
            expect(resolvers.DateTime).toBeDefined();
        });

        it('defines JSON scalar', () => {
            expect(resolvers.JSON).toBeDefined();
        });
    });
});

describe('GraphQL Integration', () => {
    it('schema and resolvers are compatible', () => {
        // Verify all Query fields have resolvers
        const queryFields = [
            'chat', 'serverStatus', 'portfolio', 'marketData',
            'priceHistory', 'watchlist', 'rateLimitInfo', 'plugins',
            'healingStatus', 'errorReports', 'healingPRDs',
            'orchestratorStatus', 'orchestrationSessions'
        ];

        for (const field of queryFields) {
            expect(resolvers.Query[field]).toBeDefined();
        }

        // Verify all Mutation fields have resolvers
        const mutationFields = [
            'sendMessage', 'sendParallelMessage', 'createTrade', 'cancelTrade',
            'updateWatchlist', 'submitErrorReport', 'startHealing',
            'createOrchestrationSession', 'executeOrchestrationSession',
            'cancelOrchestrationSession', 'installPlugin', 'uninstallPlugin',
            'executeSandboxCommand'
        ];

        for (const field of mutationFields) {
            expect(resolvers.Mutation[field]).toBeDefined();
        }
    });
});
