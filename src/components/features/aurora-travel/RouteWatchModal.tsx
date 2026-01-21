/**
 * Route Watch Modal
 * 
 * Modal for creating and editing routes-to-watch.
 * Users define origin/destination with flexible dates and weather criteria.
 */
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    MapPin,
    Calendar,
    Thermometer,
    Droplets,
    Wind,
    Check,
    Search,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton, GlassInput } from '@/components';
import {
    useAuroraTravelStore,
    type RouteToWatch,
    type SavedLocation,
    type WeatherCriteria,
    type FlexibilitySettings,
} from '@/stores/auroraTravelStore';

// ============================================================================
// Types
// ============================================================================

interface RouteFormData {
    name: string;
    origin: SavedLocation | null;
    destination: SavedLocation | null;
    flexibility: FlexibilitySettings;
    weatherCriteria: WeatherCriteria;
}

export interface RouteWatchModalProps {
    /** Initial route data for editing */
    initialRoute?: RouteToWatch;
    /** Called when modal is closed */
    onClose: () => void;
    /** Called when route is saved */
    onSave?: (routeId: string) => void;
}

// ============================================================================
// Location Picker
// ============================================================================

interface LocationPickerProps {
    label: string;
    value: SavedLocation | null;
    onChange: (location: SavedLocation) => void;
    placeholder?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ label, value, onChange, placeholder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Mock search - in production, use Google Places API
    const handleSearch = useCallback(() => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        setTimeout(() => {
            const mockLocations: Record<string, { lat: number; lng: number }> = {
                'berlin': { lat: 52.52, lng: 13.405 },
                'munich': { lat: 48.1351, lng: 11.582 },
                'hamburg': { lat: 53.5511, lng: 9.9937 },
                'usedom': { lat: 53.95, lng: 14.05 },
                'rostock': { lat: 54.0924, lng: 12.0991 },
                'warnemünde': { lat: 54.1833, lng: 12.0833 },
            };

            const key = searchQuery.toLowerCase().trim();
            const coords = mockLocations[key] || { lat: 52.52 + Math.random() * 2, lng: 13.4 + Math.random() * 2 };

            onChange({
                id: crypto.randomUUID(),
                name: searchQuery.trim(),
                lat: coords.lat,
                lng: coords.lng,
                timezone: 'Europe/Berlin',
            });
            setSearchQuery('');
            setIsSearching(false);
        }, 300);
    }, [searchQuery, onChange]);

    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide">
                {label}
            </label>
            {value ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)]">
                    <MapPin size={16} className="text-sky-400" />
                    <span className="flex-1 text-sm font-medium text-primary">{value.name}</span>
                    <button
                        onClick={() => onChange(null as unknown as SavedLocation)}
                        className="p-1 rounded-md hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={placeholder || 'Search location...'}
                        className="pl-10"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    {searchQuery && (
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-xs font-medium hover:bg-[var(--glass-accent)]/30 transition-colors"
                        >
                            {isSearching ? '...' : 'Set'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Slider Component
// ============================================================================

interface SliderInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    icon?: React.ElementType;
}

const SliderInput: React.FC<SliderInputProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = '',
    icon: Icon,
}) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-medium text-tertiary">
                {Icon && <Icon size={12} />}
                {label}
            </label>
            <span className="text-sm font-medium text-primary">
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-[var(--glass-bg-subtle)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--glass-accent)]"
        />
    </div>
);

// ============================================================================
// Day Picker
// ============================================================================

const DAYS = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
] as const;

interface DayPickerProps {
    selectedDays: string[];
    onChange: (days: string[]) => void;
}

const DayPicker: React.FC<DayPickerProps> = ({ selectedDays, onChange }) => {
    const toggleDay = (dayId: string) => {
        onChange(
            selectedDays.includes(dayId)
                ? selectedDays.filter(d => d !== dayId)
                : [...selectedDays, dayId]
        );
    };

    return (
        <div className="flex gap-1">
            {DAYS.map((day) => (
                <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                        selectedDays.includes(day.id)
                            ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                            : 'bg-[var(--glass-bg-subtle)] text-tertiary hover:text-secondary'
                    )}
                >
                    {day.label}
                </button>
            ))}
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const RouteWatchModal: React.FC<RouteWatchModalProps> = ({
    initialRoute,
    onClose,
    onSave,
}) => {
    const createRouteToWatch = useAuroraTravelStore(state => state.createRouteToWatch);
    const updateRouteToWatch = useAuroraTravelStore(state => state.updateRouteToWatch);

    // Default dates: next 2 weeks
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [formData, setFormData] = useState<RouteFormData>(() => ({
        name: initialRoute?.name || '',
        origin: initialRoute?.origin || null,
        destination: initialRoute?.destination || null,
        flexibility: initialRoute?.flexibility || {
            dateRange: {
                start: today.toISOString().split('T')[0],
                end: twoWeeksFromNow.toISOString().split('T')[0],
            },
            preferredDays: ['friday', 'saturday', 'sunday'],
            minGoodWeatherHours: 6,
        },
        weatherCriteria: initialRoute?.weatherCriteria || {
            maxPrecipProbability: 20,
            minTemp: 15,
            maxTemp: 30,
            maxWindSpeed: 30,
        },
    }));

    const canSave = formData.name.trim() && formData.origin && formData.destination;

    const handleSave = () => {
        if (!canSave || !formData.origin || !formData.destination) return;

        if (initialRoute) {
            updateRouteToWatch(initialRoute.id, {
                name: formData.name,
                origin: formData.origin,
                destination: formData.destination,
                flexibility: formData.flexibility,
                weatherCriteria: formData.weatherCriteria,
            });
            onSave?.(initialRoute.id);
        } else {
            const routeId = createRouteToWatch({
                name: formData.name,
                origin: formData.origin,
                destination: formData.destination,
                flexibility: formData.flexibility,
                weatherCriteria: formData.weatherCriteria,
                status: 'watching',
            });
            onSave?.(routeId);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
                <GlassContainer className="p-6" border>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-primary">
                            {initialRoute ? 'Edit Route' : 'Watch a Route'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Route Name */}
                        <div>
                            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
                                Route Name
                            </label>
                            <GlassInput
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Weekend Baltic Sea Trip"
                            />
                        </div>

                        {/* Origin & Destination */}
                        <div className="grid grid-cols-2 gap-4">
                            <LocationPicker
                                label="From"
                                value={formData.origin}
                                onChange={(loc) => setFormData(prev => ({ ...prev, origin: loc }))}
                                placeholder="Origin city..."
                            />
                            <LocationPicker
                                label="To"
                                value={formData.destination}
                                onChange={(loc) => setFormData(prev => ({ ...prev, destination: loc }))}
                                placeholder="Destination..."
                            />
                        </div>

                        {/* Route Preview */}
                        {formData.origin && formData.destination && (
                            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                                <MapPin size={14} className="text-sky-400" />
                                <span className="text-sm text-primary">{formData.origin.name}</span>
                                <ArrowRight size={14} className="text-tertiary" />
                                <span className="text-sm text-primary">{formData.destination.name}</span>
                            </div>
                        )}

                        {/* Date Range */}
                        <div>
                            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
                                <Calendar size={12} className="inline mr-1" />
                                Look for weather between
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    value={formData.flexibility.dateRange.start}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        flexibility: {
                                            ...prev.flexibility,
                                            dateRange: { ...prev.flexibility.dateRange, start: e.target.value },
                                        },
                                    }))}
                                    className="px-3 py-2 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50"
                                />
                                <input
                                    type="date"
                                    value={formData.flexibility.dateRange.end}
                                    min={formData.flexibility.dateRange.start}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        flexibility: {
                                            ...prev.flexibility,
                                            dateRange: { ...prev.flexibility.dateRange, end: e.target.value },
                                        },
                                    }))}
                                    className="px-3 py-2 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50"
                                />
                            </div>
                        </div>

                        {/* Preferred Days */}
                        <div>
                            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
                                Preferred Days
                            </label>
                            <DayPicker
                                selectedDays={formData.flexibility.preferredDays || []}
                                onChange={(days) => setFormData(prev => ({
                                    ...prev,
                                    flexibility: { ...prev.flexibility, preferredDays: days as FlexibilitySettings['preferredDays'] },
                                }))}
                            />
                        </div>

                        {/* Weather Criteria */}
                        <div className="space-y-4">
                            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide">
                                Weather Criteria
                            </label>

                            <SliderInput
                                label="Max Rain Chance"
                                icon={Droplets}
                                value={formData.weatherCriteria.maxPrecipProbability}
                                onChange={(v) => setFormData(prev => ({
                                    ...prev,
                                    weatherCriteria: { ...prev.weatherCriteria, maxPrecipProbability: v },
                                }))}
                                min={0}
                                max={100}
                                step={5}
                                unit="%"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput
                                    label="Min Temp"
                                    icon={Thermometer}
                                    value={formData.weatherCriteria.minTemp || 10}
                                    onChange={(v) => setFormData(prev => ({
                                        ...prev,
                                        weatherCriteria: { ...prev.weatherCriteria, minTemp: v },
                                    }))}
                                    min={-10}
                                    max={30}
                                    unit="°C"
                                />
                                <SliderInput
                                    label="Max Temp"
                                    icon={Thermometer}
                                    value={formData.weatherCriteria.maxTemp || 35}
                                    onChange={(v) => setFormData(prev => ({
                                        ...prev,
                                        weatherCriteria: { ...prev.weatherCriteria, maxTemp: v },
                                    }))}
                                    min={10}
                                    max={45}
                                    unit="°C"
                                />
                            </div>

                            <SliderInput
                                label="Max Wind Speed"
                                icon={Wind}
                                value={formData.weatherCriteria.maxWindSpeed || 30}
                                onChange={(v) => setFormData(prev => ({
                                    ...prev,
                                    weatherCriteria: { ...prev.weatherCriteria, maxWindSpeed: v },
                                }))}
                                min={0}
                                max={60}
                                step={5}
                                unit=" km/h"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--glass-border)]">
                        <GlassButton variant="ghost" onClick={onClose}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" onClick={handleSave} disabled={!canSave}>
                            <Check size={16} className="mr-1" />
                            {initialRoute ? 'Save Changes' : 'Start Watching'}
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
};

export default RouteWatchModal;
