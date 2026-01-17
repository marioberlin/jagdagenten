import React, { useState, useEffect, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassContextMenuProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    className?: string;
}

export const GlassContextMenu = ({ trigger, content, className }: GlassContextMenuProps) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setVisible(true);
        setPosition({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <div onContextMenu={handleContextMenu} className="inline-block relative">
            {trigger}
            {visible && (
                <div
                    className="fixed z-[100] min-w-[150px]"
                    style={{ top: position.y, left: position.x }}
                    ref={menuRef}
                >
                    <GlassContainer material="thick" className={cn("p-1 shadow-2xl rounded-xl border border-[var(--glass-border)]", className)}>
                        {content}
                    </GlassContainer>
                </div>
            )}
        </div>
    );
};

GlassContextMenu.displayName = 'GlassContextMenu';
