/**
 * Composition Tree Component
 *
 * Hierarchical view of composition elements and tracks.
 */
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Type, Image, Video, Music, Square, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Composition, TimelineTrack } from '../types';

interface CompositionTreeProps {
  composition: Composition | null;
  selectedElement: string | null;
  onSelectElement: (elementId: string | null) => void;
  onAddTrack: (track: Omit<TimelineTrack, 'id' | 'events'>) => void;
}

export const CompositionTree: React.FC<CompositionTreeProps> = ({
  composition,
  selectedElement,
  onSelectElement,
  onAddTrack,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['root']));

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!composition) {
    return (
      <div className="p-4 text-white/50 text-sm text-center">
        Create a composition to get started
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Composition Root */}
      <TreeItem
        id="root"
        label={composition.name}
        icon={Layers}
        level={0}
        isExpanded={expandedItems.has('root')}
        isSelected={selectedElement === 'root'}
        onToggle={() => toggleExpanded('root')}
        onSelect={() => onSelectElement('root')}
      />

      {/* Add Track Buttons */}
      <div className="px-2 py-2 flex flex-wrap gap-1 border-b border-white/10">
        <AddTrackButton label="Text" icon={Type} onClick={() => onAddTrack({ name: 'Text', type: 'text' })} />
        <AddTrackButton label="Image" icon={Image} onClick={() => onAddTrack({ name: 'Image', type: 'image' })} />
        <AddTrackButton label="Video" icon={Video} onClick={() => onAddTrack({ name: 'Video', type: 'video' })} />
        <AddTrackButton label="Audio" icon={Music} onClick={() => onAddTrack({ name: 'Audio', type: 'audio' })} />
        <AddTrackButton label="Shape" icon={Square} onClick={() => onAddTrack({ name: 'Shape', type: 'shape' })} />
        <AddTrackButton label="Effect" icon={Sparkles} onClick={() => onAddTrack({ name: 'Effect', type: 'effect' })} />
      </div>

      {/* Info */}
      <div className="p-2 text-xs text-white/40 space-y-1">
        <div>Resolution: {composition.width} × {composition.height}</div>
        <div>Frame Rate: {composition.fps} fps</div>
        <div>Duration: {(composition.durationInFrames / composition.fps).toFixed(1)}s ({composition.durationInFrames} frames)</div>
      </div>
    </div>
  );
};

// ============================================================================
// Tree Item Component
// ============================================================================

interface TreeItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  level: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onSelect: () => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  id: _id,
  label,
  icon: Icon,
  level,
  isExpanded = false,
  isSelected = false,
  hasChildren = false,
  onToggle,
  onSelect,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors',
        isSelected ? 'bg-blue-500/30 text-white' : 'text-white/70 hover:bg-white/5'
      )}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      onClick={onSelect}
    >
      {/* Expand/Collapse */}
      {hasChildren || onToggle ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="w-4 h-4 flex items-center justify-center"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      ) : (
        <div className="w-4" />
      )}

      {/* Icon */}
      <Icon className="w-4 h-4 text-white/50" />

      {/* Label */}
      <span className="text-xs truncate">{label}</span>
    </div>
  );
};

// ============================================================================
// Add Track Button
// ============================================================================

interface AddTrackButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

const AddTrackButton: React.FC<AddTrackButtonProps> = ({ label, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
      title={`Add ${label} track`}
    >
      <Plus className="w-3 h-3" />
      <Icon className="w-3 h-3" />
    </button>
  );
};
