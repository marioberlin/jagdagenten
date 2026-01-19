/**
 * ViewMenu
 * 
 * Standard View menu following macOS HIG patterns.
 * Provides display and appearance controls.
 */
import { useMemo } from 'react';
import {
    PanelLeftClose,
    PanelBottom,
    Maximize,
    ZoomIn,
    ZoomOut,
    Scan,
    Sun,
    Moon,
    Monitor,
    Palette
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { MenuItemDef } from '@/context/MenuBarContext';

export function useViewMenuItems(): MenuItemDef[] {
    const { theme, toggleTheme } = useTheme();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'toggle-sidebar',
            label: 'Toggle Sidebar',
            icon: PanelLeftClose,
            shortcut: '⌘\\',
            action: () => {
                // TODO: Toggle sidebar
                console.log('Toggle sidebar');
            },
        },
        {
            id: 'toggle-dock',
            label: 'Toggle Dock',
            icon: PanelBottom,
            shortcut: '⇧Space',
            action: () => {
                // TODO: Toggle dock visibility
                console.log('Toggle dock');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },
        {
            id: 'full-screen',
            label: 'Enter Full Screen',
            icon: Maximize,
            shortcut: '⌃⌘F',
            action: () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            },
        },
        {
            id: 'zoom-in',
            label: 'Zoom In',
            icon: ZoomIn,
            shortcut: '⌘+',
            action: () => {
                console.log('Zoom in');
            },
        },
        {
            id: 'zoom-out',
            label: 'Zoom Out',
            icon: ZoomOut,
            shortcut: '⌘-',
            action: () => {
                console.log('Zoom out');
            },
        },
        {
            id: 'actual-size',
            label: 'Actual Size',
            icon: Scan,
            shortcut: '⌘0',
            action: () => {
                console.log('Reset zoom');
            },
        },
        { id: 'sep-2', label: '', dividerAfter: true },
        {
            id: 'appearance',
            label: 'Appearance',
            icon: Sun,
            submenu: [
                {
                    id: 'light',
                    label: 'Light',
                    icon: Sun,
                    checked: theme === 'light',
                    action: () => {
                        if (theme !== 'light') toggleTheme();
                    },
                },
                {
                    id: 'dark',
                    label: 'Dark',
                    icon: Moon,
                    checked: theme === 'dark',
                    action: () => {
                        if (theme !== 'dark') toggleTheme();
                    },
                },
                {
                    id: 'auto',
                    label: 'Auto',
                    icon: Monitor,
                    checked: false, // TODO: Track auto mode
                    action: () => {
                        // TODO: Auto mode based on system preference
                        console.log('Auto theme');
                    },
                },
            ],
        },
        {
            id: 'theme',
            label: 'Theme',
            icon: Palette,
            submenu: [
                {
                    id: 'liquid-glass',
                    label: 'Liquid Glass',
                    checked: true,
                    action: () => console.log('Liquid Glass theme'),
                },
                {
                    id: 'native-hig',
                    label: 'Native HIG',
                    action: () => console.log('Native HIG theme'),
                },
                {
                    id: 'cyberpunk',
                    label: 'Cyberpunk',
                    action: () => console.log('Cyberpunk theme'),
                },
                {
                    id: 'minimal',
                    label: 'Minimal',
                    action: () => console.log('Minimal theme'),
                },
            ],
        },
    ], [theme, toggleTheme]);
}
