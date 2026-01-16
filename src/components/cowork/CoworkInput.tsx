/**
 * CoworkInput
 *
 * The "describe your outcome" entry point.
 * Features: Auto-resizing textarea, workspace selector, attachments support.
 */

import React, { useRef, useEffect } from 'react';
import { Folder, Paperclip, ArrowRight } from 'lucide-react';

import type { TaskOptions } from '@/types/cowork';

interface CoworkInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (description: string, options: TaskOptions) => void;
    disabled?: boolean;
}

export const CoworkInput: React.FC<CoworkInputProps> = ({
    value,
    onChange,
    onSubmit,
    disabled
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.max(120, Math.min(textareaRef.current.scrollHeight, 400));
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (value.trim()) {
                onSubmit(value.trim(), { workspacePath: null });
            }
        }
    };

    const handleSubmit = () => {
        if (value.trim() && !disabled) {
            onSubmit(value.trim(), { workspacePath: null });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Main Input */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to accomplish...

Example: Organize my project's documentation folder. Group by topic, create a table of contents, and identify any outdated files."
                    className="w-full min-h-[120px] p-4 rounded-2xl bg-white/5
                               border border-white/10 focus:border-indigo-500/50
                               text-white placeholder:text-white/30
                               resize-none outline-none transition-colors
                               font-sans text-base leading-relaxed"
                    disabled={disabled}
                />
                <div className="absolute bottom-3 right-3 text-xs text-white/20">
                    {value.length} chars • ⌘+Enter to submit
                </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Workspace Selector */}
                    <button
                        className="flex items-center gap-2 px-3 py-1.5
                                   rounded-lg bg-white/5 hover:bg-white/10
                                   text-sm text-white/60 transition-colors"
                        type="button"
                        disabled={disabled}
                    >
                        <Folder size={14} />
                        Select folder...
                    </button>

                    {/* Attachments */}
                    <button
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        type="button"
                        disabled={disabled}
                    >
                        <Paperclip size={14} className="text-white/60" />
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || disabled}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                               bg-gradient-to-r from-indigo-500 to-purple-500
                               text-white font-medium
                               disabled:opacity-50 disabled:cursor-not-allowed
                               hover:shadow-lg hover:shadow-indigo-500/25
                               transition-all active:scale-[0.98]"
                    type="button"
                >
                    Let's go
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default CoworkInput;
