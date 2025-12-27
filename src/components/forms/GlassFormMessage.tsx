import React from 'react';
import { cn } from '@/utils/cn';

export interface GlassFormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    /** Message type - affects styling */
    variant?: 'default' | 'error' | 'success' | 'warning';
}

/**
 * GlassFormMessage - Helper/error text for form fields
 * 
 * Features:
 * - Semantic color coding for different message types
 * - Screen reader friendly with role="alert" for errors
 * - Consistent typography with glass design system
 */
export const GlassFormMessage = React.forwardRef<HTMLParagraphElement, GlassFormMessageProps>(
    ({ className, children, variant = 'default', ...props }, ref) => {
        const variantClasses = {
            default: 'text-label-glass-secondary',
            error: 'text-red-400',
            success: 'text-green-400',
            warning: 'text-amber-400',
        };

        if (!children) return null;

        return (
            <p
                ref={ref}
                role={variant === 'error' ? 'alert' : undefined}
                aria-live={variant === 'error' ? 'polite' : undefined}
                className={cn(
                    'text-xs font-medium leading-relaxed mt-1.5',
                    variantClasses[variant],
                    className
                )}
                {...props}
            >
                {children}
            </p>
        );
    }
);

GlassFormMessage.displayName = 'GlassFormMessage';
