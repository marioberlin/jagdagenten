/**
 * DynamicPackingList
 * 
 * An enhanced packing list with weather context, animations, and smart grouping.
 * Features:
 * - Animated check/uncheck with confetti burst
 * - Weather-driven item suggestions highlighted
 * - Category grouping (essentials, clothing, accessories)
 * - Progress indicator
 */
import { useState } from 'react';
import { cn } from '@/utils/cn';
import {
    Check,
    Sparkles,
    Sun,
    CloudRain,
    Snowflake,
    Briefcase,
    Shirt,
    Glasses,
    ChevronDown,
    ChevronUp,
    // Packing item icons
    FileText,
    Plug,
    Wifi,
    Footprints,
    Umbrella,
    Backpack
} from 'lucide-react';
import { GlassContainer } from '@/components';
import type { PackingItem, WeatherCondition } from '../../services/a2a/NeonTokyoService';

// Packing item icon mapping with Liquid Glass colors
const PACKING_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    passport: { icon: FileText, color: '#3b82f6' },
    charger: { icon: Plug, color: '#f59e0b' },
    wifi: { icon: Wifi, color: '#06b6d4' },
    jacket: { icon: Shirt, color: '#8b5cf6' },
    shoes: { icon: Footprints, color: '#ec4899' },
    umbrella: { icon: Umbrella, color: '#6366f1' },
    sunglasses: { icon: Glasses, color: '#f97316' },
    backpack: { icon: Backpack, color: '#22c55e' }
};

// Helper to render packing icon
function PackingIcon({ iconKey, size = 16 }: { iconKey?: string; size?: number }) {
    if (!iconKey) return null;
    const config = PACKING_ICONS[iconKey];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon size={size} style={{ color: config.color }} />;
}

interface DynamicPackingListProps {
    items: PackingItem[];
    weatherCondition?: WeatherCondition;
    onToggle: (id: string) => void;
    accentColor?: string;
    className?: string;
}

// Category configuration
interface Category {
    id: string;
    label: string;
    icon: React.ElementType;
    keywords: string[];
}

const CATEGORIES: Category[] = [
    { id: 'essentials', label: 'Essentials', icon: Briefcase, keywords: ['passport', 'charger', 'adapter', 'wallet', 'phone', 'toiletries'] },
    { id: 'clothing', label: 'Clothing', icon: Shirt, keywords: ['jacket', 'coat', 'underwear', 'shirt', 'pants', 'dress', 'shoes', 'boots'] },
    { id: 'accessories', label: 'Accessories', icon: Glasses, keywords: ['sunglasses', 'umbrella', 'hat', 'gloves', 'scarf', 'warmers'] }
];

// Weather icons for suggestions
const WeatherHint: Record<WeatherCondition, { icon: React.ElementType; label: string }> = {
    sunny: { icon: Sun, label: 'Sun protection' },
    rainy: { icon: CloudRain, label: 'Rain gear' },
    snowy: { icon: Snowflake, label: 'Cold weather' },
    cloudy: { icon: Sun, label: 'Variable weather' },
    night: { icon: Sparkles, label: 'Night essentials' },
    foggy: { icon: CloudRain, label: 'Low visibility' }
};

/**
 * Categorize items based on name keywords
 */
function categorizeItem(item: PackingItem): string {
    const name = item.name.toLowerCase();
    for (const cat of CATEGORIES) {
        if (cat.keywords.some(kw => name.includes(kw))) {
            return cat.id;
        }
    }
    return 'other';
}

/**
 * Individual packing item row
 */
function PackingItemRow({
    item,
    onToggle,
    isWeatherItem,
    accentColor
}: {
    item: PackingItem;
    onToggle: () => void;
    isWeatherItem: boolean;
    accentColor: string;
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        if (!item.checked) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 600);
        }
        onToggle();
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300",
                "hover:bg-white/5 active:scale-[0.98]",
                "group relative overflow-hidden",
                item.checked && "opacity-60"
            )}
        >
            {/* Checkbox */}
            <div
                className={cn(
                    "relative w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center shrink-0",
                    item.checked
                        ? "bg-green-500 border-green-500"
                        : "border-white/30 group-hover:border-white/50"
                )}
            >
                {item.checked && (
                    <Check size={14} className="text-white animate-scale-in" />
                )}

                {/* Confetti burst on check */}
                {isAnimating && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full animate-confetti"
                                style={{
                                    backgroundColor: accentColor,
                                    left: '50%',
                                    top: '50%',
                                    animationDelay: `${i * 50}ms`,
                                    '--confetti-angle': `${i * 60}deg`
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Packing Icon */}
            {item.icon && (
                <PackingIcon iconKey={item.icon} size={18} />
            )}

            {/* Name and reason */}
            <div className="flex-1 min-w-0">
                <span className={cn(
                    "block text-sm font-medium transition-all duration-300",
                    item.checked ? "line-through text-white/50" : "text-white/90"
                )}>
                    {item.name}
                </span>
                {item.weatherReason && (
                    <span className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                        {isWeatherItem && <Sparkles size={10} className="text-amber-400" />}
                        {item.weatherReason}
                    </span>
                )}
            </div>

            {/* Weather badge */}
            {isWeatherItem && !item.checked && (
                <div
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                    style={{
                        backgroundColor: `${accentColor}30`,
                        color: accentColor
                    }}
                >
                    Suggested
                </div>
            )}
        </button>
    );
}

/**
 * Category section with collapsible list
 */
function CategorySection({
    category,
    items,
    onToggle,
    weatherCondition: _weatherCondition,
    accentColor
}: {
    category: Category;
    items: PackingItem[];
    onToggle: (id: string) => void;
    weatherCondition?: WeatherCondition;
    accentColor: string;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const Icon = category.icon;
    const checkedCount = items.filter(i => i.checked).length;

    return (
        <div className="mb-4">
            {/* Category header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
                <Icon size={16} className="text-white/60" />
                <span className="text-sm font-semibold text-white/80 flex-1 text-left">
                    {category.label}
                </span>
                <span className="text-xs text-white/40">
                    {checkedCount}/{items.length}
                </span>
                {isExpanded ? (
                    <ChevronUp size={14} className="text-white/40" />
                ) : (
                    <ChevronDown size={14} className="text-white/40" />
                )}
            </button>

            {/* Items */}
            {isExpanded && (
                <div className="mt-1 space-y-0.5">
                    {items.map(item => (
                        <PackingItemRow
                            key={item.id}
                            item={item}
                            onToggle={() => onToggle(item.id)}
                            isWeatherItem={!!item.weatherReason}
                            accentColor={accentColor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Progress bar showing packing completion
 */
function ProgressBar({
    checked,
    total,
    accentColor
}: {
    checked: number;
    total: number;
    accentColor: string;
}) {
    const percentage = total > 0 ? (checked / total) * 100 : 0;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/70">Packing Progress</span>
                <span className="text-sm font-bold text-white">
                    {checked}/{total} items
                </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: percentage === 100 ? '#22c55e' : accentColor
                    }}
                />
            </div>
            {percentage === 100 && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                    <Check size={12} />
                    All packed! You're ready to go
                </p>
            )}
        </div>
    );
}

export function DynamicPackingList({
    items,
    weatherCondition,
    onToggle,
    accentColor = '#ec4899',
    className
}: DynamicPackingListProps) {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const cat = categorizeItem(item);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, PackingItem[]>);

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.checked).length;

    if (totalItems === 0) {
        return (
            <GlassContainer className={cn("p-4 text-center", className)} border material="thin">
                <Briefcase size={32} className="mx-auto mb-2 text-white/30" />
                <p className="text-white/50">No packing items yet</p>
                <p className="text-xs text-white/30 mt-1">Ask the agent to generate a packing list</p>
            </GlassContainer>
        );
    }

    return (
        <GlassContainer className={cn("p-4", className)} border material="thin">
            {/* Header with weather hint */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Briefcase size={16} style={{ color: accentColor }} />
                    Smart Packing
                </h3>
                {weatherCondition && WeatherHint[weatherCondition] && (
                    <div className="flex items-center gap-1 text-xs text-white/50">
                        {(() => {
                            const hint = WeatherHint[weatherCondition];
                            const Icon = hint.icon;
                            return (
                                <>
                                    <Icon size={12} />
                                    {hint.label}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Progress */}
            <ProgressBar checked={checkedItems} total={totalItems} accentColor={accentColor} />

            {/* Categories */}
            <div className="max-h-80 overflow-auto -mx-2 px-2">
                {CATEGORIES.map(category => {
                    const categoryItems = groupedItems[category.id];
                    if (!categoryItems?.length) return null;
                    return (
                        <CategorySection
                            key={category.id}
                            category={category}
                            items={categoryItems}
                            onToggle={onToggle}
                            weatherCondition={weatherCondition}
                            accentColor={accentColor}
                        />
                    );
                })}

                {/* Other items */}
                {groupedItems['other']?.length > 0 && (
                    <CategorySection
                        category={{ id: 'other', label: 'Other', icon: Sparkles, keywords: [] }}
                        items={groupedItems['other']}
                        onToggle={onToggle}
                        weatherCondition={weatherCondition}
                        accentColor={accentColor}
                    />
                )}
            </div>
        </GlassContainer>
    );
}

export default DynamicPackingList;
