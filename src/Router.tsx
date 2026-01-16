import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AgentConfigProvider } from './context/AgentConfigContext';
import { BackgroundManager } from './components/Backgrounds/BackgroundManager';
import { GlassCommandPalette } from '@/components';
import { ErrorBoundary } from '@/components';

// Layouts
import { LiquidOSLayout } from './layouts/LiquidOSLayout';
import { RushHourLayout } from './layouts/RushHourLayout';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })));
const Settings = lazy(() => import('./pages/Settings').then(mod => ({ default: mod.Settings })));
const Showcase = lazy(() => import('./pages/Showcase').then(mod => ({ default: mod.Showcase })));
const SFSymbolsViewer = lazy(() => import('./pages/SfSymbolsBrowser').then(mod => ({ default: mod.default })));
const DesignGuide = lazy(() => import('./pages/DesignGuide').then(mod => ({ default: mod.default })));

// Demos
const SheetsDemo = lazy(() => import('./pages/SheetsDemo').then(mod => ({ default: mod.SheetsDemo })));
const GenerativeShowcase = lazy(() => import('./pages/demos/GenerativeShowcase').then(mod => ({ default: mod.default })));
const GenerativeExtensions = lazy(() => import('./pages/demos/GenerativeExtensions').then(mod => ({ default: mod.default })));
const CopilotFormDemo = lazy(() => import('./pages/demos/CopilotFormDemo').then(mod => ({ default: mod.default })));
const DynamicDashboardDemo = lazy(() => import('./pages/demos/DynamicDashboardDemo').then(mod => ({ default: mod.default })));
const StateMachineDemo = lazy(() => import('./pages/demos/StateMachineDemo').then(mod => ({ default: mod.default })));
const QAAgentDemo = lazy(() => import('./pages/demos/QAAgentDemo').then(mod => ({ default: mod.default })));
const ResearchCanvasDemo = lazy(() => import('./pages/demos/ResearchCanvasDemo').then(mod => ({ default: mod.default })));
const TravelPlannerDemo = lazy(() => import('./pages/demos/TravelPlannerDemo').then(mod => ({ default: mod.default })));
const AIResearcherDemo = lazy(() => import('./pages/demos/AIResearcherDemo').then(mod => ({ default: mod.default })));
const FoundationDemo = lazy(() => import('./pages/demos/FoundationDemo').then(mod => ({ default: mod.default })));
const SignatureDemo = lazy(() => import('./pages/demos/SignatureDemo').then(mod => ({ default: mod.default })));
const ExtensionDemo = lazy(() => import('./pages/demos/ExtensionDemo').then(mod => ({ default: mod.ExtensionDemo })));
const DemosIndex = lazy(() => import('./pages/demos/DemosIndex').then(mod => ({ default: mod.DemosIndex })));

// Agent Hub
const AgentHub = lazy(() => import('./pages/agents/AgentHub').then(mod => ({ default: mod.AgentHub })));

// Artifacts
const ArtifactsPage = lazy(() => import('./pages/artifacts/ArtifactsPage').then(mod => ({ default: mod.ArtifactsPage })));

// Docs
const CopilotDocs = lazy(() => import('./pages/showcase/CopilotDocs').then(mod => ({ default: mod.default })));
const AIResearcherDocs = lazy(() => import('./pages/showcase/AIResearcherDocs').then(mod => ({ default: mod.default })));
const DynamicDashboardDocs = lazy(() => import('./pages/showcase/DynamicDashboardDocs').then(mod => ({ default: mod.default })));
const QAAgentDocs = lazy(() => import('./pages/showcase/QAAgentDocs').then(mod => ({ default: mod.default })));
const ResearchCanvasDocs = lazy(() => import('./pages/showcase/ResearchCanvasDocs').then(mod => ({ default: mod.default })));
const StateMachineDocs = lazy(() => import('./pages/showcase/StateMachineDocs').then(mod => ({ default: mod.default })));
const TravelPlannerDocs = lazy(() => import('./pages/showcase/TravelPlannerDocs').then(mod => ({ default: mod.default })));
const GenerativeShowcaseDocs = lazy(() => import('./pages/showcase/GenerativeShowcaseDocs').then(mod => ({ default: mod.default })));
const GenerativeExtensionsDocs = lazy(() => import('./pages/showcase/GenerativeExtensionsDocs').then(mod => ({ default: mod.default })));
const AuditDocs = lazy(() => import('./pages/showcase/AuditDocs').then(mod => ({ default: mod.default })));

// Trading (RushHour)
const MarketOverview = lazy(() => import('./pages/MarketOverview').then(mod => ({ default: mod.MarketOverview })));
const TradingDashboard = lazy(() => import('./pages/trading/Dashboard').then(mod => ({ default: mod.Dashboard })));
const TradingRiskSettings = lazy(() => import('./pages/trading/RiskSettings').then(mod => ({ default: mod.RiskSettings })));
const TradingBotConfig = lazy(() => import('./pages/trading/BotConfig').then(mod => ({ default: mod.BotConfig })));
const SmartAnalytics = lazy(() => import('./pages/analytics/SmartAnalytics').then(mod => ({ default: mod.SmartAnalytics })));
const ShowcaseCompound = lazy(() => import('./pages/showcase/ShowcaseCompound').then(mod => ({ default: mod.ShowcaseCompound })));
const PerformanceComparison = lazy(() => import('./pages/PerformanceComparison').then(mod => ({ default: mod.default })));

// Loading fallback component
function PageLoader() {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--glass-accent)]"></div>
                <p className="text-[var(--text-secondary)]">Initializing Liquid OS...</p>
            </div>
        </div>
    );
}

export const AppRouter = () => {
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Global ⌘K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <BrowserRouter>
            <AgentConfigProvider>
                {/* Global Background Manager (Handles the immersive layer) */}
                <BackgroundManager />

                {/* Global Command Palette (⌘K) - Constant across worlds */}
                <GlassCommandPalette
                    isOpen={commandPaletteOpen}
                    onClose={() => setCommandPaletteOpen(false)}
                />

                <ErrorBoundary
                    fallback={
                        <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
                            <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-xl">
                                <h1 className="text-2xl font-bold text-red-400 mb-2">System Critical Error</h1>
                                <p className="text-gray-400">The Liquid OS encountered a fatal exception.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-6 px-6 py-2 bg-[var(--glass-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Reboot System
                                </button>
                            </div>
                        </div>
                    }
                >
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* --- WORLD 1: LIQUID OS (Spatial) --- */}
                            <Route element={<LiquidOSLayout />}>
                                <Route path="/" element={<Navigate to="/os" replace />} />
                                <Route path="/os" element={<Home />} />

                                {/* System Apps */}
                                <Route path="/os/settings" element={<Settings />} />
                                <Route path="/os/design" element={<DesignGuide />} />
                                <Route path="/os/showcase" element={<Showcase />} />
                                <Route path="/os/icons" element={<SFSymbolsViewer />} />
                                <Route path="/os/agents" element={<AgentHub />} />
                                <Route path="/os/artifacts" element={<ArtifactsPage />} />

                                {/* Demos */}
                                <Route path="/os/demos" element={<DemosIndex />} />
                                <Route path="/os/demos/generative" element={<GenerativeShowcase />} />
                                <Route path="/os/demos/generative-extensions" element={<GenerativeExtensions />} />
                                <Route path="/os/demos/copilot-form" element={<CopilotFormDemo />} />
                                <Route path="/os/demos/dynamic-dashboard" element={<DynamicDashboardDemo />} />
                                <Route path="/os/demos/state-machine" element={<StateMachineDemo />} />
                                <Route path="/os/demos/qa-agent" element={<QAAgentDemo />} />
                                <Route path="/os/demos/research-canvas" element={<ResearchCanvasDemo />} />
                                <Route path="/os/demos/travel-planner" element={<TravelPlannerDemo />} />
                                <Route path="/os/demos/ai-researcher" element={<AIResearcherDemo />} />
                                <Route path="/os/demos/foundation" element={<FoundationDemo />} />
                                <Route path="/os/demos/signature" element={<SignatureDemo />} />
                                <Route path="/os/demos/extension" element={<ExtensionDemo />} />
                                <Route path="/os/sheets" element={<SheetsDemo />} />

                                {/* Documentation */}
                                <Route path="/os/docs/copilot" element={<CopilotDocs />} />
                                <Route path="/os/docs/ai-researcher" element={<AIResearcherDocs />} />
                                <Route path="/os/docs/dynamic-dashboard" element={<DynamicDashboardDocs />} />
                                <Route path="/os/docs/qa-agent" element={<QAAgentDocs />} />
                                <Route path="/os/docs/research-canvas" element={<ResearchCanvasDocs />} />
                                <Route path="/os/docs/state-machine" element={<StateMachineDocs />} />
                                <Route path="/os/docs/travel-planner" element={<TravelPlannerDocs />} />
                                <Route path="/os/docs/generative-showcase" element={<GenerativeShowcaseDocs />} />
                                <Route path="/os/docs/generative-extensions" element={<GenerativeExtensionsDocs />} />
                                <Route path="/os/docs/audit" element={<AuditDocs />} />
                            </Route>

                            {/* --- WORLD 2: RUSH HOUR (Dense Terminal) --- */}
                            <Route path="/terminal" element={<RushHourLayout />}>
                                <Route index element={<Navigate to="/terminal/dashboard" replace />} />
                                <Route path="dashboard" element={<TradingDashboard />} />
                                <Route path="market" element={<MarketOverview />} />
                                <Route path="risk" element={<TradingRiskSettings />} />
                                <Route path="bots" element={<TradingBotConfig />} />
                                <Route path="bots/:id" element={<TradingBotConfig />} />
                                <Route path="analytics" element={<SmartAnalytics />} />
                                <Route path="performance" element={<PerformanceComparison />} />
                                <Route path="compound" element={<ShowcaseCompound />} />
                            </Route>

                            {/* Legacy Redirects (for safety) */}
                            <Route path="/trading" element={<Navigate to="/terminal/dashboard" replace />} />
                            <Route path="/settings" element={<Navigate to="/os/settings" replace />} />
                            <Route path="/design-guide" element={<Navigate to="/os/design" replace />} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/os" replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </AgentConfigProvider>
        </BrowserRouter>
    );
};
