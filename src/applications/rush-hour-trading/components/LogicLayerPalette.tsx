import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassContainer, GlassInput } from '@/components';
import { LogicLayerCard } from './LogicLayerCard';
import type { LogicLayer } from '@/types/trading';

interface LogicLayerPaletteProps {
    layers: LogicLayer[];
    assignedLayerIds: string[];
    onAssign: (layer: LogicLayer) => void;
}

export function LogicLayerPalette({
    layers,
    assignedLayerIds,
    onAssign,
}: LogicLayerPaletteProps) {
    const [search, setSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['RISK_MANAGEMENT']));

    // Filter and group layers
    const { groupedLayers, categories } = useMemo(() => {
        const filtered = layers.filter(layer => {
            const matchesSearch = !search ||
                layer.name.toLowerCase().includes(search.toLowerCase()) ||
                layer.category.toLowerCase().includes(search.toLowerCase());
            const notAssigned = !assignedLayerIds.includes(layer.id);
            return matchesSearch && notAssigned;
        });

        const grouped: Record<string, LogicLayer[]> = {};
        for (const layer of filtered) {
            const cat = layer.category || 'CUSTOM';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(layer);
        }

        return {
            groupedLayers: grouped,
            categories: Object.keys(grouped).sort(),
        };
    }, [layers, assignedLayerIds, search]);

    function toggleCategory(category: string) {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }

    return (
        <GlassContainer className="p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">Available Logic Layers</h3>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <GlassInput
                    type="text"
                    placeholder="Search layers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Grouped Layers */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories.length === 0 ? (
                    <p className="text-sm text-tertiary text-center py-4">
                        {search ? 'No matching layers' : 'All layers assigned'}
                    </p>
                ) : (
                    categories.map(category => (
                        <div key={category}>
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                {expandedCategories.has(category) ? (
                                    <ChevronDown className="w-4 h-4 text-secondary" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-secondary" />
                                )}
                                <span className="text-sm font-medium text-secondary">{category}</span>
                                <span className="text-xs text-tertiary">({groupedLayers[category].length})</span>
                            </button>

                            {expandedCategories.has(category) && (
                                <div className="pl-6 space-y-2 mt-2">
                                    {groupedLayers[category].map(layer => (
                                        <LogicLayerCard
                                            key={layer.id}
                                            layer={layer}
                                            isAssigned={false}
                                            onAssign={() => onAssign(layer)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </GlassContainer>
    );
}

export default LogicLayerPalette;
