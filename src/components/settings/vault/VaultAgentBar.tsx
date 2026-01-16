/**
 * VaultAgentBar - Paste-to-Parse Input Component
 * 
 * A smart input bar that allows users to paste business documents,
 * emails, or text snippets. The service parses the content and
 * extracts entity information for quick saving to the vault.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wand2,
    ClipboardPaste,
    X,
    Building2,
    User,
    MapPin,
    Mail,
    FileText,
    Sparkles,
    Plus,
    Loader2,
} from 'lucide-react';
import { vaultService, ParsedDocument } from '@/services/vaultService';
import { cn } from '@/utils/cn';

interface VaultAgentBarProps {
    className?: string;
    onParseComplete?: (result: ParsedDocument) => void;
}

export const VaultAgentBar: React.FC<VaultAgentBarProps> = ({
    className,
    onParseComplete,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseResult, setParseResult] = useState<ParsedDocument | null>(null);
    const [showResults, setShowResults] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text.length > 50) {
            e.preventDefault();
            setInputValue(text);
            await parseContent(text);
        }
    }, []);

    const parseContent = async (text: string) => {
        setIsParsing(true);
        setShowResults(false);

        // Simulate parsing delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));

        const result = vaultService.parseDocument(text);
        setParseResult(result);
        setShowResults(true);
        setIsParsing(false);

        onParseComplete?.(result);
    };

    const handleSubmit = useCallback(async () => {
        if (!inputValue.trim()) return;
        await parseContent(inputValue);
    }, [inputValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
        if (e.key === 'Escape') {
            setShowResults(false);
            setParseResult(null);
            setInputValue('');
        }
    };

    const handleAddToEntity = (entityId: string) => {
        if (!parseResult) return;

        // TODO: Merge parsed fields into existing entity
        console.log('Adding to entity:', entityId, parseResult.fields);
        setShowResults(false);
        setParseResult(null);
        setInputValue('');
    };

    const handleCreateNew = () => {
        if (!parseResult) return;

        // TODO: Open create entity dialog with pre-filled data
        console.log('Creating new entity with:', parseResult.fields);
        setShowResults(false);
        setParseResult(null);
        setInputValue('');
    };

    const getTypeIcon = (type: ParsedDocument['type']) => {
        switch (type) {
            case 'organization':
                return <Building2 size={16} />;
            case 'person':
                return <User size={16} />;
            case 'address':
                return <MapPin size={16} />;
            case 'contact':
                return <Mail size={16} />;
            default:
                return <FileText size={16} />;
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-400';
        if (confidence >= 0.6) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <div className={cn("relative", className)}>
            {/* Input Bar */}
            <div className="relative">
                <div className="absolute left-3 top-3 text-white/40">
                    <Wand2 size={18} />
                </div>
                <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste company details, email signatures, or business cards..."
                    className={cn(
                        "w-full pl-10 pr-24 py-3 min-h-[48px] max-h-32 resize-none",
                        "bg-white/5 border border-white/10 rounded-xl",
                        "text-sm text-white placeholder:text-white/30",
                        "focus:outline-none focus:border-[var(--glass-accent)]/50 focus:ring-1 focus:ring-[var(--glass-accent)]/25",
                        "transition-all duration-200"
                    )}
                    rows={1}
                />

                {/* Action Buttons */}
                <div className="absolute right-2 top-2 flex items-center gap-1">
                    {inputValue && (
                        <button
                            onClick={() => {
                                setInputValue('');
                                setParseResult(null);
                                setShowResults(false);
                            }}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!inputValue.trim() || isParsing}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            inputValue.trim() && !isParsing
                                ? "bg-[var(--glass-accent)] text-white hover:bg-[var(--glass-accent)]/80"
                                : "bg-white/10 text-white/30 cursor-not-allowed"
                        )}
                    >
                        {isParsing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Sparkles size={14} />
                        )}
                        Parse
                    </button>
                </div>
            </div>

            {/* Hint Text */}
            <div className="flex items-center justify-between mt-1.5 px-1 text-xs text-white/30">
                <span className="flex items-center gap-1">
                    <ClipboardPaste size={10} />
                    Paste to auto-parse
                </span>
                <span>⌘+Enter to submit</span>
            </div>

            {/* Parse Results Dropdown */}
            <AnimatePresence>
                {showResults && parseResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50"
                    >
                        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    {getTypeIcon(parseResult.type)}
                                    <span className="text-sm font-medium capitalize">
                                        {parseResult.type} detected
                                    </span>
                                    <span className={cn("text-xs", getConfidenceColor(parseResult.confidence))}>
                                        {Math.round(parseResult.confidence * 100)}% confidence
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/60"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Extracted Fields */}
                            <div className="px-4 py-3 border-b border-white/10">
                                <div className="text-xs text-white/40 mb-2">Extracted Fields</div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(parseResult.fields).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs"
                                        >
                                            <span className="text-white/40">{key}:</span>
                                            <span className="text-white/80 font-medium truncate max-w-[200px]">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Suggested Entities */}
                            {parseResult.suggestedEntities.length > 0 && (
                                <div className="px-4 py-3 border-b border-white/10">
                                    <div className="text-xs text-white/40 mb-2">Add to existing entity</div>
                                    <div className="space-y-1">
                                        {parseResult.suggestedEntities.map((suggestion) => (
                                            <button
                                                key={suggestion.id}
                                                onClick={() => handleAddToEntity(suggestion.id)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-white/40" />
                                                    <span className="text-sm">{suggestion.name}</span>
                                                </div>
                                                <span className="text-xs text-[var(--glass-accent)]">
                                                    {Math.round(suggestion.matchScore * 100)}% match
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="px-4 py-3 flex items-center justify-between bg-white/5">
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--glass-accent)] rounded-lg text-sm font-medium hover:bg-[var(--glass-accent)]/80 transition-colors"
                                >
                                    <Plus size={14} />
                                    Create New Entity
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

VaultAgentBar.displayName = 'VaultAgentBar';
