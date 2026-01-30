/**
 * Subscription Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSubscriptionStore, SUBSCRIPTION_PLANS, getRequiredTier } from '../subscriptionStore';

describe('subscriptionStore', () => {
    beforeEach(() => {
        // Reset store to defaults
        useSubscriptionStore.setState({
            currentTier: 'beater',
            paywallEnabled: false,
            subscriptionStartDate: null,
            subscriptionEndDate: null,
        });
    });

    describe('initial state', () => {
        it('starts with beater tier', () => {
            const state = useSubscriptionStore.getState();
            expect(state.currentTier).toBe('beater');
        });

        it('starts with paywall disabled', () => {
            const state = useSubscriptionStore.getState();
            expect(state.paywallEnabled).toBe(false);
        });
    });

    describe('setTier', () => {
        it('changes current tier', () => {
            const { setTier } = useSubscriptionStore.getState();
            setTier('paechter');
            expect(useSubscriptionStore.getState().currentTier).toBe('paechter');
        });
    });

    describe('upgradeTo', () => {
        it('upgrades tier and sets dates', () => {
            const { upgradeTo } = useSubscriptionStore.getState();
            upgradeTo('forst');

            const state = useSubscriptionStore.getState();
            expect(state.currentTier).toBe('forst');
            expect(state.subscriptionStartDate).toBeTruthy();
            expect(state.subscriptionEndDate).toBeTruthy();
        });

        it('sets end date 1 year from start', () => {
            const { upgradeTo } = useSubscriptionStore.getState();
            upgradeTo('paechter');

            const state = useSubscriptionStore.getState();
            const start = new Date(state.subscriptionStartDate!);
            const end = new Date(state.subscriptionEndDate!);

            const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            expect(diffDays).toBeGreaterThanOrEqual(364);
            expect(diffDays).toBeLessThanOrEqual(366);
        });
    });

    describe('downgrade', () => {
        it('resets to beater tier', () => {
            const { upgradeTo, downgrade } = useSubscriptionStore.getState();
            upgradeTo('forst');
            downgrade();

            const state = useSubscriptionStore.getState();
            expect(state.currentTier).toBe('beater');
            expect(state.subscriptionStartDate).toBeNull();
            expect(state.subscriptionEndDate).toBeNull();
        });
    });

    describe('hasAccess', () => {
        it('grants all access when paywall disabled', () => {
            const { hasAccess } = useSubscriptionStore.getState();
            expect(hasAccess('forst')).toBe(true);
        });

        it('restricts access when paywall enabled', () => {
            const { setPaywallEnabled, hasAccess } = useSubscriptionStore.getState();
            setPaywallEnabled(true);

            expect(useSubscriptionStore.getState().hasAccess('paechter')).toBe(false);
            expect(useSubscriptionStore.getState().hasAccess('beater')).toBe(true);
        });

        it('grants access for current or lower tiers', () => {
            const { setPaywallEnabled, setTier, hasAccess } = useSubscriptionStore.getState();
            setPaywallEnabled(true);
            setTier('paechter');

            const state = useSubscriptionStore.getState();
            expect(state.hasAccess('beater')).toBe(true);
            expect(state.hasAccess('paechter')).toBe(true);
            expect(state.hasAccess('forst')).toBe(false);
        });
    });

    describe('isPremium', () => {
        it('returns true when paywall disabled', () => {
            const state = useSubscriptionStore.getState();
            expect(state.isPremium()).toBe(true);
        });

        it('returns false for beater when paywall enabled', () => {
            const { setPaywallEnabled } = useSubscriptionStore.getState();
            setPaywallEnabled(true);

            expect(useSubscriptionStore.getState().isPremium()).toBe(false);
        });

        it('returns true for paechter when paywall enabled', () => {
            const { setPaywallEnabled, setTier } = useSubscriptionStore.getState();
            setPaywallEnabled(true);
            setTier('paechter');

            expect(useSubscriptionStore.getState().isPremium()).toBe(true);
        });
    });
});

describe('SUBSCRIPTION_PLANS', () => {
    it('has all tier plans', () => {
        expect(SUBSCRIPTION_PLANS.beater).toBeDefined();
        expect(SUBSCRIPTION_PLANS.paechter).toBeDefined();
        expect(SUBSCRIPTION_PLANS.forst).toBeDefined();
    });

    it('beater is free', () => {
        expect(SUBSCRIPTION_PLANS.beater.price).toBe(0);
    });

    it('paechter costs 49', () => {
        expect(SUBSCRIPTION_PLANS.paechter.price).toBe(49);
    });

    it('forst costs 199', () => {
        expect(SUBSCRIPTION_PLANS.forst.price).toBe(199);
    });
});

describe('getRequiredTier', () => {
    it('returns correct tier for premium features', () => {
        expect(getRequiredTier('scout_recommendations')).toBe('paechter');
        expect(getRequiredTier('multi_revier')).toBe('forst');
        expect(getRequiredTier('api_access')).toBe('forst');
    });
});
