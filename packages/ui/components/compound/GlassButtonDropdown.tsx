import React from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassButton, GlassButtonProps } from '../primitives/GlassButton';
import { GlassDropdown, GlassDropdownItem } from '../overlays/GlassDropdown';


interface GlassButtonDropdownOption {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    disabled?: boolean;
    description?: string;
}

interface GlassButtonDropdownProps extends Omit<GlassButtonProps, 'onClick'> {
    /** Label to display on the button */
    label: React.ReactNode;
    /** Options to display in the dropdown */
    options: GlassButtonDropdownOption[];
    /** Alignment of the dropdown menu */
    align?: 'left' | 'right';
}

/**
 * GlassButtonDropdown
 * 
 * A button that acts entirely as a trigger for a dropdown menu.
 * It does not have a separate main action.
 */
export const GlassButtonDropdown = ({
    label,
    options,
    align = 'left',
    endContent,
    ...props
}: GlassButtonDropdownProps) => {
    return (
        <GlassDropdown
            align={align}
            trigger={
                <GlassButton
                    {...props}
                    endContent={endContent || <ChevronDown size={14} className="ml-1 opacity-70" />}
                >
                    {label}
                </GlassButton>
            }
        >
            {options.map((option, idx) => (
                <GlassDropdownItem
                    key={idx}
                    onClick={option.onClick}
                    icon={option.icon}
                    description={option.description}
                >
                    {option.label}
                </GlassDropdownItem>
            ))}
        </GlassDropdown>
    );
};

GlassButtonDropdown.displayName = 'GlassButtonDropdown';
