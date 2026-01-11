/**
 * GlassSmartModal
 * 
 * A generative modal/dialog component for user interactions.
 * Listens for the 'generate_modal' tool.
 */

import { LiquidSmartComponent } from '../../liquid-engine/react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';

interface ModalAction {
    id: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
    onClick?: string; // Action ID to emit
}

export function GlassSmartModal() {
    return (
        <LiquidSmartComponent
            name="generate_modal"
            render={({ status, args }) => {
                const isLoading = status === 'running';

                const title = args.title || args.heading || 'Modal';
                const body = args.body || args.content || '';
                const size = args.size || 'md'; // 'sm' | 'md' | 'lg' | 'xl' | 'full'
                const closable = args.closable !== false;
                const actions: ModalAction[] = args.actions || args.buttons || [
                    { id: 'cancel', label: 'Cancel', variant: 'ghost' },
                    { id: 'confirm', label: 'Confirm', variant: 'primary' },
                ];

                const sizeStyles = {
                    sm: 'max-w-sm',
                    md: 'max-w-md',
                    lg: 'max-w-lg',
                    xl: 'max-w-xl',
                    full: 'max-w-4xl',
                };

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <GlassContainer
                            className={cn(
                                'relative w-full mx-4 p-6 shadow-2xl',
                                sizeStyles[size as keyof typeof sizeStyles],
                                'animate-in fade-in zoom-in-95 duration-200'
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    {isLoading && !title ? (
                                        <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
                                    ) : (
                                        <h2 className="text-xl font-semibold text-white">
                                            {title}
                                        </h2>
                                    )}
                                    {args.subtitle && (
                                        <p className="text-sm text-secondary mt-1">
                                            {args.subtitle}
                                        </p>
                                    )}
                                </div>

                                {closable && (
                                    <button
                                        className="p-1 rounded-lg text-secondary hover:text-white hover:bg-white/10 transition-colors"
                                        onClick={() => { /* Close handler */ }}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="mb-6">
                                {isLoading && !body ? (
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                                        <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                                        <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                                    </div>
                                ) : (
                                    <div className="text-secondary">
                                        {body}
                                        {args.form && (
                                            <div className="mt-4 p-4 bg-white/5 rounded-lg">
                                                <p className="text-xs text-secondary/60 mb-2">Form fields would render here</p>
                                                {args.form.fields?.map((_field: string, i: number) => (
                                                    <div key={i} className="h-10 bg-white/10 rounded mb-2" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer / Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
                                {actions.map((action) => (
                                    <GlassButton
                                        key={action.id}
                                        variant={action.variant || 'ghost'}
                                        size="sm"
                                        onClick={() => { /* Action handler */ }}
                                    >
                                        {action.label}
                                    </GlassButton>
                                ))}
                            </div>

                            {/* Loading overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 bg-glass-surface/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm text-secondary">Generating...</span>
                                    </div>
                                </div>
                            )}
                        </GlassContainer>
                    </div>
                );
            }}
        />
    );
}
