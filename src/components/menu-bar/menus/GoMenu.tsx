import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItemDef } from '@/context/MenuBarContext';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { resolveIconComponent } from '@/system/app-store/iconResolver';
import { REMOTE_AGENTS } from '@/config/remote-agents.config';
import {
    Layout,
    Briefcase,
    Bot,
    Layers,
    Palette,
    FileCode,
    Gauge,
    Map,
    Package
} from 'lucide-react';

export const useGoMenuItems = (): MenuItemDef[] => {
    const navigate = useNavigate();
    const openApp = useAppStoreStore((s) => s.openApp);
    const installedApps = useAppStoreStore((s) => s.installedApps);

    const appMenuItems = useMemo((): MenuItemDef[] => {
        // System items always at top
        const systemItems: MenuItemDef[] = [
            {
                id: 'app-cowork',
                label: 'Cowork Mode',
                icon: Briefcase,
                action: () => window.dispatchEvent(new CustomEvent('liquid:toggle-cowork')),
            },
            {
                id: 'app-command',
                label: 'Command Center',
                icon: Layout,
                action: () => navigate('/os'),
                dividerAfter: true,
            },
        ];

        // Dynamic items from installed apps (sorted alphabetically)
        const dynamicItems: MenuItemDef[] = Object.values(installedApps)
            .filter(app => !app.id.startsWith('_system'))
            .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
            .map(app => ({
                id: `app-${app.id}`,
                label: app.manifest.name,
                icon: (resolveIconComponent(app.manifest.icon) ?? Package) as any,
                action: () => openApp(app.id),
            }));

        return [...systemItems, ...dynamicItems];
    }, [installedApps, openApp, navigate]);

    return [
        {
            id: 'apps',
            label: 'Apps',
            submenu: appMenuItems,
        },
        {
            id: 'agents',
            label: 'Agents',
            submenu: REMOTE_AGENTS.map(agent => ({
                id: `agent-${agent.id}`,
                label: agent.name,
                icon: Bot,
                action: () => openApp('agent-hub')
            }))
        },
        {
            id: 'demos',
            label: 'Demos',
            submenu: [
                { id: 'demo-neon', label: 'Neon Tokyo', icon: Map, action: () => openApp('neon-tokyo') },
                { id: 'demo-weather', label: 'Aurora Weather', icon: Gauge, action: () => openApp('aurora-weather') },
                { id: 'demo-sheets', label: 'Liquid Sheets', icon: FileCode, action: () => openApp('sheets') },
                { id: 'demo-research', label: 'Research Canvas', icon: Layers, action: () => openApp('demos') }
            ]
        },
        {
            id: 'showcase',
            label: 'Showcase',
            submenu: [
                { id: 'sc-foundation', label: 'Foundation', icon: Palette, action: () => openApp('_system/showcase') },
                { id: 'sc-components', label: 'Components', icon: Layers, action: () => openApp('_system/showcase') },
                { id: 'sc-patterns', label: 'Patterns', icon: FileCode, action: () => openApp('_system/showcase') }
            ]
        }
    ];
};
