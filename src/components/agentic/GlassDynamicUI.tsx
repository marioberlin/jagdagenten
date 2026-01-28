import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { GlassInput } from '../forms/GlassInput';
import { GlassBadge } from '../data-display/GlassBadge';
import { GlassCard } from '../data-display/GlassCard';
import { GlassSlider } from '../forms/GlassSlider';
import { GlassSwitch } from '../forms/GlassSwitch';
import { GlassCheckbox } from '../forms/GlassCheckbox';
import { GlassSelect } from '../forms/GlassSelect';
import { GlassTextarea } from '../forms/GlassTextarea';
import { GlassNumberInput } from '../forms/GlassNumberInput';
import { GlassRadioGroup, GlassRadioGroupItem } from '../forms/GlassRadioGroup';
import { GlassDatePicker } from '../forms/GlassDatePicker';
import { GlassVideo } from '../media/GlassVideo';
import { GlassAudio } from '../media/GlassAudio';
import { GlassModal } from '../overlays/GlassModal';
import { cn } from '@/utils/cn';

// Schema types for dynamic UI generation
// v1.0: Added radiogroup, datepicker, video, audio, modal
// v1.1: Added checkbox, select, textarea, numberinput
type UINodeType = 'container' | 'stack' | 'grid' | 'text' | 'button' | 'input' | 'badge' | 'card' | 'divider' | 'slider' | 'toggle' | 'checkbox' | 'radiogroup' | 'datepicker' | 'video' | 'audio' | 'modal' | 'select' | 'textarea' | 'numberinput';

interface UINode {
    type: UINodeType;
    id?: string;
    props?: Record<string, unknown>;
    children?: UINode[] | string;
    style?: React.CSSProperties;
    /** Animation style for the element entrance */
    motion?: 'fade' | 'slide' | 'scale' | 'glass-morph';
    /** Sound to play on interaction (if applicable) */
    sound?: 'tap' | 'success' | 'alert';
}

interface GlassDynamicUIProps extends React.HTMLAttributes<HTMLDivElement> {
    /** JSON schema defining the UI structure */
    schema: UINode;
    /** Callback when an action is triggered (e.g., button click) */
    onAction?: (actionId: string, data?: unknown) => void;
}

export const GlassDynamicUI = React.forwardRef<HTMLDivElement, GlassDynamicUIProps>(
    ({ className, schema, onAction, ...props }, ref) => {

        // Simple sound player helper
        const playSound = (type?: 'tap' | 'success' | 'alert') => {
            if (!type) return;
            // In a real app, this would play an Audio file.
            // For now, we utilize the browser's interaction feedback if available or log it.
            console.log(`[GlassDynamicUI] Playing sound: ${type}`);
        };

        const getMotionClass = (motion?: string) => {
            switch (motion) {
                case 'fade': return 'animate-fade-in duration-500 ease-out';
                case 'slide': return 'animate-slide-up duration-500 cubic-bezier(0.42, 0.0, 0.58, 1.0)';
                case 'scale': return 'animate-scale-in duration-300 cubic-bezier(0.42, 0.0, 0.58, 1.0)';
                case 'glass-morph': return 'transition-all duration-700 hover:backdrop-blur-3xl';
                default: return '';
            }
        };

        const renderNode = (node: UINode, key?: string | number): React.ReactNode => {
            const { type, id, props: nodeProps = {}, children, style, motion, sound } = node;
            const motionClass = getMotionClass(motion);

            // Wrap onAction to play sound if defined
            const handleAction = (actionId: string, data?: unknown) => {
                if (sound) playSound(sound);
                onAction?.(actionId, data);
            };

            switch (type) {
                case 'container':
                    return (
                        <GlassContainer
                            key={key}
                            className={cn('p-4', motionClass, nodeProps.className as string)}
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
                                motionClass,
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
                            onClick={() => handleAction(
                                (nodeProps.actionId as string) || id || 'click',
                                nodeProps.data
                            )}
                            className={motionClass}
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
                                motionClass,
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
                                onValueChange={(val) => id && handleAction(id, val)}
                            />
                        </div>
                    );

                case 'toggle':
                    return (
                        <div key={key} className={cn("flex items-center gap-2", nodeProps.className as string)} style={style}>
                            <GlassSwitch
                                checked={nodeProps.checked as boolean}
                                onCheckedChange={(checked) => id && handleAction(id, checked)}
                            />
                            {(nodeProps.label as string) && <span className="text-sm text-primary">{nodeProps.label as string}</span>}
                        </div>
                    );

                // v1.0 new components
                case 'radiogroup': {
                    const options = (nodeProps.options as Array<{ value: string; label: string }>) || [];
                    return (
                        <div key={key} className={cn("space-y-2", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassRadioGroup
                                value={nodeProps.value as string}
                                onValueChange={(val) => id && handleAction(id, val)}
                            >
                                {options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <GlassRadioGroupItem value={opt.value} className={`id-${opt.value}`}>
                                            {opt.label}
                                        </GlassRadioGroupItem>
                                    </div>
                                ))}
                            </GlassRadioGroup>
                        </div>
                    );
                }

                case 'datepicker':
                    return (
                        <div key={key} className={cn("w-full", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassDatePicker
                                date={nodeProps.value ? new Date(nodeProps.value as string) : undefined}
                                onSelect={(date) => id && handleAction(id, date.toISOString())}
                            />
                        </div>
                    );

                case 'video':
                    return (
                        <GlassVideo
                            key={key}
                            src={nodeProps.src as string}
                            poster={nodeProps.poster as string}
                            autoPlay={nodeProps.autoplay as boolean}
                            controls={nodeProps.controls as boolean ?? true}
                            className={cn('rounded-xl overflow-hidden', nodeProps.className as string)}
                            style={style}
                        />
                    );

                case 'audio':
                    return (
                        <GlassAudio
                            key={key}
                            src={nodeProps.src as string}
                            title={nodeProps.title as string}
                            className={cn('w-full', nodeProps.className as string)}
                            style={style}
                        />
                    );

                case 'modal': {
                    const isOpen = nodeProps.isOpen as boolean ?? true;
                    return (
                        <GlassModal
                            key={key}
                            isOpen={isOpen}
                            onClose={() => id && handleAction(id, { open: false })}
                            title={nodeProps.title as string}
                        >
                            {Array.isArray(children)
                                ? children.map((child, i) => renderNode(child, i))
                                : children
                            }
                        </GlassModal>
                    );
                }

                // v1.1 new components
                case 'checkbox':
                    return (
                        <div key={key} className={cn("flex items-center gap-2", nodeProps.className as string)} style={style}>
                            <GlassCheckbox
                                checked={nodeProps.checked as boolean}
                                onCheckedChange={(checked) => id && handleAction(id, checked)}
                            />
                            {(nodeProps.label as string) && <span className="text-sm text-primary">{nodeProps.label as string}</span>}
                        </div>
                    );

                case 'select': {
                    const options = (nodeProps.options as Array<{ value: string; label: string }>) || [];
                    return (
                        <div key={key} className={cn("w-full", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassSelect
                                options={options}
                                placeholder={nodeProps.placeholder as string || 'Select...'}
                                value={nodeProps.value as string}
                                onValueChange={(val) => id && handleAction(id, val)}
                            />
                        </div>
                    );
                }

                case 'textarea':
                    return (
                        <div key={key} className={cn("w-full", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassTextarea
                                placeholder={nodeProps.placeholder as string}
                                defaultValue={nodeProps.value as string}
                                rows={(nodeProps.rows as number) || 3}
                                onChange={(e) => id && handleAction(id, e.target.value)}
                            />
                        </div>
                    );

                case 'numberinput':
                    return (
                        <div key={key} className={cn("w-full", nodeProps.className as string)} style={style}>
                            {(nodeProps.label as string) && <label className="text-sm text-secondary mb-2 block">{nodeProps.label as string}</label>}
                            <GlassNumberInput
                                defaultValue={(nodeProps.value as number) || 0}
                                min={nodeProps.min as number}
                                max={nodeProps.max as number}
                                step={(nodeProps.step as number) || 1}
                                onChange={(val) => id && handleAction(id, val)}
                            />
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
