import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { GlassInput } from '../forms/GlassInput';
import { GlassBadge } from '../data-display/GlassBadge';
import { GlassCard } from '../data-display/GlassCard';
import { GlassSlider } from '../forms/GlassSlider';
import { GlassSwitch } from '../forms/GlassSwitch';
import { cn } from '@/utils/cn';

// Schema types for dynamic UI generation
type UINodeType = 'container' | 'stack' | 'grid' | 'text' | 'button' | 'input' | 'badge' | 'card' | 'divider' | 'slider' | 'toggle' | 'checkbox';

interface UINode {
    type: UINodeType;
    id?: string;
    props?: Record<string, unknown>;
    children?: UINode[] | string;
    style?: React.CSSProperties;
}

interface GlassDynamicUIProps extends React.HTMLAttributes<HTMLDivElement> {
    /** JSON schema defining the UI structure */
    schema: UINode;
    /** Callback when an action is triggered (e.g., button click) */
    onAction?: (actionId: string, data?: unknown) => void;
}

export const GlassDynamicUI = React.forwardRef<HTMLDivElement, GlassDynamicUIProps>(
    ({ className, schema, onAction, ...props }, ref) => {

        const renderNode = (node: UINode, key?: string | number): React.ReactNode => {
            const { type, id, props: nodeProps = {}, children, style } = node;

            switch (type) {
                case 'container':
                    return (
                        <GlassContainer
                            key={key}
                            className={cn('p-4', nodeProps.className as string)}
                            style={style}
                            material={nodeProps.material as 'thin' | 'regular' | 'thick' | undefined}
                        >
                            {Array.isArray(children)
                                ? children.map((child, i) => renderNode(child, i))
                                : children
                            }
                        </GlassContainer>
                    );

                case 'stack':
                    return (
                        <div
                            key={key}
                            className={cn(
                                'flex',
                                nodeProps.direction === 'horizontal' ? 'flex-row items-start' : 'flex-col',
                                nodeProps.className as string
                            )}
                            style={{
                                ...style,
                                gap: `${(nodeProps.gap as number) || 4}px`,
                            }}
                        >
                            {Array.isArray(children)
                                ? children.map((child, i) => renderNode(child, i))
                                : children
                            }
                        </div>
                    );

                case 'grid':
                    return (
                        <div
                            key={key}
                            className={cn(
                                'grid',
                                `grid-cols-${nodeProps.cols || 2}`,
                                `gap-${nodeProps.gap || 4}`,
                                nodeProps.className as string
                            )}
                            style={style}
                        >
                            {Array.isArray(children)
                                ? children.map((child, i) => renderNode(child, i))
                                : children
                            }
                        </div>
                    );

                case 'text': {
                    const TextTag = (nodeProps.variant as 'h1' | 'h2' | 'h3' | 'p') || 'p';
                    return (
                        <TextTag
                            key={key}
                            className={cn(
                                nodeProps.variant === 'h1' && 'text-2xl font-bold text-primary',
                                nodeProps.variant === 'h2' && 'text-xl font-semibold text-primary',
                                nodeProps.variant === 'h3' && 'text-lg font-medium text-primary',
                                !nodeProps.variant && 'text-base text-secondary',
                                nodeProps.className as string
                            )}
                            style={style}
                        >
                            {children as string}
                        </TextTag>
                    );
                }

                case 'button':
                    return (
                        <GlassButton
                            key={key}
                            variant={nodeProps.variant as 'primary' | 'secondary' | 'ghost'}
                            size={nodeProps.size as 'sm' | 'md' | 'lg'}
                            onClick={() => id && onAction?.(id, nodeProps.data)}
                            style={style}
                        >
                            {children as string}
                        </GlassButton>
                    );

                case 'input':
                    return (
                        <GlassInput
                            key={key}
                            placeholder={nodeProps.placeholder as string}
                            type={nodeProps.inputType as string}
                            style={style}
                        />
                    );

                case 'badge':
                    return (
                        <GlassBadge
                            key={key}
                            variant={nodeProps.variant as 'glass'}
                            style={style}
                        >
                            {children as string}
                        </GlassBadge>
                    );

                case 'card':
                    return (
                        <GlassCard
                            key={key}
                            className={cn(
                                'rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10',
                                nodeProps.className as string
                            )}
                            style={style}
                        >
                            {Array.isArray(children)
                                ? children.map((child, i) => renderNode(child, i))
                                : children
                            }
                        </GlassCard>
                    );

                case 'divider':
                    return (
                        <div
                            key={key}
                            className="border-t border-glass-border my-4"
                            style={style}
                        />
                    );

                case 'slider':
                    return (
                        <div key={key} className={cn("w-full", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassSlider
                                defaultValue={typeof nodeProps.value === 'number' ? nodeProps.value : 50}
                                max={(nodeProps.max as number) || 100}
                                step={(nodeProps.step as number) || 1}
                                onValueChange={(val) => id && onAction?.(id, val)}
                            />
                        </div>
                    );

                case 'toggle':
                    return (
                        <div key={key} className={cn("flex items-center gap-2", nodeProps.className as string)} style={style}>
                            <GlassSwitch
                                checked={nodeProps.checked as boolean}
                                onCheckedChange={(checked) => id && onAction?.(id, checked)}
                            />
                            {(nodeProps.label as string) && <span className="text-sm text-primary">{nodeProps.label as string}</span>}
                        </div>
                    );

                default:
                    console.warn(`Unknown node type: ${type}`);
                    return null;
            }
        };

        return (
            <div ref={ref} className={cn('glass-dynamic-ui', className)} {...props}>
                {renderNode(schema)}
            </div>
        );
    }
);

GlassDynamicUI.displayName = 'GlassDynamicUI';

// Export types for consumers
export type { UINode, UINodeType, GlassDynamicUIProps };
