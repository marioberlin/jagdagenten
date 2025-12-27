import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { GlassContainer } from '../primitives/GlassContainer';
import { useTheme } from '@/hooks/useTheme';
import {
    Search,
    Home,
    Layout,
    Settings,
    LogIn,
    Moon,
    Sun,
    X
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface CommandItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    category: 'navigation' | 'theme' | 'actions';
    action: () => void;
}

interface GlassCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlassCommandPalette = ({ isOpen, onClose }: GlassCommandPaletteProps) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const items: CommandItem[] = [
        // Navigation
        { id: 'home', icon: <Home size={16} />, label: 'Go to Home', category: 'navigation', action: () => { navigate('/'); onClose(); } },
        { id: 'showcase', icon: <Layout size={16} />, label: 'Go to Showcase', category: 'navigation', action: () => { navigate('/showcase'); onClose(); } },
        { id: 'settings', icon: <Settings size={16} />, label: 'Go to Settings', category: 'navigation', action: () => { navigate('/settings'); onClose(); } },
        { id: 'login', icon: <LogIn size={16} />, label: 'Open Login Demo', category: 'navigation', action: () => { navigate('/demos/login'); onClose(); } },
        // Theme
        { id: 'theme', icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', shortcut: '⌘D', category: 'theme', action: () => { toggleTheme(); onClose(); } },
    ];

    const filtered = items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % filtered.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    filtered[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [isOpen, filtered, selectedIndex, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Clear query when closing
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const groupedItems = filtered.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        theme: 'Appearance',
        actions: 'Actions',
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Command Palette */}
            <GlassContainer
                material="thick"
                border
                enableLiquid={false}
                className="relative w-full max-w-lg mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-[var(--glass-border)]">
                    <Search className="mr-3 h-5 w-5 text-secondary" />
                    <input
                        autoFocus
                        className="flex h-14 w-full bg-transparent text-base outline-none placeholder:text-secondary"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-glass-surface-hover transition-colors"
                        aria-label="Close command palette"
                    >
                        <X size={18} className="text-secondary" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {filtered.length === 0 && (
                        <div className="text-sm text-center py-8 text-secondary">
                            No results found.
                        </div>
                    )}

                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category}>
                            <div className="px-4 py-2 text-xs font-semibold text-label-tertiary uppercase tracking-wider">
                                {categoryLabels[category] || category}
                            </div>
                            {categoryItems.map((item) => {
                                const globalIndex = filtered.indexOf(item);
                                const isSelected = globalIndex === selectedIndex;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={item.action}
                                        className={cn(
                                            "w-full flex items-center px-4 py-2.5 text-left transition-colors",
                                            isSelected
                                                ? "bg-accent/20 text-accent"
                                                : "text-primary hover:bg-glass-surface-hover"
                                        )}
                                    >
                                        <span className={cn(
                                            "mr-3 transition-colors",
                                            isSelected ? "text-accent" : "text-secondary"
                                        )}>
                                            {item.icon}
                                        </span>
                                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                                        {item.shortcut && (
                                            <kbd className="text-xs text-secondary bg-glass-surface px-2 py-0.5 rounded">
                                                {item.shortcut}
                                            </kbd>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-[var(--glass-border)] flex items-center justify-between text-xs text-secondary">
                    <span>↑↓ to navigate</span>
                    <span>↵ to select</span>
                    <span>esc to close</span>
                </div>
            </GlassContainer>
        </div>,
        document.body
    );
};

GlassCommandPalette.displayName = 'GlassCommandPalette';
