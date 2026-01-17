import type { Meta, StoryObj } from '@storybook/react';
import { GlassSidebar } from './GlassSidebar';
import { Home, Layout, Settings, PieChart, Users, MessageSquare, HelpCircle } from 'lucide-react';

const meta: Meta<typeof GlassSidebar> = {
    title: 'Layout/GlassSidebar',
    component: GlassSidebar,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof GlassSidebar>;

const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className="p-4 mb-6">
            <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-primary">L</div>
                <span className="font-bold text-xl tracking-tight">Liquid</span>
            </div>
        </div>

        <nav className="flex-1 space-y-1">
            {[
                { icon: <Home size={20} />, label: 'Dashboard', active: true },
                { icon: <PieChart size={20} />, label: 'Analytics' },
                { icon: <Layout size={20} />, label: 'Showcase' },
                { icon: <Users size={20} />, label: 'Team' },
                { icon: <MessageSquare size={20} />, label: 'Chat' },
            ].map((item) => (
                <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${item.active
                        ? 'bg-accent/10 text-accent border-r-2 border-accent'
                        : 'text-secondary hover:text-primary hover:bg-glass-surface'
                        }`}
                >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="p-4 mt-auto border-t border-[var(--glass-border)]">
            <button className="w-full flex items-center gap-3 px-2 py-3 text-secondary hover:text-primary transition-colors">
                <Settings size={20} />
                <span className="text-sm font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-3 text-secondary hover:text-primary transition-colors">
                <HelpCircle size={20} />
                <span className="text-sm font-medium">Support</span>
            </button>
        </div>
    </div>
);

export const Desktop: Story = {
    render: (args) => (
        <div className="flex h-screen bg-app-dark p-4">
            <GlassSidebar {...args}>
                <SidebarContent />
            </GlassSidebar>
            <main className="flex-1 p-8">
                <h1 className="text-3xl font-bold mb-4">Main Content</h1>
                <p className="text-secondary leading-relaxed">
                    The sidebar is fixed on the left. On smaller screens, it will collapse into the mobile drawer.
                </p>
            </main>
        </div>
    ),
};

export const MobileDrawer: Story = {

    render: () => (
        <div className="h-screen bg-app-dark p-4">
            <GlassSidebar mobileOpen={true} title="Menu">
                <SidebarContent />
            </GlassSidebar>
            <p className="text-secondary p-8">Mobile view with drawer open.</p>
        </div>
    ),
};

export const RightPosition: Story = {

    render: () => (
        <div className="flex flex-row-reverse h-screen bg-app-dark p-4">
            <GlassSidebar position="right" width="w-72">
                <SidebarContent />
            </GlassSidebar>
            <main className="flex-1 p-8 text-right">
                <h1 className="text-3xl font-bold mb-4">Right Sidebar</h1>
            </main>
        </div>
    ),
};
