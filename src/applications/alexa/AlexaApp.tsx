/**
 * Alexa+ App - Smart Home Dashboard
 *
 * Features:
 * - Real weather data via geolocation + OpenWeatherMap
 * - Google Calendar integration
 * - Shopping list with persistence
 * - Option+Spacebar agent input toggle
 * - Weather/Time in title bar
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Calendar,
    ShoppingCart,
    Cloud,
    Image,
    Mic,
    Send,
    Sun,
    CloudSun,
    CloudRain,
    Snowflake,
    ChevronLeft,
    ChevronRight,
    Phone,
    Radio,
    Check,
    Plus,
    X,
    MapPin,
    RefreshCw,
    LogIn,
} from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { AuroraWeatherService, type CurrentWeather, type HourlyForecast } from '@/services/a2a/AuroraWeatherService';
import { useAlexaAppStore } from './store';

// =============================================================================
// Types
// =============================================================================

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end?: Date;
    isAllDay: boolean;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface ShoppingItem {
    id: string;
    name: string;
    checked: boolean;
}

interface Contact {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
    canDropIn: boolean;
    canCall: boolean;
    type: 'device' | 'person';
}

interface Photo {
    url: string;
    caption: string;
}

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    city: string;
    loading: boolean;
    error: string | null;
}

// =============================================================================
// Weather Helpers
// =============================================================================

const getWeatherIcon = (condition: string | undefined, size: number = 20) => {
    switch (condition) {
        case 'clear': return <Sun size={size} className="text-yellow-400" />;
        case 'partly_cloudy': return <CloudSun size={size} className="text-gray-300" />;
        case 'cloudy':
        case 'overcast': return <Cloud size={size} className="text-gray-400" />;
        case 'rain':
        case 'drizzle':
        case 'heavy_rain':
        case 'thunderstorm': return <CloudRain size={size} className="text-blue-400" />;
        case 'snow':
        case 'heavy_snow':
        case 'sleet':
        case 'hail': return <Snowflake size={size} className="text-blue-200" />;
        default: return <Sun size={size} className="text-yellow-400" />;
    }
};

// =============================================================================
// Google Calendar Helper
// =============================================================================

async function fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
    try {
        const now = new Date();
        const timeMin = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const timeMax = new Date(now.setDate(now.getDate() + 7)).toISOString();

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=20`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) throw new Error('Failed to fetch calendar');

        const data = await response.json();
        const colors: CalendarEvent['color'][] = ['blue', 'green', 'yellow', 'red', 'purple'];

        return (data.items || []).map((item: any, idx: number) => ({
            id: item.id,
            title: item.summary || 'Untitled Event',
            start: new Date(item.start?.dateTime || item.start?.date),
            end: item.end ? new Date(item.end.dateTime || item.end.date) : undefined,
            isAllDay: !!item.start?.date,
            color: colors[idx % colors.length],
        }));
    } catch (err) {
        console.error('Calendar fetch error:', err);
        return [];
    }
}

// =============================================================================
// Geolocation Hook
// =============================================================================

function useGeolocation(): GeolocationState & { refresh: () => void } {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lng: null,
        city: 'Loading...',
        loading: true,
        error: null,
    });

    const fetchLocation = useCallback(() => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get city name
                try {
                    const resp = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const data = await resp.json();
                    setState({
                        lat: latitude,
                        lng: longitude,
                        city: data.city || data.locality || 'Unknown',
                        loading: false,
                        error: null,
                    });
                } catch {
                    setState({
                        lat: latitude,
                        lng: longitude,
                        city: 'Unknown Location',
                        loading: false,
                        error: null,
                    });
                }
            },
            (err) => {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: err.message,
                    city: 'Seattle, WA', // Fallback
                }));
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }, []);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    return { ...state, refresh: fetchLocation };
}

// =============================================================================
// Sub-Components
// =============================================================================

const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/80',
    green: 'bg-green-500/80',
    yellow: 'bg-yellow-500/80',
    red: 'bg-red-500/80',
    purple: 'bg-purple-500/80',
};

const CalendarWidget: React.FC<{
    events: CalendarEvent[];
    isSignedIn: boolean;
    onSignIn: () => void;
    loading: boolean;
}> = ({ events, isSignedIn, onSignIn, loading }) => {
    const [viewMonth, setViewMonth] = useState(new Date());
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => e.start.toDateString() === today.toDateString());
    const tomorrowEvents = events.filter(e => e.start.toDateString() === tomorrow.toDateString());

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const monthName = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = useMemo(() => {
        const d = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            const prevMonthDays = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0).getDate();
            d.push({ day: prevMonthDays - firstDayOfMonth + i + 1, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            d.push({ day: i, isCurrentMonth: true });
        }
        const remaining = 42 - d.length;
        for (let i = 1; i <= remaining; i++) {
            d.push({ day: i, isCurrentMonth: false });
        }
        return d;
    }, [viewMonth, firstDayOfMonth, daysInMonth]);

    if (!isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
                <Calendar size={48} className="text-white/30" />
                <p className="text-white/60 text-sm">Connect Google Calendar to see your events</p>
                <button
                    onClick={onSignIn}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                    <LogIn size={16} />
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {loading && <div className="text-white/40 text-xs mb-2">Syncing...</div>}

            {/* Events List */}
            <div className="flex-1 space-y-1 mb-4 overflow-y-auto custom-scrollbar">
                <div className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">Today</div>
                {todayEvents.length === 0 ? (
                    <div className="text-white/30 text-sm py-2">No events today</div>
                ) : (
                    todayEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-2 py-1">
                            <div className={`w-1 h-full min-h-[20px] rounded-full ${colorMap[event.color]}`} />
                            <div className="flex-1 min-w-0">
                                {event.isAllDay ? (
                                    <div className="text-white/40 text-xs">all-day</div>
                                ) : (
                                    <div className="text-white/40 text-xs">{formatTime(event.start)}</div>
                                )}
                                <div className="text-white text-sm font-medium truncate">{event.title}</div>
                            </div>
                        </div>
                    ))
                )}

                <div className="text-white/60 text-xs font-medium uppercase tracking-wide mt-4 mb-2">Tomorrow</div>
                {tomorrowEvents.length === 0 ? (
                    <div className="text-white/30 text-sm py-2">No events</div>
                ) : (
                    tomorrowEvents.slice(0, 4).map(event => (
                        <div key={event.id} className="flex items-start gap-2 py-1">
                            <div className={`w-1 h-full min-h-[20px] rounded-full ${colorMap[event.color]}`} />
                            <div className="flex-1 min-w-0">
                                {event.isAllDay ? (
                                    <div className="text-white/40 text-xs">all-day</div>
                                ) : (
                                    <div className="text-white/40 text-xs">{formatTime(event.start)}</div>
                                )}
                                <div className="text-white text-sm font-medium truncate">{event.title}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Mini Calendar */}
            <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                        className="p-1 hover:bg-white/10 rounded transition-colors">
                        <ChevronLeft size={16} className="text-white/60" />
                    </button>
                    <span className="text-white text-sm font-medium">{monthName}</span>
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                        className="p-1 hover:bg-white/10 rounded transition-colors">
                        <ChevronRight size={16} className="text-white/60" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-white/40 text-[10px] font-medium py-1">{d}</div>
                    ))}
                    {days.map((d, i) => (
                        <div key={i} className={`text-xs py-1 rounded ${d.isCurrentMonth
                            ? d.day === today.getDate() && viewMonth.getMonth() === today.getMonth()
                                ? 'bg-cyan-500 text-white font-bold'
                                : 'text-white/80'
                            : 'text-white/20'
                            }`}>
                            {d.day}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ShoppingListWidget: React.FC<{
    items: ShoppingItem[];
    onToggle: (id: string) => void;
    onAdd: (name: string) => void;
}> = ({ items, onToggle, onAdd }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 h-full">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-white font-semibold">Shopping List</h3>
                    <p className="text-white/40 text-xs">{items.filter(i => !i.checked).length} items remaining</p>
                </div>
                <ShoppingCart size={18} className="text-white/40" />
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                {items.map(item => (
                    <div key={item.id}
                        onClick={() => onToggle(item.id)}
                        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 transition-colors">
                        <div className={`w-4 h-4 rounded border ${item.checked ? 'bg-cyan-500 border-cyan-500' : 'border-white/30'} flex items-center justify-center`}>
                            {item.checked && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-white text-sm ${item.checked ? 'line-through opacity-50' : ''}`}>{item.name}</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add item..."
                    className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:bg-white/10 transition-colors"
                />
                <button onClick={handleAdd} className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors">
                    <Plus size={16} className="text-cyan-400" />
                </button>
            </div>
        </div>
    );
};

const WeatherWidget: React.FC<{
    current: CurrentWeather | null;
    hourly: HourlyForecast[];
    city: string;
    loading: boolean;
    onRefresh: () => void;
}> = ({ current, hourly, city, loading, onRefresh }) => {
    return (
        <div className="bg-gradient-to-br from-sky-600/40 to-blue-800/40 backdrop-blur-xl rounded-2xl p-4">
            {/* Current Weather */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                        <MapPin size={12} />
                        <span>{city}</span>
                        <button onClick={onRefresh} className="ml-1 hover:text-white/80 transition-colors">
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-light text-white">
                            {current ? Math.round(current.temperature) : '--'}°
                        </span>
                        <div className="text-white/60 text-xs">
                            {current && (
                                <>
                                    <span>H:{Math.round(current.temperature + 2)}°</span>
                                    <span className="ml-2">L:{Math.round(current.temperature - 4)}°</span>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-white/80 text-sm">{current?.conditionText || 'Loading...'}</p>
                    {current && (
                        <p className="text-white/50 text-xs">Feels like {Math.round(current.feelsLike)}°</p>
                    )}
                </div>
                {current ? getWeatherIcon(current.condition, 48) : <Cloud size={48} className="text-white/30" />}
            </div>

            {/* 24-Hour Forecast - Horizontally Scrollable */}
            {hourly.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                    <p className="text-white/50 text-xs uppercase tracking-wide mb-2">24-Hour Forecast</p>
                    <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                        <div className="flex gap-3" style={{ width: 'max-content' }}>
                            {hourly.map((h, i) => {
                                const hour = new Date(h.time).getHours();
                                const hourStr = hour.toString().padStart(2, '0');
                                const isNow = i === 0;
                                // Use current temperature for "Now" slot for consistency
                                const displayTemp = isNow && current ? current.temperature : h.temperature;
                                const displayCondition = isNow && current ? current.condition : h.condition;
                                return (
                                    <div
                                        key={i}
                                        className={`flex flex-col items-center min-w-[48px] py-2 px-2 rounded-lg transition-colors ${isNow ? 'bg-white/10' : ''
                                            }`}
                                    >
                                        <p className={`text-xs ${isNow ? 'text-cyan-400 font-medium' : 'text-white/50'}`}>
                                            {isNow ? 'Now' : `${hourStr}:00`}
                                        </p>
                                        <div className="my-1">
                                            {getWeatherIcon(displayCondition, 18)}
                                        </div>
                                        <p className="text-white text-sm font-medium">{Math.round(displayTemp)}°</p>
                                        {!isNow && h.precipitationProbability > 0 && (
                                            <p className="text-cyan-400 text-[10px]">{Math.round(h.precipitationProbability)}%</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PhotosWidget: React.FC<{ photos: Photo[] }> = ({ photos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (photos.length <= 1) return;

        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % photos.length);
                setIsTransitioning(false);
            }, 500);
        }, 10000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [photos.length]);

    if (photos.length === 0) return null;
    const photo = photos[currentIndex];

    return (
        <div className="relative rounded-2xl overflow-hidden h-full min-h-[180px]">
            <img
                key={currentIndex}
                src={photo.url}
                alt={photo.caption}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                    }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
                <div className="flex items-center gap-1.5 text-white/80 text-xs bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                    <Image size={12} />
                    <span>Art Gallery</span>
                </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
                <p className={`text-white font-medium text-sm transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    {photo.caption}
                </p>
            </div>
            {/* Image counter */}
            <div className="absolute top-3 right-3 text-white/40 text-xs bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                {currentIndex + 1} / {photos.length}
            </div>
        </div>
    );
};

const ContactsWidget: React.FC<{ contacts: Contact[] }> = ({ contacts }) => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Top Contacts</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
            {contacts.map(contact => (
                <div key={contact.id} className="text-center">
                    <div className={`w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center ${contact.type === 'device' ? 'bg-white/10' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }`}>
                        {contact.type === 'device' ? (
                            <Radio size={20} className="text-white/60" />
                        ) : (
                            <span className="text-white text-lg font-semibold">{contact.initials}</span>
                        )}
                    </div>
                    <p className="text-white text-xs font-medium truncate px-1">{contact.name.split(' ')[0]}</p>
                    <div className="flex items-center justify-center gap-1 mt-1 text-white/40 text-[10px]">
                        {contact.canDropIn && <><Radio size={10} /></>}
                        {contact.canCall && <Phone size={10} />}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AgentInputBar: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
}> = ({ visible, onClose, onSend }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (visible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [visible]);

    const handleSubmit = () => {
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };

    if (!visible) return null;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90%] z-50 animate-fade-in">
            <div className="bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-xl">
                        <Mic size={20} className="text-cyan-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                            if (e.key === 'Escape') onClose();
                        }}
                        placeholder="Ask Alexa anything..."
                        className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                        <Send size={20} className="text-white" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} className="text-white/60" />
                    </button>
                </div>
                <div className="text-center text-white/30 text-xs mt-2">
                    Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⌃ Space</kbd> to toggle • <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> to close
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// Main App
// =============================================================================

// Expressionist Paintings Collection (AI-generated, hosted locally)
const EXPRESSIONIST_PAINTINGS: Photo[] = [
    { url: '/assets/paintings/kandinsky-composition.png', caption: 'Kandinsky - Abstract Composition' },
    { url: '/assets/paintings/munch-anxiety.png', caption: 'Munch - Anxiety' },
    { url: '/assets/paintings/marc-blue-horses.png', caption: 'Franz Marc - Blue Horses' },
    { url: '/assets/paintings/kirchner-street.png', caption: 'Kirchner - Die Brücke Street Scene' },
    { url: '/assets/paintings/schiele-figure.png', caption: 'Schiele - Figure Study' },
    { url: '/assets/paintings/kokoschka-landscape.png', caption: 'Kokoschka - Turbulent Landscape' },
    { url: '/assets/paintings/klee-portrait.png', caption: 'Paul Klee - Geometric Face' },
    { url: '/assets/paintings/macke-promenade.png', caption: 'August Macke - Garden Promenade' },
    { url: '/assets/paintings/nolde-flowers.png', caption: 'Emil Nolde - Vibrant Flowers' },
    { url: '/assets/paintings/beckmann-self.png', caption: 'Max Beckmann - Self Portrait' },
];

const DEMO_CONTACTS: Contact[] = [
    { id: 'c1', name: 'Kitchen Echo', initials: '', type: 'device', canDropIn: true, canCall: false },
    { id: 'c2', name: 'Study Room', initials: '', type: 'device', canDropIn: false, canCall: true },
    { id: 'c3', name: 'Andrea Smith', initials: 'AS', type: 'person', canDropIn: false, canCall: true },
    { id: 'c4', name: 'Sally Chen', initials: 'SC', type: 'person', canDropIn: false, canCall: true },
    { id: 'c5', name: 'Dad', initials: 'D', type: 'person', canDropIn: true, canCall: true },
];

const STORAGE_KEY = 'alexa-shopping-list';

export const AlexaApp: React.FC = () => {
    // Geolocation
    const geo = useGeolocation();

    // Weather
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const setWeatherStore = useAlexaAppStore(s => s.setWeather);

    // Use lazy initialization to avoid recreating service on every render
    const weatherService = useRef<AuroraWeatherService | null>(null);
    if (!weatherService.current) {
        weatherService.current = new AuroraWeatherService('alexa-weather', (data) => {
            const firstLocation = Object.keys(data.weatherData)[0];
            if (firstLocation) {
                const weather = data.weatherData[firstLocation].current;
                setCurrentWeather(weather);
                setHourlyForecast(data.weatherData[firstLocation].hourly.slice(0, 24));
                // Publish to store for title bar
                setWeatherStore(weather.temperature, weather.condition, data.weatherData[firstLocation].location.name);
            }
        });
    }

    // Google Calendar
    const { accessToken, isAuthenticated, signIn, isLoading: authLoading } = useGoogleAuth([
        'https://www.googleapis.com/auth/calendar.readonly',
    ]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    // Shopping List (persisted)
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [
                { id: 's1', name: 'Bananas', checked: false },
                { id: 's2', name: 'Olive Oil', checked: false },
                { id: 's3', name: 'Lemons', checked: false },
            ];
        } catch {
            return [];
        }
    });

    // UI State
    const [showInput, setShowInput] = useState(false);
    const [lastResponse, setLastResponse] = useState<string | null>(null);

    // Persist shopping list
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shoppingItems));
    }, [shoppingItems]);

    // Fetch weather when location is available
    useEffect(() => {
        if (geo.city && !geo.loading && geo.city !== 'Loading...' && weatherService.current) {
            setWeatherLoading(true);
            weatherService.current.sendMessage(`Weather in ${geo.city}`).finally(() => {
                setWeatherLoading(false);
            });
        }
    }, [geo.city, geo.loading]);

    // Fetch calendar when authenticated
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            setCalendarLoading(true);
            fetchGoogleCalendarEvents(accessToken).then(events => {
                setCalendarEvents(events);
                setCalendarLoading(false);
            });
        }
    }, [isAuthenticated, accessToken]);

    // Option+Spacebar keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                setShowInput(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSendMessage = useCallback(async (message: string) => {
        const lowerMsg = message.toLowerCase();

        // Handle shopping list commands
        if (lowerMsg.includes('add') && (lowerMsg.includes('list') || lowerMsg.includes('shopping'))) {
            const match = message.match(/add\s+(.+?)\s+to/i) || message.match(/add\s+(.+?)$/i);
            if (match) {
                const itemName = match[1].trim();
                setShoppingItems(prev => [...prev, { id: uuidv4(), name: itemName, checked: false }]);
                setLastResponse(`Added "${itemName}" to your shopping list.`);
            }
        } else if (lowerMsg.includes('weather')) {
            if (currentWeather) {
                setLastResponse(`It's ${Math.round(currentWeather.temperature)}° and ${currentWeather.conditionText} in ${geo.city}.`);
            } else {
                setLastResponse('Fetching weather...');
                weatherService.current?.sendMessage(`Weather in ${geo.city}`);
            }
        } else if (lowerMsg.includes('calendar')) {
            setLastResponse(`You have ${calendarEvents.length} upcoming events.`);
        } else {
            setLastResponse("Try: 'Add milk to list', 'What's the weather?', or 'What's on my calendar?'");
        }

        setShowInput(false);
        setTimeout(() => setLastResponse(null), 4000);
    }, [currentWeather, geo.city, calendarEvents.length]);

    const handleToggleItem = (id: string) => {
        setShoppingItems(prev =>
            prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    };

    const handleAddItem = (name: string) => {
        setShoppingItems(prev => [...prev, { id: uuidv4(), name, checked: false }]);
    };

    const refreshWeather = () => {
        geo.refresh();
    };

    return (
        <div className="relative flex flex-col h-full bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] rounded-b-xl overflow-hidden">
            {/* Main Grid */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-12 gap-4 h-full min-h-[600px]">
                    {/* Left Column - Calendar */}
                    <div className="col-span-4 bg-white/5 backdrop-blur-xl rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={18} className="text-cyan-400" />
                            <span className="text-white font-semibold">Calendar</span>
                        </div>
                        <CalendarWidget
                            events={calendarEvents}
                            isSignedIn={isAuthenticated}
                            onSignIn={signIn}
                            loading={calendarLoading || authLoading}
                        />
                    </div>

                    {/* Center Column - Shopping + Weather + Photos */}
                    <div className="col-span-4 flex flex-col gap-4">
                        <ShoppingListWidget
                            items={shoppingItems}
                            onToggle={handleToggleItem}
                            onAdd={handleAddItem}
                        />
                        <WeatherWidget
                            current={currentWeather}
                            hourly={hourlyForecast}
                            city={geo.city}
                            loading={weatherLoading || geo.loading}
                            onRefresh={refreshWeather}
                        />
                        <PhotosWidget photos={EXPRESSIONIST_PAINTINGS} />
                    </div>

                    {/* Right Column - Contacts */}
                    <div className="col-span-4">
                        <ContactsWidget contacts={DEMO_CONTACTS} />
                    </div>
                </div>
            </div>

            {/* Response Toast */}
            {lastResponse && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/10 animate-fade-in z-40">
                    <p className="text-white text-sm">{lastResponse}</p>
                </div>
            )}

            {/* Agent Input Bar */}
            <AgentInputBar visible={showInput} onClose={() => setShowInput(false)} onSend={handleSendMessage} />

            {/* Hint */}
            {!showInput && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs">
                    Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/30">⌃ Space</kbd> to ask Alexa
                </div>
            )}
        </div>
    );
};

export default AlexaApp;
