/**
 * Inspector Component
 *
 * Property inspector for selected elements and composition settings.
 */
import React from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Composition } from '../types';

interface InspectorProps {
  selectedElement: string | null;
  composition: Composition | null;
  onUpdateElement: (id: string, updates: Record<string, unknown>) => void;
  onUpdateComposition: (updates: Partial<Composition>) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedElement,
  composition,
  onUpdateElement,
  onUpdateComposition,
}) => {
  // Show composition settings if no element selected
  if (!selectedElement || selectedElement === 'root') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <Settings className="w-4 h-4 text-white/50" />
          <span className="text-sm text-white font-medium">Composition</span>
        </div>

        {composition ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Name */}
            <PropertyGroup label="Name">
              <input
                type="text"
                value={composition.name}
                onChange={(e) => onUpdateComposition({ name: e.target.value })}
                className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </PropertyGroup>

            {/* Dimensions */}
            <PropertyGroup label="Dimensions">
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="W"
                  value={composition.width}
                  onChange={(v) => onUpdateComposition({ width: v })}
                  min={1}
                  max={7680}
                />
                <NumberInput
                  label="H"
                  value={composition.height}
                  onChange={(v) => onUpdateComposition({ height: v })}
                  min={1}
                  max={4320}
                />
              </div>
            </PropertyGroup>

            {/* Frame Rate */}
            <PropertyGroup label="Frame Rate">
              <select
                value={composition.fps}
                onChange={(e) => onUpdateComposition({ fps: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={24}>24 fps</option>
                <option value={25}>25 fps</option>
                <option value={30}>30 fps</option>
                <option value={50}>50 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </PropertyGroup>

            {/* Duration */}
            <PropertyGroup label="Duration">
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Frames"
                  value={composition.durationInFrames}
                  onChange={(v) => onUpdateComposition({ durationInFrames: v })}
                  min={1}
                />
                <div className="flex items-center">
                  <span className="text-xs text-white/50">
                    {(composition.durationInFrames / composition.fps).toFixed(2)}s
                  </span>
                </div>
              </div>
            </PropertyGroup>

            {/* Background */}
            <PropertyGroup label="Background">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={composition.backgroundColor || '#000000'}
                  onChange={(e) => onUpdateComposition({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={composition.backgroundColor || '#000000'}
                  onChange={(e) => onUpdateComposition({ backgroundColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </PropertyGroup>

            {/* Presets */}
            <PropertyGroup label="Presets">
              <div className="grid grid-cols-2 gap-1">
                <PresetButton label="1080p" onClick={() => onUpdateComposition({ width: 1920, height: 1080 })} />
                <PresetButton label="4K" onClick={() => onUpdateComposition({ width: 3840, height: 2160 })} />
                <PresetButton label="Square" onClick={() => onUpdateComposition({ width: 1080, height: 1080 })} />
                <PresetButton label="Story" onClick={() => onUpdateComposition({ width: 1080, height: 1920 })} />
              </div>
            </PropertyGroup>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
            No composition
          </div>
        )}
      </div>
    );
  }

  // Element inspector (placeholder)
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <Settings className="w-4 h-4 text-white/50" />
        <span className="text-sm text-white font-medium">Element</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-white/50 text-sm">
          Selected: {selectedElement}
        </p>
        {/* Element-specific properties would go here */}
      </div>
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

interface PropertyGroupProps {
  label: string;
  children: React.ReactNode;
}

const PropertyGroup: React.FC<PropertyGroupProps> = ({ label, children }) => (
  <div>
    <label className="block text-xs text-white/50 mb-1">{label}</label>
    {children}
  </div>
);

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}) => (
  <div className="flex items-center gap-1">
    <span className="text-xs text-white/40 w-3">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="flex-1 px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:border-blue-500 focus:outline-none"
    />
  </div>
);

interface PresetButtonProps {
  label: string;
  onClick: () => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-2 py-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
  >
    {label}
  </button>
);
