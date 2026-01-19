/**
 * Menu Bar Module
 * 
 * LiquidOS persistent menu bar system following macOS HIG patterns.
 * Implements the "Many Worlds" architecture where each App can register
 * its own menus, status icons, and identity.
 */

// Main component
export { LiquidMenuBar } from './LiquidMenuBar';

// Context and hooks
export { MenuBarProvider, useMenuBar } from '@/context/MenuBarContext';
export type {
    MenuItemDef,
    MenuDef,
    StatusIconDef,
    PrivacyIndicators,
    MenuBarState,
    MenuBarContextValue,
} from '@/context/MenuBarContext';

// Convenience hooks
export { useAppMenuBar, useMenuBarActions } from './hooks/useMenuBar';

// Primitives (for custom implementations)
export {
    MenuBarButton,
    MenuDropdown,
    MenuItem,
    MenuSeparator
} from './primitives/MenuPrimitives';

// Zones
export { LeftZone } from './zones/LeftZone';
export { RightZone } from './zones/RightZone';
export { ControlCenterPanel } from './zones/ControlCenterPanel';

// Menu definitions (for reference/extension)
export { useLiquidMenuItems } from './menus/LiquidMenu';
export { useFileMenuItems } from './menus/FileMenu';
export { useAgentMenuItems } from './menus/AgentMenu';
export { useViewMenuItems } from './menus/ViewMenu';
export { useContextMenuItems } from './menus/ContextMenu';
export { useHelpMenuItems } from './menus/HelpMenu';
