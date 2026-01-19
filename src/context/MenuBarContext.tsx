/**
 * MenuBarContext
 * 
 * Global context for the Liquid Menu Bar system.
 * Enables "Many Worlds" architecture where each App can register
 * its own menus, status icons, and identity.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface MenuItemDef {
    id: string;
    label: string;
    icon?: LucideIcon;
    shortcut?: string;
    action?: () => void;
    disabled?: boolean;
    danger?: boolean;
    checked?: boolean;
    submenu?: MenuItemDef[];
    dividerAfter?: boolean;
}

export interface MenuDef {
    id: string;
    label: string;
    items: MenuItemDef[];
}

export interface StatusIconDef {
    id: string;
    icon: LucideIcon;
    color?: string;
    tooltip: string;
    onClick?: () => void;
    priority?: number;
}

export interface PrivacyIndicators {
    microphone?: boolean;
    camera?: boolean;
    location?: boolean;
    audio?: boolean;
}

export interface MenuBarState {
    // App identity
    appName: string;
    appIcon?: LucideIcon;

    // Custom menus (inserted between View and Context menus)
    customMenus: MenuDef[];

    // Status icons (right zone)
    statusIcons: StatusIconDef[];

    // Privacy indicators
    privacyIndicators: PrivacyIndicators;
}

export interface MenuBarContextValue {
    state: MenuBarState;

    // Registration methods
    setAppIdentity: (name: string, icon?: LucideIcon) => void;
    registerMenu: (menu: MenuDef) => void;
    unregisterMenu: (menuId: string) => void;
    registerStatusIcon: (icon: StatusIconDef) => void;
    unregisterStatusIcon: (iconId: string) => void;

    // Privacy indicators
    setPrivacyIndicator: (type: keyof PrivacyIndicators, active: boolean) => void;

    // Menu state
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
}

// =============================================================================
// Context
// =============================================================================

const defaultState: MenuBarState = {
    appName: 'LiquidOS',
    appIcon: undefined,
    customMenus: [],
    statusIcons: [],
    privacyIndicators: {},
};

const MenuBarContext = createContext<MenuBarContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export const MenuBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<MenuBarState>(defaultState);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const setAppIdentity = useCallback((name: string, icon?: LucideIcon) => {
        setState(prev => ({
            ...prev,
            appName: name,
            appIcon: icon,
        }));
    }, []);

    const registerMenu = useCallback((menu: MenuDef) => {
        setState(prev => ({
            ...prev,
            customMenus: [...prev.customMenus.filter(m => m.id !== menu.id), menu],
        }));
    }, []);

    const unregisterMenu = useCallback((menuId: string) => {
        setState(prev => ({
            ...prev,
            customMenus: prev.customMenus.filter(m => m.id !== menuId),
        }));
    }, []);

    const registerStatusIcon = useCallback((icon: StatusIconDef) => {
        setState(prev => ({
            ...prev,
            statusIcons: [...prev.statusIcons.filter(i => i.id !== icon.id), icon]
                .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50)),
        }));
    }, []);

    const unregisterStatusIcon = useCallback((iconId: string) => {
        setState(prev => ({
            ...prev,
            statusIcons: prev.statusIcons.filter(i => i.id !== iconId),
        }));
    }, []);

    const setPrivacyIndicator = useCallback((type: keyof PrivacyIndicators, active: boolean) => {
        setState(prev => ({
            ...prev,
            privacyIndicators: {
                ...prev.privacyIndicators,
                [type]: active,
            },
        }));
    }, []);

    const value = useMemo<MenuBarContextValue>(() => ({
        state,
        setAppIdentity,
        registerMenu,
        unregisterMenu,
        registerStatusIcon,
        unregisterStatusIcon,
        setPrivacyIndicator,
        openMenuId,
        setOpenMenuId,
    }), [
        state,
        setAppIdentity,
        registerMenu,
        unregisterMenu,
        registerStatusIcon,
        unregisterStatusIcon,
        setPrivacyIndicator,
        openMenuId,
    ]);

    return (
        <MenuBarContext.Provider value={value}>
            {children}
        </MenuBarContext.Provider>
    );
};

// =============================================================================
// Hook
// =============================================================================

export function useMenuBar(): MenuBarContextValue {
    const context = useContext(MenuBarContext);
    if (!context) {
        throw new Error('useMenuBar must be used within a MenuBarProvider');
    }
    return context;
}

// Reset app identity when leaving an app
export function useResetMenuBarOnUnmount() {
    const { setAppIdentity, unregisterMenu, unregisterStatusIcon, state } = useMenuBar();

    React.useEffect(() => {
        return () => {
            // Reset to default on unmount
            setAppIdentity('LiquidOS');
            // Clean up any custom menus
            state.customMenus.forEach(menu => unregisterMenu(menu.id));
            // Clean up any status icons
            state.statusIcons.forEach(icon => unregisterStatusIcon(icon.id));
        };
    }, []);
}

MenuBarProvider.displayName = 'MenuBarProvider';
