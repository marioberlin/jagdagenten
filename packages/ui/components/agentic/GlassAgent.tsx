import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassMaterial } from '@/components/types';
import { cn } from '@/utils/cn';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'replying' | 'error';

interface GlassAgentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Current state of the agent */
    state?: AgentState;
    /** Size of the agent orb */
    size?: 'sm' | 'md' | 'lg';
    /** Glass material intensity */
    material?: GlassMaterial;
    /** Visual style variant */
    variant?: 'orb' | 'flux';
    /** Optional label text */
    label?: string;
}

const stateConfig: Record<AgentState, { color: string; pulse: boolean; label: string }> = {
    idle: { color: 'from-slate-400/40 to-slate-600/40', pulse: false, label: 'Ready' },
    listening: { color: 'from-blue-400/60 to-cyan-400/60', pulse: true, label: 'Listening...' },
    thinking: { color: 'from-purple-500/60 to-indigo-500/60', pulse: true, label: 'Thinking...' },
    replying: { color: 'from-green-400/60 to-emerald-400/60', pulse: true, label: 'Responding...' },
    error: { color: 'from-red-500/60 to-orange-500/60', pulse: false, label: 'Error' },
};

const sizeConfig = {
    sm: { orb: 'w-12 h-12', wrapper: 'p-3', text: 'text-xs' },
    md: { orb: 'w-20 h-20', wrapper: 'p-4', text: 'text-sm' },
    lg: { orb: 'w-28 h-28', wrapper: 'p-5', text: 'text-base' },
};

export const GlassAgent = React.forwardRef<HTMLDivElement, GlassAgentProps>(
    ({ className, state = 'idle', size = 'md', material = 'regular', variant = 'orb', label, ...props }, ref) => {
        const config = stateConfig[state];
        const sizes = sizeConfig[size];

        return (
            <GlassContainer
                ref={ref}
                material={material}
                className={cn(
                    'flex flex-col items-center justify-center gap-3',
                    sizes.wrapper,
                    className
                )}
                {...props}
            >
                {/* Visual Representation */}
                <div className="relative flex items-center justify-center">
                    {/* FLUX VARIANT (Organic Blob) */}
                    {variant === 'flux' && (
                        <div className={cn('flux-agent-container relative', sizes.orb)}>
                            {/* Outer Glow Layer - Large diffuse glow */}
                            <div
                                className={cn(
                                    'flux-glow absolute inset-0 blur-3xl opacity-60 transition-all duration-700',
                                    state === 'idle' && 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
                                    state === 'listening' && 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
                                    state === 'thinking' && 'bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500',
                                    state === 'replying' && 'bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400',
                                    state === 'error' && 'bg-gradient-to-br from-red-500 via-orange-500 to-rose-500',
                                    config.pulse && 'animate-pulse-glow'
                                )}
                                style={{
                                    transform: 'scale(1.8)',
                                    borderRadius: '60% 40% 50% 50% / 50% 60% 40% 50%'
                                }}
                            />

                            {/* Mid Glow Layer - Secondary glow with offset */}
                            <div
                                className={cn(
                                    'flux-mid-glow absolute inset-0 blur-xl opacity-70 transition-all duration-500',
                                    state === 'idle' && 'bg-gradient-to-tr from-slate-300 to-slate-500',
                                    state === 'listening' && 'bg-gradient-to-tr from-cyan-300 to-blue-500',
                                    state === 'thinking' && 'bg-gradient-to-tr from-violet-400 to-purple-600',
                                    state === 'replying' && 'bg-gradient-to-tr from-green-300 to-emerald-500',
                                    state === 'error' && 'bg-gradient-to-tr from-orange-400 to-red-600'
                                )}
                                style={{
                                    transform: 'scale(1.4) translateX(-5%)',
                                    borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
                                    animation: 'flux-morph-alt 6s ease-in-out infinite'
                                }}
                            />

                            {/* Core Blob - The main morphing shape */}
                            <div
                                className={cn(
                                    'flux-core absolute inset-0 transition-all duration-500',
                                    state === 'idle' && 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600',
                                    state === 'listening' && 'bg-gradient-to-br from-cyan-200 via-blue-400 to-indigo-500',
                                    state === 'thinking' && 'bg-gradient-to-br from-violet-300 via-purple-500 to-indigo-600',
                                    state === 'replying' && 'bg-gradient-to-br from-emerald-200 via-green-400 to-teal-500',
                                    state === 'error' && 'bg-gradient-to-br from-orange-300 via-red-500 to-rose-600',
                                    state === 'thinking' && 'animate-spin-slow'
                                )}
                                style={{
                                    animation: state === 'listening' ? 'flux-morph 2s ease-in-out infinite' : 'flux-morph 4s ease-in-out infinite',
                                    boxShadow: 'inset 0 0 30px rgba(255,255,255,0.3), inset 0 0 60px rgba(255,255,255,0.1)'
                                }}
                            />

                            {/* Inner Highlight - Glass-like inner reflection */}
                            <div
                                className="flux-inner absolute inset-3 bg-gradient-to-br from-white/40 via-white/10 to-transparent backdrop-blur-sm"
                                style={{
                                    borderRadius: '50% 50% 45% 55% / 55% 45% 50% 50%',
                                    animation: 'flux-morph-inner 5s ease-in-out infinite'
                                }}
                            />

                            {/* Core Light - Central bright point */}
                            <div
                                className={cn(
                                    'flux-light absolute top-1/4 left-1/4 w-1/4 h-1/4 rounded-full bg-white/80 blur-sm',
                                    config.pulse && 'animate-ping'
                                )}
                            />

                            {/* Thinking Ring Overlay */}
                            {state === 'thinking' && (
                                <div
                                    className="absolute inset-0 border-2 border-white/40 animate-spin-reverse"
                                    style={{
                                        borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%',
                                        borderStyle: 'dashed'
                                    }}
                                />
                            )}

                            {/* Listening Pulse Rings */}
                            {state === 'listening' && (
                                <>
                                    <div className="absolute inset-0 border-2 border-cyan-400/50 animate-ping-slow" style={{ borderRadius: '50%' }} />
                                    <div className="absolute -inset-3 border border-blue-400/30 animate-ping-slower" style={{ borderRadius: '50%' }} />
                                </>
                            )}
                        </div>
                    )}

                    {/* ORB VARIANT (Default) */}
                    {variant === 'orb' && (
                        <>
                            {/* Animated glow background */}
                            <div
                                className={cn(
                                    'absolute inset-0 rounded-full blur-xl transition-all duration-700',
                                    `bg-gradient-to-br ${config.color}`,
                                    config.pulse && 'animate-pulse'
                                )}
                                style={{ transform: 'scale(1.5)' }}
                            />

                            {/* Main orb */}
                            <div
                                className={cn(
                                    'relative rounded-full flex items-center justify-center',
                                    'bg-gradient-to-br shadow-glass-lg border border-white/20',
                                    'transition-all duration-500 ease-out',
                                    config.color,
                                    sizes.orb,
                                    state === 'thinking' && 'animate-spin-slow'
                                )}
                            >
                                {/* Inner highlight */}
                                <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm" />

                                {/* Core light */}
                                <div
                                    className={cn(
                                        'w-1/3 h-1/3 rounded-full bg-white/60 blur-sm',
                                        config.pulse && 'animate-ping'
                                    )}
                                />
                            </div>

                            {/* Listening rings - Only for Orb */}
                            {state === 'listening' && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping-slow" />
                                    <div className="absolute -inset-2 rounded-full border border-cyan-400/20 animate-ping-slower" />
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Status label */}
                <div
                    className={cn(
                        'font-medium text-secondary tracking-wide text-center',
                        sizes.text,
                        config.pulse && 'animate-pulse'
                    )}
                >
                    {label || config.label}
                </div>

                {/* Inline styles for custom animations */}
                <style>{`
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes spin-reverse {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    @keyframes ping-slow {
                        0% { transform: scale(1); opacity: 0.5; }
                        75%, 100% { transform: scale(1.6); opacity: 0; }
                    }
                    @keyframes ping-slower {
                        0% { transform: scale(1); opacity: 0.3; }
                        75%, 100% { transform: scale(2.2); opacity: 0; }
                    }
                    @keyframes flux-morph {
                        0%, 100% { 
                            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                        }
                        25% { 
                            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
                        }
                        50% { 
                            border-radius: 50% 60% 30% 60% / 40% 30% 70% 50%;
                        }
                        75% {
                            border-radius: 40% 50% 60% 50% / 60% 50% 40% 60%;
                        }
                    }
                    @keyframes flux-morph-alt {
                        0%, 100% { 
                            border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%;
                            transform: scale(1.4) translateX(-5%) rotate(0deg);
                        }
                        50% { 
                            border-radius: 55% 45% 40% 60% / 45% 55% 45% 55%;
                            transform: scale(1.5) translateX(5%) rotate(180deg);
                        }
                    }
                    @keyframes flux-morph-inner {
                        0%, 100% { 
                            border-radius: 50% 50% 45% 55% / 55% 45% 50% 50%;
                            transform: scale(1);
                        }
                        50% { 
                            border-radius: 45% 55% 50% 50% / 50% 50% 55% 45%;
                            transform: scale(0.95);
                        }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.5; transform: scale(1.8); }
                        50% { opacity: 0.8; transform: scale(2); }
                    }
                    .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                    .animate-spin-reverse { animation: spin-reverse 4s linear infinite; }
                    .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
                    .animate-ping-slower { animation: ping-slower 2.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
                    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
                `}</style>
            </GlassContainer>
        );
    }
);

GlassAgent.displayName = 'GlassAgent';
