/**
 * GraphQL Schema Definition
 *
 * Complete GraphQL schema for LiquidCrypto API.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.3 GraphQL Schema Completion
 */

export const typeDefs = `#graphql
  # ============ Enums ============

  """Available AI providers"""
  enum Provider {
    GEMINI
    CLAUDE
  }

  """Trade side (buy or sell)"""
  enum TradeSide {
    BUY
    SELL
  }

  """Order types"""
  enum OrderType {
    MARKET
    LIMIT
    STOP_LOSS
    TAKE_PROFIT
  }

  """Order status"""
  enum OrderStatus {
    PENDING
    FILLED
    PARTIALLY_FILLED
    CANCELLED
    FAILED
  }

  """Healing task status"""
  enum HealingStatus {
    QUEUED
    ANALYZING
    PRD_READY
    HEALING
    VERIFYING
    COMPLETED
    FAILED
  }

  """Orchestration session status"""
  enum OrchestrationStatus {
    DECOMPOSING
    EXECUTING
    MERGING
    VERIFYING
    COMPLETED
    FAILED
  }

  # ============ Scalars ============

  """Custom DateTime scalar"""
  scalar DateTime

  """JSON scalar for arbitrary data"""
  scalar JSON

  # ============ Types ============

  """Chat message"""
  type ChatMessage {
    role: String!
    content: String!
  }

  """AI chat response"""
  type ChatResponse {
    id: ID!
    content: String!
    provider: Provider!
    cached: Boolean!
    timestamp: DateTime!
    promptTokens: Int
    completionTokens: Int
    duration: Int
  }

  """Parallel AI response from multiple providers"""
  type ParallelChatResponse {
    gemini: ChatResponse
    claude: ChatResponse
    fastest: Provider
  }

  """Market data for a symbol"""
  type MarketData {
    symbol: String!
    price: Float!
    change24h: Float!
    changePercent24h: Float!
    volume24h: Float!
    high24h: Float!
    low24h: Float!
    marketCap: Float
    timestamp: DateTime!
  }

  """Historical price point"""
  type PricePoint {
    timestamp: DateTime!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Float!
  }

  """Portfolio position"""
  type Position {
    symbol: String!
    quantity: Float!
    avgPrice: Float!
    currentPrice: Float!
    value: Float!
    pnl: Float!
    pnlPercent: Float!
  }

  """User portfolio"""
  type Portfolio {
    totalValue: Float!
    totalCost: Float!
    totalPnl: Float!
    totalPnlPercent: Float!
    positions: [Position!]!
    performance24h: Float!
    lastUpdated: DateTime!
  }

  """Trade order"""
  type Trade {
    id: ID!
    symbol: String!
    side: TradeSide!
    type: OrderType!
    quantity: Float!
    price: Float
    filledQuantity: Float!
    avgFillPrice: Float
    status: OrderStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """Watchlist"""
  type Watchlist {
    symbols: [String!]!
    marketData: [MarketData!]!
    lastUpdated: DateTime!
  }

  """Server status"""
  type ServerStatus {
    version: String!
    uptime: Int!
    redis: RedisStatus!
    cache: CacheStatus!
    telemetry: TelemetryStatus!
    healing: HealingStatus!
    orchestrator: OrchestratorStatus!
  }

  """Redis connection status"""
  type RedisStatus {
    connected: Boolean!
    latency: Int
    url: String
  }

  """Cache status"""
  type CacheStatus {
    memoryEntries: Int!
    redisEntries: Int
    hitRate: Float!
  }

  """Telemetry status"""
  type TelemetryStatus {
    enabled: Boolean!
    endpoint: String
    serviceName: String!
    serviceVersion: String!
  }

  """Healing system status"""
  type HealingSystemStatus {
    queueTotal: Int!
    activeHealing: Int!
    successCount: Int!
    failedCount: Int!
    autoHealEnabled: Boolean!
  }

  """Orchestrator status"""
  type OrchestratorSystemStatus {
    activeSessions: Int!
    totalSessions: Int!
    parallelExecution: Boolean!
    maxConcurrent: Int!
  }

  """Error report for healing"""
  type ErrorReport {
    id: ID!
    type: String!
    message: String!
    componentName: String
    url: String
    timestamp: DateTime!
    status: HealingStatus!
  }

  """Healing PRD"""
  type HealingPRD {
    id: ID!
    title: String!
    summary: String!
    rootCause: String!
    storiesCount: Int!
    priority: String!
    status: HealingStatus!
    createdAt: DateTime!
  }

  """Orchestration session summary"""
  type OrchestrationSessionSummary {
    id: ID!
    prdTitle: String!
    status: OrchestrationStatus!
    totalSubPrds: Int!
    completedSubPrds: Int!
    failedSubPrds: Int!
    createdAt: DateTime!
  }

  """Rate limit info"""
  type RateLimitInfo {
    limit: Int!
    remaining: Int!
    reset: DateTime!
    tier: String!
  }

  """Plugin info"""
  type Plugin {
    id: ID!
    name: String!
    version: String!
    scope: String!
    isInstalled: Boolean!
  }

  """Sandbox execution result"""
  type SandboxResult {
    exitCode: Int!
    stdout: String!
    stderr: String!
    timedOut: Boolean!
    duration: Int!
  }

  # ============ Inputs ============

  """Chat input for AI providers"""
  input ChatInput {
    messages: [MessageInput!]!
    provider: Provider
    stream: Boolean
  }

  """Message input"""
  input MessageInput {
    role: String!
    content: String!
  }

  """Trade input"""
  input TradeInput {
    symbol: String!
    side: TradeSide!
    type: OrderType!
    quantity: Float!
    price: Float
  }

  """Error report input"""
  input ErrorReportInput {
    type: String!
    message: String!
    stack: String
    componentName: String
    url: String
    userAgent: String
    level: String
    errorCount: Int
  }

  """PRD story input"""
  input PRDStoryInput {
    title: String!
    description: String!
    acceptanceCriteria: [String!]!
    affectedFiles: [String!]!
    complexity: Int!
    domain: String
  }

  """PRD input"""
  input PRDInput {
    title: String!
    summary: String!
    stories: [PRDStoryInput!]!
  }

  # ============ Queries ============

  type Query {
    """Send a chat message to AI"""
    chat(prompt: String!, provider: Provider): ChatResponse!

    """Get server status"""
    serverStatus: ServerStatus!

    """Get current portfolio"""
    portfolio: Portfolio!

    """Get market data for symbols"""
    marketData(symbols: [String!]!): [MarketData!]!

    """Get historical prices"""
    priceHistory(
      symbol: String!
      interval: String!
      limit: Int
    ): [PricePoint!]!

    """Get user's watchlist"""
    watchlist: Watchlist!

    """Get rate limit info"""
    rateLimitInfo: RateLimitInfo!

    """Get installed plugins"""
    plugins: [Plugin!]!

    """Get healing queue status"""
    healingStatus: HealingSystemStatus!

    """Get error reports"""
    errorReports(limit: Int): [ErrorReport!]!

    """Get healing PRDs"""
    healingPRDs(status: HealingStatus): [HealingPRD!]!

    """Get orchestrator status"""
    orchestratorStatus: OrchestratorSystemStatus!

    """Get orchestration sessions"""
    orchestrationSessions(status: OrchestrationStatus): [OrchestrationSessionSummary!]!
  }

  # ============ Mutations ============

  type Mutation {
    """Send a chat message"""
    sendMessage(input: ChatInput!): ChatResponse!

    """Send to multiple AI providers in parallel"""
    sendParallelMessage(messages: [MessageInput!]!): ParallelChatResponse!

    """Create a trade order"""
    createTrade(input: TradeInput!): Trade!

    """Cancel a trade order"""
    cancelTrade(id: ID!): Trade!

    """Update watchlist"""
    updateWatchlist(symbols: [String!]!): Watchlist!

    """Submit error report for healing"""
    submitErrorReport(input: ErrorReportInput!): ErrorReport!

    """Start healing for an error"""
    startHealing(errorId: ID!): HealingPRD

    """Create orchestration session"""
    createOrchestrationSession(input: PRDInput!): OrchestrationSessionSummary!

    """Execute orchestration session"""
    executeOrchestrationSession(sessionId: ID!): OrchestrationSessionSummary!

    """Cancel orchestration session"""
    cancelOrchestrationSession(sessionId: ID!): OrchestrationSessionSummary!

    """Install a plugin"""
    installPlugin(pluginId: String!): Plugin!

    """Uninstall a plugin"""
    uninstallPlugin(pluginId: String!): Boolean!

    """Execute plugin hook in sandbox"""
    executeSandboxCommand(
      pluginRoot: String!
      command: String!
    ): SandboxResult!
  }

  # ============ Subscriptions ============

  type Subscription {
    """Subscribe to price updates"""
    priceUpdates(symbols: [String!]!): MarketData!

    """Subscribe to chat stream"""
    chatStream(prompt: String!, provider: Provider): String!

    """Subscribe to healing progress"""
    healingProgress(taskId: ID!): HealingPRD!

    """Subscribe to orchestration progress"""
    orchestrationProgress(sessionId: ID!): OrchestrationSessionSummary!

    """Subscribe to trade updates"""
    tradeUpdates: Trade!
  }
`;

export default typeDefs;
