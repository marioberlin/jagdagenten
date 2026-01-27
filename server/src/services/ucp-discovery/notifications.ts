/**
 * UCP Discovery Notification System
 *
 * Sends alerts when:
 * - A merchant moves from Tier A to Tier C
 * - A new merchant with A2A is discovered
 * - Crawl errors exceed threshold
 */

import { merchantStore } from './storage.js';
import { onCrawlerProgress, type CrawlerProgressEvent } from './crawler.js';
import type { Merchant, HealthTier } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface DiscoveryNotification {
  id: string;
  type: 'tier_change' | 'new_a2a' | 'crawl_errors' | 'crawl_complete';
  severity: 'info' | 'warn' | 'error';
  title: string;
  message: string;
  merchantId?: string;
  domain?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

type NotificationCallback = (notification: DiscoveryNotification) => void;

// ============================================================================
// Notification Callbacks
// ============================================================================

let notificationCallbacks: NotificationCallback[] = [];

export function onNotification(callback: NotificationCallback): () => void {
  notificationCallbacks.push(callback);
  return () => {
    notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
  };
}

function emit(notification: DiscoveryNotification): void {
  for (const callback of notificationCallbacks) {
    try {
      callback(notification);
    } catch (e) {
      console.error('[Notifications] Callback error:', e);
    }
  }
}

function createNotification(
  type: DiscoveryNotification['type'],
  severity: DiscoveryNotification['severity'],
  title: string,
  message: string,
  data?: Partial<DiscoveryNotification>
): DiscoveryNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
}

// ============================================================================
// Tier Change Detection
// ============================================================================

const previousTiers = new Map<string, HealthTier>();
const ERROR_THRESHOLD = 10;

export function trackTierChange(merchantId: string, oldTier: HealthTier, newTier: HealthTier): void {
  previousTiers.set(merchantId, newTier);

  // Alert on downgrade from A to C
  if (oldTier === 'A' && newTier === 'C') {
    const merchant = merchantStore.getMerchantById(merchantId);
    emit(createNotification(
      'tier_change',
      'error',
      'Merchant Health Degraded',
      `${merchant?.domain || merchantId} dropped from Tier A to Tier C`,
      { merchantId, domain: merchant?.domain, data: { oldTier, newTier } }
    ));
  }
  // Alert on upgrade from C to A
  else if (oldTier === 'C' && newTier === 'A') {
    const merchant = merchantStore.getMerchantById(merchantId);
    emit(createNotification(
      'tier_change',
      'info',
      'Merchant Health Recovered',
      `${merchant?.domain || merchantId} recovered from Tier C to Tier A`,
      { merchantId, domain: merchant?.domain, data: { oldTier, newTier } }
    ));
  }
}

// ============================================================================
// New A2A Merchant Detection
// ============================================================================

const knownA2AMerchants = new Set<string>();

export function trackNewA2AMerchant(merchant: Merchant, hasA2A: boolean): void {
  if (hasA2A && !knownA2AMerchants.has(merchant.id)) {
    knownA2AMerchants.add(merchant.id);
    emit(createNotification(
      'new_a2a',
      'info',
      'New A2A Merchant Discovered',
      `${merchant.domain} supports A2A protocol`,
      { merchantId: merchant.id, domain: merchant.domain }
    ));
  }
}

// ============================================================================
// Crawl Progress Handler
// ============================================================================

let unsubscribeProgress: (() => void) | null = null;

export function startNotificationTracking(): void {
  if (unsubscribeProgress) return;

  unsubscribeProgress = onCrawlerProgress((event: CrawlerProgressEvent) => {
    // Crawl completed
    if (event.type === 'completed' && event.stats) {
      const { newMerchants, updatedMerchants, errors } = event.stats;

      emit(createNotification(
        'crawl_complete',
        errors > ERROR_THRESHOLD ? 'warn' : 'info',
        'Crawl Completed',
        `New: ${newMerchants}, Updated: ${updatedMerchants}, Errors: ${errors}`,
        { data: { newMerchants, updatedMerchants, errors } }
      ));

      // Alert if too many errors
      if (errors > ERROR_THRESHOLD) {
        emit(createNotification(
          'crawl_errors',
          'error',
          'High Error Rate Detected',
          `Crawl had ${errors} errors (threshold: ${ERROR_THRESHOLD})`,
          { data: { errors, threshold: ERROR_THRESHOLD } }
        ));
      }
    }

    // Crawl error
    if (event.type === 'error') {
      emit(createNotification(
        'crawl_errors',
        'error',
        'Crawl Failed',
        event.message || 'Unknown error',
        { data: { error: event.message } }
      ));
    }
  });
}

export function stopNotificationTracking(): void {
  if (unsubscribeProgress) {
    unsubscribeProgress();
    unsubscribeProgress = null;
  }
}

// ============================================================================
// Recent Notifications
// ============================================================================

const recentNotifications: DiscoveryNotification[] = [];
const MAX_RECENT = 50;

// Auto-store recent notifications
onNotification((notif) => {
  recentNotifications.unshift(notif);
  if (recentNotifications.length > MAX_RECENT) {
    recentNotifications.pop();
  }
});

export function getRecentNotifications(limit = 20): DiscoveryNotification[] {
  return recentNotifications.slice(0, limit);
}

export function clearNotifications(): void {
  recentNotifications.length = 0;
}
