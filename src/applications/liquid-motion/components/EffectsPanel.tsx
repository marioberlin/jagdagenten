/**
 * Effects Panel Component
 *
 * Library of available effects with drag-and-drop support.
 */
import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, ArrowDown, ZoomIn, Droplet, RotateCw, Type, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Effect, EffectType, EffectPreset } from '../types';

interface EffectsPanelProps {
  onApplyEffect: (effect: EffectPreset) => void;
}

// Built-in effect presets
const EFFECT_PRESETS: EffectPreset[] = [
  // Transitions
  { id: 'fade-in', name: 'Fade In', description: 'Gradually appear', category: 'Transition', type: 'fade', parameters: { direction: 'in', duration: 30 } },
  { id: 'fade-out', name: 'Fade Out', description: 'Gradually disappear', category: 'Transition', type: 'fade', parameters: { direction: 'out', duration: 30 } },
  { id: 'slide-left', name: 'Slide Left', description: 'Slide in from right', category: 'Transition', type: 'slide', parameters: { direction: 'left', duration: 30 } },
  { id: 'slide-right', name: 'Slide Right', description: 'Slide in from left', category: 'Transition', type: 'slide', parameters: { direction: 'right', duration: 30 } },
  { id: 'slide-up', name: 'Slide Up', description: 'Slide in from bottom', category: 'Transition', type: 'slide', parameters: { direction: 'up', duration: 30 } },
  { id: 'slide-down', name: 'Slide Down', description: 'Slide in from top', category: 'Transition', type: 'slide', parameters: { direction: 'down', duration: 30 } },
  { id: 'zoom-in', name: 'Zoom In', description: 'Scale up from small', category: 'Transition', type: 'zoom', parameters: { direction: 'in', scale: 0.5, duration: 30 } },
  { id: 'zoom-out', name: 'Zoom Out', description: 'Scale down from large', category: 'Transition', type: 'zoom', parameters: { direction: 'out', scale: 1.5, duration: 30 } },
  { id: 'wipe-h', name: 'Wipe Horizontal', description: 'Horizontal wipe reveal', category: 'Transition', type: 'wipe', parameters: { direction: 'horizontal', duration: 30 } },
  { id: 'wipe-v', name: 'Wipe Vertical', description: 'Vertical wipe reveal', category: 'Transition', type: 'wipe', parameters: { direction: 'vertical', duration: 30 } },

  // Filters
  { id: 'blur', name: 'Blur', description: 'Gaussian blur effect', category: 'Filter', type: 'blur', parameters: { radius: 10 } },

  // Motion
  { id: 'spring-bounce', name: 'Spring Bounce', description: 'Bouncy spring animation', category: 'Motion', type: 'spring', parameters: { mass: 1, damping: 10, stiffness: 100 } },
  { id: 'spring-wobbly', name: 'Spring Wobbly', description: 'Wobbly spring effect', category: 'Motion', type: 'spring', parameters: { mass: 1, damping: 7, stiffness: 150 } },
  { id: 'spin', name: 'Spin', description: 'Rotate 360 degrees', category: 'Motion', type: 'spin', parameters: { degrees: 360, duration: 60 } },
  { id: 'bounce', name: 'Bounce', description: 'Bounce up and down', category: 'Motion', type: 'bounce', parameters: { height: 20, duration: 30 } },

  // Text
  { id: 'typewriter', name: 'Typewriter', description: 'Type character by character', category: 'Text', type: 'typewriter', parameters: { speed: 2 } },
];

// Category icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Transition: ArrowRight,
  Filter: Droplet,
  Motion: Zap,
  Text: Type,
};

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ onApplyEffect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Transition', 'Motion'])
  );

  // Filter effects by search
  const filteredEffects = searchQuery
    ? EFFECT_PRESETS.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : EFFECT_PRESETS;

  // Group by category
  const categories = [...new Set(filteredEffects.map((e) => e.category))];

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search effects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Effects List */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => {
          const categoryEffects = filteredEffects.filter((e) => e.category === category);
          const isExpanded = expandedCategories.has(category);
          const CategoryIcon = CATEGORY_ICONS[category] || Sparkles;

          return (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors"
              >
                <CategoryIcon className="w-3 h-3" />
                <span className="flex-1 text-left font-medium">{category}</span>
                <span className="text-white/40">{categoryEffects.length}</span>
                <ArrowDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Effects */}
              {isExpanded && (
                <div className="pb-2">
                  {categoryEffects.map((effect) => (
                    <EffectItem
                      key={effect.id}
                      effect={effect}
                      onApply={() => onApplyEffect(effect)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredEffects.length === 0 && (
          <div className="p-4 text-center text-white/40 text-sm">
            No effects found
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Effect Item Component
// ============================================================================

interface EffectItemProps {
  effect: EffectPreset;
  onApply: () => void;
}

const EffectItem: React.FC<EffectItemProps> = ({ effect, onApply }) => {
  return (
    <button
      onClick={onApply}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors group"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(effect));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <Sparkles className="w-4 h-4 text-white/30 group-hover:text-blue-400" />
      <div className="flex-1 text-left">
        <div className="text-xs text-white/80">{effect.name}</div>
        <div className="text-[10px] text-white/40">{effect.description}</div>
      </div>
    </button>
  );
};
