import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

export interface GlassIconProps extends LucideProps {
    name: string;
}

/**
 * GlassIcon - Renders Lucide icons by name
 * 
 * @example
 * <GlassIcon name="Settings" size={24} />
 * <GlassIcon name="Bell" className="text-accent" />
 */
export const GlassIcon: React.FC<GlassIconProps> = ({ name, className = '', color = 'currentColor', size = 24, ...props }) => {
    const LucideIcon = (LucideIcons as any)[name];

    if (LucideIcon) {
        return <LucideIcon className={className} color={color} size={size} {...props} />;
    }

    // Icon not found
    console.warn(`GlassIcon: Icon "${name}" not found in Lucide.`);
    return null;
};
