import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/utils/cn';
import { GlassLabel } from '../primitives/GlassLabel';
import { GlassFormMessage } from './GlassFormMessage';

// Context to share form field state
interface FormFieldContextValue {
    id: string;
    name?: string;
    error?: string;
    disabled?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/**
 * Hook to access form field context
 * Use this in custom form inputs to get the auto-generated id and error state
 */
export const useFormField = () => {
    const context = useContext(FormFieldContext);
    if (!context) {
        throw new Error('useFormField must be used within a GlassFormGroup');
    }
    return context;
};

export interface GlassFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Label text for the form field */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display (shown when no error) */
    helperText?: string;
    /** Success message to display */
    successText?: string;
    /** Field name (used for form libraries) */
    name?: string;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Label size variant */
    labelSize?: 'sm' | 'default' | 'lg';
}

/**
 * GlassFormGroup - Container that bundles Label + Input + Error/Helper message
 * 
 * Features:
 * - Auto-generates unique IDs for accessibility binding
 * - Provides context for child inputs to access field state
 * - Manages error, success, and helper text display
 * - Consistent spacing and layout
 * 
 * @example
 * ```tsx
 * <GlassFormGroup label="Email" required error={errors.email}>
 *   <GlassInput type="email" placeholder="you@example.com" />
 * </GlassFormGroup>
 * ```
 */
export const GlassFormGroup = React.forwardRef<HTMLDivElement, GlassFormGroupProps>(
    ({
        className,
        children,
        label,
        required,
        error,
        helperText,
        successText,
        name,
        disabled,
        labelSize = 'default',
        ...props
    }, ref) => {
        // Generate unique ID for accessibility
        const generatedId = useId();
        const fieldId = name || generatedId;

        // Determine which message to show (error takes precedence)
        const messageVariant = error ? 'error' : successText ? 'success' : 'default';
        const messageText = error || successText || helperText;

        return (
            <FormFieldContext.Provider value={{ id: fieldId, name, error, disabled }}>
                <div
                    ref={ref}
                    className={cn(
                        'flex flex-col gap-1.5',
                        disabled && 'opacity-60',
                        className
                    )}
                    {...props}
                >
                    {/* Label */}
                    {label && (
                        <GlassLabel
                            htmlFor={fieldId}
                            required={required}
                            error={!!error}
                            size={labelSize}
                        >
                            {label}
                        </GlassLabel>
                    )}

                    {/* Input slot - clone children to inject id and error state */}
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child as React.ReactElement<any>, {
                                id: fieldId,
                                name: name || child.props.name,
                                disabled: disabled || child.props.disabled,
                                'aria-invalid': error ? 'true' : undefined,
                                'aria-describedby': messageText ? `${fieldId}-message` : undefined,
                                error: !!error,
                            });
                        }
                        return child;
                    })}

                    {/* Helper/Error/Success message */}
                    {messageText && (
                        <GlassFormMessage
                            id={`${fieldId}-message`}
                            variant={messageVariant}
                        >
                            {messageText}
                        </GlassFormMessage>
                    )}
                </div>
            </FormFieldContext.Provider>
        );
    }
);

GlassFormGroup.displayName = 'GlassFormGroup';

// Re-export child components for convenience
export { GlassLabel } from '../primitives/GlassLabel';
export { GlassFormMessage } from './GlassFormMessage';
