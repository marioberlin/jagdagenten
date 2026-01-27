/**
 * Preview Component
 *
 * Canvas-based video preview with real-time rendering.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import type { Composition } from '../types';

interface PreviewProps {
  composition: Composition | null;
  currentFrame: number;
  isPlaying: boolean;
  className?: string;
}

export const Preview: React.FC<PreviewProps> = ({
  composition,
  currentFrame,
  isPlaying: _isPlaying,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate display dimensions maintaining aspect ratio
  const aspectRatio = composition ? composition.width / composition.height : 16 / 9;

  // Render frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !composition) return;

    // Clear canvas
    ctx.fillStyle = composition.backgroundColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // In production, this would render composition elements
    // For now, show a placeholder

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw center crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    // Draw frame info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Frame: ${currentFrame}`, 20, canvas.height - 40);
    ctx.fillText(`Time: ${(currentFrame / composition.fps).toFixed(2)}s`, 20, canvas.height - 20);

    // Draw composition name
    ctx.textAlign = 'center';
    ctx.fillText(composition.name, cx, 30);
  }, [composition, currentFrame]);

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !composition) return;

    // Set canvas to composition size
    canvas.width = composition.width;
    canvas.height = composition.height;

    renderFrame();
  }, [composition, renderFrame]);

  // Render on frame change
  useEffect(() => {
    renderFrame();
  }, [currentFrame, renderFrame]);

  if (!composition) {
    return (
      <div className={cn('flex items-center justify-center text-white/50', className)}>
        No composition loaded
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex items-center justify-center', className)}
      style={{ aspectRatio }}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain bg-black shadow-2xl"
        style={{
          aspectRatio,
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />

      {/* Safe area overlay (optional) */}
      <div
        className="absolute pointer-events-none"
        style={{
          aspectRatio,
          width: 'auto',
          height: 'auto',
          maxWidth: '90%',
          maxHeight: '90%',
        }}
      >
        {/* Title safe (80%) */}
        <div className="absolute inset-[10%] border border-white/10 rounded pointer-events-none" />
        {/* Action safe (90%) */}
        <div className="absolute inset-[5%] border border-white/5 pointer-events-none" />
      </div>
    </div>
  );
};
