/**
 * Premium Feature Gate Component
 *
 * Wraps content that requires a premium subscription.
 * Shows upgrade prompt when paywall is enabled and user doesn't have access.
 */

import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import {
    useFeatureAccess,
    useSubscription,
    type PremiumFeature,
    getRequiredTier,
    SUBSCRIPTION_PLANS,
} from '../stores/subscriptionStore';

interface PremiumGateProps {
    feature: PremiumFeature;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showUpgradePrompt?: boolean;
}

export function PremiumGate({
    feature,
    children,
    fallback,
    showUpgradePrompt = true,
}: PremiumGateProps) {
    const hasAccess = useFeatureAccess(feature);
    const { paywallEnabled } = useSubscription();

    // If paywall disabled or user has access, show content
    if (!paywallEnabled || hasAccess) {
        return <>{children}</>;
    }

    // Show fallback or upgrade prompt
    if (fallback) {
        return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
        return <UpgradePrompt feature={feature} />;
    }

    return null;
}

interface UpgradePromptProps {
    feature: PremiumFeature;
    compact?: boolean;
}

export function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
    const requiredTier = getRequiredTier(feature);
    const plan = SUBSCRIPTION_PLANS[requiredTier];

    const featureLabels: Record<PremiumFeature, string> = {
        scout_recommendations: 'Scout-Empfehlungen',
        bureaucracy_automation: 'Behörden-Automatisierung',
        export_packs: 'Export-Pakete',
        pack_events: 'Rudel-Events',
        weekly_explore: 'Weekly Explore',
        waidmann_feed_full: 'Waidmann-Feed',
        gear_health: 'Ausrüstungs-Tracking',
        multi_revier: 'Multi-Revier',
        team_admin: 'Team-Verwaltung',
        api_access: 'API-Zugang',
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm">{plan.nameDE} erforderlich</span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-800/40 rounded-lg">
                    <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {featureLabels[feature]}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Diese Funktion ist Teil des <strong>{plan.nameDE}</strong>-Abonnements.
                    </p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Upgrade auf {plan.nameDE}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                        {plan.price > 0 ? `€${plan.price}/Jahr` : 'Kostenlos'}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Premium Badge - shows when a feature is premium
 */
export function PremiumBadge({ tier = 'paechter' }: { tier?: 'paechter' | 'forst' }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded text-xs font-medium">
            <Crown className="w-3 h-3" />
            {tier === 'forst' ? 'Forst' : 'Premium'}
        </span>
    );
}
