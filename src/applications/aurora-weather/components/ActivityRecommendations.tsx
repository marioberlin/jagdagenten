// React is auto-imported in JSX runtime;
import { Activity, Mountain, Bike, UtensilsCrossed, Coffee, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { ActivityRecommendation } from '@/services/a2a/AuroraWeatherService';

export function ActivityRecommendations({ recommendations }: { recommendations: ActivityRecommendation[] }) {
    if (!recommendations || recommendations.length === 0) return null;

    const getCategoryIcon = (category: ActivityRecommendation['category']) => {
        switch (category) {
            case 'outdoor': return Mountain;
            case 'exercise': return Bike;
            case 'social': return UtensilsCrossed;
            case 'indoor': return Coffee;
            case 'relaxation': return Star;
            default: return Activity;
        }
    };

    const getSuitabilityColor = (suitability: ActivityRecommendation['suitability']) => {
        switch (suitability) {
            case 'perfect': return 'text-green-400 bg-green-500/20';
            case 'good': return 'text-blue-400 bg-blue-500/20';
            case 'okay': return 'text-yellow-400 bg-yellow-500/20';
            case 'poor': return 'text-red-400 bg-red-500/20';
        }
    };

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-green-400" />
                <h3 className="text-sm font-semibold text-primary">Activity Suggestions</h3>
            </div>
            <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec) => {
                    const Icon = getCategoryIcon(rec.category);
                    return (
                        <div
                            key={rec.id}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-white/10">
                                    <Icon size={16} className="text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-medium text-primary">{rec.activity}</h4>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                                            getSuitabilityColor(rec.suitability)
                                        )}>
                                            {rec.suitability}
                                        </span>
                                    </div>
                                    <p className="text-xs text-secondary">{rec.reason}</p>
                                    {rec.timeWindow && (
                                        <p className="text-[10px] text-accent-primary mt-1">{rec.timeWindow}</p>
                                    )}
                                    {rec.tips && rec.tips.length > 0 && (
                                        <p className="text-[10px] text-tertiary mt-1">
                                            Tip: {rec.tips[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
}
