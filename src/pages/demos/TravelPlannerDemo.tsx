import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { GlassContainer, GlassInput, GlassButton } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassMap, MapMarker } from '../../components/data-display/GlassMap';
import { Plane, MapPin, Calendar, Clock, Plus, Trash2, Sun, Cloud, CloudRain, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { TravelPlannerService } from '../../services/a2a/TravelPlannerService';
import { v4 as uuidv4 } from 'uuid';

// Initialize the engine client
const liquidClient = new LiquidClient();

interface Destination {
    id: string;
    name: string;
    date: string;
    duration: string;
    activities: string[];
    weather?: 'sunny' | 'cloudy' | 'rainy';
    lat?: number;
    lng?: number;
}

// Inner component with hooks
function TravelContent() {
    const [tripName, setTripName] = useState('Japan Adventure 2024');
    const [destinations, setDestinations] = useState<Destination[]>([
        {
            id: '1',
            name: 'Tokyo',
            date: 'Mar 15',
            duration: '3 days',
            activities: ['Shibuya Crossing', 'Senso-ji Temple', 'Akihabara'],
            weather: 'sunny',
            lat: 35.6762,
            lng: 139.6503
        },
        {
            id: '2',
            name: 'Kyoto',
            date: 'Mar 18',
            duration: '2 days',
            activities: ['Fushimi Inari', 'Arashiyama Bamboo'],
            weather: 'cloudy',
            lat: 35.0116,
            lng: 135.7681
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());

    // Handle data updates from A2A agent
    const handleDataUpdate = useCallback((data: any) => {
        if (data.tripName) {
            setTripName(data.tripName);
        }
        if (data.destinations) {
            setDestinations(data.destinations);
        }
        if (data.newDestination) {
            setDestinations(prev => [...prev, data.newDestination]);
        }
    }, []);

    // Create A2A service
    const agentService = useMemo(
        () => new TravelPlannerService(sessionId, handleDataUpdate),
        [sessionId, handleDataUpdate]
    );

    const handleDeleteDestination = useCallback((id: string) => {
        setDestinations(prev => prev.filter(d => d.id !== id));
    }, []);

    const weatherIcons = {
        sunny: Sun,
        cloudy: Cloud,
        rainy: CloudRain
    };

    // Create map markers from destinations that have coordinates
    const mapMarkers: MapMarker[] = destinations
        .filter(d => d.lat && d.lng)
        .map(d => ({
            id: d.id,
            lat: d.lat!,
            lng: d.lng!,
            label: d.name,
            color: d.weather === 'sunny' ? '#f59e0b' : d.weather === 'rainy' ? '#3b82f6' : '#6b7280'
        }));

    const handleAddDestinationClick = async () => {
        setIsLoading(true);
        try {
            await agentService.sendMessage('Add a new interesting destination to my Japan trip with activities and coordinates');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Left: Map */}
            <div className="h-full min-h-[400px] lg:min-h-[500px]">
                <GlassMap
                    className="h-full w-full"
                    markers={mapMarkers}
                    defaultCenter={[35.6762, 139.6503]}
                    defaultZoom={5}
                />
            </div>

            {/* Right: Itinerary */}
            <div className="flex flex-col h-full">
                {/* Trip Header */}
                <div className="mb-4">
                    <label className="text-xs text-secondary mb-1 block">Trip Name</label>
                    <GlassInput
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="Name your trip..."
                        className="font-medium"
                    />
                </div>

                {/* Destinations */}
                <div className="flex-1 space-y-3 overflow-auto">
                    {destinations.map((dest, index) => {
                        const WeatherIcon = weatherIcons[dest.weather || 'sunny'];

                        return (
                            <GlassContainer
                                key={dest.id}
                                className="p-4 group relative"
                                border
                                material="thin"
                            >
                                <button
                                    onClick={() => handleDeleteDestination(dest.id)}
                                    className="absolute right-2 top-2 p-1 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                >
                                    <Trash2 size={12} />
                                </button>

                                <div className="flex items-start gap-3">
                                    {/* Day number */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary text-sm font-bold flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        {index < destinations.length - 1 && (
                                            <div className="w-px h-8 bg-white/10 mt-2" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <MapPin size={14} className="text-accent-primary" />
                                                {dest.name}
                                            </h3>
                                            {WeatherIcon && (
                                                <div className={cn(
                                                    "p-1 rounded",
                                                    dest.weather === 'sunny' && "bg-yellow-500/10 text-yellow-400",
                                                    dest.weather === 'cloudy' && "bg-gray-500/10 text-gray-400",
                                                    dest.weather === 'rainy' && "bg-blue-500/10 text-blue-400"
                                                )}>
                                                    <WeatherIcon size={14} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-secondary mb-3">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {dest.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {dest.duration}
                                            </span>
                                        </div>

                                        {/* Activities */}
                                        <div className="flex flex-wrap gap-1">
                                            {dest.activities.map((activity, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-secondary"
                                                >
                                                    {activity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </GlassContainer>
                        );
                    })}

                    {/* Add Destination Placeholder */}
                    <GlassContainer
                        className={cn(
                            "p-4 border-dashed flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors",
                            isLoading && "opacity-50 pointer-events-none"
                        )}
                        border
                        material="thin"
                        onClick={handleAddDestinationClick}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full mr-2" />
                                <span className="text-sm text-secondary">Adding destination...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} className="text-secondary mr-2" />
                                <span className="text-sm text-secondary">Click to add destination or ask Copilot</span>
                            </>
                        )}
                    </GlassContainer>
                </div>
            </div>
        </div>
    );
}

export default function TravelPlannerDemo() {
    const navigate = useNavigate();

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Travel Planner', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <Plane size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    Travel Planner
                                </h1>
                                <p className="text-sm text-white/50">
                                    AI-assisted travel itinerary builder.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/travel-planner')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Planner Area */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden">
                        <TravelContent />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar />
            </div>
        </LiquidProvider>
    );
}
