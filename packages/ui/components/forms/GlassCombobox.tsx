import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSITIONS } from '@/styles/animations';

export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
    icon?: React.ReactNode;
}

export interface GlassComboboxProps {
    /** Available options */
    options: ComboboxOption[];
    /** Currently selected value */
    value?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Placeholder text when no value selected */
    placeholder?: string;
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Text shown when no results found */
    emptyText?: string;
    /** Whether the combobox is disabled */
    disabled?: boolean;
    /** Custom filter function */
    filterFunction?: (option: ComboboxOption, query: string) => boolean;
    /** Additional className for the trigger button */
    className?: string;
    /** Whether to allow clearing the selection */
    clearable?: boolean;
}

/**
 * GlassCombobox - Searchable dropdown with autocomplete
 * 
 * Features:
 * - Type-ahead search filtering
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Optional custom filter function
 * - Clear button
 * - Icon and description support for options
 * 
 * @example
 * ```tsx
 * <GlassCombobox
 *   options={[
 *     { value: 'react', label: 'React' },
 *     { value: 'vue', label: 'Vue' },
 *     { value: 'angular', label: 'Angular' },
 *   ]}
 *   value={framework}
 *   onValueChange={setFramework}
 *   placeholder="Select framework..."
 * />
 * ```
 */
export const GlassCombobox = forwardRef<HTMLDivElement, GlassComboboxProps>(({
    options,
    value,
    onValueChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    disabled = false,
    filterFunction,
    className,
    clearable = true,
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Default filter function
    const defaultFilter = useCallback((option: ComboboxOption, query: string) => {
        return option.label.toLowerCase().includes(query.toLowerCase()) ||
            option.value.toLowerCase().includes(query.toLowerCase()) ||
            (option.description?.toLowerCase().includes(query.toLowerCase()) ?? false);
    }, []);

    const filter = filterFunction || defaultFilter;

    // Filter options based on search query
    const filteredOptions = searchQuery
        ? options.filter(opt => filter(opt, searchQuery))
        : options;

    // Get selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset highlighted index when search changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery]);

    // Scroll highlighted option into view
    useEffect(() => {
        if (listRef.current && highlightedIndex >= 0) {
            const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedEl) {
                highlightedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        Math.min(prev + 1, filteredOptions.length - 1)
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && filteredOptions[highlightedIndex]) {
                    const option = filteredOptions[highlightedIndex];
                    if (!option.disabled) {
                        onValueChange?.(option.value);
                        setIsOpen(false);
                        setSearchQuery('');
                    }
                } else {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchQuery('');
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const handleOptionClick = (option: ComboboxOption) => {
        if (option.disabled) return;
        onValueChange?.(option.value);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange?.('');
    };

    return (
        <div ref={ref} className={cn("relative w-full", className)}>
            {/* Trigger Button */}
            <GlassContainer
                as="button"
                type="button"
                material="thin"
                border
                interactive={!disabled}
                enableLiquid={false}
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={cn(
                    "w-full px-4 h-11",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center justify-between gap-2 w-full h-full">
                    <span className={cn(
                        "flex-1 text-left truncate",
                        selectedOption ? "text-primary" : "text-secondary/60"
                    )}>
                        {selectedOption ? (
                            <span className="flex items-center gap-2">
                                {selectedOption.icon}
                                {selectedOption.label}
                            </span>
                        ) : placeholder}
                    </span>

                    <span className="flex items-center gap-1">
                        {clearable && value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 rounded-full hover:bg-white/10 text-secondary/60 hover:text-primary transition-colors"
                                aria-label="Clear selection"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <ChevronDown
                            size={18}
                            className={cn(
                                "text-secondary/60 transition-transform duration-200",
                                isOpen && "rotate-180"
                            )}
                        />
                    </span>
                </div>
            </GlassContainer>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={TRANSITIONS.spring}
                        className="absolute z-50 w-full mt-2"
                    >
                        <GlassContainer
                            material="thick"
                            border
                            enableLiquid={false}
                            className="overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="p-2 border-b border-white/10">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                                    <Search size={16} className="text-secondary/50 flex-shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={searchPlaceholder}
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-secondary/40"
                                    />
                                </div>
                            </div>

                            {/* Options List */}
                            <div
                                ref={listRef}
                                role="listbox"
                                className="max-h-60 overflow-y-auto p-1"
                            >
                                {filteredOptions.length === 0 ? (
                                    <div className="px-3 py-6 text-center text-sm text-secondary/60">
                                        {emptyText}
                                    </div>
                                ) : (
                                    filteredOptions.map((option, index) => (
                                        <div
                                            key={option.value}
                                            role="option"
                                            aria-selected={option.value === value}
                                            aria-disabled={option.disabled}
                                            onClick={() => handleOptionClick(option)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                                                index === highlightedIndex && "bg-white/10",
                                                option.value === value && "bg-accent-muted",
                                                option.disabled && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {/* Option Icon */}
                                            {option.icon && (
                                                <span className="flex-shrink-0 text-secondary">
                                                    {option.icon}
                                                </span>
                                            )}

                                            {/* Option Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-primary truncate">
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="text-xs text-secondary/60 truncate">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Check Mark */}
                                            {option.value === value && (
                                                <Check size={16} className="flex-shrink-0 text-accent" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

GlassCombobox.displayName = 'GlassCombobox';
