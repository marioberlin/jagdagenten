import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './index.css'
import { GlassProvider } from './context/GlassContext'
import { LiquidFilter } from './components/Effects/LiquidFilter'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GlassProvider>
            <LiquidFilter />
            <App />
        </GlassProvider>
    </React.StrictMode>,
)
