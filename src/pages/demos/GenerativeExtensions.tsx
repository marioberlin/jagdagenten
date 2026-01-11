import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { GlassSpreadsheet } from '../../components/features/GlassSpreadsheet';
import { GlassMap } from '../../components/data-display/GlassMap';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassContainer, GlassButton } from '@/components';
import {
    Table,
    Map as MapIcon,
    Grid2X2,
    Sparkles,
    Book
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Get API Key from Vite env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

type DemoTab = 'spreadsheet' | 'map';

export default function GenerativeExtensions() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<DemoTab>('spreadsheet');

    const tabs: { id: DemoTab; label: string; icon: any; description: string }[] = [
        {
            id: 'spreadsheet',
            label: 'Spreadsheet',
            icon: Table,
            description: 'AI-assisted data grid. Ask to "analyze the priority distribution" or "add a new row".'
        },
        {
            id: 'map',
            label: 'Geo Map',
            icon: MapIcon,
            description: 'Interactive mapping. Ask to "zoom into Tokyo" or "add markers for tech hubs".'
        },
    ];

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-0 z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                                <Grid2X2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                    Generative Extensions
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/20">Beta</span>
                                </h1>
                                <p className="text-sm text-white/50">
                                    Heavy-duty components powered by Liquid Copilot.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/generative-extensions')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>

                        {/* Custom Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-white/10 text-white shadow-glass"
                                            : "text-white/40 hover:text-white/80 hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* Active Demo Area */}
                    <main className="flex-1 p-6 overflow-hidden flex flex-col">
                        <GlassContainer className="flex-1 rounded-2xl overflow-hidden relative flex flex-col bg-black/20" border material="thin">

                            {/* Toolbar / Prompt Hint */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-2 text-xs text-secondary">
                                    <Sparkles size={14} className="text-accent-tertiary" />
                                    <span>Try asking Copilot:</span>
                                    <span className="text-white bg-white/10 px-2 py-0.5 rounded">
                                        "{tabs.find(t => t.id === activeTab)?.description.split('"')[1]}"
                                    </span>
                                </div>
                            </div>

                            {/* Component Canvas */}
                            <div className="flex-1 relative overflow-auto p-4">
                                {activeTab === 'spreadsheet' && <div className="h-full"><GlassSpreadsheet /></div>}
                                {activeTab === 'map' && <div className="h-full"><GlassMap /></div>}
                            </div>
                        </GlassContainer>
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar apiKey={API_KEY} />
            </div>
        </LiquidProvider>
    );
}
