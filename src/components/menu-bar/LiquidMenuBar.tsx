/**
 * LiquidMenuBar
 * 
 * The main menu bar container for LiquidOS.
 * A persistent, system-level UI element following macOS HIG patterns.
 * 
 * Features:
 * - 30px height (24px + 6px for comfortable spacing)
 * - Glass material with blur effect
 * - Left zone: Liquid menu + App name + Standard menus + Custom menus
 * - Right zone: Status icons + Theme toggle + Control center
 */
import React, { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useMenuBar } from '@/context/MenuBarContext';
import { LeftZone } from './zones/LeftZone';
import { RightZone } from './zones/RightZone';

interface LiquidMenuBarProps {
    className?: string;
}

export const LiquidMenuBar: React.FC<LiquidMenuBarProps> = ({ className }) => {
    const { openMenuId, setOpenMenuId } = useMenuBar();

    // Close menus on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && openMenuId) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [openMenuId, setOpenMenuId]);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if click is inside the menu bar
            if (!target.closest('[data-menubar]') && !target.closest('[data-menu-dropdown]')) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [openMenuId, setOpenMenuId]);

    return (
        <header
            data-menubar
            className={cn(
                // Fixed positioning at top
                "fixed top-0 left-0 right-0 z-[100]",
                // Height: 26px (macOS 24px + 2px for better spacing)
                "h-[30px]",
                // Flexbox layout
                "flex items-center justify-between",
                // Glass material
                "bg-[var(--glass-bg-thin)] backdrop-blur-xl",

                // Typography
                "text-[13px] font-normal text-[var(--glass-text-primary)]",
                // Padding
                "px-3",
                className
            )}
            role="menubar"
            aria-label="Liquid OS Menu Bar"
        >
            <LeftZone />
            <RightZone />
        </header>
    );
};

LiquidMenuBar.displayName = 'LiquidMenuBar';
