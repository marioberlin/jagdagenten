/**
 * IBird Resize Handle
 * 
 * Draggable handle component for resizing adjacent panels.
 * Used between sidebar, message list, and reading pane.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface IBirdResizeHandleProps {
    /** Callback fired during drag with the delta in pixels */
    onResize: (delta: number) => void;
    /** Optional: Callback fired when drag ends */
    onResizeEnd?: () => void;
    /** Orientation of the resize handle */
    orientation?: 'vertical' | 'horizontal';
    /** Disable the handle */
    disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function IBirdResizeHandle({
    onResize,
    onResizeEnd,
    orientation = 'vertical',
    disabled = false,
}: IBirdResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startPosRef = useRef<number>(0);
    const handleRef = useRef<HTMLDivElement>(null);

    // Handle mouse events
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
        startPosRef.current = orientation === 'vertical' ? e.clientX : e.clientY;
    }, [disabled, orientation]);

    // Handle mouse move during drag
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
            const delta = currentPos - startPosRef.current;

            if (delta !== 0) {
                onResize(delta);
                startPosRef.current = currentPos;
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onResizeEnd?.();
        };

        // Add listeners to document to capture movement outside the handle
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Change cursor globally during drag
        document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, onResize, onResizeEnd, orientation]);

    // Keyboard support for accessibility
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (disabled) return;

        const step = e.shiftKey ? 10 : 2;

        if (orientation === 'vertical') {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onResize(-step);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onResize(step);
            }
        } else {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                onResize(-step);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onResize(step);
            }
        }
    }, [disabled, onResize, orientation]);

    const isVertical = orientation === 'vertical';

    return (
        <div
            ref={handleRef}
            role="separator"
            aria-orientation={orientation}
            aria-valuenow={0}
            tabIndex={disabled ? -1 : 0}
            onMouseDown={handleMouseDown}
            onKeyDown={handleKeyDown}
            className={cn(
                'relative flex-shrink-0 group',
                isVertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
                'hover:bg-[var(--glass-accent)]/20 transition-colors duration-150',
                isDragging && 'bg-[var(--glass-accent)]/30',
                disabled && 'opacity-50 cursor-default pointer-events-none'
            )}
        >
            {/* Visual indicator line */}
            <div
                className={cn(
                    'absolute transition-all duration-150',
                    isVertical
                        ? 'inset-y-0 left-1/2 -translate-x-1/2 w-0.5'
                        : 'inset-x-0 top-1/2 -translate-y-1/2 h-0.5',
                    'bg-[var(--glass-border)]',
                    'group-hover:bg-[var(--glass-accent)] group-hover:shadow-[0_0_4px_var(--glass-accent)]',
                    isDragging && 'bg-[var(--glass-accent)] shadow-[0_0_6px_var(--glass-accent)]'
                )}
            />

            {/* Hit area expansion for easier grabbing */}
            <div
                className={cn(
                    'absolute',
                    isVertical
                        ? 'inset-y-0 -left-1 -right-1'
                        : 'inset-x-0 -top-1 -bottom-1'
                )}
            />
        </div>
    );
}

export default IBirdResizeHandle;
