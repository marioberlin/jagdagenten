/**
 * UCP Merchant Discovery Types
 *
 * Type definitions for the merchant discovery crawler that:
 * - Harvests domains from directories and search results
 * - Fetches and validates /.well-known/ucp profiles
 * - Extracts A2A endpoints and capabilities
 * - Maintains a registry with freshness checks
 */

// ============================================================================
// Region & Configuration
// ============================================================================

export type Region = 'EU' | 'US' | 'CA' | 'OTHER';

export interface CrawlerConfig {
  /** Maximum concurrent requests */
  concurrency: number;
  /** Max requests per eTLD+1 domain */
  perDomainConcurrency: number;
  /** Connection timeout in ms */
  connectTimeout: number;
  /** Total request timeout in ms */
  requestTimeout: number;
  /** Max redirects to follow */
  maxRedirects: number;
  /** User agent for requests */
  userAgent: string;
  /** Selected region for prioritization */
  selectedRegion: Region;
}

export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  concurrency: 50,
  perDomainConcurrency: 2,
  connectTimeout: 3000,
  requestTimeout: 15000,
  maxRedirects: 5,
  userAgent: 'UCPDiscovery/1.0 (+https://ucp.dev/crawler)',
  selectedRegion: 'EU',
};

// ============================================================================
// Merchant & Sources
// ============================================================================

export interface Merchant {
  id: string;
  domain: string;
  region: Region;
  score: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SourceType = 'github_dir' | 'ucpchecker' | 'ucptools' | 'search' | 'manual';

export interface MerchantSource {
  id: string;
  merchantId: string;
  sourceType: SourceType;
  sourceUrl: string;
  discoveredAt: string;
}

// ============================================================================
// UCP Profile Fetch
// ============================================================================

export interface UCPFetchResult {
  id: string;
  merchantId: string;
  fetchedAt: string;
  url: string;
  finalUrl: string;
  statusCode: number;
  latencyMs: number;
  etag?: string;
  lastModified?: string;
  cacheControl?: string;
  bodySha256?: string;
  bodyJson?: unknown;
  error?: string;
}

// ============================================================================
// UCP Profile Validation
// ============================================================================

export type ValidationSeverity = 'info' | 'warn' | 'error';
export type ValidationTarget = 'ucp_profile' | 'agent_card';

export interface ValidationResult {
  id: string;
  merchantId: string;
  fetchedAt: string;
  target: ValidationTarget;
  severity: ValidationSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Validation error codes
export const VALIDATION_CODES = {
  // Structural errors
  NOT_JSON: 'UCP_NOT_JSON',
  MISSING_UCP: 'UCP_MISSING_UCP_OBJECT',
  MISSING_VERSION: 'UCP_MISSING_VERSION',
  MISSING_SERVICES: 'UCP_MISSING_SERVICES',
  MISSING_CAPABILITIES: 'UCP_MISSING_CAPABILITIES',
  MISSING_A2A_ENDPOINT: 'UCP_MISSING_A2A_ENDPOINT',

  // Semantic warnings
  MISSING_PAYMENT: 'UCP_MISSING_PAYMENT',
  MISSING_SIGNING_KEYS: 'UCP_MISSING_SIGNING_KEYS',
  NO_SHOPPING_SERVICE: 'UCP_NO_SHOPPING_SERVICE',

  // Network errors
  TLS_ERROR: 'UCP_TLS_ERROR',
  TIMEOUT: 'UCP_TIMEOUT',
  NOT_FOUND: 'UCP_NOT_FOUND',
  SERVER_ERROR: 'UCP_SERVER_ERROR',

  // Agent Card errors
  AGENT_MISSING_UCP_EXTENSION: 'A2A_MISSING_UCP_EXTENSION',
  AGENT_INVALID_SKILLS: 'A2A_INVALID_SKILLS',
} as const;

// ============================================================================
// Parsed UCP Profile
// ============================================================================

export interface UCPProfileSnapshot {
  merchantId: string;
  ucpVersion: string;
  services: UCPServices;
  capabilities: UCPCapability[];
  payment?: unknown;
  signingKeys?: unknown;
  hasA2A: boolean;
  a2aAgentCardUrl?: string;
  restEndpoint?: string;
  mcpEndpoint?: string;
  embeddedSchema?: string;
  updatedAt: string;
}

export interface UCPServices {
  [namespace: string]: UCPService;
}

export interface UCPService {
  version: string;
  spec?: string;
  a2a?: {
    endpoint: string;
  };
  rest?: {
    endpoint: string;
  };
  mcp?: {
    endpoint: string;
  };
}

export interface UCPCapability {
  name: string;
  version: string;
  description?: string;
  spec?: string;
  schema?: string;
  extends?: string;
}

// ============================================================================
// Agent Card
// ============================================================================

export interface AgentCardFetch {
  id: string;
  merchantId: string;
  fetchedAt: string;
  url: string;
  statusCode: number;
  latencyMs: number;
  bodySha256?: string;
  bodyJson?: unknown;
  error?: string;
}

export interface AgentCardSnapshot {
  merchantId: string;
  name: string;
  description?: string;
  version?: string;
  protocolVersions: string[];
  supportedInterfaces: AgentInterface[];
  capabilities: AgentCapabilities;
  extensions: AgentExtensions;
  skills: AgentSkill[];
  updatedAt: string;
}

export interface AgentInterface {
  url: string;
  protocolBinding: string;
}

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extendedAgentCard?: boolean;
  extensions?: AgentExtension[];
}

export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
}

export interface AgentExtensions {
  ucp?: {
    version: string;
    capabilities?: UCPCapability[];
    features?: Record<string, boolean>;
  };
}

export interface AgentSkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

// ============================================================================
// Crawl State & Scheduling
// ============================================================================

export type HealthTier = 'A' | 'B' | 'C';

export interface CrawlState {
  merchantId: string;
  nextCheckAt: string;
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  healthTier: HealthTier;
}

// Tier configuration
export const HEALTH_TIER_CONFIG: Record<HealthTier, { minHours: number; maxHours: number }> = {
  A: { minHours: 6, maxHours: 24 },
  B: { minHours: 48, maxHours: 168 }, // 2-7 days
  C: { minHours: 168, maxHours: 720 }, // 7-30 days
};

// ============================================================================
// Scoring
// ============================================================================

export interface ScoringFactors {
  validProfile: number;
  semanticChecks: number;
  hasA2A: number;
  hasPayment: number;
  hasSigningKeys: number;
  lowLatency: number;
  repeatedFailures: number;
  staleProfile: number;
  regionMatch: number;
  regionUnknown: number;
  regionMismatch: number;
}

export const DEFAULT_SCORING: ScoringFactors = {
  validProfile: 30,
  semanticChecks: 20,
  hasA2A: 15,
  hasPayment: 10,
  hasSigningKeys: 10,
  lowLatency: 5,
  repeatedFailures: -20,
  staleProfile: -10,
  regionMatch: 15,
  regionUnknown: 5,
  regionMismatch: -10,
};

// ============================================================================
// API Response Types
// ============================================================================

export interface MerchantListResponse {
  merchants: Merchant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MerchantDetailResponse {
  merchant: Merchant;
  sources: MerchantSource[];
  profile?: UCPProfileSnapshot;
  agentCard?: AgentCardSnapshot;
  validationResults: ValidationResult[];
  crawlState: CrawlState;
}

export interface CrawlerStatsResponse {
  totalMerchants: number;
  activeMerchants: number;
  byRegion: Record<Region, number>;
  byHealthTier: Record<HealthTier, number>;
  validPercentage: number;
  withA2A: number;
  lastCrawlAt?: string;
}
