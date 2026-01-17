import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassPopoverProps {
    trigger?: React.ReactNode;
    children?: React.ReactNode;
    content?: React.ReactNode;
    width?: number;
    className?: string;
}

export const GlassPopover = ({ trigger, children, content, width = 350, className }: GlassPopoverProps) => {
    const triggerElement = trigger || children;
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const updatePosition = () => {
            if (triggerRef.current && isOpen) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY + 8, // 8px Offset
                    left: rect.left + window.scrollX + (rect.width / 2) // Center horizontally
                });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Handle clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is on trigger or inside popover content
            if (
                triggerRef.current &&
                triggerRef.current.contains(event.target as Node)
            ) {
                return;
            }

            if ((event.target as Element).closest('.glass-popover-content')) {
                return;
            }

            setIsOpen(false);
        };

        if (isOpen) {
            // Delay listener to prevent catching the opening click
            const timer = setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 0);

            return () => {
                clearTimeout(timer);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen]);

    return (
        <>
            {/* Trigger */}
            <div
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer inline-block"
            >
                {triggerElement}
            </div>

            {/* Portal Content */}
            {isOpen && createPortal(
                <div
                    className={cn(
                        "glass-popover-content fixed z-[9999] transition-all duration-200",
                        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translateX(-50%)', // Center alignment
                        width
                    }}
                >
                    <GlassContainer
                        material="thick"
                        className={cn(
                            "p-4 rounded-xl shadow-2xl backdrop-blur-xl border border-[var(--glass-border)]",
                            className
                        )}
                    >
                        {content || children}
                    </GlassContainer>
                </div>,
                document.body
            )}
        </>
    );
};
