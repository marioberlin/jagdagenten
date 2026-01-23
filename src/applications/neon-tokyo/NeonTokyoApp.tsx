/**
 * NeonTokyo App
 * 
 * Hyper-personalized travel concierge with atmosphere-reactive UI.
 * GlassApp version with chat input at the bottom of the panel.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plane, MapPin, Calendar, Luggage, CheckCircle, Circle, Train, Hotel, Building2, UtensilsCrossed, Landmark, Coffee, Castle } from 'lucide-react';
import { GlassContainer } from '@/components';
import { GlassGoogleMap, type MapMarker } from '@/components/data-display/GlassGoogleMap';
import { AtmosphereIndicator } from '@/components/atmospheric/AtmosphereIndicator';
import { HolographicTicket } from '@/components/travel/HolographicTicket';
import { WorldTimeClock } from '@/components/travel/WorldTimeClock';
import { DynamicPackingList } from '@/components/travel/DynamicPackingList';
import { NeonTokyoChatInput } from './NeonTokyoChatInput';
import { NeonTokyoService, NeonTokyoData, ItineraryDay } from '@/services/a2a/NeonTokyoService';
import { cn } from '@/utils/cn';

// ============================================================================
// Icon Mappings
// ============================================================================

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

function ActivityIcon({ iconKey, size = 16 }: { iconKey: string; size?: number }) {
    const config = ACTIVITY_ICONS[iconKey];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon size={size} style={{ color: config.color }} />;
}

// ============================================================================
// Itinerary Component
// ============================================================================

function ItineraryStream({ days }: { days: ItineraryDay[] }) {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    if (!days.length) return null;

    return (
        <GlassContainer className="p-4 h-full overflow-hidden" border material="thin">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Calendar size={16} className="text-pink-400" />
                    Your Itinerary
                </h3>
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "px-2 py-1 text-xs rounded-md transition-all duration-300",
                            viewMode === 'list' ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
                        )}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={cn(
                            "px-2 py-1 text-xs rounded-md transition-all duration-300",
                            viewMode === 'kanban' ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"
                        )}
                    >
                        Board
                    </button>
                </div>
            </div>

            {viewMode === 'list' && (
                <div className="space-y-4 overflow-auto max-h-[calc(100%-3rem)]">
                    {days.map((day, dayIndex) => (
                        <div key={day.date} className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center">
                                    {dayIndex + 1}
                                </div>
                                <span className="text-white font-medium">{day.theme}</span>
                                <span className="text-white/40 text-xs">{day.date}</span>
                            </div>
                            <div className="ml-3 pl-5 border-l border-white/10 space-y-2">
                                {day.activities.map((activity, i) => (
                                    <div key={i} className="relative group">
                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-white/20 group-hover:bg-pink-400 transition-colors" />
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

            {viewMode === 'kanban' && (
                <div className="flex gap-3 overflow-x-auto max-h-[calc(100%-3rem)] pb-2">
                    {days.map((day, dayIndex) => (
                        <div key={day.date} className="flex-shrink-0 w-64 bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <div className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center">
                                    {dayIndex + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{day.theme}</p>
                                    <p className="text-xs text-white/40">{day.date}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {day.activities.map((activity, i) => (
                                    <div key={i} className="p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-pink-500/30 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5">
                                                <ActivityIcon iconKey={activity.icon} size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                                                <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{activity.description}</p>
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

// ============================================================================
// Main App Component
// ============================================================================

interface NeonTokyoAppProps {
    onClose?: () => void;
}

export const NeonTokyoApp: React.FC<NeonTokyoAppProps> = ({ onClose }) => {
    const [sessionId] = useState(() => uuidv4());
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState<string | null>(null);

    // Initial trip data
    const [tripData, setTripData] = useState<NeonTokyoData>({
        destination: 'Tokyo',
        tripName: 'Tokyo Adventure',
        atmosphere: {
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
            { id: 'p6', name: 'Umbrella', icon: 'umbrella', checked: false, category: 'accessories', weatherReason: 'Chance of rain' }
        ],
        ticket: {
            type: 'flight',
            carrier: 'Japan Airlines',
            reference: 'JL7X8K9M',
            departure: { location: 'SFO', time: '11:30', terminal: '1' },
            arrival: { location: 'NRT', time: '15:30+1' },
            passenger: 'Alex Traveler',
            class: 'Business'
        },
        mapMarkers: [
            { id: '1', lat: 35.6762, lng: 139.6503, label: 'Tokyo', color: '#ec4899' },
            { id: '2', lat: 35.7147, lng: 139.7967, label: 'Senso-ji', color: '#f59e0b' },
            { id: '3', lat: 35.6580, lng: 139.7016, label: 'Shibuya', color: '#a855f7' }
        ]
    });

    // Handle data updates from A2A agent
    const handleDataUpdate = useCallback((data: NeonTokyoData) => {
        setTripData(prev => ({ ...prev, ...data }));
    }, []);

    // Create A2A service
    const agentService = useMemo(
        () => new NeonTokyoService(sessionId, handleDataUpdate),
        [sessionId, handleDataUpdate]
    );

    // Handle chat message
    const handleSendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        try {
            const response = await agentService.sendMessage(message);
            setLastResponse(response);
        } catch (error) {
            console.error('[NeonTokyoApp] Error sending message:', error);
            setLastResponse('Sorry, I had trouble processing that. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [agentService]);

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
        <div className="flex flex-col h-full bg-gradient-to-br from-pink-900/10 via-black/40 to-cyan-900/10">
            {/* Header */}
            <header className="shrink-0 p-4 border-b border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 text-pink-400">
                    <Plane size={20} />
                </div>
                <div className="flex-1">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        {tripData.tripName || 'Neon Tokyo'}
                    </h1>
                    <p className="text-xs text-white/50">
                        {tripData.destination} • Hyper-personalized travel concierge
                    </p>
                </div>
                {tripData.atmosphere && (
                    <AtmosphereIndicator
                        atmosphere={tripData.atmosphere}
                        destination={tripData.destination}
                        size="sm"
                        variant="badge"
                    />
                )}
            </header>

            {/* Main Content - Scrollable */}
            <main className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-[500px]">
                    {/* Left: Itinerary */}
                    <div className="lg:col-span-1 h-full min-h-[400px]">
                        <ItineraryStream days={tripData.itinerary || []} />
                    </div>

                    {/* Middle: Map */}
                    <div className="lg:col-span-1 h-full min-h-[400px]">
                        <GlassGoogleMap
                            className="h-full w-full"
                            markers={mapMarkers}
                            defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
                            defaultZoom={5}
                        />
                    </div>

                    {/* Right: Ticket + Clock + Packing */}
                    <div className="lg:col-span-1 flex flex-col gap-4 overflow-auto">
                        {/* Top row: Boarding Pass + World Clock side by side */}
                        <div className="flex gap-3">
                            <div className="flex-[2]">
                                {tripData.ticket && (
                                    <HolographicTicket
                                        ticket={tripData.ticket}
                                        accentColor="#ec4899"
                                        fullWidth
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <WorldTimeClock
                                    timezone="Asia/Tokyo"
                                    cityName="Tokyo"
                                    accentColor="#ec4899"
                                />
                            </div>
                        </div>
                        {/* Full width packing list */}
                        <DynamicPackingList
                            items={tripData.packingList || []}
                            onToggle={handleTogglePacking}
                            weatherCondition={tripData.atmosphere?.condition}
                            accentColor="#ec4899"
                        />
                    </div>
                </div>

                {/* Last response display */}
                {lastResponse && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-pink-500/20">
                        <p className="text-sm text-white/80">{lastResponse}</p>
                    </div>
                )}
            </main>

            {/* Chat Input - Fixed at Bottom */}
            <footer className="shrink-0 relative">
                <NeonTokyoChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    placeholder="Ask about your Tokyo adventure..."
                />
            </footer>
        </div>
    );
};
