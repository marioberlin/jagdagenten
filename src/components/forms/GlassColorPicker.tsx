import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { GlassInput } from './GlassInput';
import { GlassPopover } from '../overlays/GlassPopover';
import { cn } from '@/utils/cn';
import { Pipette } from 'lucide-react';

export interface GlassColorPickerProps {
    /**
     * Current color value (hex)
     */
    color: string;

    /**
     * Callback when color changes
     */
    onChange: (color: string) => void;

    /**
     * Label for the input
     */
    label?: string;

    /**
     * Additional class names
     */
    className?: string;
}

export function GlassColorPicker({
    color,
    onChange,
    label,
    className
}: GlassColorPickerProps) {
    const [inputValue, setInputValue] = useState(color);

    // Sync input with external color prop
    useEffect(() => {
        setInputValue(color);
    }, [color]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        if (/^#[0-9A-F]{6}$/i.test(newVal)) {
            onChange(newVal);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-sm font-medium text-secondary">{label}</label>}

            <GlassPopover
                trigger={
                    <button className="flex items-center gap-3 w-full p-2 rounded-xl bg-glass-surface border border-glass-border hover:bg-glass-surface-hover transition-colors group">
                        <div
                            className="w-10 h-10 rounded-lg shadow-inner border border-white/10"
                            style={{ backgroundColor: color }}
                        />
                        <div className="flex-1 text-left font-mono text-primary group-hover:text-white transition-colors">
                            {color.toUpperCase()}
                        </div>
                        <Pipette size={16} className="text-secondary group-hover:text-primary mr-2" />
                    </button>
                }
                content={
                    <div className="p-3 space-y-3">
                        <div className="custom-color-picker">
                            <style>{`
                                .custom-color-picker .react-colorful {
                                    width: 100%;
                                    height: 200px;
                                }
                                .custom-color-picker .react-colorful__saturation {
                                    border-radius: 12px 12px 0 0;
                                }
                                .custom-color-picker .react-colorful__hue {
                                    border-radius: 0 0 12px 12px;
                                    height: 24px;
                                    margin-top: 4px;
                                }

                            `}</style>
                            <HexColorPicker color={color} onChange={onChange} />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-secondary text-sm font-mono">#</span>
                            <GlassInput
                                value={inputValue.replace('#', '')}
                                onChange={handleInputChange}
                                className="font-mono uppercase"
                                maxLength={6}
                            />
                        </div>
                    </div>
                }
            />
        </div>
    );
}

GlassColorPicker.displayName = 'GlassColorPicker';
