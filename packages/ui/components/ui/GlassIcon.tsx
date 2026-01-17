import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import iconRegistry from '../../config/iconRegistry.json';

export interface GlassIconProps extends LucideProps {
    name: string;
}

export const GlassIcon: React.FC<GlassIconProps> = ({ name, className = '', color = 'currentColor', size = 24, ...props }) => {
    // Check if mapping exists in registry
    const sfSymbolName = (iconRegistry as Record<string, string>)[name];

    const LucideIcon = (LucideIcons as any)[name];

    // If we have an SF Symbol mapping, render it using CSS mask
    if (sfSymbolName) {
        // We use a div with mask-image to allow standard CSS coloring (fill/text-color)
        // The background color of the div becomes the color of the icon

        // Construct the path to the SVG. Assuming regular weight for now.
        const symbolUrl = `/symbols/${sfSymbolName}/regular.svg`;

        // Inline styles for the mask
        const style: React.CSSProperties = {
            WebkitMaskImage: `url(${symbolUrl})`,
            maskImage: `url(${symbolUrl})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            backgroundColor: color === 'currentColor' ? 'currentColor' : color,
            width: size,
            height: size,
            display: 'inline-block',
            verticalAlign: 'middle',
            // Merge with any passed style, but mask properties take precedence ideally, 
            // though here we merge passed style *after* to allow overrides if really needed, 
            // but usually color/size are controlled by props.
            ...props.style,
        };

        // Filter out SVG specific props that React might complain about on a div
        // or just cast props to any if we are lazy, but better to be safe.
        // LucideProps includes some SVG specific things.
        // taking out known SVG props to avoid React warnings
        const {
            absoluteStrokeWidth,
            strokeWidth,
            ...divProps
        } = props as any;

        return (
            <div
                className={`glass-icon-sf ${className}`}
                style={style}
                aria-hidden="true"
                role="img"
                {...divProps}
            />
        );
    }

    // Fallback to Lucide Icon if it exists
    if (LucideIcon) {
        return <LucideIcon className={className} color={color} size={size} {...props} />;
    }

    // Final fallback or empty render
    console.warn(`GlassIcon: Icon "${name}" not found in registry or Lucide.`);
    return null;
};
