import { useNavigate } from 'react-router-dom';
import { GlassButton } from '@/components';
import { Book } from 'lucide-react';
import { GlassSmartCard } from '../../components/generative/GlassSmartCard';
import { GlassSmartWeather } from '../../components/generative/GlassSmartWeather';
import { GlassSmartList } from '../../components/generative/GlassSmartList';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidProvider } from '../../liquid-engine/react';

import { liquidClient } from '../../services/liquid';

// Using singleton instance for global context sharing

export default function GenerativeShowcase() {
    const navigate = useNavigate();
    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-10 overflow-auto relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                    <div className="max-w-4xl mx-auto w-full relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">Generative UI Showcase</h1>
                                <p className="text-gray-400 mb-8 max-w-xl">
                                    This interface is driven by the <strong>Liquid Protocol Engine</strong>.
                                    Use the sidebar to chat with Gemini 3 Pro. The AI can trigger "Smart" components
                                    directly in this view.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/generative-showcase')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center space-x-2 text-xs text-primary/70 uppercase tracking-widest font-semibold ml-1">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span>Live Generative Environment</span>
                            </div>

                            {/* The Smart Components are always mounted, waiting for their signal.
                                In a more advanced version, these would be dynamically mounted by the engine.
                                For V1, we mount them all and let them handle their own visibility/state. 
                             */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <GlassSmartWeather />
                                <GlassSmartList />
                                <GlassSmartCard />
                            </div>

                            {/* Hints */}
                            <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <h3 className="text-white font-semibold mb-3">Try asking:</h3>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li className="flex items-center space-x-2">
                                        <span className="text-primary">→</span>
                                        <span>"Show me the current weather in Tokyo"</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className="text-primary">→</span>
                                        <span>"Create a packing list for a trip to Iceland"</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className="text-primary">→</span>
                                        <span>"Generate a card explaining Quantum Computing"</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <AgSidebar key="v4-gemini3" />
            </div>
        </LiquidProvider>
    );
}
