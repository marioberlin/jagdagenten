import React, { useState, useMemo } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassSelect } from '../forms/GlassSelect';
import { GlassSwitch } from '../forms/GlassSwitch';
import { GlassInput } from '../forms/GlassInput';
import { GlassButton } from '../primitives/GlassButton';
import { GlassCode } from './GlassCode';
import { GlassBadge } from './GlassBadge';
import { cn } from '@/utils/cn';
import { Play, RotateCcw } from 'lucide-react';

type ControlType = 'select' | 'boolean' | 'string' | 'number';

interface PropControl {
    name: string;
    type: ControlType;
    defaultValue: string | boolean | number;
    options?: { label: string; value: string }[];
    description?: string;
}

interface GlassPlaygroundProps {
    componentName: string;
    controls: PropControl[];
    renderPreview: (props: Record<string, unknown>) => React.ReactNode;
    className?: string;
}

/**
 * GlassPlayground - Interactive component preview with live controls
 * 
 * Usage:
 * ```tsx
 * <GlassPlayground
 *   componentName="GlassButton"
 *   controls={[
 *     { name: 'variant', type: 'select', defaultValue: 'primary', options: [{ label: 'Primary', value: 'primary' }] },
 *     { name: 'disabled', type: 'boolean', defaultValue: false },
 *   ]}
 *   renderPreview={(props) => <GlassButton {...props}>Click me</GlassButton>}
 * />
 * ```
 */
export const GlassPlayground = ({
    componentName,
    controls,
    renderPreview,
    className,
}: GlassPlaygroundProps) => {
    // Initialize state from default values
    const initialState = useMemo(() => {
        return controls.reduce((acc, control) => {
            acc[control.name] = control.defaultValue;
            return acc;
        }, {} as Record<string, unknown>);
    }, [controls]);

    const [values, setValues] = useState<Record<string, unknown>>(initialState);

    const handleChange = (name: string, value: unknown) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setValues(initialState);
    };

    // Generate code preview
    const codePreview = useMemo(() => {
        const propsString = Object.entries(values)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([key, value]) => {
                if (typeof value === 'boolean') {
                    return value ? key : null;
                }
                if (typeof value === 'string') {
                    return `${key}="${value}"`;
                }
                return `${key}={${value}}`;
            })
            .filter(Boolean)
            .join('\n  ');

        return `<${componentName}${propsString ? '\n  ' + propsString + '\n' : ' '}>
  Content
</${componentName}>`;
    }, [componentName, values]);

    return (
        <GlassContainer
            material="thin"
            border
            className={cn("overflow-hidden rounded-2xl", className)}
        >
            {/* Header */}
            <div className="px-4 py-3 bg-glass-surface border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Play size={14} className="text-green-400" />
                    <span className="text-sm font-semibold text-primary">Playground</span>
                    <GlassBadge variant="glass" size="sm">{componentName}</GlassBadge>
                </div>
                <GlassButton variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw size={14} className="mr-1" />
                    Reset
                </GlassButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--glass-border)]">
                {/* Preview Area */}
                <div className="p-6">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">Preview</span>
                    <div className="flex items-center justify-center min-h-[120px] p-4 rounded-xl bg-glass-surface border border-[var(--glass-border)]">
                        {renderPreview(values)}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">Props</span>
                    <div className="space-y-4">
                        {controls.map((control) => (
                            <div key={control.name} className="space-y-1">
                                <label className="text-xs text-secondary font-medium flex items-center gap-2">
                                    {control.name}
                                    {control.description && (
                                        <span className="text-label-tertiary font-normal">— {control.description}</span>
                                    )}
                                </label>

                                {control.type === 'select' && control.options && (
                                    <GlassSelect
                                        defaultValue={values[control.name] as string}
                                        onValueChange={(v) => handleChange(control.name, v)}
                                        options={control.options}
                                    />
                                )}

                                {control.type === 'boolean' && (
                                    <GlassSwitch
                                        checked={values[control.name] as boolean}
                                        onCheckedChange={(v) => handleChange(control.name, v)}
                                    />
                                )}

                                {control.type === 'string' && (
                                    <GlassInput
                                        value={values[control.name] as string}
                                        onChange={(e) => handleChange(control.name, e.target.value)}
                                        placeholder={`Enter ${control.name}...`}
                                    />
                                )}

                                {control.type === 'number' && (
                                    <GlassInput
                                        type="number"
                                        value={values[control.name] as number}
                                        onChange={(e) => handleChange(control.name, Number(e.target.value))}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Code Preview */}
            <div className="border-t border-[var(--glass-border)]">
                <GlassCode code={codePreview} language="tsx" filename={`${componentName}.tsx`} showLineNumbers={false} />
            </div>
        </GlassContainer>
    );
};

GlassPlayground.displayName = 'GlassPlayground';
