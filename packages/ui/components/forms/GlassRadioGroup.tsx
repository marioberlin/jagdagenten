import React, { createContext, useContext, useId } from 'react';
import { GlassRadio } from './GlassRadio';
import { cn } from '@/utils/cn';

interface RadioGroupContextValue {
    name: string;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export const useRadioGroup = () => {
    const context = useContext(RadioGroupContext);
    return context;
};

export interface GlassRadioGroupProps {
    /** Currently selected value */
    value?: string;
    /** Default value (uncontrolled) */
    defaultValue?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Name attribute for form submission */
    name?: string;
    /** Whether the entire group is disabled */
    disabled?: boolean;
    /** Layout direction */
    orientation?: 'horizontal' | 'vertical';
    /** Additional className */
    className?: string;
    /** Radio options */
    children: React.ReactNode;
}

export interface GlassRadioGroupItemProps {
    /** Value for this radio option */
    value: string;
    /** Label text */
    children: React.ReactNode;
    /** Whether this specific item is disabled */
    disabled?: boolean;
    /** Additional className */
    className?: string;
}

/**
 * GlassRadioGroup - Controlled radio button group
 * 
 * Features:
 * - Controlled and uncontrolled modes
 * - Horizontal and vertical layouts
 * - Form-compatible name attribute
 * - Proper focus management
 * 
 * @example
 * ```tsx
 * <GlassRadioGroup value={plan} onValueChange={setPlan}>
 *   <GlassRadioGroupItem value="free">Free</GlassRadioGroupItem>
 *   <GlassRadioGroupItem value="pro">Pro</GlassRadioGroupItem>
 *   <GlassRadioGroupItem value="enterprise">Enterprise</GlassRadioGroupItem>
 * </GlassRadioGroup>
 * ```
 */
export const GlassRadioGroup = ({
    value,
    defaultValue,
    onValueChange,
    name,
    disabled = false,
    orientation = 'vertical',
    className,
    children,
}: GlassRadioGroupProps) => {
    const generatedName = useId();
    const groupName = name || generatedName;

    // Handle uncontrolled default value
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newValue: string) => {
        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    };

    return (
        <RadioGroupContext.Provider
            value={{
                name: groupName,
                value: currentValue,
                onValueChange: handleValueChange,
                disabled,
            }}
        >
            <div
                role="radiogroup"
                aria-orientation={orientation}
                className={cn(
                    'flex',
                    orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-4',
                    className
                )}
            >
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
};

/**
 * GlassRadioGroupItem - Individual radio option within a GlassRadioGroup
 */
export const GlassRadioGroupItem = ({
    value,
    children,
    disabled: itemDisabled = false,
    className,
}: GlassRadioGroupItemProps) => {
    const group = useRadioGroup();

    if (!group) {
        throw new Error('GlassRadioGroupItem must be used within a GlassRadioGroup');
    }

    const isDisabled = group.disabled || itemDisabled;
    const isChecked = group.value === value;

    const handleChange = () => {
        if (!isDisabled) {
            group.onValueChange?.(value);
        }
    };

    return (
        <label
            className={cn(
                'inline-flex items-center gap-3 cursor-pointer select-none',
                isDisabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <GlassRadio
                name={group.name}
                checked={isChecked}
                onCheckedChange={handleChange}
                disabled={isDisabled}
            />
            <span className="text-primary">{children}</span>
        </label>
    );
};

GlassRadioGroup.displayName = 'GlassRadioGroup';
GlassRadioGroupItem.displayName = 'GlassRadioGroupItem';
