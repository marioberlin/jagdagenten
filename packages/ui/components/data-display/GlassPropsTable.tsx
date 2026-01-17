
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassBadge } from './GlassBadge';
import { cn } from '@/utils/cn';

interface PropDefinition {
    name: string;
    type: string;
    defaultValue?: string;
    required?: boolean;
    description: string;
}

interface GlassPropsTableProps {
    componentName: string;
    props: PropDefinition[];
    className?: string;
}

/**
 * GlassPropsTable - Displays props documentation for a component
 * 
 * Usage:
 * ```tsx
 * <GlassPropsTable
 *   componentName="GlassButton"
 *   props={[
 *     { name: 'variant', type: "'primary' | 'secondary' | 'ghost'", defaultValue: "'primary'", description: 'Visual style variant' },
 *     { name: 'onClick', type: '() => void', required: true, description: 'Click handler' },
 *   ]}
 * />
 * ```
 */
export const GlassPropsTable = ({
    componentName,
    props,
    className,
}: GlassPropsTableProps) => {
    return (
        <GlassContainer
            material="thin"
            className={cn("overflow-hidden rounded-2xl", className)}
        >
            {/* Header */}
            <div className="px-4 py-3 bg-glass-surface border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary font-mono">&lt;{componentName} /&gt;</span>
                </div>
                <GlassBadge variant="outline" size="sm">
                    {props.length} props
                </GlassBadge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--glass-border)] text-left">
                            <th className="px-4 py-3 font-medium text-secondary text-xs uppercase tracking-wider">Prop</th>
                            <th className="px-4 py-3 font-medium text-secondary text-xs uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 font-medium text-secondary text-xs uppercase tracking-wider hidden md:table-cell">Default</th>
                            <th className="px-4 py-3 font-medium text-secondary text-xs uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-surface">
                        {props.map((prop) => (
                            <tr key={prop.name} className="hover:bg-glass-surface transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <code className="text-blue-300 font-mono text-xs">{prop.name}</code>
                                        {prop.required && (
                                            <span className="text-red-400 text-xs">*</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <code className="text-purple-300 font-mono text-xs bg-glass-surface px-2 py-0.5 rounded">
                                        {prop.type}
                                    </code>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    {prop.defaultValue ? (
                                        <code className="text-green-300 font-mono text-xs">{prop.defaultValue}</code>
                                    ) : (
                                        <span className="text-label-tertiary text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-primary/70 text-xs max-w-xs">
                                    {prop.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer with required indicator */}
            {props.some(p => p.required) && (
                <div className="px-4 py-2 bg-glass-surface border-t border-[var(--glass-border)] text-xs text-secondary">
                    <span className="text-red-400">*</span> Required prop
                </div>
            )}
        </GlassContainer>
    );
};

// Export prop type for use in other files
export type { PropDefinition };

GlassPropsTable.displayName = 'GlassPropsTable';
