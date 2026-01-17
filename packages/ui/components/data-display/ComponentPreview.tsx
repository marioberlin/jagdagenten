import { ReactNode } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface ComponentPreviewProps {
    /** Section title */
    title: string;
    /** Optional description */
    description?: string;
    /** Category badge text */
    badge?: string;
    /** Badge color variant */
    badgeColor?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
    /** Preview content */
    children: ReactNode;
    /** Additional className */
    className?: string;
    /** ID for anchor linking */
    id?: string;
}

const badgeColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
};

export const ComponentPreview = ({
    title,
    description,
    badge,
    badgeColor = 'blue',
    children,
    className,
    id,
}: ComponentPreviewProps) => {
    return (
        <section id={id} className={cn("scroll-mt-28", className)}>
            <GlassContainer
                material="thin"
                border
                className="p-6 sm:p-8 rounded-2xl"
            >
                {/* Header */}
                <div className="mb-6">
                    {badge && (
                        <span className={cn(
                            "text-xs font-bold uppercase tracking-widest mb-2 block",
                            badgeColors[badgeColor]
                        )}>
                            {badge}
                        </span>
                    )}
                    <h3 className="text-xl font-semibold text-primary">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-secondary mt-1">
                            {description}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {children}
                </div>
            </GlassContainer>
        </section>
    );
};

ComponentPreview.displayName = 'ComponentPreview';

/**
 * Sub-component for grouping related examples within a preview
 */
interface PreviewGroupProps {
    /** Group label */
    label?: string;
    /** Content */
    children: ReactNode;
    /** Additional className */
    className?: string;
}

export const PreviewGroup = ({ label, children, className }: PreviewGroupProps) => (
    <div className={cn("space-y-3", className)}>
        {label && (
            <p className="text-xs font-medium text-label-tertiary uppercase tracking-widest">{label}</p>
        )}
        <div className="flex flex-wrap gap-4 items-center">
            {children}
        </div>
    </div>
);

PreviewGroup.displayName = 'PreviewGroup';
