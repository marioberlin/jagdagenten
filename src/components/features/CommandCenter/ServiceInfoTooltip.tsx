/**
 * ServiceInfoTooltip
 * 
 * Glassmorphic tooltip showing service health status categorized by:
 * 1. Running services (green)
 * 2. Not running - optional (yellow) 
 * 3. Not running - required (red)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Activity, AlertCircle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { ServiceDescription } from '@/data/serviceDescriptions';
import { SERVICE_DESCRIPTIONS } from '@/data/serviceDescriptions';
import type { ServiceHealthStatus } from '@/hooks/useServiceHealth';

interface ServiceInfoTooltipProps {
    service: ServiceDescription;
    isVisible: boolean;
    position?: 'top' | 'bottom';
    healthStatus?: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
    className?: string;
    /** All services health status for System Status tooltip */
    allServices?: Record<string, ServiceHealthStatus>;
}

// Services to show for System Status overlay
const SYSTEM_STATUS_SERVICES = ['backend', 'postgres', 'redis', 'liquid-runtime'];

// Services to show for Runtime overlay  
const RUNTIME_RELATED_SERVICES = ['liquid-runtime'];

export const ServiceInfoTooltip: React.FC<ServiceInfoTooltipProps> = ({
    service,
    isVisible,
    position = 'bottom',
    healthStatus = 'unknown',
    className,
    allServices,
}) => {
    const statusColors = {
        healthy: 'text-emerald-400 bg-emerald-500/20',
        unhealthy: 'text-red-400 bg-red-500/20',
        unknown: 'text-gray-400 bg-gray-500/20',
        checking: 'text-blue-400 bg-blue-500/20',
    };

    const statusLabels = {
        healthy: 'Online',
        unhealthy: 'Offline',
        unknown: 'Unknown',
        checking: 'Checking...',
    };

    // Determine which services to show based on service type
    const isSystemStatus = service.id === 'system';
    const isRuntime = service.id === 'liquid-runtime';
    const showServiceList = isSystemStatus || isRuntime;
    const serviceIds = isSystemStatus ? SYSTEM_STATUS_SERVICES : isRuntime ? RUNTIME_RELATED_SERVICES : [];

    // Categorize services
    const categorizeServices = () => {
        const running: { id: string; name: string; required: boolean }[] = [];
        const notRunningOptional: { id: string; name: string }[] = [];
        const notRunningRequired: { id: string; name: string }[] = [];

        serviceIds.forEach(id => {
            const serviceDesc = SERVICE_DESCRIPTIONS[id];
            const serviceHealth = allServices?.[id];
            const isRunning = serviceHealth?.status === 'healthy';
            const isRequired = serviceDesc?.required ?? false;

            if (isRunning) {
                running.push({ id, name: serviceDesc?.shortName || id, required: isRequired });
            } else if (isRequired) {
                notRunningRequired.push({ id, name: serviceDesc?.shortName || id });
            } else {
                notRunningOptional.push({ id, name: serviceDesc?.shortName || id });
            }
        });

        return { running, notRunningOptional, notRunningRequired };
    };

    const { running, notRunningOptional, notRunningRequired } = categorizeServices();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: position === 'bottom' ? -8 : 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: position === 'bottom' ? -8 : 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className={cn(
                        'absolute z-[100] w-[320px] pointer-events-none',
                        position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
                        'left-1/2 -translate-x-1/2',
                        className
                    )}
                >
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-white font-semibold text-sm">{service.name}</h3>
                                <p className="text-white/50 text-xs mt-0.5">{service.description}</p>
                            </div>
                            <div className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                                statusColors[healthStatus]
                            )}>
                                {healthStatus === 'checking' ? (
                                    <Activity size={10} className="animate-pulse" />
                                ) : healthStatus === 'unhealthy' ? (
                                    <AlertCircle size={10} />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                )}
                                {statusLabels[healthStatus]}
                            </div>
                        </div>

                        {/* Service Status List (for System Status and Runtime) */}
                        {showServiceList && allServices && (
                            <div className="space-y-3 mb-3">
                                {/* Running Services */}
                                {running.length > 0 && (
                                    <div>
                                        <h4 className="text-emerald-400/80 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <CheckCircle size={10} />
                                            Running
                                        </h4>
                                        <div className="space-y-1">
                                            {running.map(s => (
                                                <div key={s.id} className="flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    <span className="text-white/80">{s.name}</span>
                                                    {s.required && (
                                                        <span className="text-[9px] text-white/30 bg-white/5 px-1 rounded">required</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Not Running - Optional */}
                                {notRunningOptional.length > 0 && (
                                    <div>
                                        <h4 className="text-yellow-400/80 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <MinusCircle size={10} />
                                            Not Running (Optional)
                                        </h4>
                                        <div className="space-y-1">
                                            {notRunningOptional.map(s => (
                                                <div key={s.id} className="flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                                    <span className="text-white/60">{s.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Not Running - Required */}
                                {notRunningRequired.length > 0 && (
                                    <div>
                                        <h4 className="text-red-400/80 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <XCircle size={10} />
                                            Not Running (Required)
                                        </h4>
                                        <div className="space-y-1">
                                            {notRunningRequired.map(s => (
                                                <div key={s.id} className="flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                    <span className="text-white/60">{s.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show message if no services to track */}
                                {running.length === 0 && notRunningOptional.length === 0 && notRunningRequired.length === 0 && (
                                    <div className="text-white/40 text-xs text-center py-2">
                                        No services configured
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Purpose (only show for non-system-status services) */}
                        {!showServiceList && (
                            <p className="text-white/70 text-xs leading-relaxed mb-3">
                                {service.purpose}
                            </p>
                        )}

                        {/* Features (only show for non-system/runtime services) */}
                        {!showServiceList && service.features.length > 0 && (
                            <div className="border-t border-white/10 pt-3">
                                <h4 className="text-white/50 text-[10px] uppercase tracking-wider mb-2">Key Features</h4>
                                <div className="space-y-1.5">
                                    {service.features.slice(0, 4).map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                            <div>
                                                <span className="text-white/80 text-xs font-medium">{feature.name}</span>
                                                <span className="text-white/40 text-xs"> – {feature.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ServiceInfoTooltip;
