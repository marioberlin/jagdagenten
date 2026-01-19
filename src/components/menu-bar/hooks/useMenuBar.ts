/**
 * useMenuBar Hook
 * 
 * Convenience hook for apps to register their menus and status icons.
 * Handles cleanup on unmount automatically.
 */
import { useEffect, useCallback } from 'react';
import { useMenuBar as useMenuBarContext, type MenuDef, type StatusIconDef, type PrivacyIndicators } from '@/context/MenuBarContext';
import type { LucideIcon } from 'lucide-react';

interface UseAppMenuBarOptions {
    appName: string;
    appIcon?: LucideIcon;
    menus?: MenuDef[];
    statusIcons?: StatusIconDef[];
    privacyIndicators?: Partial<PrivacyIndicators>;
}

/**
 * Register an app's menu bar configuration.
 * Automatically cleans up on unmount.
 */
export function useAppMenuBar(options: UseAppMenuBarOptions) {
    const {
        setAppIdentity,
        registerMenu,
        unregisterMenu,
        registerStatusIcon,
        unregisterStatusIcon,
        setPrivacyIndicator,
    } = useMenuBarContext();

    useEffect(() => {
        // Set app identity
        setAppIdentity(options.appName, options.appIcon);

        // Register custom menus
        options.menus?.forEach(menu => registerMenu(menu));

        // Register status icons
        options.statusIcons?.forEach(icon => registerStatusIcon(icon));

        // Set privacy indicators
        if (options.privacyIndicators) {
            Object.entries(options.privacyIndicators).forEach(([key, value]) => {
                if (value !== undefined) {
                    setPrivacyIndicator(key as keyof PrivacyIndicators, value);
                }
            });
        }

        // Cleanup on unmount
        return () => {
            setAppIdentity('LiquidOS');
            options.menus?.forEach(menu => unregisterMenu(menu.id));
            options.statusIcons?.forEach(icon => unregisterStatusIcon(icon.id));
            // Reset privacy indicators
            if (options.privacyIndicators) {
                Object.keys(options.privacyIndicators).forEach(key => {
                    setPrivacyIndicator(key as keyof PrivacyIndicators, false);
                });
            }
        };
    }, [
        options.appName,
        options.appIcon,
        JSON.stringify(options.menus?.map(m => m.id)),
        JSON.stringify(options.statusIcons?.map(i => i.id)),
    ]);
}

/**
 * Get menu bar actions without any registration.
 * Useful for triggering actions from within an app.
 */
export function useMenuBarActions() {
    const context = useMenuBarContext();

    return {
        registerMenu: context.registerMenu,
        unregisterMenu: context.unregisterMenu,
        registerStatusIcon: context.registerStatusIcon,
        unregisterStatusIcon: context.unregisterStatusIcon,
        setPrivacyIndicator: context.setPrivacyIndicator,
    };
}

// Re-export the base hook for direct access
export { useMenuBar } from '@/context/MenuBarContext';
