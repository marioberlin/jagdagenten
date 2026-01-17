import React from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassButton } from '../primitives/GlassButton';
import { GlassDropdown, GlassDropdownItem } from '../overlays/GlassDropdown';
import { cn } from '@/utils/cn';

interface GlassSplitButtonOption {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    disabled?: boolean;
    description?: string;
}

interface GlassSplitButtonProps {
    /** Label for the main action button */
    label: React.ReactNode;
    /** Handler for the main action */
    onMainAction: () => void;
    /** Options to display in the dropdown */
    options: GlassSplitButtonOption[];
    /** Visual variant for both buttons */
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Loading state */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Optional icon for main button */
    startContent?: React.ReactNode;
    className?: string;
}

/**
 * GlassSplitButton
 * 
 * A compound component that combines a primary action button with a dropdown
 * for related secondary actions.
 */
export const GlassSplitButton = ({
    label,
    onMainAction,
    options,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    startContent,
    className
}: GlassSplitButtonProps) => {

    return (
        <div className={cn("inline-flex items-center shadow-sm", className)}>
            <GlassButton
                variant={variant}
                size={size}
                loading={loading}
                disabled={disabled}
                onClick={onMainAction}
                startContent={startContent}
                className="rounded-r-none border-r-0 focus:z-10"
            >
                {label}
            </GlassButton>

            <GlassDropdown
                trigger={
                    <GlassButton
                        variant={variant}
                        size={size}
                        disabled={disabled} // Don't show loading on the chevron, just disable
                        className={cn(
                            "rounded-l-none px-2 focus:z-10 -ml-[1px]",
                            // Add a separator line for certain variants
                            (variant === 'secondary' || variant === 'outline' || variant === 'ghost') && "border-l border-white/10"
                        )}
                    >
                        <ChevronDown size={14} />
                    </GlassButton>
                }
                align="right"
            >
                {options.map((option, idx) => (
                    <GlassDropdownItem
                        key={idx}
                        onClick={option.onClick}
                        icon={option.icon}
                        description={option.description}
                    // disabled={option.disabled} // GlassDropdownItem needs update for disabled if required
                    >
                        {option.label}
                    </GlassDropdownItem>
                ))}
            </GlassDropdown>
        </div>
    );
};

GlassSplitButton.displayName = 'GlassSplitButton';
