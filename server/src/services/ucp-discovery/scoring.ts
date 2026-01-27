/**
 * Merchant Scoring System
 *
 * Computes a 0-100 score for merchants based on:
 * - Profile validity and completeness
 * - A2A support
 * - Response latency
 * - Region matching
 * - Reliability history
 */

import type {
  Region,
  ScoringFactors,
  UCPProfileSnapshot,
  AgentCardSnapshot,
  ValidationResult,
  CrawlState,
} from './types.js';

// ============================================================================
// Scoring Input
// ============================================================================

export interface MerchantScoringInput {
  merchantId: string;
  domain: string;
  region: Region;
  profile?: UCPProfileSnapshot;
  agentCard?: AgentCardSnapshot;
  validationResults: ValidationResult[];
  crawlState?: CrawlState;
  lastFetchLatencyMs?: number;
  selectedRegion: Region;
}

// ============================================================================
// Score Calculator
// ============================================================================

export function calculateMerchantScore(
  input: MerchantScoringInput,
  factors: ScoringFactors = {
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
  }
): number {
  let score = 0;

  // Valid profile (structural validation passed)
  if (input.profile) {
    score += factors.validProfile;

    // Semantic checks (has services, capabilities)
    const hasErrors = input.validationResults.some(r =>
      r.target === 'ucp_profile' && r.severity === 'error'
    );
    if (!hasErrors) {
      score += factors.semanticChecks;
    }

    // Has A2A endpoint
    if (input.profile.hasA2A) {
      score += factors.hasA2A;
    }

    // Has payment section
    if (input.profile.payment) {
      score += factors.hasPayment;
    }

    // Has signing keys
    if (input.profile.signingKeys) {
      score += factors.hasSigningKeys;
    }
  }

  // Low latency bonus (< 500ms)
  if (input.lastFetchLatencyMs && input.lastFetchLatencyMs < 500) {
    score += factors.lowLatency;
  }

  // Repeated failures penalty
  if (input.crawlState && input.crawlState.consecutiveFailures >= 3) {
    score += factors.repeatedFailures;
  }

  // Stale profile penalty (no successful fetch in 7+ days)
  if (input.crawlState?.lastSuccessAt) {
    const daysSinceSuccess = Math.floor(
      (Date.now() - new Date(input.crawlState.lastSuccessAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSuccess >= 7) {
      score += factors.staleProfile;
    }
  }

  // Region matching
  if (input.region === input.selectedRegion) {
    score += factors.regionMatch;
  } else if (input.region === 'OTHER') {
    score += factors.regionUnknown;
  } else {
    score += factors.regionMismatch;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Batch Scoring
// ============================================================================

export function scoreMerchants(
  inputs: MerchantScoringInput[],
  selectedRegion: Region,
  factors?: ScoringFactors
): Array<{ merchantId: string; score: number }> {
  return inputs.map(input => ({
    merchantId: input.merchantId,
    score: calculateMerchantScore({ ...input, selectedRegion }, factors),
  }));
}

// ============================================================================
// Score-Based Ranking
// ============================================================================

export function rankMerchantsByScore(
  merchants: Array<{ merchantId: string; score: number }>,
  limit?: number
): Array<{ merchantId: string; score: number; rank: number }> {
  const sorted = [...merchants].sort((a, b) => b.score - a.score);

  const ranked = sorted.map((m, index) => ({
    ...m,
    rank: index + 1,
  }));

  if (limit) {
    return ranked.slice(0, limit);
  }

  return ranked;
}

// ============================================================================
// Health Tier Assignment
// ============================================================================

import type { HealthTier } from './types.js';

export function assignHealthTier(
  score: number,
  consecutiveFailures: number
): HealthTier {
  // Tier C: Many failures or very low score
  if (consecutiveFailures >= 3 || score < 30) {
    return 'C';
  }

  // Tier A: High score and no failures
  if (score >= 70 && consecutiveFailures === 0) {
    return 'A';
  }

  // Tier B: Everything else
  return 'B';
}

// ============================================================================
// Next Check Scheduling
// ============================================================================

import { HEALTH_TIER_CONFIG } from './types.js';

export function calculateNextCheckTime(
  tier: HealthTier,
  consecutiveFailures: number
): Date {
  const config = HEALTH_TIER_CONFIG[tier];

  // Exponential backoff for failures
  const backoffFactor = Math.min(consecutiveFailures, 5);
  const minHours = config.minHours * Math.pow(1.5, backoffFactor);
  const maxHours = config.maxHours * Math.pow(1.5, backoffFactor);

  // Random jitter between min and max
  const hours = minHours + Math.random() * (maxHours - minHours);

  const nextCheck = new Date();
  nextCheck.setTime(nextCheck.getTime() + hours * 60 * 60 * 1000);

  return nextCheck;
}
