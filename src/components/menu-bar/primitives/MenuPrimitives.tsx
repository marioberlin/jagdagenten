/**
 * Menu Bar Primitives
 * 
 * Core building blocks for the menu bar system.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import type { MenuItemDef } from '@/context/MenuBarContext';

// =============================================================================
// MenuBarButton
// =============================================================================

interface MenuBarButtonProps {
    label: string;
    isOpen: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    disabled?: boolean;
    isBold?: boolean;
}

export const MenuBarButton: React.FC<MenuBarButtonProps> = ({
    label,
    isOpen,
    onClick,
    onMouseEnter,
    disabled = false,
    isBold = false,
}) => {
    return (
        <button
            className={cn(
                "px-2 py-0.5 rounded-[4px] select-none",
                "transition-colors duration-75",
                isOpen && "bg-[var(--glass-surface-active)]",
                !disabled && !isOpen && "hover:bg-[var(--glass-surface-hover)]",
                disabled && "opacity-50 cursor-not-allowed",
                isBold && "font-semibold"
            )}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            disabled={disabled}
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={isOpen}
        >
            {label}
        </button>
    );
};

// =============================================================================
// MenuDropdown
// =============================================================================

interface MenuDropdownProps {
    isOpen: boolean;
    items: MenuItemDef[];
    onClose: () => void;
    onItemClick: (item: MenuItemDef) => void;
    align?: 'left' | 'right';
    className?: string;
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({
    isOpen,
    items,
    onClose,
    onItemClick,
    align = 'left',
    className,
}) => {
    const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-menu-dropdown
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    className={cn(
                        "absolute top-full mt-0.5 z-50",
                        align === 'left' ? 'left-0' : 'right-0',
                        className
                    )}
                >
                    <GlassContainer
                        material="thick"
                        className="min-w-[200px] max-w-[320px] py-1 shadow-lg rounded-lg overflow-visible"
                    >
                        {items.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <MenuItem
                                    item={item}
                                    onClick={() => onItemClick(item)}
                                    onSubmenuHover={(id) => setHoveredSubmenu(id)}
                                    isSubmenuOpen={hoveredSubmenu === item.id}
                                />
                                {item.dividerAfter && <MenuSeparator />}
                            </React.Fragment>
                        ))}
                    </GlassContainer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// =============================================================================
// MenuItem
// =============================================================================

interface MenuItemProps {
    item: MenuItemDef;
    onClick: () => void;
    onSubmenuHover?: (id: string | null) => void;
    isSubmenuOpen?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    item,
    onClick,
    onSubmenuHover,
    isSubmenuOpen = false,
}) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const Icon = item.icon;
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleMouseEnter = () => {
        if (hasSubmenu && onSubmenuHover) {
            clearTimeout(timeoutRef.current);
            onSubmenuHover(item.id);
        }
    };

    const handleMouseLeave = () => {
        if (hasSubmenu && onSubmenuHover) {
            timeoutRef.current = setTimeout(() => {
                onSubmenuHover(null);
            }, 100);
        }
    };

    const handleClick = () => {
        if (!hasSubmenu && !item.disabled && item.action) {
            item.action();
            onClick();
        }
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={cn(
                    "w-full flex items-center justify-between gap-4 px-3 py-1.5 text-left",
                    "text-[13px] select-none",
                    "transition-colors duration-75",
                    !item.disabled && "hover:bg-[var(--glass-surface-hover)]",
                    item.disabled && "opacity-40 cursor-not-allowed",
                    item.danger && "text-[var(--system-red)]"
                )}
                onClick={handleClick}
                disabled={item.disabled}
                role="menuitem"
                aria-disabled={item.disabled}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {Icon && (
                        <Icon
                            size={14}
                            className={cn(
                                "flex-shrink-0",
                                item.danger ? "text-[var(--system-red)]" : "text-[var(--glass-text-secondary)]"
                            )}
                        />
                    )}
                    <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {item.checked && (
                        <span className="text-[var(--color-accent)]">✓</span>
                    )}
                    {item.shortcut && (
                        <span className="text-[11px] text-[var(--glass-text-tertiary)] font-mono">
                            {item.shortcut}
                        </span>
                    )}
                    {hasSubmenu && (
                        <ChevronRight size={12} className="text-[var(--glass-text-tertiary)]" />
                    )}
                </div>
            </button>

            {/* Submenu */}
            {hasSubmenu && isSubmenuOpen && (
                <div className="absolute left-full top-0 ml-0.5">
                    <GlassContainer
                        material="thick"
                        className="min-w-[180px] py-1 shadow-lg rounded-lg overflow-hidden"
                    >
                        {item.submenu!.map((subItem) => (
                            <React.Fragment key={subItem.id}>
                                <MenuItem
                                    item={subItem}
                                    onClick={onClick}
                                />
                                {subItem.dividerAfter && <MenuSeparator />}
                            </React.Fragment>
                        ))}
                    </GlassContainer>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// MenuSeparator
// =============================================================================

export const MenuSeparator: React.FC = () => (
    <div className="h-px bg-[var(--glass-border)] mx-2 my-1" />
);

// =============================================================================
// Exports
// =============================================================================

MenuBarButton.displayName = 'MenuBarButton';
MenuDropdown.displayName = 'MenuDropdown';
MenuItem.displayName = 'MenuItem';
MenuSeparator.displayName = 'MenuSeparator';
