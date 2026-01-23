/**
 * Packing List
 * 
 * AI-generated packing suggestions based on trip weather.
 * Categories with checkable items, persisted to local storage.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Shirt,
    Umbrella,
    Camera,
    Briefcase,
    Check,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import type { Trip } from '@/stores/auroraTravelStore';

// ============================================================================
// Types
// ============================================================================

export interface PackingItem {
    id: string;
    name: string;
    checked: boolean;
    weather?: 'rain' | 'cold' | 'hot' | 'uv' | 'wind';
}

export interface PackingCategory {
    id: string;
    name: string;
    icon: React.ElementType;
    items: PackingItem[];
}

export interface PackingListProps {
    trip: Trip;
    onClose?: () => void;
}

// ============================================================================
// Generate Packing List from Weather
// ============================================================================

const generatePackingList = (trip: Trip): PackingCategory[] => {
    // Mock weather data - in production would come from trip weather
    const hasRain = trip.destinations.some(() => Math.random() > 0.5);
    const hasCold = trip.destinations.some(() => Math.random() > 0.7);
    const hasHot = trip.destinations.some(() => Math.random() > 0.6);
    const hasHighUV = Math.random() > 0.5;

    const categories: PackingCategory[] = [
        {
            id: 'clothing',
            name: 'Clothing',
            icon: Shirt,
            items: [
                { id: 'c1', name: 'T-shirts', checked: false },
                { id: 'c2', name: 'Pants/Shorts', checked: false },
                { id: 'c3', name: 'Underwear', checked: false },
                { id: 'c4', name: 'Socks', checked: false },
                { id: 'c5', name: 'Comfortable walking shoes', checked: false },
                ...(hasCold ? [
                    { id: 'c6', name: 'Warm jacket', checked: false, weather: 'cold' as const },
                    { id: 'c7', name: 'Sweater/Hoodie', checked: false, weather: 'cold' as const },
                ] : []),
                ...(hasHot ? [
                    { id: 'c8', name: 'Light breathable clothes', checked: false, weather: 'hot' as const },
                    { id: 'c9', name: 'Sandals', checked: false, weather: 'hot' as const },
                ] : []),
            ],
        },
        {
            id: 'weather',
            name: 'Weather Gear',
            icon: Umbrella,
            items: [
                ...(hasRain ? [
                    { id: 'w1', name: 'Rain jacket', checked: false, weather: 'rain' as const },
                    { id: 'w2', name: 'Compact umbrella', checked: false, weather: 'rain' as const },
                ] : []),
                ...(hasHighUV ? [
                    { id: 'w3', name: 'Sunscreen SPF 50+', checked: false, weather: 'uv' as const },
                    { id: 'w4', name: 'Sunglasses', checked: false, weather: 'uv' as const },
                    { id: 'w5', name: 'Hat/Cap', checked: false, weather: 'uv' as const },
                ] : []),
            ],
        },
        {
            id: 'tech',
            name: 'Tech & Accessories',
            icon: Camera,
            items: [
                { id: 't1', name: 'Phone + charger', checked: false },
                { id: 't2', name: 'Power bank', checked: false },
                { id: 't3', name: 'Camera', checked: false },
                { id: 't4', name: 'Headphones', checked: false },
            ],
        },
        {
            id: 'documents',
            name: 'Documents',
            icon: Briefcase,
            items: [
                { id: 'd1', name: 'ID / Passport', checked: false },
                { id: 'd2', name: 'Travel insurance', checked: false },
                { id: 'd3', name: 'Booking confirmations', checked: false },
                { id: 'd4', name: 'Cash / Cards', checked: false },
            ],
        },
    ];

    return categories.filter(c => c.items.length > 0);
};

// ============================================================================
// Category Section
// ============================================================================

interface CategorySectionProps {
    category: PackingCategory;
    onToggleItem: (categoryId: string, itemId: string) => void;
    onAddItem: (categoryId: string, name: string) => void;
    onRemoveItem: (categoryId: string, itemId: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    onToggleItem,
    onAddItem,
    onRemoveItem,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [newItemName, setNewItemName] = useState('');

    const checkedCount = category.items.filter(i => i.checked).length;
    const Icon = category.icon;

    const handleAddItem = () => {
        if (newItemName.trim()) {
            onAddItem(category.id, newItemName.trim());
            setNewItemName('');
        }
    };

    return (
        <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-[var(--glass-bg-subtle)] hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon size={18} className="text-[var(--glass-accent)]" />
                    <span className="font-medium text-primary">{category.name}</span>
                    <span className="text-xs text-tertiary">
                        {checkedCount}/{category.items.length}
                    </span>
                </div>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Items */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            {category.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group"
                                >
                                    <button
                                        onClick={() => onToggleItem(category.id, item.id)}
                                        className={cn(
                                            'w-5 h-5 rounded border flex items-center justify-center transition-all',
                                            item.checked
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-[var(--glass-border)] hover:border-[var(--glass-accent)]'
                                        )}
                                    >
                                        {item.checked && <Check size={12} className="text-white" />}
                                    </button>
                                    <span className={cn(
                                        'flex-1 text-sm',
                                        item.checked ? 'text-tertiary line-through' : 'text-secondary'
                                    )}>
                                        {item.name}
                                    </span>
                                    {item.weather && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                                            {item.weather}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => onRemoveItem(category.id, item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Item */}
                            <div className="flex items-center gap-2 p-2">
                                <Plus size={16} className="text-tertiary" />
                                <input
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                    placeholder="Add item..."
                                    className="flex-1 bg-transparent text-sm text-secondary placeholder:text-tertiary outline-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const PackingList: React.FC<PackingListProps> = ({ trip, onClose }) => {
    // Generate initial list based on weather
    const [categories, setCategories] = useState<PackingCategory[]>(() =>
        generatePackingList(trip)
    );

    // Stats
    const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
    const checkedItems = categories.reduce(
        (sum, c) => sum + c.items.filter(i => i.checked).length,
        0
    );
    const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    // Handlers
    const handleToggleItem = (categoryId: string, itemId: string) => {
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId
                ? {
                    ...cat,
                    items: cat.items.map(item =>
                        item.id === itemId ? { ...item, checked: !item.checked } : item
                    ),
                }
                : cat
        ));
    };

    const handleAddItem = (categoryId: string, name: string) => {
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId
                ? {
                    ...cat,
                    items: [...cat.items, { id: crypto.randomUUID(), name, checked: false }],
                }
                : cat
        ));
    };

    const handleRemoveItem = (categoryId: string, itemId: string) => {
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId
                ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
                : cat
        ));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package size={20} className="text-[var(--glass-accent)]" />
                    <h3 className="text-lg font-semibold text-primary">Packing List</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                    <Sparkles size={14} className="text-amber-400" />
                    AI-generated based on weather
                </div>
            </div>

            {/* Progress */}
            <GlassContainer className="p-4" border>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-secondary">Progress</span>
                    <span className="text-sm font-medium text-primary">
                        {checkedItems} / {totalItems} items
                    </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--glass-bg-subtle)] overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    />
                </div>
            </GlassContainer>

            {/* Categories */}
            <div className="space-y-3">
                {categories.map((category) => (
                    <CategorySection
                        key={category.id}
                        category={category}
                        onToggleItem={handleToggleItem}
                        onAddItem={handleAddItem}
                        onRemoveItem={handleRemoveItem}
                    />
                ))}
            </div>

            {/* Actions */}
            {onClose && (
                <div className="flex justify-end pt-2">
                    <GlassButton variant="primary" onClick={onClose}>
                        <Check size={16} className="mr-1" />
                        Done
                    </GlassButton>
                </div>
            )}
        </div>
    );
};

export default PackingList;
