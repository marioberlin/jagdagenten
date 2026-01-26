/**
 * Export Modal Component
 *
 * Modal for configuring video export settings.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Film } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Composition, RenderOptions } from '../types';

interface ExportModalProps {
  composition: Composition | null;
  onExport: (options: RenderOptions) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  composition,
  onExport,
  onClose,
}) => {
  const [format, setFormat] = useState<RenderOptions['format']>('mp4');
  const [codec, setCodec] = useState<RenderOptions['codec']>('h264');
  const [quality, setQuality] = useState<RenderOptions['quality']>('high');

  if (!composition) return null;

  const handleExport = () => {
    onExport({
      format,
      codec,
      quality,
    });
  };

  const estimatedSize = getEstimatedSize(composition, format, quality);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-medium">Export Video</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Composition Info */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Film className="w-8 h-8 text-white/30" />
            <div>
              <div className="text-white font-medium">{composition.name}</div>
              <div className="text-xs text-white/50">
                {composition.width}×{composition.height} • {composition.fps}fps •{' '}
                {(composition.durationInFrames / composition.fps).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs text-white/50 mb-2">Format</label>
            <div className="grid grid-cols-4 gap-2">
              {(['mp4', 'webm', 'gif', 'mov'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    'px-3 py-2 text-sm rounded transition-colors',
                    format === f
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  )}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Codec (only for video formats) */}
          {(format === 'mp4' || format === 'webm' || format === 'mov') && (
            <div>
              <label className="block text-xs text-white/50 mb-2">Codec</label>
              <select
                value={codec}
                onChange={(e) => setCodec(e.target.value as RenderOptions['codec'])}
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded text-white focus:border-blue-500 focus:outline-none"
              >
                {format === 'webm' ? (
                  <>
                    <option value="vp8">VP8</option>
                    <option value="vp9">VP9</option>
                  </>
                ) : (
                  <>
                    <option value="h264">H.264 (Most compatible)</option>
                    <option value="h265">H.265 (Smaller file size)</option>
                    {format === 'mov' && <option value="prores">ProRes (Professional)</option>}
                  </>
                )}
              </select>
            </div>
          )}

          {/* Quality */}
          <div>
            <label className="block text-xs text-white/50 mb-2">Quality</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'lossless'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={cn(
                    'px-3 py-2 text-sm rounded capitalize transition-colors',
                    quality === q
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Output */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-xs text-white/50">Estimated file size</span>
            <span className="text-sm text-white font-mono">{estimatedSize}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper to estimate file size
function getEstimatedSize(
  composition: Composition,
  format: RenderOptions['format'],
  quality: RenderOptions['quality']
): string {
  const duration = composition.durationInFrames / composition.fps;
  const pixels = composition.width * composition.height;

  // Very rough estimates
  const qualityMultipliers: Record<string, number> = {
    low: 0.3,
    medium: 0.6,
    high: 1,
    lossless: 3,
  };

  const formatMultipliers: Record<string, number> = {
    mp4: 1,
    webm: 0.8,
    gif: 2,
    mov: 1.5,
    'png-sequence': 10,
  };

  // Base: ~2MB per second at 1080p
  const baseMbPerSecond = (pixels / (1920 * 1080)) * 2;
  const estimatedMb =
    baseMbPerSecond *
    duration *
    (qualityMultipliers[quality || 'high'] || 1) *
    (formatMultipliers[format] || 1);

  if (estimatedMb < 1) {
    return `~${Math.round(estimatedMb * 1024)} KB`;
  }
  if (estimatedMb < 1024) {
    return `~${Math.round(estimatedMb)} MB`;
  }
  return `~${(estimatedMb / 1024).toFixed(1)} GB`;
}
