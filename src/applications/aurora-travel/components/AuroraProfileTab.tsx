/**
 * Aurora Profile Tab
 * 
 * User preferences and settings for Aurora Travel Weather.
 */
import React from 'react';
import {
    User,
    Thermometer,
    Ruler,
    Clock,
    Bell,
    Route,
    MapPin,
    Home,
    Briefcase,
    ChevronRight,
} from 'lucide-react';
import { GlassContainer, GlassButton } from '@/components';
import { cn } from '@/utils/cn';
import {
    useAuroraTravelStore,
    type TemperatureUnit,
    type DistanceUnit,
    type TimeFormat,
    selectHomeLocation,
    selectWorkLocation,
} from '@/stores/auroraTravelStore';

// ============================================================================
// Setting Row Component
// ============================================================================

interface SettingRowProps {
    icon: React.ElementType;
    label: string;
    description?: string;
    children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon: Icon, label, description, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-[var(--glass-border)] last:border-0">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--glass-bg-subtle)]">
                <Icon size={18} className="text-secondary" />
            </div>
            <div>
                <div className="text-sm font-medium text-primary">{label}</div>
                {description && (
                    <div className="text-xs text-tertiary">{description}</div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {children}
        </div>
    </div>
);

// ============================================================================
// Toggle Chips
// ============================================================================

interface ToggleChipProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}

const ToggleChips: React.FC<ToggleChipProps> = ({ options, value, onChange }) => (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--glass-bg-subtle)]">
        {options.map((option) => (
            <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                    value === option.value
                        ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]'
                        : 'text-secondary hover:text-primary'
                )}
            >
                {option.label}
            </button>
        ))}
    </div>
);

// ============================================================================
// Toggle Switch
// ============================================================================

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={cn(
            'relative w-10 h-6 rounded-full transition-colors',
            checked ? 'bg-[var(--glass-accent)]' : 'bg-[var(--glass-bg-subtle)]'
        )}
    >
        <div
            className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-5' : 'translate-x-1'
            )}
        />
    </button>
);

// ============================================================================
// Location Row
// ============================================================================

interface LocationRowProps {
    icon: React.ElementType;
    label: string;
    locationName?: string;
    onConfigure: () => void;
}

const LocationRow: React.FC<LocationRowProps> = ({ icon: Icon, label, locationName, onConfigure }) => (
    <button
        onClick={onConfigure}
        className="w-full flex items-center justify-between py-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-white/5 -mx-4 px-4 transition-colors"
    >
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--glass-bg-subtle)]">
                <Icon size={18} className="text-secondary" />
            </div>
            <div className="text-left">
                <div className="text-sm font-medium text-primary">{label}</div>
                <div className="text-xs text-tertiary">
                    {locationName || 'Not set'}
                </div>
            </div>
        </div>
        <ChevronRight size={16} className="text-tertiary" />
    </button>
);

// ============================================================================
// Main Component
// ============================================================================

export const AuroraProfileTab: React.FC = () => {
    const preferences = useAuroraTravelStore(state => state.preferences);
    const updatePreferences = useAuroraTravelStore(state => state.updatePreferences);
    const savedLocations = useAuroraTravelStore(state => state.savedLocations);
    const homeLocation = useAuroraTravelStore(selectHomeLocation);
    const workLocation = useAuroraTravelStore(selectWorkLocation);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Profile Header */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                        <User size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-primary">Aurora Traveler</h2>
                        <p className="text-sm text-secondary">
                            {savedLocations.length} saved location{savedLocations.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </GlassContainer>

            {/* Units & Display */}
            <GlassContainer className="p-4" border>
                <h3 className="text-sm font-semibold text-primary mb-2 px-2">Units & Display</h3>

                <SettingRow icon={Thermometer} label="Temperature">
                    <ToggleChips
                        options={[
                            { value: 'celsius', label: '°C' },
                            { value: 'fahrenheit', label: '°F' },
                        ]}
                        value={preferences.temperatureUnit}
                        onChange={(v) => updatePreferences({ temperatureUnit: v as TemperatureUnit })}
                    />
                </SettingRow>

                <SettingRow icon={Ruler} label="Distance">
                    <ToggleChips
                        options={[
                            { value: 'km', label: 'km' },
                            { value: 'miles', label: 'mi' },
                        ]}
                        value={preferences.distanceUnit}
                        onChange={(v) => updatePreferences({ distanceUnit: v as DistanceUnit })}
                    />
                </SettingRow>

                <SettingRow icon={Clock} label="Time Format">
                    <ToggleChips
                        options={[
                            { value: '24h', label: '24h' },
                            { value: '12h', label: '12h' },
                        ]}
                        value={preferences.timeFormat}
                        onChange={(v) => updatePreferences({ timeFormat: v as TimeFormat })}
                    />
                </SettingRow>
            </GlassContainer>

            {/* Locations */}
            <GlassContainer className="p-4" border>
                <h3 className="text-sm font-semibold text-primary mb-2 px-2">Quick Locations</h3>

                <LocationRow
                    icon={Home}
                    label="Home"
                    locationName={homeLocation?.name}
                    onConfigure={() => {
                        // TODO: Open location picker modal
                        console.log('Configure home location');
                    }}
                />

                <LocationRow
                    icon={Briefcase}
                    label="Work"
                    locationName={workLocation?.name}
                    onConfigure={() => {
                        // TODO: Open location picker modal
                        console.log('Configure work location');
                    }}
                />
            </GlassContainer>

            {/* Notifications */}
            <GlassContainer className="p-4" border>
                <h3 className="text-sm font-semibold text-primary mb-2 px-2">Notifications</h3>

                <SettingRow
                    icon={Bell}
                    label="Weather Alerts"
                    description="Get notified about severe weather"
                >
                    <ToggleSwitch
                        checked={preferences.notificationsEnabled}
                        onChange={(v) => updatePreferences({ notificationsEnabled: v })}
                    />
                </SettingRow>

                <SettingRow
                    icon={Route}
                    label="Route Recommendations"
                    description="Notify when watched routes have good weather"
                >
                    <ToggleSwitch
                        checked={preferences.routeWatchNotifications}
                        onChange={(v) => updatePreferences({ routeWatchNotifications: v })}
                    />
                </SettingRow>
            </GlassContainer>

            {/* Saved Locations */}
            <GlassContainer className="p-4" border>
                <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-sm font-semibold text-primary">Saved Locations</h3>
                    <GlassButton variant="ghost" size="sm">
                        <MapPin size={14} className="mr-1" />
                        Add
                    </GlassButton>
                </div>

                {savedLocations.length === 0 ? (
                    <p className="text-sm text-tertiary px-2 py-4 text-center">
                        No saved locations yet
                    </p>
                ) : (
                    <div className="space-y-1">
                        {savedLocations.map((location) => (
                            <div
                                key={location.id}
                                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-tertiary" />
                                    <span className="text-sm text-primary">{location.name}</span>
                                    {location.isHome && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                                            Home
                                        </span>
                                    )}
                                    {location.isWork && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                            Work
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-tertiary">
                                    {location.country}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassContainer>
        </div>
    );
};

export default AuroraProfileTab;
