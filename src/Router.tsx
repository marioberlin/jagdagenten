import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { BackgroundManager } from './components/Backgrounds/BackgroundManager';
import { GlassTopNav } from '@/components';
import { GlassCommandPalette } from '@/components';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { Showcase } from './pages/Showcase';
import SFSymbolsViewer from './pages/SfSymbolsBrowser';


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
        <ThemeProvider>
            <BrowserRouter>
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
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/showcase" element={<Showcase />} />
                    <Route path="/sf-symbols" element={<SFSymbolsViewer />} />


                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
};
