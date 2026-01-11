import React, { createContext, useContext } from 'react';
import { cn } from '@/utils/cn';

// Context for sharing button group state with children
interface ButtonGroupContextValue {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'attached' | 'separated';
    orientation?: 'horizontal' | 'vertical';
}

const ButtonGroupContext = createContext<ButtonGroupContextValue | undefined>(undefined);

export const useButtonGroup = () => useContext(ButtonGroupContext);

/**
 * Props for the GlassButtonGroup component
 */
export interface GlassButtonGroupProps {
    /** 
     * Button children to be grouped. Should be GlassButton components. 
     */
    children: React.ReactNode;
    /** 
     * Layout orientation for the button group.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';
    /** 
     * Visual attachment mode. 'attached' removes gaps and borders between buttons,
     * 'separated' adds spacing between them.
     * @default 'attached'
     */
    variant?: 'attached' | 'separated';
    /** 
     * Button size passed to all children via context. Individual buttons can override this.
     * @default undefined (uses button's default size)
     */
    size?: 'sm' | 'md' | 'lg';
    /** 
     * Makes button group fill container width. Buttons distribute space equally.
     * @default false
     */
    fullWidth?: boolean;
    /** 
     * Additional CSS classes to apply to the group container.
     */
    className?: string;
}

/**
 * GlassButtonGroup - Compound component for grouping related buttons
 * 
 * Groups multiple buttons together with consistent spacing and visual connection.
 * Supports both attached mode (buttons joined with shared borders) and separated mode
 * (buttons with gaps between them).
 * 
 * **Size Inheritance**: The `size` prop is passed to all child buttons via React context.
 * Individual buttons can override this by specifying their own `size` prop.
 * 
 * **Accessibility**: Renders with `role="group"` to indicate grouped controls to screen readers.
 * 
 * @example
 * // Horizontal attached buttons (default)
 * <GlassButtonGroup variant="attached">
 *   <GlassButton variant="outline">Previous</GlassButton>
 *   <GlassButton variant="primary">Next</GlassButton>
 * </GlassButtonGroup>
 * 
 * @example
 * // Vertical separated buttons
 * <GlassButtonGroup orientation="vertical" variant="separated">
 *   <GlassButton>Dashboard</GlassButton>
 *   <GlassButton>Analytics</GlassButton>
 *   <GlassButton>Settings</GlassButton>
 * </GlassButtonGroup>
 * 
 * @example
 * // Size inheritance
 * <GlassButtonGroup size="sm">
 *   <GlassButton>Small</GlassButton>
 *   <GlassButton>Buttons</GlassButton>
 *   <GlassButton size="lg">Except this one</GlassButton>
 * </GlassButtonGroup>
 * 
 * @see {@link GlassButton} for individual button component
 * @see {@link useButtonGroup} for accessing group context in custom components
 */
export const GlassButtonGroup = React.forwardRef<HTMLDivElement, GlassButtonGroupProps>(
    (
        {
            children,
            orientation = 'horizontal',
            variant = 'attached',
            size,
            fullWidth = false,
            className,
        },
        ref
    ) => {
        const contextValue: ButtonGroupContextValue = {
            size,
            variant,
            orientation,
        };

        // Process children to add positioning classes
        const processedChildren = React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) {
                return child;
            }

            const childCount = React.Children.count(children);
            const isFirst = index === 0;
            const isLast = index === childCount - 1;
            const isMiddle = !isFirst && !isLast;

            // Border radius classes for attached variant
            let radiusClasses = '';
            if (variant === 'attached') {
                if (orientation === 'horizontal') {
                    if (isFirst) radiusClasses = 'rounded-r-none';
                    else if (isLast) radiusClasses = 'rounded-l-none';
                    else if (isMiddle) radiusClasses = 'rounded-none';
                } else {
                    if (isFirst) radiusClasses = 'rounded-b-none';
                    else if (isLast) radiusClasses = 'rounded-t-none';
                    else if (isMiddle) radiusClasses = 'rounded-none';
                }
            }

            // Border removal for attached variant to prevent double borders
            let borderClasses = '';
            if (variant === 'attached') {
                if (orientation === 'horizontal' && !isLast) {
                    borderClasses = '[&>*]:border-r-0';
                } else if (orientation === 'vertical' && !isLast) {
                    borderClasses = '[&>*]:border-b-0';
                }
            }

            // Full width for vertical or fullWidth prop
            const widthClasses = (orientation === 'vertical' || fullWidth) ? 'w-full' : '';

            const element = child as React.ReactElement<any>;
            return React.cloneElement(element, {
                ...element.props,
                className: cn(
                    element.props.className,
                    radiusClasses,
                    borderClasses,
                    widthClasses
                ),
                // Pass size prop if provided in group but not in button
                size: element.props.size || size,
            } as any);
        });

        return (
            <ButtonGroupContext.Provider value={contextValue}>
                <div
                    ref={ref}
                    role="group"
                    className={cn(
                        'inline-flex',
                        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
                        variant === 'separated'
                            ? orientation === 'horizontal'
                                ? 'gap-2'
                                : 'gap-2'
                            : 'gap-0',
                        fullWidth && 'w-full',
                        className
                    )}
                >
                    {processedChildren}
                </div>
            </ButtonGroupContext.Provider>
        );
    }
);

GlassButtonGroup.displayName = 'GlassButtonGroup';
