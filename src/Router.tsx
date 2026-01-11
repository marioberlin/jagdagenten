import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AgentConfigProvider } from './context/AgentConfigContext';
import { BackgroundManager } from './components/Backgrounds/BackgroundManager';
import { GlassTopNav } from '@/components';
import { GlassCommandPalette } from '@/components';
import { ErrorBoundary } from '@/components';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })));
const Settings = lazy(() => import('./pages/Settings').then(mod => ({ default: mod.Settings })));
const Showcase = lazy(() => import('./pages/Showcase').then(mod => ({ default: mod.Showcase })));
const SFSymbolsViewer = lazy(() => import('./pages/SfSymbolsBrowser').then(mod => ({ default: mod.default })));
const DesignGuide = lazy(() => import('./pages/DesignGuide').then(mod => ({ default: mod.default })));
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
        <div className="flex items-center justify-center h-screen w-full">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--glass-accent)]"></div>
                <p className="text-[var(--text-secondary)]">Loading...</p>
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
                {/* Global Background Layer */}
                <BackgroundManager />

                {/* Global Top Navigation */}
                <GlassTopNav
                    onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
                />

                {/* Global Command Palette (⌘K) */}
                <GlassCommandPalette
                    isOpen={commandPaletteOpen}
                    onClose={() => setCommandPaletteOpen(false)}
                />


                {/* Application Content */}
                <ErrorBoundary
                    fallback={
                        <div className="min-h-screen flex items-center justify-center p-4">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-red-600">Route Error</h1>
                                <p className="text-gray-600 mt-2">This page encountered an error.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    }
                >
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/showcase" element={<Showcase />} />
                            <Route path="/sf-symbols" element={<SFSymbolsViewer />} />
                            <Route path="/design-guide" element={<DesignGuide />} />
                            <Route path="/demos/generative" element={<GenerativeShowcase />} />
                            <Route path="/demos/generative-extensions" element={<GenerativeExtensions />} />
                            <Route path="/demos/copilot-form" element={<CopilotFormDemo />} />
                            <Route path="/demos/dynamic-dashboard" element={<DynamicDashboardDemo />} />
                            <Route path="/demos/state-machine" element={<StateMachineDemo />} />
                            <Route path="/demos/qa-agent" element={<QAAgentDemo />} />
                            <Route path="/demos/research-canvas" element={<ResearchCanvasDemo />} />
                            <Route path="/demos/travel-planner" element={<TravelPlannerDemo />} />
                            <Route path="/demos/ai-researcher" element={<AIResearcherDemo />} />
                            <Route path="/demos/foundation" element={<FoundationDemo />} />
                            <Route path="/demos/signature" element={<SignatureDemo />} />
                            <Route path="/demos/extension" element={<ExtensionDemo />} />
                            <Route path="/docs/copilot" element={<CopilotDocs />} />
                            <Route path="/docs/ai-researcher" element={<AIResearcherDocs />} />
                            <Route path="/docs/dynamic-dashboard" element={<DynamicDashboardDocs />} />
                            <Route path="/docs/qa-agent" element={<QAAgentDocs />} />
                            <Route path="/docs/research-canvas" element={<ResearchCanvasDocs />} />
                            <Route path="/docs/state-machine" element={<StateMachineDocs />} />
                            <Route path="/docs/travel-planner" element={<TravelPlannerDocs />} />
                            <Route path="/docs/generative-showcase" element={<GenerativeShowcaseDocs />} />
                            <Route path="/docs/generative-extensions" element={<GenerativeExtensionsDocs />} />
                            <Route path="/docs/ag-ui-vs-copilotkit" element={<AuditDocs />} />
                            {/* Trading */}
                            <Route path="/trading" element={<TradingDashboard />} />
                            <Route path="/trading/risk-settings" element={<TradingRiskSettings />} />
                            <Route path="/trading/bots" element={<TradingBotConfig />} />
                            <Route path="/trading/bots/new" element={<TradingBotConfig />} />
                            <Route path="/trading/bots/:id" element={<TradingBotConfig />} />
                            <Route path="/market-overview" element={<MarketOverview />} />
                            <Route path="/showcase/compound" element={<ShowcaseCompound />} />
                            <Route path="/analytics" element={<SmartAnalytics />} />
                            <Route path="/performance" element={<PerformanceComparison />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </AgentConfigProvider>
        </BrowserRouter>
    );
};
