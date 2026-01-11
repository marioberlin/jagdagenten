'use client';

import { useState } from 'react';
import { GlassContainer } from '@/components';
import { GlassBadge } from '@/components';
import { GlassButton } from '@/components';
import { GlassAvatar } from '@/components';
import { GlassInput } from '@/components';
import { GlassSlider } from '@/components';
import {
    MessageCircle,
    Search,
    Globe,
    Mic,
    ArrowUp,
    Paperclip,
    Home,
    Clock,
    Film,
    Star,
    Settings,
    ChevronRight,
    Play,
    SkipBack,
    SkipForward,
    Repeat,
    Shuffle,
    Wifi,
    Power,
    Sun,
    CloudRain,
    Wind,
    Tv,
    Speaker,
    Fan,
    Timer,
    Layers,
    Camera,
    Plus,
    ChevronLeft,
    ArrowUpRight,
    Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================================
// DEMO 1: AI CHAT ASSISTANT (ZAP)
// ============================================================================
const AIChatDemo = () => {
    const [query, setQuery] = useState('');

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600 p-8">
            {/* Icon */}
            <div className="flex flex-col items-center justify-center pt-8 pb-12">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                    <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Hi, I'm Zap.</h2>
                <p className="text-white/70">How can I help you today?</p>
            </div>

            {/* Glass Search Bar */}
            <GlassContainer className="p-4 rounded-2xl max-w-2xl mx-auto" material="regular" border>
                <GlassInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything..."
                    className="mb-4 text-lg"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Paperclip className="w-5 h-5 text-white/60" />
                        </button>
                        <GlassButton variant="secondary" size="sm" className="gap-2">
                            <Search className="w-4 h-4" />
                            Deep search
                        </GlassButton>
                        <GlassButton variant="secondary" size="sm" className="gap-2">
                            <Globe className="w-4 h-4" />
                            Search
                        </GlassButton>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Mic className="w-5 h-5 text-white/60" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors">
                            <ArrowUp className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};

// ============================================================================
// DEMO 2: RESTAURANT / LUXLUNCH
// ============================================================================
const RestaurantDemo = () => {
    const menuItems = [
        { name: 'Veg Crunch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100', cta: 'Order now' },
        { name: 'Salmon Fois', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=100', cta: 'Order now' },
    ];

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200)' }}
            />
            <div className="absolute inset-0 bg-black/20" />

            {/* Glass Panel */}
            <div className="relative p-6">
                <GlassContainer className="p-8 rounded-3xl max-w-4xl mx-auto" material="thick" border>
                    {/* Nav */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                <Sun className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-primary">LuxLunch</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-6 text-sm text-secondary">
                            <a href="#" className="hover:text-primary">Home</a>
                            <a href="#" className="hover:text-primary">Tables</a>
                            <a href="#" className="hover:text-primary">Hi-Tea</a>
                            <a href="#" className="hover:text-primary">Reservations</a>
                        </nav>
                        <GlassButton variant="ghost" size="sm" className="text-orange-400">
                            Be a member
                        </GlassButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Content */}
                        <div>
                            <h1 className="text-4xl font-bold text-primary mb-4">
                                Where <span className="text-orange-400">taste</span><br />
                                meets perfection
                            </h1>
                            <p className="text-secondary mb-6">
                                Discover a curated collection of exquisite gourmet
                                delicacies, hand-selected for their exceptional quality
                                and taste.
                            </p>
                            <GlassButton className="bg-orange-500 hover:bg-orange-400">
                                Book Now
                            </GlassButton>

                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-primary mb-3">Starters</h3>
                                <div className="flex gap-4">
                                    {menuItems.map((item) => (
                                        <GlassContainer key={item.name} className="p-3 rounded-xl flex items-center gap-3" material="thin" border>
                                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                            <div>
                                                <div className="text-sm font-medium text-primary">{item.name}</div>
                                                <button className="text-xs text-orange-400">{item.cta}</button>
                                            </div>
                                        </GlassContainer>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right - Featured Image */}
                        <div className="relative">
                            <div className="relative w-full aspect-square max-w-sm mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-400/30" />
                                <img
                                    src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"
                                    alt="Pasta"
                                    className="w-full h-full rounded-full object-cover shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </GlassContainer>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 3: ENTERTAINMENT DASHBOARD
// ============================================================================
const EntertainmentDemo = () => {
    const movies = [
        { title: 'Beyond the Silence', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200', desc: 'A deep dive into mindfulness...' },
        { title: 'Neon Skies', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200', desc: 'A high-tech odyssey...' },
        { title: 'Echoes of the Mind', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200', desc: 'Explore how memories shape reality...' },
        { title: 'Flow State', image: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200', desc: 'One hidden signal...' },
    ];

    const recommendations = [
        { title: 'AI Awakens', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100' },
        { title: 'Shadows of Serenity', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100' },
        { title: 'Lightwave Chronicles', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100' },
    ];

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200)' }}
            />
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative p-6 grid grid-cols-12 gap-4">
                {/* Left Sidebar */}
                <div className="col-span-1 flex flex-col gap-2">
                    <GlassContainer className="p-3 rounded-xl" material="thin" border>
                        <Home className="w-5 h-5 text-primary" />
                    </GlassContainer>
                    <GlassContainer className="p-3 rounded-xl" material="thin" border>
                        <Clock className="w-5 h-5 text-secondary" />
                    </GlassContainer>
                    <GlassContainer className="p-3 rounded-xl" material="thin" border>
                        <Film className="w-5 h-5 text-secondary" />
                    </GlassContainer>
                    <GlassContainer className="p-3 rounded-xl" material="thin" border>
                        <Star className="w-5 h-5 text-secondary" />
                    </GlassContainer>
                    <GlassContainer className="p-3 rounded-xl" material="thin" border>
                        <Settings className="w-5 h-5 text-secondary" />
                    </GlassContainer>
                </div>

                {/* Main Content */}
                <div className="col-span-8 space-y-4">
                    <h2 className="text-2xl font-bold text-white">Welcome Romis</h2>

                    {/* Time Tracking */}
                    <GlassContainer className="p-4 rounded-xl" material="thin" border>
                        <h3 className="text-sm text-secondary mb-3">Time tracking</h3>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">1432</div>
                                <div className="text-xs text-secondary">Minutes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">80%</div>
                                <div className="text-xs text-secondary">Charge</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">6/10</div>
                                <div className="text-xs text-secondary">Target</div>
                            </div>
                        </div>
                    </GlassContainer>

                    {/* Movies Grid */}
                    <div>
                        <h3 className="text-sm text-secondary mb-3">Recommended Movies</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {movies.map((movie) => (
                                <GlassContainer key={movie.title} className="rounded-xl overflow-hidden" material="thin" border>
                                    <img src={movie.image} alt={movie.title} className="w-full h-24 object-cover" />
                                    <div className="p-2">
                                        <div className="text-xs font-medium text-primary truncate">{movie.title}</div>
                                        <div className="text-[10px] text-secondary truncate">{movie.desc}</div>
                                    </div>
                                </GlassContainer>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Recommendations */}
                <div className="col-span-3">
                    <GlassContainer className="p-4 rounded-xl" material="regular" border>
                        <h3 className="text-sm font-semibold text-primary mb-4">Recommend</h3>
                        <div className="space-y-3">
                            {recommendations.map((item) => (
                                <div key={item.title} className="flex items-center gap-3">
                                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <div className="text-sm font-medium text-primary">{item.title}</div>
                                        <div className="text-xs text-secondary">Healing begins where...</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassContainer>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 4: SMART HOME DASHBOARD
// ============================================================================
const SmartHomeDemo = () => {
    const [temperature] = useState(18);

    const weekForecast = [
        { day: 'Sat', high: 30, low: 22, icon: Sun },
        { day: 'Sun', high: 28, low: 20, icon: CloudRain },
        { day: 'Mon', high: 31, low: 23, icon: Sun },
        { day: 'Tue', high: 29, low: 19, icon: Wind },
    ];

    return (
        <div className="relative min-h-[600px] rounded-3xl overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200)' }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative p-6">
                {/* Top Nav */}
                <GlassContainer className="mx-auto w-fit px-6 py-2 rounded-full flex items-center gap-4 mb-6" material="thin" border>
                    <Search className="w-4 h-4 text-secondary" />
                    <Layers className="w-4 h-4 text-primary" />
                    <Settings className="w-4 h-4 text-secondary" />
                </GlassContainer>

                <div className="grid grid-cols-12 gap-4">
                    {/* Left Section */}
                    <div className="col-span-3 space-y-4">
                        <div>
                            <p className="text-white/60 italic">Good Morning Zia!</p>
                            <h2 className="text-3xl font-bold text-white">Laid-back Eco<br />Home Vibes</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">Members</span>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <GlassAvatar key={i} src={`https://i.pravatar.cc/40?img=${i}`} size="sm" />
                                ))}
                                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Camera Feed */}
                    <div className="col-span-3">
                        <GlassContainer className="p-3 rounded-xl h-full" material="regular" border>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-secondary">Camera 1</span>
                                <span className="flex items-center gap-1 text-xs text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white/30" />
                            </div>
                        </GlassContainer>
                    </div>

                    {/* Weather */}
                    <div className="col-span-3">
                        <GlassContainer className="p-4 rounded-xl" material="regular" border>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="text-3xl font-bold text-primary">23°C</div>
                                    <div className="text-xs text-secondary">56% Humidity</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-primary">Friday</div>
                                    <div className="text-xs text-secondary">20 June 2025</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {weekForecast.map((day) => (
                                    <div key={day.day} className="text-center flex-1">
                                        <div className="text-xs text-secondary">{day.day}</div>
                                        <day.icon className="w-4 h-4 text-primary mx-auto my-1" />
                                        <div className="text-xs text-primary">{day.high}°</div>
                                    </div>
                                ))}
                            </div>
                        </GlassContainer>
                    </div>

                    {/* Music Player */}
                    <div className="col-span-3">
                        <GlassContainer className="p-4 rounded-xl" material="regular" border>
                            <div className="text-xs text-secondary mb-1">Arash</div>
                            <div className="text-sm font-medium text-primary mb-3">One day I'm gonna fly away</div>
                            <img
                                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200"
                                alt="Album"
                                className="w-full h-20 object-cover rounded-lg mb-3"
                            />
                            <div className="flex items-center justify-center gap-4">
                                <Shuffle className="w-4 h-4 text-secondary" />
                                <SkipBack className="w-4 h-4 text-primary" />
                                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-primary" />
                                </button>
                                <SkipForward className="w-4 h-4 text-primary" />
                                <Repeat className="w-4 h-4 text-secondary" />
                            </div>
                        </GlassContainer>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-12 gap-4 mt-4">
                    {/* AC Control */}
                    <div className="col-span-3">
                        <GlassContainer className="p-4 rounded-xl" material="regular" border>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium text-primary">Air Conditioner</span>
                                </div>
                                <Power className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="text-4xl font-bold text-primary text-center mb-4">{temperature}°</div>
                            <div className="flex justify-center gap-4">
                                <button className="text-xs text-secondary flex flex-col items-center">
                                    <Fan className="w-4 h-4 mb-1" />
                                    Fan
                                </button>
                                <button className="text-xs text-secondary flex flex-col items-center">
                                    <Timer className="w-4 h-4 mb-1" />
                                    Timer
                                </button>
                                <button className="text-xs text-secondary flex flex-col items-center">
                                    <Layers className="w-4 h-4 mb-1" />
                                    Mode
                                </button>
                            </div>
                        </GlassContainer>
                    </div>

                    {/* TV */}
                    <div className="col-span-3">
                        <GlassContainer className="p-4 rounded-xl" material="thin" border>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Tv className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">TV</span>
                                </div>
                                <Power className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="text-xs text-secondary mb-2">Singer SmartTV</div>
                            <div className="flex gap-2">
                                {['N', 'prime', 'tv+', 'max'].map((s) => (
                                    <div key={s} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs text-primary">
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </GlassContainer>
                    </div>

                    {/* Alexa & WiFi */}
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                        <GlassContainer className="p-4 rounded-xl" material="thin" border>
                            <div className="flex items-center justify-between">
                                <Speaker className="w-5 h-5 text-primary" />
                                <Power className="w-3 h-3 text-secondary" />
                            </div>
                            <div className="text-xs font-medium text-primary mt-2">Alexa</div>
                        </GlassContainer>
                        <GlassContainer className="p-4 rounded-xl" material="thin" border>
                            <div className="flex items-center justify-between">
                                <Wifi className="w-5 h-5 text-primary" />
                                <Power className="w-3 h-3 text-secondary" />
                            </div>
                            <div className="text-xs font-medium text-primary mt-2">WiFi</div>
                        </GlassContainer>
                    </div>

                    {/* Ambient LED */}
                    <div className="col-span-3">
                        <GlassContainer className="p-4 rounded-xl" material="thin" border>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm font-medium text-primary">Ambient LED</span>
                            </div>
                            <div className="text-xs text-secondary">Living room ambiance</div>
                            <div className="h-3 mt-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" />
                        </GlassContainer>
                    </div>
                </div>

                {/* Bottom Dock */}
                <div className="flex justify-center mt-6">
                    <GlassContainer className="px-6 py-3 rounded-full flex items-center gap-4" material="regular" border>
                        <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                            <Home className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary">Living room</span>
                        </button>
                        {[Home, Layers, Settings, Star, Plus].map((Icon, i) => (
                            <button key={i} className="p-2">
                                <Icon className="w-4 h-4 text-secondary" />
                            </button>
                        ))}
                    </GlassContainer>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 5: ADMIN DASHBOARD
// ============================================================================
const AdminDashboardDemo = () => {
    const stats = [
        { label: 'Total Revenue', value: '$48,329', trend: '+12%', icon: '💰', color: 'bg-green-500/20 text-green-400' },
        { label: 'Total Sales', value: '1,204', trend: '+8%', icon: '🛒', color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Customers', value: '82', trend: '+24%', icon: '👤', color: 'bg-purple-500/20 text-purple-400' },
        { label: 'Orders', value: '15', trend: '-3%', icon: '📦', color: 'bg-yellow-500/20 text-yellow-400' },
    ];

    const chartData = [30, 50, 40, 60, 45, 75, 90];
    const maxHeight = Math.max(...chartData);

    const orders = [
        { id: '#84321', customer: 'John Doe', amount: '$129.99', status: 'Completed', statusColor: 'bg-green-500/20 text-green-400' },
        { id: '#84320', customer: 'Jane Smith', amount: '$49.50', status: 'Shipped', statusColor: 'bg-blue-500/20 text-blue-400' },
        { id: '#84319', customer: 'Mike Johnson', amount: '$250.00', status: 'Pending', statusColor: 'bg-yellow-500/20 text-yellow-400' },
    ];

    const sidebarItems = ['Dashboard', 'Analytics', 'Products', 'Customers', 'Settings'];

    return (
        <div className="relative min-h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
            <div className="grid grid-cols-12 gap-4 h-full">
                {/* Sidebar */}
                <div className="col-span-2 hidden md:block">
                    <GlassContainer className="h-full p-4 rounded-2xl" material="thin" border>
                        <h2 className="text-lg font-bold text-white mb-6">Admin</h2>
                        <nav className="space-y-2">
                            {sidebarItems.map((item, i) => (
                                <button
                                    key={item}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${i === 0
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </nav>
                    </GlassContainer>
                </div>

                {/* Main Content */}
                <div className="col-span-12 md:col-span-10 space-y-4">
                    {/* Header */}
                    <GlassContainer className="p-4 rounded-2xl flex items-center justify-between" material="thin" border>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
                            <p className="text-white/60 text-sm">Here's what's happening today.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">A</div>
                        </div>
                    </GlassContainer>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {stats.map((stat) => (
                            <GlassContainer key={stat.label} className="p-4 rounded-xl" material="thin" border>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-lg`}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-xs">{stat.label}</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-white">{stat.value}</span>
                                            <span className={`text-xs ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </GlassContainer>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Line Chart */}
                        <GlassContainer className="lg:col-span-2 p-4 rounded-xl" material="thin" border>
                            <h3 className="text-white font-semibold mb-4">Sales Overview</h3>
                            <div className="flex items-end justify-between h-32 gap-2">
                                {chartData.map((value, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-500/80 to-purple-500/60 rounded-t transition-all hover:from-blue-400 hover:to-purple-400"
                                            style={{ height: `${(value / maxHeight) * 100}%` }}
                                        />
                                        <span className="text-[10px] text-white/40">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </GlassContainer>

                        {/* Doughnut Chart */}
                        <GlassContainer className="p-4 rounded-xl" material="thin" border>
                            <h3 className="text-white font-semibold mb-4">Traffic Sources</h3>
                            <div className="flex items-center justify-center h-32">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(74, 222, 128, 0.8)" strokeWidth="3" strokeDasharray="45 100" />
                                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(96, 165, 250, 0.8)" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-45" />
                                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(192, 132, 252, 0.8)" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-70" />
                                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(250, 204, 21, 0.8)" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-85" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-2">
                                {[
                                    { label: 'Organic', color: 'bg-green-400' },
                                    { label: 'Direct', color: 'bg-blue-400' },
                                    { label: 'Referral', color: 'bg-purple-400' },
                                    { label: 'Social', color: 'bg-yellow-400' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                        <span className="text-[10px] text-white/60">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassContainer>
                    </div>

                    {/* Orders Table */}
                    <GlassContainer className="p-4 rounded-xl" material="thin" border>
                        <h3 className="text-white font-semibold mb-4">Recent Orders</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-white/40 text-left border-b border-white/10">
                                        <th className="pb-2 font-medium">Order ID</th>
                                        <th className="pb-2 font-medium">Customer</th>
                                        <th className="pb-2 font-medium">Amount</th>
                                        <th className="pb-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b border-white/5">
                                            <td className="py-3 text-white/70">{order.id}</td>
                                            <td className="py-3 text-white font-medium">{order.customer}</td>
                                            <td className="py-3 text-white/70">{order.amount}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassContainer>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 6: PORTFOLIO / GALLERY
// ============================================================================
const PortfolioDemo = () => {
    const galleryImages = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300',
        'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300',
    ];

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="font-serif italic text-2xl text-gray-800">lazy bird</div>
                <nav className="hidden md:flex items-center gap-6">
                    <a href="#" className="text-sm font-medium text-gray-900">Home</a>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Portfolio</a>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Blog</a>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact Us</a>
                </nav>
                <button className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm">
                    Login
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Content */}
                <div className="col-span-5">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Let's Create<br />
                        Something Beautiful
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Join the Email Newsletter. Fill out the form below, tell me that you want to
                        join the newsletter, and I'll add you right away.
                    </p>
                    <div className="flex gap-2">
                        <GlassInput
                            type="email"
                            placeholder="Email address"
                            className="flex-1"
                        />
                        <GlassButton variant="primary">
                            Subscribe
                        </GlassButton>
                    </div>

                    <div className="mt-12">
                        <span className="text-xs text-gray-500">Follow Us</span>
                        <div className="flex gap-3 mt-2">
                            {['Fb', 'In', 'Tw', 'Yt'].map((s) => (
                                <button key={s} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Gallery */}
                <div className="col-span-7">
                    <div className="flex gap-4 items-start">
                        {/* Frosted glass overlay on first image */}
                        <div className="relative w-48 h-72 rounded-2xl overflow-hidden">
                            <img src={galleryImages[0]} alt="Gallery 1" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
                        </div>
                        <div className="w-48 h-80 rounded-2xl overflow-hidden shadow-2xl">
                            <img src={galleryImages[1]} alt="Gallery 2" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-48 h-72 rounded-2xl overflow-hidden mt-8">
                            <img src={galleryImages[2]} alt="Gallery 3" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 7: INTRO ANIMATION
// ============================================================================
const IntroAnimationDemo = () => {
    const text = "Welcome to Liquid Glass";

    return (
        <div className="relative min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
            {/* Floating Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-20 h-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm top-[10%] left-[15%] animate-pulse" />
                <div className="absolute w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm top-[70%] left-[80%] animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm top-[80%] left-[10%] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute w-32 h-32 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm top-[25%] left-[75%] animate-bounce" style={{ animationDuration: '4s' }} />
                <div className="absolute w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm top-[5%] left-[45%] animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <GlassContainer className="p-8 md:p-12 text-center rounded-3xl max-w-2xl mx-4 relative z-10" material="thin" border>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                    {text.split('').map((char, i) => (
                        <span
                            key={i}
                            className="inline-block animate-bounce"
                            style={{
                                animationDelay: `${i * 0.05}s`,
                                animationDuration: '0.6s',
                                animationIterationCount: '1',
                                animationFillMode: 'both'
                            }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </h1>
                <p className="text-white/70 text-lg mb-6">The future of interfaces is here.</p>
                <GlassButton variant="primary" className="mx-auto">
                    Get Started <ChevronRight className="ml-1 w-4 h-4" />
                </GlassButton>
            </GlassContainer>
        </div>
    );
};

// ============================================================================
// DEMO 8: QUOTE GENERATOR
// ============================================================================
const QuoteGeneratorDemo = () => {
    const [projectType, setProjectType] = useState<string[]>([]);
    const [pageCount, setPageCount] = useState(10);
    const [complexity, setComplexity] = useState('standard');

    const projectOptions = [
        { id: 'new', label: 'New Website', cost: 2000 },
        { id: 'redesign', label: 'Redesign', cost: 1500 },
        { id: 'ecommerce', label: 'E-commerce', cost: 5000 },
        { id: 'webapp', label: 'Web App', cost: 8000 },
    ];

    const complexityOptions = [
        { id: 'simple', label: 'Simple', mult: 1 },
        { id: 'standard', label: 'Standard', mult: 1.5 },
        { id: 'complex', label: 'Complex', mult: 2.5 },
    ];

    const toggleProject = (id: string) => {
        setProjectType(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const calculateTotal = () => {
        const base = projectOptions.filter(p => projectType.includes(p.id)).reduce((a, b) => a + b.cost, 0);
        const mult = complexityOptions.find(c => c.id === complexity)?.mult || 1;
        return (base * mult) + (pageCount * 150);
    };

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <GlassContainer className="p-6 rounded-2xl space-y-6" material="thin" border>
                    <h2 className="text-xl font-bold text-white">Website Quote Generator</h2>

                    {/* Project Type */}
                    <div>
                        <h3 className="text-sm font-semibold text-white/80 mb-3">1. Project Type</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {projectOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleProject(opt.id)}
                                    className={`p-3 rounded-lg text-left text-sm transition-all ${projectType.includes(opt.id)
                                        ? 'bg-indigo-500/30 border-indigo-500/50 border'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-white font-medium">{opt.label}</span>
                                    <span className="text-white/50 block text-xs">${opt.cost}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Complexity */}
                    <div>
                        <h3 className="text-sm font-semibold text-white/80 mb-3">2. Complexity</h3>
                        <div className="flex gap-2">
                            {complexityOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setComplexity(opt.id)}
                                    className={`flex-1 p-3 rounded-lg text-sm transition-all ${complexity === opt.id
                                        ? 'bg-indigo-500/30 border-indigo-500/50 border'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-white font-medium">{opt.label}</span>
                                    <span className="text-white/50 block text-xs">{opt.mult}x</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Page Count */}
                    <div>
                        <h3 className="text-sm font-semibold text-white/80 mb-3">3. Pages: {pageCount}</h3>
                        <GlassSlider
                            min={1}
                            max={50}
                            value={pageCount}
                            onValueChange={setPageCount}
                        />
                    </div>
                </GlassContainer>

                {/* Result */}
                <GlassContainer className="p-6 rounded-2xl flex flex-col" material="regular" border>
                    <h2 className="text-xl font-bold text-white mb-4">Your Estimate</h2>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-white/60 text-sm mb-2">Estimated Total</p>
                            <p className="text-5xl font-extrabold text-indigo-300">
                                ${calculateTotal().toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-4 mt-4 text-sm text-white/60 space-y-1">
                        {projectType.length > 0 && (
                            <p>Base: ${projectOptions.filter(p => projectType.includes(p.id)).reduce((a, b) => a + b.cost, 0).toLocaleString()}</p>
                        )}
                        <p>Pages: ${(pageCount * 150).toLocaleString()}</p>
                        <p>Complexity: {complexityOptions.find(c => c.id === complexity)?.mult}x multiplier</p>
                    </div>
                </GlassContainer>
            </div>
        </div>
    );
};

// ============================================================================
// DEMO 9: LOGIN FLIP CARD
// ============================================================================
const LoginFlipDemo = () => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900 flex items-center justify-center p-6">
            <style>{`
                .flip-container { perspective: 1500px; }
                .flip-card { transform-style: preserve-3d; transition: transform 0.7s; }
                .flip-card.flipped { transform: rotateY(180deg); }
                .flip-face { backface-visibility: hidden; position: absolute; inset: 0; }
                .flip-back { transform: rotateY(180deg); }
            `}</style>

            <div className="flip-container w-full max-w-md">
                <div className={`flip-card relative h-[400px] ${isFlipped ? 'flipped' : ''}`}>
                    {/* Front - Login */}
                    <div className="flip-face">
                        <GlassContainer className="w-full h-full p-8 rounded-2xl flex flex-col items-center justify-center" material="regular" border>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-white/60 mb-6">Please sign in to continue</p>

                            <div className="w-full space-y-4">
                                <GlassInput
                                    type="text"
                                    placeholder="Email Address"
                                    icon={<span className="text-white/40">👤</span>}
                                />
                                <GlassInput
                                    type="password"
                                    placeholder="Password"
                                    icon={<span className="text-white/40">🔒</span>}
                                />
                                <GlassButton
                                    variant="primary"
                                    className="w-full justify-center"
                                    onClick={() => setIsFlipped(true)}
                                >
                                    Login <ChevronRight className="ml-1 w-4 h-4" />
                                </GlassButton>
                            </div>
                        </GlassContainer>
                    </div>

                    {/* Back - Dashboard Preview */}
                    <div className="flip-face flip-back">
                        <GlassContainer className="w-full h-full p-6 rounded-2xl" material="regular" border>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">Dashboard</h2>
                                <button
                                    onClick={() => setIsFlipped(false)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Logout
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {[
                                    { label: 'Revenue', value: '$48K', icon: '💰', color: 'bg-green-500/20' },
                                    { label: 'Sales', value: '1,204', icon: '🛒', color: 'bg-blue-500/20' },
                                    { label: 'Users', value: '82', icon: '👤', color: 'bg-purple-500/20' },
                                    { label: 'Orders', value: '15', icon: '📦', color: 'bg-yellow-500/20' },
                                ].map(stat => (
                                    <div key={stat.label} className={`${stat.color} rounded-lg p-3`}>
                                        <div className="text-lg mb-1">{stat.icon}</div>
                                        <div className="text-white font-bold">{stat.value}</div>
                                        <div className="text-white/60 text-xs">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 flex-1">
                                <h3 className="text-sm font-medium text-white mb-2">Sales Chart</h3>
                                <div className="h-16 flex items-end gap-1">
                                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                        <div key={i} className="flex-1 bg-blue-500/60 rounded-t" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </GlassContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN SHOWCASE COMPONENT
// ============================================================================
export const ShowcaseInspiration = () => {
    return (
        <div className="space-y-8">
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Demos</span>
                        <h3 className="text-xl font-bold text-primary">Demos</h3>
                    </div>
                    <GlassBadge variant="default">9 Demos</GlassBadge>
                </div>
                <p className="text-secondary mb-8">
                    Real-world liquid glass UI concepts showcasing the versatility of the design system. Full-screen demos integrated into the Showcase.
                </p>

                <div className="space-y-12">
                    {/* Featured Demos */}
                    <div id="featured">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Featured Demos
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassContainer className="p-6 group relative overflow-hidden" material="thick" border interactive>
                                <Link to="/demos/foundation" className="absolute inset-0 z-10" />
                                <div className="relative z-0">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Foundation System</h3>
                                    <p className="text-sm text-secondary mb-4">
                                        Interactive playground for design tokens, typography, and foundational components.
                                    </p>
                                    <div className="flex items-center text-xs font-bold text-blue-400 uppercase tracking-wider">
                                        Launch Demo <ArrowUpRight size={12} className="ml-1" />
                                    </div>
                                </div>
                            </GlassContainer>

                            <GlassContainer className="p-6 group relative overflow-hidden" material="thick" border interactive>
                                <Link to="/demos/signature" className="absolute inset-0 z-10" />
                                <div className="relative z-0">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Signature Interactions</h3>
                                    <p className="text-sm text-secondary mb-4">
                                        High-polish interaction patterns, morphing cards, and fluid navigation animations.
                                    </p>
                                    <div className="flex items-center text-xs font-bold text-purple-400 uppercase tracking-wider">
                                        Launch Demo <ArrowUpRight size={12} className="ml-1" />
                                    </div>
                                </div>
                            </GlassContainer>
                        </div>
                    </div>
                    {/* Demo 1: AI Chat */}
                    <div id="ai-chat">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            AI Assistant Interface
                        </span>
                        <AIChatDemo />
                    </div>

                    {/* Demo 2: Restaurant */}
                    <div id="restaurant">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Restaurant Website
                        </span>
                        <RestaurantDemo />
                    </div>

                    {/* Demo 3: Entertainment */}
                    <div id="entertainment">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Entertainment Dashboard
                        </span>
                        <EntertainmentDemo />
                    </div>

                    {/* Demo 4: Smart Home */}
                    <div id="smart-home">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Smart Home Dashboard
                        </span>
                        <SmartHomeDemo />
                    </div>

                    {/* Demo 5: Admin Dashboard */}
                    <div id="admin">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Admin Dashboard
                        </span>
                        <AdminDashboardDemo />
                    </div>

                    {/* Demo 6: Portfolio */}
                    <div id="portfolio">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Creative Portfolio
                        </span>
                        <PortfolioDemo />
                    </div>

                    {/* Demo 7: Intro Animation */}
                    <div id="intro-animation">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Intro Animation
                        </span>
                        <IntroAnimationDemo />
                    </div>

                    {/* Demo 8: Quote Generator */}
                    <div id="quote-generator">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Quote Generator
                        </span>
                        <QuoteGeneratorDemo />
                    </div>

                    {/* Demo 9: Login Flip Card */}
                    <div id="login-flip">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-4">
                            Login Flip Card
                        </span>
                        <LoginFlipDemo />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
