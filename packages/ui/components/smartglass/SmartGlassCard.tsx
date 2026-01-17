/**
 * SmartGlassCard
 * 
 * AI-enhanced card component with auto-summarization and smart suggestions.
 */

import React from 'react';
import { GlassCard } from '../data-display/GlassCard';
import { GlassBadge } from '../data-display/GlassBadge';
import { GlassButton } from '../primitives/GlassButton';
import { GlassSkeleton } from '../feedback/GlassSkeleton';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { SmartGlassProps, SmartCardContent } from './types';
import { useSmartCard, formatProcessingTime, getConfidenceVariant } from './useSmartGlass';

// ============================================================================
// Default Loading Component
// ============================================================================

function DefaultLoading() {
    return (
        <GlassCard className="w-full max-w-md">
            <GlassSkeleton className="h-6 w-2/3 mb-4 rounded" />
            <div className="space-y-2">
                <GlassSkeleton className="h-4 w-full rounded" />
                <GlassSkeleton className="h-4 w-4/5 rounded" />
                <GlassSkeleton className="h-4 w-3/4 rounded" />
            </div>
        </GlassCard>
    );
}

// ============================================================================
// Default Error Component
// ============================================================================

function DefaultError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <GlassCard className="w-full max-w-md border-red-500/30">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">Enhancement failed</p>
                    <p className="text-xs text-secondary">{error.message}</p>
                </div>
                <GlassButton variant="outline" size="sm" onClick={onRetry}>
                    Retry
                </GlassButton>
            </div>
        </GlassCard>
    );
}

// ============================================================================
// SmartGlassCard Component
// ============================================================================

export interface SmartGlassCardProps extends SmartGlassProps<SmartCardContent> {
    /** Show processing time badge */
    showMeta?: boolean;
    /** Show enhancement trigger button when not auto-enhanced */
    showTrigger?: boolean;
}

export const SmartGlassCard = React.forwardRef<HTMLDivElement, SmartGlassCardProps>(
    (
        {
            content,
            options = {},
            onEnhance,
            onError,
            loading: LoadingComponent = <DefaultLoading />,
            error: ErrorComponent,
            // enabled = true,
            className,
            showMeta = true,
            showTrigger = true,
        },
        ref
    ) => {
        const {
            result,
            loading,
            error,
            enhance,
            isEnhanced,
        } = useSmartCard(content, options);

        // Handle enhancement completion
        React.useEffect(() => {
            if (result && onEnhance) {
                onEnhance(result);
            }
        }, [result, onEnhance]);

        // Handle error
        React.useEffect(() => {
            if (error && onError) {
                onError(error);
            }
        }, [error, onError]);

        // Show loading state
        if (loading && !isEnhanced) {
            return <>{LoadingComponent}</>;
        }

        // Show error state
        if (error) {
            return (
                ErrorComponent || <DefaultError error={error} onRetry={enhance} />
            );
        }

        const displayContent = result?.enhanced || content;
        const summary = result?.summary;

        return (
            <GlassCard
                ref={ref}
                className={cn('w-full max-w-md', className)}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">{displayContent.title}</h3>
                        {displayContent.tags && displayContent.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {displayContent.tags.map((tag) => (
                                    <GlassBadge key={tag} variant="secondary" size="sm">
                                        {tag}
                                    </GlassBadge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Badge */}
                    {isEnhanced && (
                        <GlassBadge variant="default" size="sm">
                            AI Enhanced
                        </GlassBadge>
                    )}
                </div>

                {/* AI Summary */}
                {summary && (
                    <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium text-primary">Summary</span>
                        </div>
                        <p className="text-sm text-secondary">{summary}</p>
                    </div>
                )}

                {/* Body */}
                <p className="text-secondary text-sm leading-relaxed">
                    {displayContent.body}
                </p>

                {/* Smart Suggestions */}
                {result?.suggestions && result.suggestions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <p className="text-xs font-medium text-secondary mb-2">Suggested Actions</p>
                        <div className="flex flex-wrap gap-2">
                            {result.suggestions.map((suggestion, index) => (
                                <GlassButton
                                    key={index}
                                    size="sm"
                                    variant={suggestion.type === 'primary' ? 'primary' : 'outline'}
                                    onClick={suggestion.action}
                                    className="relative"
                                >
                                    {suggestion.label}
                                    {suggestion.confidence > 0 && (
                                        <span className="absolute -top-2 -right-2 w-4 h-4 text-[10px] rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                            {Math.round(suggestion.confidence * 100)}
                                        </span>
                                    )}
                                </GlassButton>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detected Patterns */}
                {result?.patterns && result.patterns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <p className="text-xs font-medium text-secondary mb-2">Detected Patterns</p>
                        <div className="flex flex-wrap gap-2">
                            {result.patterns.map((pattern, index) => {
                                const badgeVariant = getConfidenceVariant(pattern.confidence) === 'success'
                                    ? 'default'
                                    : getConfidenceVariant(pattern.confidence) === 'warning'
                                        ? 'secondary'
                                        : 'destructive';
                                return (
                                    <GlassBadge key={index} variant={badgeVariant} size="sm">
                                        {pattern.name}
                                    </GlassBadge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {displayContent.footer && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <p className="text-xs text-secondary">{displayContent.footer}</p>
                    </div>
                )}

                {/* Meta Information */}
                {showMeta && result && (
                    <div className="mt-4 pt-3 border-t border-glass-border/50">
                        <div className="flex items-center justify-between text-xs text-white/40">
                            <span>
                                {result.meta.cached ? 'From cache' : 'Fresh analysis'}
                            </span>
                            <span>
                                {formatProcessingTime(result.meta.processingTime)} with {result.meta.modelUsed}
                            </span>
                        </div>
                    </div>
                )}

                {/* Manual Trigger (when not auto-enhanced) */}
                {showTrigger && !isEnhanced && !loading && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={enhance}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Enhance with AI
                        </GlassButton>
                    </div>
                )}
            </GlassCard>
        );
    }
);

SmartGlassCard.displayName = 'SmartGlassCard';

// ============================================================================
// Convenience Component: SmartGlassCardInline
// ============================================================================

export interface SmartGlassCardInlineProps extends Omit<SmartGlassCardProps, 'error'> {
    /** Inline loading state */
    inlineLoading?: boolean;
}

export const SmartGlassCardInline = React.forwardRef<HTMLDivElement, SmartGlassCardInlineProps>(
    (props, ref) => {
        const [inlineLoading, setInlineLoading] = React.useState(false);

        return (
            <SmartGlassCard
                ref={ref}
                {...props}
                loading={
                    props.loading || (inlineLoading && (
                        <GlassContainer className="p-4 flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-secondary">Enhancing...</span>
                        </GlassContainer>
                    ))
                }
                onEnhance={(result) => {
                    setInlineLoading(false);
                    props.onEnhance?.(result);
                }}
            />
        );
    }
);

SmartGlassCardInline.displayName = 'SmartGlassCardInline';
