/**
 * AboutLiquidOSDialog
 * 
 * Modal dialog showing comprehensive information about LiquidOS services.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { X, ChevronDown, ChevronRight, Activity, AlertCircle, ExternalLink } from 'lucide-react';
import { SERVICE_DESCRIPTIONS, type ServiceDescription } from '@/data/serviceDescriptions';
import { useServiceHealth, type ServiceHealthStatus } from '@/hooks/useServiceHealth';

interface AboutLiquidOSDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutLiquidOSDialog: React.FC<AboutLiquidOSDialogProps> = ({ isOpen, onClose }) => {
    const { services: healthStatus, refresh } = useServiceHealth();
    const [expandedService, setExpandedService] = useState<string | null>(null);

    const displayOrder = ['liquid-runtime', 'backend', 'postgres', 'redis', 'frontend', 'ai-core', 'network', 'system'];
    const orderedServices = displayOrder
        .map(id => SERVICE_DESCRIPTIONS[id])
        .filter(Boolean);

    const getHealthStatus = (serviceId: string): ServiceHealthStatus['status'] => {
        return healthStatus[serviceId]?.status || 'unknown';
    };

    const statusColors: Record<ServiceHealthStatus['status'], string> = {
        healthy: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
        unhealthy: 'text-red-400 bg-red-500/20 border-red-500/30',
        unknown: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
        checking: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
        recovering: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <span className="bg-gradient-to-br from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                            Liquid OS
                                        </span>
                                        <span className="text-sm font-mono text-white/40">v2.0</span>
                                    </h2>
                                    <p className="text-white/50 text-sm mt-1">
                                        Agentic Enterprise Operating System
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* Services List */}
                            <div className="overflow-y-auto max-h-[calc(80vh-160px)] p-4">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-xs uppercase tracking-wider text-white/40 font-medium">
                                        System Services
                                    </h3>
                                    <button
                                        onClick={refresh}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                                    >
                                        <Activity size={12} />
                                        Refresh Status
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {orderedServices.map(service => (
                                        <ServiceRow
                                            key={service.id}
                                            service={service}
                                            isExpanded={expandedService === service.id}
                                            onToggle={() => setExpandedService(
                                                expandedService === service.id ? null : service.id
                                            )}
                                            healthStatus={getHealthStatus(service.id)}
                                            statusColors={statusColors}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                <div className="text-xs text-white/30">
                                    Built with ❤️ for agentic workflows
                                </div>
                                <div className="text-xs text-white/30 font-mono">
                                    {new Date().getFullYear()} © Liquid Glass UI
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface ServiceRowProps {
    service: ServiceDescription;
    isExpanded: boolean;
    onToggle: () => void;
    healthStatus: ServiceHealthStatus['status'];
    statusColors: Record<ServiceHealthStatus['status'], string>;
}

const ServiceRow: React.FC<ServiceRowProps> = ({
    service,
    isExpanded,
    onToggle,
    healthStatus,
    statusColors,
}) => {
    return (
        <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown size={16} className="text-white/40" />
                    ) : (
                        <ChevronRight size={16} className="text-white/40" />
                    )}
                    <div>
                        <div className="text-white font-medium text-sm">{service.name}</div>
                        <div className="text-white/40 text-xs">{service.description}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {service.port && (
                        <div className="flex items-center gap-1 text-xs text-white/40">
                            <ExternalLink size={10} />
                            <span className="font-mono">:{service.port}</span>
                        </div>
                    )}
                    <div className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
                        statusColors[healthStatus]
                    )}>
                        {healthStatus === 'checking' ? (
                            <Activity size={10} className="animate-pulse" />
                        ) : healthStatus === 'unhealthy' ? (
                            <AlertCircle size={10} />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                        {healthStatus === 'healthy' ? 'Online' :
                            healthStatus === 'unhealthy' ? 'Offline' :
                                healthStatus === 'checking' ? 'Checking...' :
                                    healthStatus === 'recovering' ? 'Recovering...' : 'Unknown'}
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-white/5">
                            {/* Purpose */}
                            <p className="text-white/60 text-sm leading-relaxed mt-3 mb-4">
                                {service.purpose}
                            </p>

                            {/* Features */}
                            {service.features.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs uppercase tracking-wider text-white/40 font-medium mb-2">
                                        Key Features
                                    </h4>
                                    <div className="grid gap-2">
                                        {service.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                                <div>
                                                    <span className="text-white/80 font-medium">{feature.name}</span>
                                                    <span className="text-white/40"> – {feature.description}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Endpoints */}
                            {service.endpoints && service.endpoints.length > 0 && (
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-white/40 font-medium mb-2">
                                        API Endpoints
                                    </h4>
                                    <div className="bg-black/30 rounded-lg p-3 grid gap-1.5">
                                        {service.endpoints.map((endpoint, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                <span className={cn(
                                                    'font-mono px-1.5 py-0.5 rounded text-[10px] font-medium',
                                                    endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                                                            endpoint.method === 'PUT' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-red-500/20 text-red-400'
                                                )}>
                                                    {endpoint.method}
                                                </span>
                                                <span className="text-white/60 font-mono">{endpoint.path}</span>
                                                <span className="text-white/30 flex-1 truncate">– {endpoint.purpose}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AboutLiquidOSDialog;
