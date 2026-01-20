/**
 * Neon Tokyo Demo
 * 
 * Hyper-personalized travel concierge with atmosphere-reactive UI.
 * Implements the "Liquid Glass" philosophy: glass that reacts to data.
 */
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassGoogleMap, type MapMarker } from '../../components/data-display/GlassGoogleMap';
import { AtmosphericBackground } from '../../components/atmospheric/AtmosphericBackground';
import { AtmosphereIndicator } from '../../components/atmospheric/AtmosphereIndicator';
import { HolographicTicket } from '../../components/travel/HolographicTicket';
import { DynamicPackingList } from '../../components/travel/DynamicPackingList';
import type { TicketData } from '../../services/a2a/NeonTokyoService';
import {
    Sparkles,
    MapPin,
    Calendar,
    Plane,
    CheckCircle,
    Circle,
    Luggage,
    Book,
    // Activity icons
    Train,
    Hotel,
    Building2,
    UtensilsCrossed,
    Landmark,
    Coffee,
    Castle,
    // Packing icons
    FileText,
    Plug,
    Wifi,
    Shirt,
    Footprints,
    Umbrella,
    Glasses,
    Backpack
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { NeonTokyoService, NeonTokyoData, PackingItem, ItineraryDay } from '../../services/a2a/NeonTokyoService';
import { v4 as uuidv4 } from 'uuid';

// Icon mapping with Liquid Glass colors
const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    plane: { icon: Plane, color: '#ec4899' },
    train: { icon: Train, color: '#8b5cf6' },
    hotel: { icon: Hotel, color: '#06b6d4' },
    city: { icon: Building2, color: '#f59e0b' },
    food: { icon: UtensilsCrossed, color: '#ef4444' },
    temple: { icon: Landmark, color: '#f97316' },
    tea: { icon: Coffee, color: '#22c55e' },
    palace: { icon: Castle, color: '#a855f7' }
};

const PACKING_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    passport: { icon: FileText, color: '#3b82f6' },
    charger: { icon: Plug, color: '#f59e0b' },
    wifi: { icon: Wifi, color: '#06b6d4' },
    jacket: { icon: Shirt, color: '#8b5cf6' },
    shoes: { icon: Footprints, color: '#ec4899' },
    umbrella: { icon: Umbrella, color: '#6366f1' },
    sunglasses: { icon: Glasses, color: '#f97316' },
    backpack: { icon: Backpack, color: '#22c55e' }
};

// Helper to render activity icon
function ActivityIcon({ iconKey, size = 16 }: { iconKey: string; size?: number }) {
    const config = ACTIVITY_ICONS[iconKey];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon size={size} style={{ color: config.color }} />;
}

// Helper to render packing icon
function PackingIcon({ iconKey, size = 16 }: { iconKey: string; size?: number }) {
    const config = PACKING_ICONS[iconKey];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon size={size} style={{ color: config.color }} />;
}

// Initialize the engine client
const liquidClient = new LiquidClient();

// Packing List Component
function PackingList({ items, onToggle }: { items: PackingItem[]; onToggle: (id: string) => void }) {
    if (!items.length) return null;

    return (
        <GlassContainer className="p-4" border material="thin">
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Luggage size={16} className="text-accent-primary" />
                Smart Packing
            </h3>
            <div className="space-y-2 max-h-64 overflow-auto">
                {items.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onToggle(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all",
                            "hover:bg-white/5",
                            item.checked && "opacity-60"
                        )}
                    >
                        {item.checked ? (
                            <CheckCircle size={16} className="text-green-400 shrink-0" />
                        ) : (
                            <Circle size={16} className="text-white/30 shrink-0" />
                        )}
                        {item.icon && <PackingIcon iconKey={item.icon} size={14} />}
                        <span className={cn(
                            "flex-1 text-sm",
                            item.checked ? "line-through text-white/50" : "text-white/80"
                        )}>
                            {item.name}
                        </span>
                        {item.weatherReason && (
                            <span className="text-xs text-white/40 hidden sm:inline">
                                {item.weatherReason}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </GlassContainer>
    );
}

// Itinerary Stream Component with List/Kanban morph
function ItineraryStream({ days }: { days: ItineraryDay[] }) {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    if (!days.length) return null;

    return (
        <GlassContainer className="p-4 h-full overflow-hidden animate-breathing-border glass-chromatic" border material="thin">
            {/* Header with view toggle */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Calendar size={16} className="text-accent-primary" />
                    Your Itinerary
                </h3>
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "px-2 py-1 text-xs rounded-md transition-all duration-300",
                            viewMode === 'list'
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:text-white/70"
                        )}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={cn(
                            "px-2 py-1 text-xs rounded-md transition-all duration-300",
                            viewMode === 'kanban'
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:text-white/70"
                        )}
                    >
                        Board
                    </button>
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-4 overflow-auto max-h-[calc(100%-3rem)] animate-fade-in">
                    {days.map((day, dayIndex) => (
                        <div key={day.date} className="relative">
                            {/* Day Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center">
                                    {dayIndex + 1}
                                </div>
                                <span className="text-white font-medium">{day.theme}</span>
                                <span className="text-white/40 text-xs">{day.date}</span>
                            </div>

                            {/* Activities */}
                            <div className="ml-3 pl-5 border-l border-white/10 space-y-2">
                                {day.activities.map((activity, i) => (
                                    <div
                                        key={i}
                                        className="relative group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-white/20 group-hover:bg-accent-primary transition-colors" />

                                        <div className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-white/50">{activity.time}</span>
                                                <ActivityIcon iconKey={activity.icon} size={16} />
                                                <span className="text-white font-medium">{activity.title}</span>
                                            </div>
                                            <p className="text-xs text-white/50 mt-0.5">{activity.description}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                                <MapPin size={10} />
                                                {activity.location}
                                                <span className="text-white/20">•</span>
                                                {activity.duration}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Kanban/Board View */}
            {viewMode === 'kanban' && (
                <div className="flex gap-3 overflow-x-auto max-h-[calc(100%-3rem)] pb-2 animate-fade-in">
                    {days.map((day, dayIndex) => (
                        <div
                            key={day.date}
                            className="flex-shrink-0 w-64 bg-white/5 rounded-xl p-3 border border-white/10"
                        >
                            {/* Column Header */}
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <div className="w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center">
                                    {dayIndex + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{day.theme}</p>
                                    <p className="text-xs text-white/40">{day.date}</p>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="space-y-2">
                                {day.activities.map((activity, i) => (
                                    <div
                                        key={i}
                                        className="p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5">
                                                <ActivityIcon iconKey={activity.icon} size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate group-hover:text-white">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                                    {activity.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                                            <span className="text-xs text-white/50">{activity.time}</span>
                                            <span className="text-xs text-white/40 flex items-center gap-1">
                                                <MapPin size={8} />
                                                {activity.location}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GlassContainer>
    );
}

// Inner component with hooks
function NeonTokyoContent({ atmosphere, destination }: { atmosphere?: NeonTokyoData['atmosphere']; destination?: string }) {
    const [tripData, setTripData] = useState<NeonTokyoData>({
        destination: destination || 'Tokyo',
        tripName: 'Tokyo Adventure',
        atmosphere: atmosphere || {
            condition: 'night',
            temperature: 18,
            humidity: 65,
            mood: 'Neon Dreams',
            gradientFrom: 'from-pink-900/20',
            gradientTo: 'to-cyan-900/20',
            accentColor: 'pink-500',
            glassBlur: 'regular'
        },
        itinerary: [
            {
                date: 'Day 1',
                theme: 'Arrival & Shibuya Nights',
                activities: [
                    { time: '14:00', icon: 'plane', title: 'Arrive at Haneda', description: 'Clear customs, grab pocket WiFi', location: 'Haneda Airport', duration: '1.5h' },
                    { time: '16:30', icon: 'train', title: 'Train to Shibuya', description: 'Take limousine bus or Keikyu line', location: 'Tokyo Transit', duration: '45m' },
                    { time: '18:00', icon: 'hotel', title: 'Hotel Check-in', description: 'Drop bags, freshen up', location: 'Shibuya Stream', duration: '30m' },
                    { time: '19:00', icon: 'city', title: 'Shibuya Crossing', description: 'Experience the famous scramble', location: 'Shibuya', duration: '30m' },
                    { time: '20:00', icon: 'food', title: 'Ramen Dinner', description: 'Try Ichiran or Fuunji', location: 'Shibuya', duration: '1h' }
                ]
            },
            {
                date: 'Day 2',
                theme: 'Traditional Tokyo',
                activities: [
                    { time: '08:00', icon: 'temple', title: 'Senso-ji Temple', description: 'Early morning visit, fewer crowds', location: 'Asakusa', duration: '2h' },
                    { time: '11:00', icon: 'tea', title: 'Tea Ceremony', description: 'Traditional matcha experience', location: 'Asakusa', duration: '1h' },
                    { time: '13:00', icon: 'palace', title: 'Imperial Palace', description: 'East Gardens exploration', location: 'Chiyoda', duration: '2h' }
                ]
            }
        ],
        packingList: [
            { id: 'p1', name: 'Passport', icon: 'passport', checked: true, category: 'essentials' },
            { id: 'p2', name: 'Phone charger & adapter', icon: 'charger', checked: true, category: 'essentials' },
            { id: 'p3', name: 'Pocket WiFi reservation', icon: 'wifi', checked: false, category: 'essentials' },
            { id: 'p4', name: 'Light jacket', icon: 'jacket', checked: false, category: 'clothing', weatherReason: 'Evenings can be cool' },
            { id: 'p5', name: 'Comfortable walking shoes', icon: 'shoes', checked: false, category: 'clothing', weatherReason: 'Lots of walking expected' },
            { id: 'p6', name: 'Umbrella', icon: 'umbrella', checked: false, category: 'accessories', weatherReason: 'Chance of rain' },
            { id: 'p7', name: 'Sunglasses', icon: 'sunglasses', checked: false, category: 'accessories' },
            { id: 'p8', name: 'Day bag/backpack', icon: 'backpack', checked: false, category: 'essentials' }
        ],
        ticket: {
            type: 'flight',
            carrier: 'Japan Airlines',
            // Flight number is encoded in the carrier field
            departure: { location: 'SFO', time: '11:30', terminal: '1' },
            arrival: { location: 'NRT', time: '15:30+1' },
            passenger: 'Alex Traveler',
            class: 'Business',
            reference: 'JL7X8K9M'
        },
        mapMarkers: [
            { id: '1', lat: 35.6762, lng: 139.6503, label: 'Tokyo', color: '#ec4899' },
            { id: '2', lat: 35.7147, lng: 139.7967, label: 'Senso-ji', color: '#f59e0b' },
            { id: '3', lat: 35.6580, lng: 139.7016, label: 'Shibuya', color: '#a855f7' }
        ]
    });
    const [sessionId] = useState(() => uuidv4());

    // Handle data updates from A2A agent
    const handleDataUpdate = useCallback((data: NeonTokyoData) => {
        setTripData(prev => ({
            ...prev,
            ...data
        }));
    }, []);

    // Create A2A service
    const agentService = useMemo(
        () => new NeonTokyoService(sessionId, handleDataUpdate),
        [sessionId, handleDataUpdate]
    );

    // Toggle packing item
    const handleTogglePacking = useCallback((id: string) => {
        setTripData(prev => ({
            ...prev,
            packingList: prev.packingList?.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        }));
    }, []);

    // Map markers
    const mapMarkers: MapMarker[] = tripData.mapMarkers?.map(m => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        label: m.label,
        color: m.color
    })) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Left Column: Itinerary */}
            <div className="lg:col-span-1 h-full min-h-[400px]">
                <ItineraryStream days={tripData.itinerary || []} />
            </div>

            {/* Middle Column: Map */}
            <div className="lg:col-span-1 h-full min-h-[400px]">
                <GlassGoogleMap
                    className="h-full w-full"
                    markers={mapMarkers}
                    defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
                    defaultZoom={5}
                />
            </div>

            {/* Right Column: Ticket + Packing */}
            <div className="lg:col-span-1 flex flex-col gap-4 overflow-auto">
                {/* Holographic Ticket */}
                {tripData.ticket && (
                    <HolographicTicket
                        ticket={tripData.ticket}
                        accentColor="#ec4899"
                    />
                )}

                {/* Dynamic Packing List - enhanced version */}
                <DynamicPackingList
                    items={tripData.packingList || []}
                    onToggle={handleTogglePacking}
                    weatherCondition={tripData.atmosphere?.condition}
                    accentColor="#ec4899"
                />
            </div>
        </div>
    );
}

export default function NeonTokyoDemo() {
    const navigate = useNavigate();

    // Initial atmosphere state - will be updated by agent
    const [atmosphere] = useState({
        condition: 'night' as const,
        temperature: 18,
        humidity: 65,
        mood: 'Neon Dreams',
        gradientFrom: 'from-pink-900/20',
        gradientTo: 'to-cyan-900/20',
        accentColor: 'pink-500',
        glassBlur: 'regular' as const
    });
    const [destination] = useState('Tokyo');

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Atmospheric Background - Now with video support! */}
                    <AtmosphericBackground
                        atmosphere={atmosphere}
                        destination={destination}
                        enableVideo={true}
                    />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10 relative">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'Demos', href: '/os/demos' },
                                { label: 'Neon Tokyo', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 text-pink-400 animate-breathe">
                                <Plane size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                    Neon Tokyo
                                </h1>
                                <p className="text-sm text-white/50">
                                    Hyper-personalized travel concierge with atmosphere-reactive UI
                                </p>
                            </div>
                            {/* Atmosphere badge in header */}
                            <AtmosphereIndicator
                                atmosphere={atmosphere}
                                destination={destination}
                                size="sm"
                                variant="badge"
                            />
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/os/demos')}
                            >
                                <Book size={16} className="mr-2" />
                                Back to Demos
                            </GlassButton>
                        </div>
                    </header>

                    {/* Main Area */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden relative z-10">
                        <NeonTokyoContent atmosphere={atmosphere} destination={destination} />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar />
            </div>
        </LiquidProvider>
    );
}

