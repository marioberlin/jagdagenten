/**
 * Action Chips Component
 *
 * Displays Plan/Do/Explain action chips for agent responses.
 * Supports primary actions and expandable explanations.
 */

import { useState } from 'react';
import { Lightbulb, PlayCircle, HelpCircle, Save, Share2 } from 'lucide-react';

export type ActionChip = 'Plan' | 'Do' | 'Explain' | 'Save' | 'Share';

interface AgentAction {
    label: string;
    tool: string;
    params?: Record<string, unknown>;
}

interface ActionChipsProps {
    chips: ActionChip[];
    primaryAction?: AgentAction;
    explain?: string[];
    onAction?: (action: AgentAction) => void;
    onExplainToggle?: (expanded: boolean) => void;
}

const CHIP_CONFIG: Record<ActionChip, { icon: typeof Lightbulb; color: string; label: string }> = {
    Plan: { icon: Lightbulb, color: '#8B5CF6', label: 'Plan' },
    Do: { icon: PlayCircle, color: '#059669', label: 'Ausführen' },
    Explain: { icon: HelpCircle, color: '#2563EB', label: 'Erklären' },
    Save: { icon: Save, color: '#7C3AED', label: 'Speichern' },
    Share: { icon: Share2, color: '#0891B2', label: 'Teilen' },
};

export function ActionChips({
    chips,
    primaryAction,
    explain,
    onAction,
    onExplainToggle,
}: ActionChipsProps) {
    const [showExplain, setShowExplain] = useState(false);

    const handleChipClick = (chip: ActionChip) => {
        if (chip === 'Explain' && explain?.length) {
            const newState = !showExplain;
            setShowExplain(newState);
            onExplainToggle?.(newState);
        } else if (chip === 'Do' && primaryAction) {
            onAction?.(primaryAction);
        }
    };

    return (
        <div className="space-y-2">
            {/* Chip Row */}
            <div className="flex flex-wrap gap-2">
                {chips.map((chip) => {
                    const config = CHIP_CONFIG[chip];
                    const Icon = config.icon;
                    const isExplainActive = chip === 'Explain' && showExplain;

                    return (
                        <button
                            key={chip}
                            onClick={() => handleChipClick(chip)}
                            className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                text-sm font-medium transition-all duration-200
                hover:scale-105 active:scale-95
              `}
                            style={{
                                backgroundColor: `${config.color}15`,
                                color: config.color,
                                borderColor: config.color,
                                outline: isExplainActive ? `2px solid ${config.color}` : 'none',
                                outlineOffset: '2px',
                            }}
                        >
                            <Icon size={14} />
                            <span>{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Explanation Panel */}
            {showExplain && explain && explain.length > 0 && (
                <div
                    className="mt-2 p-3 rounded-lg border animate-in slide-in-from-top-2 duration-200"
                    style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        borderColor: 'rgba(37, 99, 235, 0.2)',
                    }}
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                        <HelpCircle size={14} />
                        <span>So habe ich das gemacht:</span>
                    </div>
                    <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                        {explain.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Primary Action Button */}
            {primaryAction && (
                <button
                    onClick={() => onAction?.(primaryAction)}
                    className="
            w-full mt-2 px-4 py-2 rounded-lg
            bg-green-600 text-white font-medium
            hover:bg-green-700 active:bg-green-800
            transition-colors duration-200
          "
                >
                    {primaryAction.label}
                </button>
            )}
        </div>
    );
}

export default ActionChips;
