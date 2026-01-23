/**
 * AtmosphereIndicator
 * 
 * A badge that displays the current destination mood/atmosphere.
 * Shows weather condition, temperature, and mood label with matching accent color.
 */
import { cn } from '@/utils/cn';
import {
    Sun,
    Cloud,
    CloudRain,
    Snowflake,
    Moon,
    CloudFog,
    Thermometer,
    Droplets
} from 'lucide-react';
import { useAtmosphere } from '../../hooks/useAtmosphere';
import type { AtmosphereConfig, WeatherCondition } from '../../services/a2a/NeonTokyoService';

interface AtmosphereIndicatorProps {
    atmosphere?: AtmosphereConfig;
    destination?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'badge' | 'card' | 'minimal';
    className?: string;
    showDetails?: boolean;
}

// Weather condition icons
const WeatherIcons: Record<WeatherCondition, React.ElementType> = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    snowy: Snowflake,
    night: Moon,
    foggy: CloudFog
};

// Size configurations
const SIZE_CONFIG = {
    sm: {
        icon: 14,
        text: 'text-xs',
        padding: 'px-2 py-1',
        gap: 'gap-1.5'
    },
    md: {
        icon: 16,
        text: 'text-sm',
        padding: 'px-3 py-1.5',
        gap: 'gap-2'
    },
    lg: {
        icon: 20,
        text: 'text-base',
        padding: 'px-4 py-2',
        gap: 'gap-3'
    }
};

/**
 * Badge variant - compact pill display
 */
function BadgeVariant({
    config,
    destination: _destination,
    size = 'md',
    showDetails,
    className
}: {
    config: ReturnType<typeof useAtmosphere>;
    destination?: string;
    size: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
    className?: string;
}) {
    const Icon = WeatherIcons[config.condition];
    const sizeConfig = SIZE_CONFIG[size];

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full",
                "bg-white/5 border border-white/10",
                "backdrop-blur-sm",
                "transition-all duration-300",
                "hover:bg-white/10 hover:border-white/20",
                sizeConfig.padding,
                sizeConfig.gap,
                className
            )}
            style={{
                boxShadow: `0 0 20px ${config.glowColor}`
            }}
        >
            {/* Weather Icon */}
            <Icon
                size={sizeConfig.icon}
                className="transition-colors"
                style={{ color: config.accentColorHex }}
            />

            {/* Mood Label */}
            <span className={cn("font-medium text-white/80", sizeConfig.text)}>
                {config.mood}
            </span>

            {/* Temperature */}
            {showDetails && (
                <>
                    <span className="text-white/30">•</span>
                    <span className={cn("text-white/60", sizeConfig.text)}>
                        {config.temperature}°C
                    </span>
                </>
            )}
        </div>
    );
}

/**
 * Card variant - expanded display with more details
 */
function CardVariant({
    config,
    destination,
    className
}: {
    config: ReturnType<typeof useAtmosphere>;
    destination?: string;
    className?: string;
}) {
    const Icon = WeatherIcons[config.condition];

    return (
        <div
            className={cn(
                "p-4 rounded-xl",
                "bg-white/5 border border-white/10",
                "backdrop-blur-md",
                "transition-all duration-500",
                className
            )}
            style={{
                boxShadow: `0 0 30px ${config.glowColor}`
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${config.accentColorHex}20` }}
                >
                    <Icon
                        size={24}
                        style={{ color: config.accentColorHex }}
                    />
                </div>
                <div>
                    <h4 className="font-semibold text-white">{destination || 'Destination'}</h4>
                    <p className="text-sm text-white/60">{config.mood}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                    <Thermometer size={14} className="text-white/40" />
                    <span className="text-white/70">{config.temperature}°C</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Droplets size={14} className="text-white/40" />
                    <span className="text-white/70">{config.humidity}%</span>
                </div>
            </div>

            {/* Condition tag */}
            <div className="mt-3 pt-3 border-t border-white/10">
                <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{
                        backgroundColor: `${config.accentColorHex}20`,
                        color: config.accentColorHex
                    }}
                >
                    {config.condition}
                </span>
            </div>
        </div>
    );
}

/**
 * Minimal variant - just icon and temperature
 */
function MinimalVariant({
    config,
    className
}: {
    config: ReturnType<typeof useAtmosphere>;
    className?: string;
}) {
    const Icon = WeatherIcons[config.condition];

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5",
                className
            )}
        >
            <Icon size={16} style={{ color: config.accentColorHex }} />
            <span className="text-sm text-white/70">{config.temperature}°</span>
        </div>
    );
}

/**
 * Main AtmosphereIndicator component
 */
export function AtmosphereIndicator({
    atmosphere,
    destination,
    size = 'md',
    variant = 'badge',
    className,
    showDetails = true
}: AtmosphereIndicatorProps) {
    const config = useAtmosphere(atmosphere, destination);

    switch (variant) {
        case 'card':
            return <CardVariant config={config} destination={destination} className={className} />;
        case 'minimal':
            return <MinimalVariant config={config} className={className} />;
        default:
            return (
                <BadgeVariant
                    config={config}
                    destination={destination}
                    size={size}
                    showDetails={showDetails}
                    className={className}
                />
            );
    }
}

export default AtmosphereIndicator;
