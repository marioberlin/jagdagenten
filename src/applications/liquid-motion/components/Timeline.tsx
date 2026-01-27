/**
 * Timeline Component
 *
 * Video timeline editor with tracks, events, and playhead.
 */
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { Composition, TimelineTrack, TimelineEvent } from '../types';

interface TimelineProps {
  composition: Composition | null;
  tracks: TimelineTrack[];
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  onSelectElement: (elementId: string | null) => void;
  selectedElement: string | null;
}

export const Timeline: React.FC<TimelineProps> = ({
  composition,
  tracks,
  currentFrame,
  onFrameChange,
  onSelectElement,
  selectedElement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Calculate timeline dimensions
  const totalFrames = composition?.durationInFrames || 300;
  const fps = composition?.fps || 30;
  const pixelsPerFrame = 4 * zoom;
  const totalWidth = totalFrames * pixelsPerFrame;

  // Generate time markers
  const markers = useMemo(() => {
    const result: { frame: number; label: string }[] = [];
    const interval = Math.ceil(30 / zoom); // Adjust marker interval based on zoom

    for (let frame = 0; frame <= totalFrames; frame += interval) {
      const seconds = frame / fps;
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      result.push({
        frame,
        label: `${minutes}:${String(secs).padStart(2, '0')}`,
      });
    }

    return result;
  }, [totalFrames, fps, zoom]);

  // Handle timeline click
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const frame = Math.round(x / pixelsPerFrame);
      onFrameChange(Math.max(0, Math.min(totalFrames - 1, frame)));
    },
    [pixelsPerFrame, scrollOffset, totalFrames, onFrameChange]
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollLeft);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(0.25, Math.min(4, prev + delta)));
  }, []);

  // Playhead position
  const playheadX = currentFrame * pixelsPerFrame;

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">Zoom:</span>
          <button
            onClick={() => handleZoom(-0.25)}
            className="px-2 py-0.5 text-xs text-white/70 hover:bg-white/10 rounded"
          >
            -
          </button>
          <span className="text-white text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom(0.25)}
            className="px-2 py-0.5 text-xs text-white/70 hover:bg-white/10 rounded"
          >
            +
          </button>
        </div>
        <div className="text-white/50 text-xs">
          {tracks.length} tracks | {totalFrames} frames
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div className="w-32 flex-shrink-0 border-r border-white/10">
          {/* Time ruler header */}
          <div className="h-6 border-b border-white/10" />

          {/* Track labels */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className="h-12 px-2 flex items-center border-b border-white/10"
            >
              <span
                className={cn(
                  'text-xs truncate',
                  track.muted ? 'text-white/30' : 'text-white/70'
                )}
              >
                {track.name}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={handleScroll}
          onClick={handleTimelineClick}
        >
          <div style={{ width: totalWidth, minWidth: '100%' }} className="relative">
            {/* Time Ruler */}
            <div className="h-6 border-b border-white/10 relative">
              {markers.map(({ frame, label }) => (
                <div
                  key={frame}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: frame * pixelsPerFrame }}
                >
                  <span className="text-[10px] text-white/40">{label}</span>
                  <div className="w-px h-2 bg-white/20" />
                </div>
              ))}
            </div>

            {/* Tracks */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-12 border-b border-white/10 relative"
              >
                {/* Events */}
                {track.events.map((event) => (
                  <TimelineEventBlock
                    key={event.id}
                    event={event}
                    track={track}
                    pixelsPerFrame={pixelsPerFrame}
                    isSelected={selectedElement === event.id}
                    onSelect={() => onSelectElement(event.id)}
                  />
                ))}
              </div>
            ))}

            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-10"
              style={{ left: playheadX }}
              initial={false}
              animate={{ left: playheadX }}
              transition={{ type: 'tween', duration: 0.05 }}
            >
              {/* Playhead handle */}
              <div className="absolute -top-1 -left-2 w-4 h-3 bg-red-500 rounded-b" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Event Block Component
// ============================================================================

interface TimelineEventBlockProps {
  event: TimelineEvent;
  track: TimelineTrack;
  pixelsPerFrame: number;
  isSelected: boolean;
  onSelect: () => void;
}

const TimelineEventBlock: React.FC<TimelineEventBlockProps> = ({
  event,
  track,
  pixelsPerFrame,
  isSelected,
  onSelect,
}) => {
  const left = event.startFrame * pixelsPerFrame;
  const width = (event.endFrame - event.startFrame) * pixelsPerFrame;

  // Color based on type
  const colors: Record<string, string> = {
    video: 'bg-blue-500/60',
    audio: 'bg-green-500/60',
    text: 'bg-yellow-500/60',
    image: 'bg-purple-500/60',
    shape: 'bg-pink-500/60',
    effect: 'bg-orange-500/60',
  };

  return (
    <div
      className={cn(
        'absolute top-1 bottom-1 rounded cursor-pointer transition-all',
        colors[track.type] || 'bg-gray-500/60',
        isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-transparent'
      )}
      style={{ left, width: Math.max(width, 4) }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {width > 40 && (
        <span className="absolute left-1 top-1 text-[10px] text-white truncate pr-1">
          {event.name || event.type}
        </span>
      )}
    </div>
  );
};
