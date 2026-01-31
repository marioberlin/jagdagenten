/**
 * Subscription Settings Panel
 *
 * Settings UI for managing subscription and paywall toggle.
 */


import { Crown, Check, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import {
    useSubscriptionStore,
    SUBSCRIPTION_PLANS,
    type SubscriptionTier,
} from '../stores/subscriptionStore';

export function SubscriptionSettings() {
    const {
        currentTier,
        paywallEnabled,
        setPaywallEnabled,
        upgradeTo,
        subscriptionStartDate,
        subscriptionEndDate,
    } = useSubscriptionStore();

    const currentPlan = SUBSCRIPTION_PLANS[currentTier];

    return (
        <div className="space-y-6">
            {/* Paywall Toggle */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <div>
                            <h4 className="font-medium text-[var(--text-primary)]">
                                Paywall aktivieren
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {paywallEnabled
                                    ? 'Premium-Funktionen sind gesperrt für Nicht-Abonnenten'
                                    : 'Alle Funktionen sind für Tests freigeschaltet'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setPaywallEnabled(!paywallEnabled)}
                        className="text-yellow-400"
                    >
                        {paywallEnabled ? (
                            <ToggleRight className="w-10 h-10" />
                        ) : (
                            <ToggleLeft className="w-10 h-10" />
                        )}
                    </button>
                </div>
            </div>

            {/* Current Plan */}
            <div className="bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        Aktuelles Abo
                    </h3>
                    <div className="flex items-center gap-2 text-amber-400">
                        <Crown className="w-5 h-5" />
                        <span className="font-medium">{currentPlan.nameDE}</span>
                    </div>
                </div>

                {subscriptionStartDate && (
                    <div className="text-sm text-[var(--text-secondary)] mb-4">
                        <p>Gestartet: {new Date(subscriptionStartDate).toLocaleDateString('de-DE')}</p>
                        {subscriptionEndDate && (
                            <p>Läuft bis: {new Date(subscriptionEndDate).toLocaleDateString('de-DE')}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    {currentPlan.featuresDE.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Selector (Mock) */}
            <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                    Abo-Stufe wählen (Mock)
                </h3>
                <div className="grid gap-3">
                    {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]).map((tier) => {
                        const plan = SUBSCRIPTION_PLANS[tier];
                        const isSelected = currentTier === tier;

                        return (
                            <button
                                key={tier}
                                onClick={() => upgradeTo(tier)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected
                                    ? 'border-amber-500 bg-amber-900/20'
                                    : 'border-[var(--glass-border)] hover:border-[var(--glass-surface-active)]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 ${isSelected
                                            ? 'border-amber-500 bg-amber-500'
                                            : 'border-[var(--glass-border)]'
                                            }`}
                                    >
                                        {isSelected && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-[var(--text-primary)]">
                                            {plan.nameDE}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {plan.featuresDE.length} Funktionen
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {plan.price === 0 ? 'Kostenlos' : `€${plan.price}`}
                                    </p>
                                    {plan.price > 0 && (
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            pro Jahr
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
