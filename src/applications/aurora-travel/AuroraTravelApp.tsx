/**
 * Aurora Travel Weather App
 * 
 * The standalone Glass App for travel weather intelligence.
 * Features a tabbed layout following the RushHour Trading App pattern.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
    Sun,
    Map,
    Compass,
    User,
    Cloud,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useMenuBar } from '@/context/MenuBarContext';
import { AuroraWeatherService, WeatherUpdate } from '@/services/a2a/AuroraWeatherService';
import { AuroraWeatherChatInput } from '@/applications/aurora-weather/AuroraWeatherChatInput';

// Tab Components
import { AuroraHomeTab, AuroraHomeTabSkeleton } from './components/AuroraHomeTab';
import { AuroraProfileTab } from './components/AuroraProfileTab';
import { AuroraTripsTab } from './components/AuroraTripsTab';
import { AuroraMapTab } from './components/AuroraMapTab';

// Store
import { useAuroraTravelStore, type AuroraTravelTab } from './store';

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS: { id: AuroraTravelTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Sun },
    { id: 'trips', label: 'Trips', icon: Map },
    { id: 'map', label: 'Map', icon: Compass },
    { id: 'profile', label: 'Profile', icon: User },
];

// ============================================================================
// Props
// ============================================================================

interface AuroraTravelAppProps {
    onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const AuroraTravelApp: React.FC<AuroraTravelAppProps> = ({ onClose }) => {
    // Store state
    const activeTab = useAuroraTravelStore(state => state.activeTab);
    const setActiveTab = useAuroraTravelStore(state => state.setActiveTab);

    // Local state
    const [weatherData, setWeatherData] = useState<WeatherUpdate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());

    // Menu bar integration
    const { setAppIdentity, registerMenu, unregisterMenu } = useMenuBar();

    // Use ref to ensure callback stability
    const setWeatherDataRef = useRef(setWeatherData);
    setWeatherDataRef.current = setWeatherData;

    // Create A2A service
    const agentService = useMemo(
        () => new AuroraWeatherService(sessionId, (data: WeatherUpdate) => {
            setWeatherDataRef.current(data);
        }),
        [sessionId]
    );

    // Register app identity and menus
    useEffect(() => {
        setAppIdentity('Aurora Travel', Cloud);

        // Weather menu
        registerMenu({
            id: 'weather',
            label: 'Weather',
            items: [
                {
                    id: 'refresh',
                    label: 'Refresh Weather',
                    icon: Sun,
                    shortcut: '⌘R',
                    action: () => handleRefresh(),
                },
                { id: 'sep-1', label: '', dividerAfter: true },
                {
                    id: 'add-location',
                    label: 'Add Location...',
                    icon: Map,
                    shortcut: '⌘L',
                    action: () => {
                        // Focus on location search
                        setActiveTab('home');
                    },
                },
            ],
        });

        // Cleanup on unmount
        return () => {
            setAppIdentity('LiquidOS');
            unregisterMenu('weather');
        };
    }, [setAppIdentity, registerMenu, unregisterMenu, setActiveTab]);

    // Initial weather load
    useEffect(() => {
        const initWeather = async () => {
            setIsLoading(true);
            try {
                await agentService.sendMessage('Weather in Berlin');
            } finally {
                setIsLoading(false);
            }
        };
        initWeather();
    }, [agentService]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleChat = useCallback(async (message: string) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(message);
        } finally {
            setIsLoading(false);
        }
    }, [agentService]);

    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await agentService.sendMessage('Refresh the weather data');
        } finally {
            setIsLoading(false);
        }
    }, [agentService]);

    const handleSelectLocation = useCallback(async (locationId: string) => {
        const location = weatherData?.locations.find(l => l.id === locationId);
        if (location) {
            setIsLoading(true);
            try {
                await agentService.sendMessage(`Show weather for ${location.name}`);
            } finally {
                setIsLoading(false);
            }
        }
    }, [agentService, weatherData]);

    const handleAddLocation = useCallback(async (cityName: string) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(`Add ${cityName}`);
        } finally {
            setIsLoading(false);
        }
    }, [agentService]);

    const handleGeolocation = useCallback(async (lat: number, lng: number) => {
        setIsLoading(true);
        try {
            await agentService.sendMessage(`Weather at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoading(false);
        }
    }, [agentService]);

    // ========================================================================
    // Tab Content Renderer
    // ========================================================================

    const renderTabContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <AuroraHomeTab
                        weatherData={weatherData}
                        isLoading={isLoading}
                        onSelectLocation={handleSelectLocation}
                        onAddLocation={handleAddLocation}
                        onGeolocation={handleGeolocation}
                        onRefresh={handleRefresh}
                    />
                );

            case 'trips':
                return <AuroraTripsTab />;

            case 'map':
                return <AuroraMapTab />;

            case 'profile':
                return <AuroraProfileTab />;

            default:
                return null;
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="flex flex-col h-full bg-glass-base rounded-b-xl overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-blue-900/10 to-transparent pointer-events-none" />

            {/* Tab Navigation (Header - RushHour Pattern) */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--glass-border)] bg-black/20 relative z-10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            activeTab === tab.id
                                ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fixed Chat Input */}
            <div className="z-20">
                <AuroraWeatherChatInput onSend={handleChat} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default AuroraTravelApp;
