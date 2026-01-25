import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './index.css'
import { GlassProvider } from './context/GlassContext'
import { LiquidFilter } from './components/Effects/LiquidFilter'

// Sync hydrate theme BEFORE React mounts to prevent flash
// @see docs/IMPLEMENTATION_PLAN.md - Item 2.3 Theme Hydration Race Fix
import { syncHydrateTheme } from './stores/utils/syncHydrate'
try {
    syncHydrateTheme()
} catch (e) {
    console.error('[main.tsx] Theme hydration failed:', e)
}

// Initialize App Store - discover and register local applications
import { initializeAppStore } from './system/app-store/appDiscovery'
try {
    initializeAppStore()
} catch (e) {
    console.error('[main.tsx] App store initialization failed:', e)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GlassProvider>
            <LiquidFilter />
            <App />
        </GlassProvider>
    </React.StrictMode>,
)
