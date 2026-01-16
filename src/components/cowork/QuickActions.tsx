/**
 * QuickActions
 *
 * Preset task buttons for common workflows.
 */

import React from 'react';
import {
    FileText,
    BarChart3,
    Code,
    FolderTree,
    Calendar,
    Mail
} from 'lucide-react';

import { QUICK_ACTIONS } from '@/types/cowork';

const ICON_MAP: Record<string, React.ElementType> = {
    'FileText': FileText,
    'BarChart3': BarChart3,
    'Code': Code,
    'FolderTree': FolderTree,
    'Calendar': Calendar,
    'Mail': Mail
};

interface QuickActionsProps {
    onSelect: (prompt: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelect }) => {
    return (
        <div className="mt-8">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((action) => {
                    const IconComponent = ICON_MAP[action.icon] || FileText;

                    return (
                        <button
                            key={action.id}
                            onClick={() => onSelect(action.prompt)}
                            className="flex items-start gap-3 p-4 rounded-xl
                                       bg-white/5 hover:bg-white/10 border border-white/5
                                       hover:border-white/10 transition-all text-left group"
                            type="button"
                        >
                            <div className="p-2 rounded-lg bg-white/5
                                            group-hover:bg-white/10 transition-colors flex-shrink-0">
                                <IconComponent size={18} className="text-white/60" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-white/90 truncate">
                                    {action.label}
                                </div>
                                <div className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                    {action.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
