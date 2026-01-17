import React from 'react';
import { cn } from '@/utils/cn';

import { Slot } from '@radix-ui/react-slot';

export interface GlassLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    /** Whether this label is for a required field */
    required?: boolean;
    /** Whether the associated field has an error */
    error?: boolean;
    /** Display size variant */
    size?: 'sm' | 'default' | 'lg';
    /** Change the underlying element to the child */
    asChild?: boolean;
}

/**
 * GlassLabel - Accessible label component for form inputs
 * 
 * Features:
 * - Proper `htmlFor` binding for accessibility
 * - Required field indicator
 * - Error state styling
 * - Consistent typography with glass design system
 */
export const GlassLabel = React.forwardRef<HTMLLabelElement, GlassLabelProps>(
    ({ className, children, required, error, size = 'default', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'label';
        const sizeClasses = {
            sm: 'text-xs',
            default: 'text-sm',
            lg: 'text-base',
        };

        return (
            <Comp
                ref={ref}
                className={cn(
                    // Base styles
                    'font-medium leading-none tracking-wide',
                    // Size
                    sizeClasses[size],
                    // Color - adapts to glass background
                    error
                        ? 'text-red-400'
                        : 'text-label-glass-primary',
                    // Disabled state handled via peer
                    'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
                    className
                )}
                {...props}
            >
                {children}
                {required && (
                    <span className="text-red-400 ml-1" aria-hidden="true">*</span>
                )}
            </Comp>
        );
    }
);

GlassLabel.displayName = 'GlassLabel';
