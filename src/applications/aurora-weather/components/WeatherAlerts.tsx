import { useState } from 'react';
import { Bell, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import { WeatherAlert } from '@/services/a2a/AuroraWeatherService';

export function WeatherAlerts({ alerts }: { alerts: WeatherAlert[] }) {
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

    if (alerts.length === 0) return null;

    const getAlertStyles = (type: WeatherAlert['type']) => {
        switch (type) {
            case 'extreme':
                return {
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/50',
                    icon: 'text-red-400',
                    badge: 'bg-red-500 text-white'
                };
            case 'severe':
                return {
                    bg: 'bg-orange-500/20',
                    border: 'border-orange-500/50',
                    icon: 'text-orange-400',
                    badge: 'bg-orange-500 text-white'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500/20',
                    border: 'border-yellow-500/50',
                    icon: 'text-yellow-400',
                    badge: 'bg-yellow-500 text-black'
                };
            case 'watch':
            case 'advisory':
                return {
                    bg: 'bg-blue-500/15',
                    border: 'border-blue-500/40',
                    icon: 'text-blue-400',
                    badge: 'bg-blue-500 text-white'
                };
            default:
                return {
                    bg: 'bg-white/10',
                    border: 'border-white/20',
                    icon: 'text-gray-400',
                    badge: 'bg-gray-500 text-white'
                };
        }
    };

    const formatExpiry = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Expires soon';
        if (diffHours < 24) return `Expires in ${diffHours}h`;
        return `Expires ${date.toLocaleDateString()}`;
    };

    return (
        <GlassContainer className="p-4 rounded-xl" border material="thin">
            <div className="flex items-center gap-2 mb-3">
                <Bell size={18} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-primary">Weather Alerts</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                    {alerts.length} active
                </span>
            </div>
            <div className="space-y-2">
                {alerts.map((alert) => {
                    const styles = getAlertStyles(alert.type);
                    const isExpanded = expandedAlert === alert.id;

                    return (
                        <div
                            key={alert.id}
                            className={cn(
                                "rounded-lg border transition-all cursor-pointer",
                                styles.bg,
                                styles.border
                            )}
                            onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        >
                            <div className="p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={18} className={cn("flex-shrink-0 mt-0.5", styles.icon)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", styles.badge)}>
                                                {alert.type}
                                            </span>
                                            <span className="text-xs text-secondary">{formatExpiry(alert.expires)}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-primary truncate">
                                            {alert.event}
                                        </h4>
                                        <p className={cn(
                                            "text-xs text-secondary mt-1",
                                            !isExpanded && "line-clamp-2"
                                        )}>
                                            {alert.headline}
                                        </p>

                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                {alert.description && (
                                                    <p className="text-xs text-secondary mb-2">
                                                        {alert.description}
                                                    </p>
                                                )}
                                                {alert.instruction && (
                                                    <div className="p-2 rounded bg-white/5">
                                                        <p className="text-xs text-primary font-medium mb-1">What to do:</p>
                                                        <p className="text-xs text-secondary">{alert.instruction}</p>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-tertiary mt-2">
                                                    Source: {alert.sender}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className={cn(
                                            "flex-shrink-0 text-secondary transition-transform",
                                            isExpanded && "rotate-90"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
}
