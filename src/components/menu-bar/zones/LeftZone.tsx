/**
 * LeftZone
 * 
 * Left portion of the menu bar containing:
 * - Liquid Menu (✦ brand logo)
 * - App name (bold)
 * - Standard menus: File, Edit, Agent, View, Memory
 * - Custom app menus (injected)
 * - Context menu
 * - Help menu
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useMenuBar } from '@/context/MenuBarContext';
import { MenuBarButton, MenuDropdown } from '../primitives/MenuPrimitives';
import { useLiquidMenuItems } from '../menus/LiquidMenu';
import { useFileMenuItems } from '../menus/FileMenu';
import { useEditMenuItems } from '../menus/EditMenu';
import { useAgentMenuItems } from '../menus/AgentMenu';
import { useViewMenuItems } from '../menus/ViewMenu';
import { useMemoryMenuItems } from '../menus/MemoryMenu';
import { useContextMenuItems } from '../menus/ContextMenu';
import { useHelpMenuItems } from '../menus/HelpMenu';

export const LeftZone: React.FC = () => {
    const { state, openMenuId, setOpenMenuId } = useMenuBar();

    // Get menu items from each menu definition
    const liquidMenuItems = useLiquidMenuItems();
    const fileMenuItems = useFileMenuItems();
    const editMenuItems = useEditMenuItems();
    const agentMenuItems = useAgentMenuItems();
    const viewMenuItems = useViewMenuItems();
    const memoryMenuItems = useMemoryMenuItems();
    const contextMenuItems = useContextMenuItems();
    const helpMenuItems = useHelpMenuItems();

    // Standard menu definitions
    const standardMenus = [
        { id: 'file', label: 'File', items: fileMenuItems },
        { id: 'edit', label: 'Edit', items: editMenuItems },
        { id: 'agent', label: 'Agent', items: agentMenuItems },
        { id: 'view', label: 'View', items: viewMenuItems },
        { id: 'memory', label: 'Memory', items: memoryMenuItems },
    ];

    // All menus in order (standard + custom + context + help)
    const allMenus = [
        ...standardMenus,
        ...state.customMenus,
        { id: 'context', label: 'Context', items: contextMenuItems },
        { id: 'help', label: 'Help', items: helpMenuItems },
    ];

    const handleMenuClick = (menuId: string) => {
        setOpenMenuId(openMenuId === menuId ? null : menuId);
    };

    const handleMenuHover = (menuId: string) => {
        // Only switch on hover if a menu is already open
        if (openMenuId !== null) {
            setOpenMenuId(menuId);
        }
    };

    const handleItemClick = () => {
        setOpenMenuId(null);
    };

    // Get app icon component
    const AppIcon = state.appIcon;

    return (
        <nav className="flex items-center gap-0.5" role="menubar">
            {/* Liquid Menu (✦) */}
            <div className="relative">
                <button
                    className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-[4px]",
                        "transition-colors duration-75",
                        openMenuId === 'liquid' && "bg-[var(--glass-surface-active)]",
                        openMenuId !== 'liquid' && "hover:bg-[var(--glass-surface-hover)]"
                    )}
                    onClick={() => handleMenuClick('liquid')}
                    onMouseEnter={() => handleMenuHover('liquid')}
                    aria-label="Liquid Menu"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === 'liquid'}
                >
                    <Sparkles size={14} className="text-[var(--color-accent)]" />
                </button>
                <MenuDropdown
                    isOpen={openMenuId === 'liquid'}
                    items={liquidMenuItems}
                    onClose={() => setOpenMenuId(null)}
                    onItemClick={handleItemClick}
                />
            </div>

            {/* App Name (Bold) */}
            <div className="flex items-center gap-1.5 px-2">
                {AppIcon && (
                    <AppIcon size={14} className="text-[var(--glass-text-secondary)]" />
                )}
                <span className="font-semibold select-none">{state.appName}</span>
            </div>

            {/* All Menus */}
            {allMenus.map(menu => (
                <div key={menu.id} className="relative">
                    <MenuBarButton
                        label={menu.label}
                        isOpen={openMenuId === menu.id}
                        onClick={() => handleMenuClick(menu.id)}
                        onMouseEnter={() => handleMenuHover(menu.id)}
                    />
                    <MenuDropdown
                        isOpen={openMenuId === menu.id}
                        items={menu.items}
                        onClose={() => setOpenMenuId(null)}
                        onItemClick={handleItemClick}
                    />
                </div>
            ))}
        </nav>
    );
};

LeftZone.displayName = 'LeftZone';
