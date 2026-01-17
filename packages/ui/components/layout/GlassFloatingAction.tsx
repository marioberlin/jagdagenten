import React, { ButtonHTMLAttributes, useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useHaptics } from '@/hooks/useHaptics';
import { Plus } from 'lucide-react';

export interface GlassFloatingActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Position on screen */
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
    /** Size of the FAB */
    size?: 'sm' | 'md' | 'lg';
    /** Extended FAB with label */
    label?: string;
    /** Icon to display (defaults to Plus) */
    icon?: React.ReactNode;
    /** Whether FAB is in expanded state (for speed dial) */
    expanded?: boolean;
    /** Speed dial actions */
    actions?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
    }>;
    /** Color variant */
    variant?: 'primary' | 'secondary' | 'accent';
}

const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
};

const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
};

const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
};

export const GlassFloatingAction = React.forwardRef<HTMLButtonElement, GlassFloatingActionProps>(
    ({
        className,
        position = 'bottom-right',
        size = 'md',
        label,
        icon,
        expanded = false,
        actions,
        variant = 'primary',
        onClick,
        disabled,
        ...props
    }, ref) => {
        const [isExpanded, setIsExpanded] = useState(expanded);
        const haptics = useHaptics();

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            haptics.impact();

            if (actions && actions.length > 0) {
                setIsExpanded(!isExpanded);
            }

            onClick?.(e);
        };

        const handleActionClick = (action: { onClick: () => void }) => {
            haptics.selection();
            action.onClick();
            setIsExpanded(false);
        };

        const variantStyles = {
            primary: 'bg-accent text-white hover:bg-accent/90',
            secondary: 'bg-[var(--glass-bg-thick)] text-label-glass-primary hover:bg-[var(--glass-surface-hover)]',
            accent: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
        };

        return (
            <div className={cn('fixed z-50', positionClasses[position])}>
                {/* Speed Dial Actions */}
                {actions && actions.length > 0 && (
                    <div
                        className={cn(
                            'absolute bottom-full mb-3 flex flex-col-reverse gap-3 transition-all duration-300',
                            isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                        )}
                    >
                        {actions.map((action, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3"
                                style={{
                                    transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
                                }}
                            >
                                {/* Label tooltip */}
                                <GlassContainer
                                    material="regular"
                                    border
                                    className="px-3 py-1.5 text-sm font-medium text-label-glass-primary whitespace-nowrap"
                                >
                                    {action.label}
                                </GlassContainer>

                                {/* Mini FAB */}
                                <GlassContainer
                                    as="button"
                                    material="regular"
                                    border
                                    interactive
                                    enableLiquid={false}
                                    className={cn(
                                        'w-10 h-10 flex items-center justify-center',
                                        'text-label-glass-primary hover:bg-[var(--glass-surface-hover)]',
                                        'transition-transform duration-200',
                                        isExpanded ? 'scale-100' : 'scale-0'
                                    )}
                                    onClick={() => handleActionClick(action)}
                                >
                                    {action.icon}
                                </GlassContainer>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main FAB */}
                <GlassContainer
                    as="button"
                    ref={ref}
                    material={variant === 'secondary' ? 'thick' : 'regular'}
                    border
                    interactive={!disabled}
                    enableLiquid={false}
                    className={cn(
                        // Base styles
                        'flex items-center justify-center gap-2',
                        'shadow-lg shadow-black/20',
                        'transition-all duration-300 ease-out',
                        // Focus ring
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                        // Size
                        label ? 'px-6 h-14 rounded-full' : cn(sizeClasses[size], 'rounded-full'),
                        // Variant
                        variantStyles[variant],
                        // Rotation for speed dial
                        actions && isExpanded && 'rotate-45',
                        // Disabled
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                    onClick={handleClick}
                    disabled={disabled}
                    aria-expanded={actions ? isExpanded : undefined}
                    aria-haspopup={actions ? 'menu' : undefined}
                    {...props}
                >
                    {icon || <Plus size={iconSizes[size]} strokeWidth={2.5} />}
                    {label && (
                        <span className="font-semibold text-base">{label}</span>
                    )}
                </GlassContainer>

                {/* Backdrop for speed dial */}
                {actions && isExpanded && (
                    <div
                        className="fixed inset-0 -z-10"
                        onClick={() => setIsExpanded(false)}
                        aria-hidden="true"
                    />
                )}
            </div>
        );
    }
);

GlassFloatingAction.displayName = 'GlassFloatingAction';
