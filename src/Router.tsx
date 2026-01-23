import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AgentConfigProvider } from './context/AgentConfigContext';
import { MenuBarProvider } from './context/MenuBarContext';
import { BackgroundManager } from './components/Backgrounds/BackgroundManager';
import { LiquidMenuBar } from './components/menu-bar';
import { GlassCommandPalette } from '@/components';
import { ErrorBoundary } from '@/components';

// Layouts
import { LiquidOSLayout } from './layouts/LiquidOSLayout';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home').then(mod => ({ default: mod.Home })));

// iBird Public Booking Page
const BookingPage = lazy(() => import('./pages/book/BookingPage'));

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

    // Global Cmd+K / Ctrl+K keyboard shortcut
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
                <MenuBarProvider>
                    {/* Global Background Manager (Handles the immersive layer) */}
                    <BackgroundManager />

                    {/* Persistent Menu Bar - Always visible across all apps */}
                    <LiquidMenuBar />

                    {/* Global Command Palette (Cmd+K) */}
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
                                {/* --- LIQUID OS --- */}
                                <Route element={<LiquidOSLayout />}>
                                    <Route path="/" element={<Navigate to="/os" replace />} />
                                    <Route path="/os" element={<Home />} />
                                </Route>

                                {/* iBird Public Booking Page */}
                                <Route path="/book/:username" element={<BookingPage />} />
                                <Route path="/book/:username/:eventType" element={<BookingPage />} />

                                {/* Legacy Redirects */}
                                <Route path="/terminal/*" element={<Navigate to="/os" replace />} />
                                <Route path="/trading" element={<Navigate to="/os" replace />} />
                                <Route path="/settings" element={<Navigate to="/os" replace />} />
                                <Route path="/design-guide" element={<Navigate to="/os" replace />} />
                                <Route path="/os/*" element={<Navigate to="/os" replace />} />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/os" replace />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </MenuBarProvider>
            </AgentConfigProvider>
        </BrowserRouter>
    );
};
