/**
 * Jagd-Agenten Subscription Store
 *
 * Mock subscription tier system with settings toggle.
 * Paywall can be enabled/disabled in settings for testing.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'beater' | 'paechter' | 'forst';

export interface SubscriptionPlan {
    id: SubscriptionTier;
    name: string;
    nameDE: string;
    price: number; // EUR per year, 0 for free
    features: string[];
    featuresDE: string[];
}

export interface SubscriptionState {
    // Current user tier
    currentTier: SubscriptionTier;

    // Paywall toggle (for testing)
    paywallEnabled: boolean;

    // Mock subscription dates
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;

    // Actions
    setTier: (tier: SubscriptionTier) => void;
    setPaywallEnabled: (enabled: boolean) => void;
    upgradeTo: (tier: SubscriptionTier) => void;
    downgrade: () => void;

    // Helpers
    hasAccess: (requiredTier: SubscriptionTier) => boolean;
    isPremium: () => boolean;
    isEnterprise: () => boolean;
}

// ============================================================================
// Plans Definition
// ============================================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
    beater: {
        id: 'beater',
        name: 'Beater',
        nameDE: 'Treiber',
        price: 0,
        features: [
            'Daily Cockpit',
            'Basic Journal',
            'Offline Maps',
            'Hunt Timeline',
        ],
        featuresDE: [
            'Tages-Cockpit',
            'Basis-Journal',
            'Offline-Karten',
            'Jagd-Timeline',
        ],
    },
    paechter: {
        id: 'paechter',
        name: 'Pächter',
        nameDE: 'Pächter',
        price: 49,
        features: [
            'Everything in Beater',
            'Scout Recommendations',
            'Bureaucracy Automation',
            'Export Packs (PDF+CSV)',
            'Pack Events',
            'Weekly Explore Dashboards',
            'Waidmann-Feed Full Access',
            'Gear Health Tracking',
        ],
        featuresDE: [
            'Alles aus Treiber',
            'Scout-Empfehlungen',
            'Behörden-Automatisierung',
            'Export-Pakete (PDF+CSV)',
            'Rudel-Events',
            'Wöchentliche Explore-Dashboards',
            'Waidmann-Feed Vollzugriff',
            'Ausrüstungs-Tracking',
        ],
    },
    forst: {
        id: 'forst',
        name: 'Forst',
        nameDE: 'Forst',
        price: 199,
        features: [
            'Everything in Pächter',
            'Multi-Revier Management',
            'Role-Based Analytics',
            'Team Administration',
            'API Access',
            'Priority Support',
        ],
        featuresDE: [
            'Alles aus Pächter',
            'Multi-Revier-Verwaltung',
            'Rollen-basierte Analytik',
            'Team-Administration',
            'API-Zugang',
            'Prioritäts-Support',
        ],
    },
};

// ============================================================================
// Tier Hierarchy
// ============================================================================

const TIER_LEVEL: Record<SubscriptionTier, number> = {
    beater: 0,
    paechter: 1,
    forst: 2,
};

// ============================================================================
// Feature Gating
// ============================================================================

export type PremiumFeature =
    | 'scout_recommendations'
    | 'bureaucracy_automation'
    | 'export_packs'
    | 'pack_events'
    | 'weekly_explore'
    | 'waidmann_feed_full'
    | 'gear_health'
    | 'multi_revier'
    | 'team_admin'
    | 'api_access';

const FEATURE_REQUIREMENTS: Record<PremiumFeature, SubscriptionTier> = {
    scout_recommendations: 'paechter',
    bureaucracy_automation: 'paechter',
    export_packs: 'paechter',
    pack_events: 'paechter',
    weekly_explore: 'paechter',
    waidmann_feed_full: 'paechter',
    gear_health: 'paechter',
    multi_revier: 'forst',
    team_admin: 'forst',
    api_access: 'forst',
};

export function getRequiredTier(feature: PremiumFeature): SubscriptionTier {
    return FEATURE_REQUIREMENTS[feature];
}

// ============================================================================
// Store
// ============================================================================

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            currentTier: 'beater',
            paywallEnabled: false, // OFF by default for dev/testing
            subscriptionStartDate: null,
            subscriptionEndDate: null,

            setTier: (tier) => set({ currentTier: tier }),

            setPaywallEnabled: (enabled) => set({ paywallEnabled: enabled }),

            upgradeTo: (tier) => {
                const now = new Date();
                const endDate = new Date(now);
                endDate.setFullYear(endDate.getFullYear() + 1);

                set({
                    currentTier: tier,
                    subscriptionStartDate: now.toISOString(),
                    subscriptionEndDate: endDate.toISOString(),
                });
            },

            downgrade: () => set({
                currentTier: 'beater',
                subscriptionStartDate: null,
                subscriptionEndDate: null,
            }),

            hasAccess: (requiredTier) => {
                const state = get();

                // If paywall is disabled, always grant access
                if (!state.paywallEnabled) return true;

                // Check tier level
                return TIER_LEVEL[state.currentTier] >= TIER_LEVEL[requiredTier];
            },

            isPremium: () => {
                const state = get();
                if (!state.paywallEnabled) return true;
                return TIER_LEVEL[state.currentTier] >= TIER_LEVEL.paechter;
            },

            isEnterprise: () => {
                const state = get();
                if (!state.paywallEnabled) return true;
                return state.currentTier === 'forst';
            },
        }),
        {
            name: 'jagd-subscription',
        }
    )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Check if user has access to a specific feature
 */
export function useFeatureAccess(feature: PremiumFeature): boolean {
    const { hasAccess, paywallEnabled } = useSubscriptionStore();

    if (!paywallEnabled) return true;

    const requiredTier = getRequiredTier(feature);
    return hasAccess(requiredTier);
}

/**
 * Get current subscription info
 */
export function useSubscription() {
    const store = useSubscriptionStore();
    const plan = SUBSCRIPTION_PLANS[store.currentTier];

    return {
        tier: store.currentTier,
        plan,
        paywallEnabled: store.paywallEnabled,
        isPremium: store.isPremium(),
        isEnterprise: store.isEnterprise(),
        startDate: store.subscriptionStartDate,
        endDate: store.subscriptionEndDate,
    };
}
