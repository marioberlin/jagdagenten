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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                Paywall aktivieren
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {paywallEnabled
                                    ? 'Premium-Funktionen sind gesperrt für Nicht-Abonnenten'
                                    : 'Alle Funktionen sind für Tests freigeschaltet'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setPaywallEnabled(!paywallEnabled)}
                        className="text-yellow-600 dark:text-yellow-400"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Aktuelles Abo
                    </h3>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Crown className="w-5 h-5" />
                        <span className="font-medium">{currentPlan.nameDE}</span>
                    </div>
                </div>

                {subscriptionStartDate && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <p>Gestartet: {new Date(subscriptionStartDate).toLocaleDateString('de-DE')}</p>
                        {subscriptionEndDate && (
                            <p>Läuft bis: {new Date(subscriptionEndDate).toLocaleDateString('de-DE')}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    {currentPlan.featuresDE.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Selector (Mock) */}
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
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
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 ${isSelected
                                            ? 'border-amber-500 bg-amber-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        {isSelected && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {plan.nameDE}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {plan.featuresDE.length} Funktionen
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {plan.price === 0 ? 'Kostenlos' : `€${plan.price}`}
                                    </p>
                                    {plan.price > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
