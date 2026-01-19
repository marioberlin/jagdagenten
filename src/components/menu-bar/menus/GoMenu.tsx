import { useNavigate } from 'react-router-dom';
import { useMenuBar } from '@/context/MenuBarContext';
import { MenuItemDef } from '@/context/MenuBarContext';
import { REMOTE_AGENTS } from '@/config/remote-agents.config';
import {
    Layout,
    Zap,
    Terminaal, // Typo intentional to check if lucide has it, realized it's Terminal
    Terminal,
    Briefcase,
    Compass,
    Bot,
    Layers,
    Palette,
    FileCode,
    Gauge,
    Map
} from 'lucide-react';

export const useGoMenuItems = (): MenuItemDef[] => {
    const navigate = useNavigate();
    const { setOpenMenuId, setCoworkOpen } = useMenuBar(); // Assuming setCoworkOpen is available in context? 
    // LeftZone uses setOpenMenuId. 
    // Wait, setCoworkOpen is typically in LiquidOSLayout state, likely passed down or in a persistent store. 
    // If not in MenuBarContext, we might need to rely on 'Cowork Mode' being an App that routes or finding a way to toggle.
    // LiquidOSLayout has `setCoworkOpen`. But context might not have it unless I check `MenuBarContext.tsx`.

    // For now, let's assume standard navigation / commands. 
    // If Cowork is overlay, it might need a global command or event. 
    // I'll check MenuBarContext.tsx to see what's available. 
    // If not, I'll use navigation to /os/cowork if that route exists, or just placeholders.

    // Re-reading LeftZone.tsx: it doesn't import setCoworkOpen. It seems `setOpenMenuId` is all it has.
    // LiquidOSLayout has `const [coworkOpen, setCoworkOpen] = useState(false)`.
    // It passes `coworkOpen` to Layout but not to Context?
    // Wait, `LiquidMenuBar` is inside `LiquidOSLayout`.
    // Maybe we just navigate to a route? 
    // Or maybe we can't toggle Cowork from here easily without an event bus?
    // "Apps > Cowork Mode" -> Toggle Cowork Panel.
    // If I can't find a clean way, I'll assume navigation or TODO.

    // Actually, earlier in `LiquidOSLayout.tsx`, `dockItems` had `setCoworkOpen`.
    // The MenuBarContext might NOT have it.
    // I will check `MenuBarContext.tsx` quickly before finalizing this file.

    return [
        {
            id: 'apps',
            label: 'Apps',
            submenu: [
                {
                    id: 'app-cowork',
                    label: 'Cowork Mode',
                    icon: Briefcase,
                    action: () => {
                        // Ideally trigger Cowork Panel. 
                        // For now, navigate to '/os?mode=cowork' or similar if supported?
                        // Or dispatch a custom event?
                        window.dispatchEvent(new CustomEvent('liquid:toggle-cowork'));
                    }
                },
                {
                    id: 'app-command',
                    label: 'Command Center',
                    icon: Layout,
                    action: () => navigate('/os')
                },
                {
                    id: 'app-rushhour',
                    label: 'RushHour Terminal',
                    icon: Zap,
                    action: () => navigate('/terminal')
                },
                {
                    id: 'app-hub',
                    label: 'Agent Hub',
                    icon: Compass,
                    action: () => navigate('/os/agents')
                },
                {
                    id: 'app-console',
                    label: 'A2A Console',
                    icon: Terminal,
                    action: () => navigate('/os/console')
                }
            ]
        },
        {
            id: 'agents',
            label: 'Agents',
            submenu: REMOTE_AGENTS.map(agent => ({
                id: `agent-${agent.id}`,
                label: agent.name,
                icon: Bot,
                action: () => navigate(`/os/agents/${agent.id}`)
            }))
        },
        {
            id: 'demos',
            label: 'Demos',
            submenu: [
                { id: 'demo-neon', label: 'Neon Tokyo', icon: Map, action: () => navigate('/os/demos/neon-tokyo') },
                { id: 'demo-weather', label: 'Aurora Weather', icon: Gauge, action: () => navigate('/os/demos/aurora-weather') },
                { id: 'demo-sheets', label: 'Glass Sheets', icon: FileCode, action: () => navigate('/os/demos/sheets') },
                { id: 'demo-research', label: 'Research Canvas', icon: Layers, action: () => navigate('/os/demos/research-canvas') }
            ]
        },
        {
            id: 'showcase',
            label: 'Showcase',
            submenu: [
                { id: 'sc-foundation', label: 'Foundation', icon: Palette, action: () => navigate('/os/showcase/foundation') },
                { id: 'sc-components', label: 'Components', icon: Layers, action: () => navigate('/os/showcase/components') },
                { id: 'sc-patterns', label: 'Patterns', icon: FileCode, action: () => navigate('/os/showcase/patterns') }
            ]
        }
    ];
};
