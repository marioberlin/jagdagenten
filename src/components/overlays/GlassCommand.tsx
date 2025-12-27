import React, { useState, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Search, User, Settings, CreditCard, LogOut } from 'lucide-react';

interface CommandItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    action?: () => void;
}

const mockItems: CommandItem[] = [
    { id: '1', icon: <User size={14} />, label: 'Profile', shortcut: '⌘P' },
    { id: '2', icon: <CreditCard size={14} />, label: 'Billing', shortcut: '⌘B' },
    { id: '3', icon: <Settings size={14} />, label: 'Settings', shortcut: '⌘S' },
    { id: '4', icon: <LogOut size={14} />, label: 'Log out' },
];

export const GlassCommand = () => {
    const [query, setQuery] = useState("");
    // const [isOpen, setIsOpen] = useState(false); // Demo state, ideally controllable

    const filtered = mockItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // setIsOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // For demo purposes in Showcase, we might render it inline or providing a trigger
    // If inline, it's just the panel. 

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="text-center text-xs text-secondary mb-4">
                Press <kbd className="bg-white/10 px-1 py-0.5 rounded text-primary">⌘K</kbd> to toggle (simulated below)
            </div>

            <GlassContainer material="thick" enableLiquid={false} className="overflow-hidden flex flex-col p-3 min-h-[300px]">
                <div className="flex items-center px-3 border-b border-white/10 pb-3 mb-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="py-2 px-1">
                    <span className="text-xs font-medium text-secondary px-2 mb-3 block">Suggestions</span>
                    {filtered.length === 0 && (
                        <div className="text-sm text-center py-6 text-secondary">No results found.</div>
                    )}
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors"
                        >
                            <div className="mr-2 text-secondary group-hover:text-primary transition-colors">
                                {item.icon}
                            </div>
                            <span className="text-sm flex-1">{item.label}</span>
                            {item.shortcut && (
                                <span className="text-xs text-secondary">{item.shortcut}</span>
                            )}
                        </div>
                    ))}
                </div>
            </GlassContainer>
        </div>
    );
};
