import type { AgentCard, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// AURORA Weather - Liquid Glass Weather Experience
// ============================================================================

// Weather condition types matching WMO codes
type WeatherCondition =
    | 'clear' | 'partly_cloudy' | 'cloudy' | 'overcast'
    | 'fog' | 'drizzle' | 'rain' | 'heavy_rain' | 'thunderstorm'
    | 'snow' | 'heavy_snow' | 'sleet' | 'hail'
    | 'wind';

// Material reactivity mood
type MaterialMood = 'calm' | 'active' | 'intense' | 'severe';

interface WeatherLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    timezone: string;
    country: string;
    region: 'EU' | 'US' | 'OTHER';
}

interface AirQuality {
    aqi: number; // US AQI scale (0-500)
    aqiCategory: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
    pm2_5: number;
    pm10: number;
    europeanAqi?: number;
}

interface CurrentWeather {
    locationId: string;
    timestamp: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    dewpoint: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: WeatherCondition;
    conditionText: string;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    precipitation: number;
    cloudCover: number;
    isDay: boolean;
    materialMood: MaterialMood;
    tintColor: string;
    airQuality?: AirQuality;
    dataSource: string;
    lastFetched: string;
}

interface HourlyForecast {
    time: string;
    temperature: number;
    feelsLike: number;
    condition: WeatherCondition;
    precipitation: number;
    precipitationProbability: number;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    confidence?: number; // 0-100 confidence level
}

interface DailyForecast {
    date: string;
    tempHigh: number;
    tempLow: number;
    condition: WeatherCondition;
    conditionText: string;
    precipitationProbability: number;
    precipitationSum: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    windSpeedMax: number;
    confidence?: number; // 0-100 confidence level (decreases with forecast distance)
}

interface WeatherAlert {
    id: string;
    type: 'info' | 'warning' | 'watch' | 'advisory' | 'severe' | 'extreme';
    event: string;
    headline: string;
    description: string;
    instruction?: string;
    sender: string;
    effective: string;
    expires: string;
    areas: string[];
}

interface WeatherData {
    location: WeatherLocation;
    current: CurrentWeather;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
    alerts: WeatherAlert[];
}

interface ActivityRecommendationData {
    id: string;
    activity: string;
    category: 'outdoor' | 'indoor' | 'exercise' | 'social' | 'relaxation';
    suitability: 'perfect' | 'good' | 'okay' | 'poor';
    reason: string;
    timeWindow?: string;
    tips?: string[];
}

interface WeatherUpdate {
    type: 'weather_update';
    locations: WeatherLocation[];
    weatherData: Record<string, WeatherData>;
    selectedLocationId: string;
    lastUpdated: string;
    activityRecommendations?: ActivityRecommendationData[];
}

// Session state
interface SessionState {
    locations: WeatherLocation[];
    weatherData: Record<string, WeatherData>;
    selectedLocationId: string;
}

const sessions = new Map<string, SessionState>();

// ============================================================================
// WMO Weather Code Mapping
// ============================================================================

const WMO_WEATHER_CODES: Record<number, { condition: WeatherCondition; text: string }> = {
    0: { condition: 'clear', text: 'Clear sky' },
    1: { condition: 'clear', text: 'Mainly clear' },
    2: { condition: 'partly_cloudy', text: 'Partly cloudy' },
    3: { condition: 'cloudy', text: 'Overcast' },
    45: { condition: 'fog', text: 'Fog' },
    48: { condition: 'fog', text: 'Depositing rime fog' },
    51: { condition: 'drizzle', text: 'Light drizzle' },
    53: { condition: 'drizzle', text: 'Moderate drizzle' },
    55: { condition: 'drizzle', text: 'Dense drizzle' },
    61: { condition: 'rain', text: 'Slight rain' },
    63: { condition: 'rain', text: 'Moderate rain' },
    65: { condition: 'heavy_rain', text: 'Heavy rain' },
    66: { condition: 'sleet', text: 'Light freezing rain' },
    67: { condition: 'sleet', text: 'Heavy freezing rain' },
    71: { condition: 'snow', text: 'Slight snow' },
    73: { condition: 'snow', text: 'Moderate snow' },
    75: { condition: 'heavy_snow', text: 'Heavy snow' },
    77: { condition: 'snow', text: 'Snow grains' },
    80: { condition: 'rain', text: 'Slight rain showers' },
    81: { condition: 'rain', text: 'Moderate rain showers' },
    82: { condition: 'heavy_rain', text: 'Violent rain showers' },
    85: { condition: 'snow', text: 'Slight snow showers' },
    86: { condition: 'heavy_snow', text: 'Heavy snow showers' },
    95: { condition: 'thunderstorm', text: 'Thunderstorm' },
    96: { condition: 'thunderstorm', text: 'Thunderstorm with slight hail' },
    99: { condition: 'thunderstorm', text: 'Thunderstorm with heavy hail' }
};

// ============================================================================
// Material Reactivity Calculations
// ============================================================================

function calculateMaterialMood(current: { condition: WeatherCondition; windSpeed: number; precipitation: number }): MaterialMood {
    // Severe conditions
    if (['thunderstorm', 'heavy_snow', 'hail'].includes(current.condition)) {
        return 'severe';
    }

    // Intense conditions
    if (current.windSpeed > 50 || current.precipitation > 10 || current.condition === 'heavy_rain') {
        return 'intense';
    }

    // Active conditions
    if (current.windSpeed > 25 || current.precipitation > 2 || ['rain', 'drizzle', 'snow', 'sleet'].includes(current.condition)) {
        return 'active';
    }

    // Calm conditions
    return 'calm';
}

function calculateSemanticTint(current: { temperature: number; condition: WeatherCondition }): string {
    // Temperature-based tints
    if (current.temperature > 35) return '#ff7043'; // Very hot - coral
    if (current.temperature > 30) return '#ff8a65'; // Hot - light coral
    if (current.temperature > 25) return '#ffc107'; // Warm - amber
    if (current.temperature > 20) return '#ffeb3b'; // Pleasant - yellow
    if (current.temperature > 15) return '#a5d6a7'; // Mild - soft green
    if (current.temperature > 10) return '#4fc3f7'; // Cool - light blue
    if (current.temperature > 5) return '#81d4fa'; // Cold - sky blue
    if (current.temperature > 0) return '#b3e5fc'; // Very cold - pale blue
    if (current.temperature > -10) return '#e3f2fd'; // Freezing - ice blue
    return '#e8eaf6'; // Deep freeze - lavender

    // Condition-based overrides could be added here
}

// ============================================================================
// Open-Meteo API Integration
// ============================================================================

// Simple in-memory cache for weather data
interface CacheEntry {
    data: any;
    timestamp: number;
    expiresAt: number;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getCacheKey(lat: number, lng: number, type: string): string {
    return `${type}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
}

function getFromCache<T>(key: string): T | null {
    const entry = weatherCache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
        return entry.data as T;
    }
    weatherCache.delete(key);
    return null;
}

function setCache(key: string, data: any): void {
    weatherCache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS
    });
}

// Calculate AQI category from US AQI value
function getAqiCategory(aqi: number): AirQuality['aqiCategory'] {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
}

// Fetch air quality data from Open-Meteo Air Quality API
async function fetchAirQuality(lat: number, lng: number): Promise<AirQuality | undefined> {
    const cacheKey = getCacheKey(lat, lng, 'aqi');
    const cached = getFromCache<AirQuality>(cacheKey);
    if (cached) return cached;

    try {
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lng.toString(),
            current: 'us_aqi,european_aqi,pm2_5,pm10'
        });

        const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
        if (!response.ok) {
            console.warn('[AURORA] Air quality API error:', response.status);
            return undefined;
        }

        const data = await response.json();
        const aqi = data.current?.us_aqi ?? 0;

        const airQuality: AirQuality = {
            aqi,
            aqiCategory: getAqiCategory(aqi),
            pm2_5: data.current?.pm2_5 ?? 0,
            pm10: data.current?.pm10 ?? 0,
            europeanAqi: data.current?.european_aqi
        };

        setCache(cacheKey, airQuality);
        return airQuality;
    } catch (error) {
        console.error('[AURORA] Air quality fetch error:', error);
        return undefined;
    }
}

// Calculate forecast confidence (decreases with time)
function calculateHourlyConfidence(hoursAhead: number): number {
    // High confidence for first 12 hours, decreasing after
    if (hoursAhead <= 6) return 95;
    if (hoursAhead <= 12) return 90;
    if (hoursAhead <= 24) return 80;
    if (hoursAhead <= 36) return 70;
    return 60;
}

function calculateDailyConfidence(daysAhead: number): number {
    // Day 0-1: 90%, Day 2-3: 80%, Day 4-5: 65%, Day 6-7: 50%
    if (daysAhead <= 1) return 90;
    if (daysAhead <= 3) return 80;
    if (daysAhead <= 5) return 65;
    return 50;
}

async function fetchWeatherFromOpenMeteo(lat: number, lng: number): Promise<{
    current: Omit<CurrentWeather, 'locationId' | 'materialMood' | 'tintColor'>;
    hourly: HourlyForecast[];
    daily: DailyForecast[];
}> {
    const cacheKey = getCacheKey(lat, lng, 'weather');
    const cached = getFromCache<{ current: any; hourly: HourlyForecast[]; daily: DailyForecast[] }>(cacheKey);

    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'weather_code',
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'precipitation',
            'cloud_cover',
            'pressure_msl',
            'visibility',
            'uv_index',
            'is_day'
        ].join(','),
        hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation_probability',
            'precipitation',
            'weather_code',
            'wind_speed_10m',
            'uv_index'
        ].join(','),
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'apparent_temperature_max',
            'apparent_temperature_min',
            'sunrise',
            'sunset',
            'uv_index_max',
            'precipitation_sum',
            'precipitation_probability_max',
            'weather_code',
            'wind_speed_10m_max'
        ].join(','),
        timezone: 'auto',
        forecast_days: '7'
    });

    // Use cache if available
    if (cached) {
        // Still fetch AQI separately as it may have different cache timing
        const airQuality = await fetchAirQuality(lat, lng);
        if (airQuality) {
            cached.current.airQuality = airQuality;
        }
        return cached;
    }

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

    if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const fetchedAt = new Date().toISOString();

    // Fetch air quality in parallel
    const airQuality = await fetchAirQuality(lat, lng);

    // Parse current weather
    const weatherCode = data.current?.weather_code ?? 0;
    const wmoData = WMO_WEATHER_CODES[weatherCode] || { condition: 'clear' as WeatherCondition, text: 'Unknown' };

    const current = {
        timestamp: data.current?.time || new Date().toISOString(),
        temperature: Math.round(data.current?.temperature_2m ?? 20),
        feelsLike: Math.round(data.current?.apparent_temperature ?? 20),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 50),
        dewpoint: Math.round((data.current?.temperature_2m ?? 20) - ((100 - (data.current?.relative_humidity_2m ?? 50)) / 5)),
        pressure: Math.round(data.current?.pressure_msl ?? 1013),
        visibility: Math.round((data.current?.visibility ?? 10000) / 1000),
        uvIndex: Math.round(data.current?.uv_index ?? 0),
        condition: wmoData.condition,
        conditionText: wmoData.text,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        windDirection: Math.round(data.current?.wind_direction_10m ?? 0),
        windGust: data.current?.wind_gusts_10m ? Math.round(data.current.wind_gusts_10m) : undefined,
        precipitation: data.current?.precipitation ?? 0,
        cloudCover: Math.round(data.current?.cloud_cover ?? 0),
        isDay: data.current?.is_day === 1,
        airQuality,
        dataSource: 'Open-Meteo (ECMWF, GFS, ICON)',
        lastFetched: fetchedAt
    };

    // Parse hourly forecast (next 48 hours) with confidence
    const hourly: HourlyForecast[] = [];
    const hourlyTimes = data.hourly?.time || [];
    const nowHour = new Date().getTime();

    for (let i = 0; i < Math.min(48, hourlyTimes.length); i++) {
        const hourCode = data.hourly?.weather_code?.[i] ?? 0;
        const hourWmo = WMO_WEATHER_CODES[hourCode] || { condition: 'clear' as WeatherCondition, text: 'Unknown' };
        const hourTime = new Date(hourlyTimes[i]).getTime();
        const hoursAhead = Math.max(0, Math.round((hourTime - nowHour) / (1000 * 60 * 60)));

        hourly.push({
            time: hourlyTimes[i],
            temperature: Math.round(data.hourly?.temperature_2m?.[i] ?? 20),
            feelsLike: Math.round(data.hourly?.apparent_temperature?.[i] ?? 20),
            condition: hourWmo.condition,
            precipitation: data.hourly?.precipitation?.[i] ?? 0,
            precipitationProbability: data.hourly?.precipitation_probability?.[i] ?? 0,
            humidity: Math.round(data.hourly?.relative_humidity_2m?.[i] ?? 50),
            windSpeed: Math.round(data.hourly?.wind_speed_10m?.[i] ?? 0),
            uvIndex: Math.round(data.hourly?.uv_index?.[i] ?? 0),
            confidence: calculateHourlyConfidence(hoursAhead)
        });
    }

    // Parse daily forecast with confidence
    const daily: DailyForecast[] = [];
    const dailyTimes = data.daily?.time || [];
    for (let i = 0; i < dailyTimes.length; i++) {
        const dayCode = data.daily?.weather_code?.[i] ?? 0;
        const dayWmo = WMO_WEATHER_CODES[dayCode] || { condition: 'clear' as WeatherCondition, text: 'Unknown' };

        daily.push({
            date: dailyTimes[i],
            tempHigh: Math.round(data.daily?.temperature_2m_max?.[i] ?? 25),
            tempLow: Math.round(data.daily?.temperature_2m_min?.[i] ?? 15),
            condition: dayWmo.condition,
            conditionText: dayWmo.text,
            precipitationProbability: data.daily?.precipitation_probability_max?.[i] ?? 0,
            precipitationSum: data.daily?.precipitation_sum?.[i] ?? 0,
            sunrise: data.daily?.sunrise?.[i] || '06:00',
            sunset: data.daily?.sunset?.[i] || '18:00',
            uvIndexMax: Math.round(data.daily?.uv_index_max?.[i] ?? 0),
            windSpeedMax: Math.round(data.daily?.wind_speed_10m_max?.[i] ?? 0),
            confidence: calculateDailyConfidence(i)
        });
    }

    // Cache the result
    setCache(cacheKey, { current, hourly, daily });

    return { current, hourly, daily };
}

// ============================================================================
// Geocoding with Nominatim
// ============================================================================

async function geocodeLocation(query: string): Promise<WeatherLocation | null> {
    const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        addressdetails: '1'
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: {
            'User-Agent': 'AURORA-Weather/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
    }

    const results = await response.json();
    if (results.length === 0) return null;

    const result = results[0];
    const countryCode = result.address?.country_code?.toUpperCase() || '';

    // Determine region
    const EU_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH'];
    let region: 'EU' | 'US' | 'OTHER' = 'OTHER';
    if (EU_COUNTRIES.includes(countryCode)) region = 'EU';
    else if (countryCode === 'US') region = 'US';

    return {
        id: `loc-${Date.now()}`,
        name: result.address?.city || result.address?.town || result.address?.village || result.display_name.split(',')[0],
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        timezone: 'auto',
        country: countryCode,
        region
    };
}

// ============================================================================
// Weather Alerts - Meteoalarm (EU) + NOAA (US)
// ============================================================================

interface MeteoalarmWarning {
    identifier: string;
    event: string;
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
    urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
    certainty: string;
    onset: string;
    expires: string;
    headline: string;
    description: string;
    instruction?: string;
    senderName: string;
    areaDesc: string;
}

interface NOAAAlert {
    id: string;
    event: string;
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme' | 'Unknown';
    headline: string;
    description: string;
    instruction: string;
    effective: string;
    expires: string;
    senderName: string;
    areaDesc: string;
}

// Map Meteoalarm/NOAA severity to our alert type
function mapSeverityToType(severity: string): WeatherAlert['type'] {
    switch (severity.toLowerCase()) {
        case 'extreme': return 'extreme';
        case 'severe': return 'severe';
        case 'moderate': return 'warning';
        case 'minor': return 'advisory';
        default: return 'info';
    }
}

// Fetch alerts from NOAA Weather API (US)
async function fetchNOAAAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
    try {
        // NOAA uses a point-based system to get the zone, then fetch alerts
        const pointUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`;
        const pointResponse = await fetch(pointUrl, {
            headers: {
                'User-Agent': 'AURORA-Weather/1.0 (weather@liquidcrypto.com)',
                'Accept': 'application/geo+json'
            }
        });

        if (!pointResponse.ok) {
            console.warn('[AURORA] NOAA point lookup failed:', pointResponse.status);
            return [];
        }

        const pointData = await pointResponse.json();
        const forecastZone = pointData.properties?.forecastZone;
        const county = pointData.properties?.county;

        if (!forecastZone && !county) {
            return [];
        }

        // Extract zone ID from URL (e.g., "https://api.weather.gov/zones/forecast/NYZ072" -> "NYZ072")
        const zoneId = forecastZone?.split('/').pop() || county?.split('/').pop();

        // Fetch active alerts for this zone
        const alertsUrl = `https://api.weather.gov/alerts/active?zone=${zoneId}`;
        const alertsResponse = await fetch(alertsUrl, {
            headers: {
                'User-Agent': 'AURORA-Weather/1.0 (weather@liquidcrypto.com)',
                'Accept': 'application/geo+json'
            }
        });

        if (!alertsResponse.ok) {
            console.warn('[AURORA] NOAA alerts fetch failed:', alertsResponse.status);
            return [];
        }

        const alertsData = await alertsResponse.json();
        const features = alertsData.features || [];

        return features.map((feature: any): WeatherAlert => {
            const props = feature.properties;
            return {
                id: props.id || `noaa-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                type: mapSeverityToType(props.severity || 'Unknown'),
                event: props.event || 'Weather Alert',
                headline: props.headline || props.event || 'Weather Alert',
                description: props.description || '',
                instruction: props.instruction || undefined,
                sender: props.senderName || 'National Weather Service',
                effective: props.effective || new Date().toISOString(),
                expires: props.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                areas: props.areaDesc ? [props.areaDesc] : []
            };
        });
    } catch (error) {
        console.error('[AURORA] NOAA alerts error:', error);
        return [];
    }
}

// Fetch alerts from Open-Meteo (backup for regions without dedicated alert APIs)
async function fetchOpenMeteoAlerts(_lat: number, _lng: number): Promise<WeatherAlert[]> {
    // Open-Meteo doesn't have a dedicated alerts API, but we can derive
    // severe weather warnings from the forecast data
    // This is a fallback for non-EU/US regions
    return [];
}

// Fetch alerts from Meteoalarm via Open-Meteo's weather codes (EU)
// Note: Meteoalarm's direct API requires registration, so we use Open-Meteo integration
async function fetchEUAlerts(lat: number, lng: number, countryCode: string): Promise<WeatherAlert[]> {
    try {
        // Use Open-Meteo's weather alerts endpoint (available for EU via meteoalarm)
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lng.toString(),
            current: 'weather_code,wind_speed_10m,precipitation',
            timezone: 'auto'
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const alerts: WeatherAlert[] = [];

        // Generate alerts based on severe weather codes
        const weatherCode = data.current?.weather_code;
        const windSpeed = data.current?.wind_speed_10m || 0;
        const precipitation = data.current?.precipitation || 0;

        // Thunderstorm alerts (codes 95-99)
        if (weatherCode >= 95) {
            alerts.push({
                id: `eu-thunder-${Date.now()}`,
                type: weatherCode === 99 ? 'severe' : 'warning',
                event: 'Thunderstorm Warning',
                headline: weatherCode === 99
                    ? 'Severe Thunderstorm with Heavy Hail'
                    : 'Thunderstorm in Progress',
                description: 'Thunderstorms are occurring in your area. Lightning, heavy rain, and strong winds are possible.',
                instruction: 'Stay indoors and away from windows. Avoid open areas and tall isolated objects.',
                sender: 'AURORA Weather (Meteoalarm Data)',
                effective: new Date().toISOString(),
                expires: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                areas: [countryCode]
            });
        }

        // High wind alerts
        if (windSpeed > 60) {
            alerts.push({
                id: `eu-wind-${Date.now()}`,
                type: windSpeed > 90 ? 'severe' : 'warning',
                event: 'High Wind Warning',
                headline: `Strong winds up to ${Math.round(windSpeed)} km/h`,
                description: `Wind speeds of ${Math.round(windSpeed)} km/h have been recorded. Secure loose objects and avoid unnecessary travel.`,
                instruction: 'Secure outdoor furniture and loose objects. Avoid driving high-profile vehicles.',
                sender: 'AURORA Weather (Meteoalarm Data)',
                effective: new Date().toISOString(),
                expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                areas: [countryCode]
            });
        }

        // Heavy precipitation alerts
        if (precipitation > 20) {
            alerts.push({
                id: `eu-precip-${Date.now()}`,
                type: precipitation > 50 ? 'severe' : 'warning',
                event: 'Heavy Precipitation Warning',
                headline: `Heavy precipitation: ${precipitation.toFixed(1)}mm`,
                description: 'Significant precipitation is occurring. Flash flooding may be possible in low-lying areas.',
                instruction: 'Avoid flood-prone areas. Do not drive through flooded roads.',
                sender: 'AURORA Weather (Meteoalarm Data)',
                effective: new Date().toISOString(),
                expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                areas: [countryCode]
            });
        }

        return alerts;
    } catch (error) {
        console.error('[AURORA] EU alerts error:', error);
        return [];
    }
}

// Main function to fetch alerts based on region
async function fetchWeatherAlerts(location: WeatherLocation): Promise<WeatherAlert[]> {
    switch (location.region) {
        case 'US':
            return fetchNOAAAlerts(location.lat, location.lng);
        case 'EU':
            return fetchEUAlerts(location.lat, location.lng, location.country);
        default:
            // For other regions, use Open-Meteo-derived alerts
            return fetchOpenMeteoAlerts(location.lat, location.lng);
    }
}

// ============================================================================
// Activity Recommendations Engine
// ============================================================================

interface ActivityRecommendation {
    id: string;
    activity: string;
    category: 'outdoor' | 'indoor' | 'exercise' | 'social' | 'relaxation';
    suitability: 'perfect' | 'good' | 'okay' | 'poor';
    reason: string;
    timeWindow?: string;
    tips?: string[];
}

function generateDetailedActivityRecommendations(
    current: CurrentWeather,
    hourly: HourlyForecast[],
    daily: DailyForecast[]
): ActivityRecommendation[] {
    const recommendations: ActivityRecommendation[] = [];
    const temp = current.temperature;
    const condition = current.condition;
    const uvIndex = current.uvIndex;
    const windSpeed = current.windSpeed;
    const humidity = current.humidity;
    const isDay = current.isDay;

    // Find best hours for outdoor activities
    const bestOutdoorHours = hourly
        .slice(0, 12)
        .filter(h => {
            const t = h.temperature;
            return t > 15 && t < 28 &&
                   h.precipitationProbability < 30 &&
                   !['rain', 'heavy_rain', 'thunderstorm', 'snow'].includes(h.condition);
        })
        .map(h => new Date(h.time).getHours());

    const timeWindowStr = bestOutdoorHours.length > 0
        ? `Best hours: ${Math.min(...bestOutdoorHours)}:00 - ${Math.max(...bestOutdoorHours) + 1}:00`
        : undefined;

    // Clear/Sunny day activities
    if (['clear', 'partly_cloudy'].includes(condition) && isDay) {
        if (temp > 18 && temp < 28 && windSpeed < 30) {
            recommendations.push({
                id: 'hiking',
                activity: 'Hiking or Nature Walk',
                category: 'outdoor',
                suitability: temp > 22 && temp < 26 ? 'perfect' : 'good',
                reason: `${temp}°C with ${current.conditionText.toLowerCase()} - ideal conditions`,
                timeWindow: timeWindowStr,
                tips: uvIndex > 5 ? ['Wear sunscreen SPF 30+', 'Bring plenty of water'] : ['Stay hydrated']
            });
        }

        if (temp > 20 && temp < 32) {
            recommendations.push({
                id: 'cycling',
                activity: 'Cycling',
                category: 'exercise',
                suitability: windSpeed < 20 ? 'perfect' : 'good',
                reason: windSpeed < 20
                    ? 'Light wind and pleasant temperature'
                    : `Moderate wind (${windSpeed}km/h) but rideable`,
                tips: windSpeed > 15 ? ['Expect headwinds on exposed routes'] : undefined
            });
        }

        if (temp > 25) {
            recommendations.push({
                id: 'swimming',
                activity: 'Swimming or Water Activities',
                category: 'outdoor',
                suitability: 'perfect',
                reason: `${temp}°C - great weather for cooling off`,
                tips: ['Apply waterproof sunscreen', 'Stay hydrated between swims']
            });
        }

        if (temp > 15 && temp < 25) {
            recommendations.push({
                id: 'outdoor-dining',
                activity: 'Outdoor Dining / Picnic',
                category: 'social',
                suitability: humidity < 70 ? 'perfect' : 'good',
                reason: 'Pleasant conditions for eating outdoors',
                tips: humidity > 60 ? ['Choose shaded spots'] : undefined
            });
        }
    }

    // Cloudy day activities
    if (['cloudy', 'overcast'].includes(condition)) {
        recommendations.push({
            id: 'photography',
            activity: 'Photography Walk',
            category: 'outdoor',
            suitability: 'perfect',
            reason: 'Soft, diffused lighting - no harsh shadows',
            tips: ['Great for portraits', 'Colors appear more saturated']
        });

        if (temp > 10 && temp < 25) {
            recommendations.push({
                id: 'running',
                activity: 'Running / Jogging',
                category: 'exercise',
                suitability: 'good',
                reason: 'Cooler conditions reduce heat stress',
                tips: ['No need for sunglasses', 'Comfortable for longer distances']
            });
        }
    }

    // Rainy day activities
    if (['rain', 'drizzle', 'heavy_rain'].includes(condition)) {
        recommendations.push({
            id: 'museum',
            activity: 'Museums or Galleries',
            category: 'indoor',
            suitability: 'perfect',
            reason: 'Perfect day to explore indoor attractions',
            tips: ['Many museums are less crowded on rainy days']
        });

        recommendations.push({
            id: 'coffee-shop',
            activity: 'Coffee Shop or Bookstore',
            category: 'relaxation',
            suitability: 'perfect',
            reason: 'Cozy atmosphere while rain falls outside',
            tips: ['Bring a book or laptop', 'Try a seasonal warm drink']
        });

        recommendations.push({
            id: 'cooking',
            activity: 'Home Cooking / Baking',
            category: 'indoor',
            suitability: 'perfect',
            reason: 'Great day to try a new recipe',
            tips: ['Soups and stews are perfect for rainy days']
        });

        if (condition === 'drizzle' && temp > 10) {
            recommendations.push({
                id: 'light-walk',
                activity: 'Light Walk with Umbrella',
                category: 'outdoor',
                suitability: 'okay',
                reason: 'Light drizzle - walkable with proper gear',
                tips: ['Wear waterproof shoes', 'Enjoy the fresh petrichor scent']
            });
        }
    }

    // Snow activities
    if (['snow', 'heavy_snow'].includes(condition)) {
        if (temp > -10 && temp < 2) {
            recommendations.push({
                id: 'snow-photography',
                activity: 'Winter Photography',
                category: 'outdoor',
                suitability: 'perfect',
                reason: 'Fresh snow creates beautiful scenes',
                tips: ['Protect your camera from moisture', 'Use lens hood to prevent snowflakes']
            });

            recommendations.push({
                id: 'snow-play',
                activity: 'Snowball Fight / Building Snowman',
                category: 'outdoor',
                suitability: temp > -5 ? 'perfect' : 'good',
                reason: 'Perfect snow conditions for outdoor fun',
                tips: ['Dress in warm, waterproof layers', 'Take breaks to warm up']
            });
        }

        recommendations.push({
            id: 'hot-drinks',
            activity: 'Hot Chocolate by the Window',
            category: 'relaxation',
            suitability: 'perfect',
            reason: 'Watch the snow fall from inside',
            tips: ['Add marshmallows', 'Great for reading or conversation']
        });
    }

    // Evening activities
    if (!isDay && ['clear', 'partly_cloudy'].includes(condition)) {
        recommendations.push({
            id: 'stargazing',
            activity: 'Stargazing',
            category: 'outdoor',
            suitability: condition === 'clear' ? 'perfect' : 'good',
            reason: 'Clear skies for astronomy',
            tips: ['Let your eyes adjust for 20 minutes', 'Use a star chart app']
        });

        if (temp > 15) {
            recommendations.push({
                id: 'evening-walk',
                activity: 'Evening Stroll',
                category: 'outdoor',
                suitability: 'good',
                reason: 'Pleasant temperature for a relaxing walk',
                tips: ['Bring a light jacket']
            });
        }
    }

    // Always suggest something
    if (recommendations.length === 0) {
        recommendations.push({
            id: 'indoor-general',
            activity: 'Indoor Activities',
            category: 'indoor',
            suitability: 'okay',
            reason: 'Weather not ideal for outdoor activities',
            tips: ['Good day for catching up on tasks', 'Try a new indoor hobby']
        });
    }

    // Sort by suitability
    const suitabilityOrder = { perfect: 0, good: 1, okay: 2, poor: 3 };
    recommendations.sort((a, b) => suitabilityOrder[a.suitability] - suitabilityOrder[b.suitability]);

    return recommendations.slice(0, 6); // Return top 6
}

// ============================================================================
// Full Weather Data Fetch
// ============================================================================

async function fetchFullWeatherData(location: WeatherLocation): Promise<WeatherData> {
    // Fetch weather and alerts in parallel
    const [weatherResponse, alerts] = await Promise.all([
        fetchWeatherFromOpenMeteo(location.lat, location.lng),
        fetchWeatherAlerts(location)
    ]);

    const materialMood = calculateMaterialMood({
        condition: weatherResponse.current.condition,
        windSpeed: weatherResponse.current.windSpeed,
        precipitation: weatherResponse.current.precipitation
    });

    // If there are severe alerts, override mood to severe
    const hasSeveAlerts = alerts.some(a => a.type === 'severe' || a.type === 'extreme');
    const finalMood = hasSeveAlerts ? 'severe' : materialMood;

    const tintColor = calculateSemanticTint({
        temperature: weatherResponse.current.temperature,
        condition: weatherResponse.current.condition
    });

    const current: CurrentWeather = {
        ...weatherResponse.current,
        locationId: location.id,
        materialMood: finalMood,
        tintColor
    };

    return {
        location,
        current,
        hourly: weatherResponse.hourly,
        daily: weatherResponse.daily,
        alerts
    };
}

// ============================================================================
// Natural Language Processing
// ============================================================================

interface Intent {
    type: 'get_weather' | 'add_location' | 'remove_location' | 'get_forecast' | 'get_alerts' | 'suggest_activities' | 'help' | 'will_it_rain' | 'air_quality' | 'clothing';
    location?: string;
    locationId?: string;
    targetTime?: string; // For time-specific queries like "will it rain at 5pm?"
    targetHour?: number; // Parsed hour (0-23)
}

// Parse time from natural language (e.g., "5pm", "17:00", "5:30")
function parseTimeFromMessage(msg: string): { hour: number; timeStr: string } | null {
    // Match patterns like "5pm", "5:30pm", "17:00", "at 5", "around 6pm"
    const patterns = [
        /(?:at|around|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
        /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
        /(\d{1,2}):(\d{2})/
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match) {
            let hour = parseInt(match[1], 10);
            const minutes = match[2] ? parseInt(match[2], 10) : 0;
            const meridiem = match[3]?.toLowerCase();

            if (meridiem === 'pm' && hour < 12) hour += 12;
            if (meridiem === 'am' && hour === 12) hour = 0;

            // Validate hour
            if (hour >= 0 && hour <= 23) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                return { hour, timeStr };
            }
        }
    }
    return null;
}

function parseIntent(message: string): Intent {
    const msg = message.toLowerCase().trim();

    // Add location patterns
    if (/add|track|save|follow/.test(msg) && /location|city|place/.test(msg)) {
        const match = msg.match(/(?:add|track|save|follow)\s+(?:the\s+)?(?:location|city|place)?\s*(.+?)(?:\s+to|\s*$)/i);
        return { type: 'add_location', location: match?.[1]?.trim() };
    }

    // Direct "add X" pattern
    if (/^add\s+/i.test(msg)) {
        const location = msg.replace(/^add\s+/i, '').trim();
        if (location) return { type: 'add_location', location };
    }

    // Remove location patterns
    if (/remove|delete/.test(msg)) {
        const match = msg.match(/(?:remove|delete)\s+(.+)/i);
        return { type: 'remove_location', location: match?.[1]?.trim() };
    }

    // Air quality patterns - check early
    if (/air\s*quality|aqi|pollution|pm2\.?5|pm10|safe\s+(?:for|to)\s+(?:breathe|go\s+out)|smog/.test(msg)) {
        const locationMatch = msg.match(/(?:for|in|at)\s+([a-zA-Z\s]+?)(?:\?|$)/i);
        return { type: 'air_quality', location: locationMatch?.[1]?.trim() };
    }

    // Clothing recommendations
    if (/what\s+(?:should\s+i|to)\s+wear|clothing|dress|jacket|umbrella|sunscreen/.test(msg)) {
        return { type: 'clothing' };
    }

    // Time-specific rain queries: "Will it rain at 5pm?", "Should I bring an umbrella at 3?"
    if (/will\s+it\s+rain|rain\s+at|umbrella|get\s+(?:wet|rained\s+on)|leave\s+at/.test(msg)) {
        const timeInfo = parseTimeFromMessage(msg);
        if (timeInfo) {
            return {
                type: 'will_it_rain',
                targetTime: timeInfo.timeStr,
                targetHour: timeInfo.hour
            };
        }
        // Generic rain query without time
        return { type: 'will_it_rain' };
    }

    // Activity patterns with time
    if (/should\s+i\s+(?:run|jog|cycle|bike|walk|exercise|go\s+out)/.test(msg)) {
        const timeInfo = parseTimeFromMessage(msg);
        return {
            type: 'suggest_activities',
            targetTime: timeInfo?.timeStr,
            targetHour: timeInfo?.hour
        };
    }

    // Forecast patterns
    if (/forecast|next\s+(?:few\s+)?(?:days|week)|tomorrow|weekend/.test(msg)) {
        const locationMatch = msg.match(/(?:for|in)\s+([a-zA-Z\s]+?)(?:\?|$)/i);
        return { type: 'get_forecast', location: locationMatch?.[1]?.trim() };
    }

    // Alert patterns
    if (/alert|warning|storm|danger|severe|emergency/.test(msg)) {
        const locationMatch = msg.match(/(?:for|in)\s+([a-zA-Z\s]+?)(?:\?|$)/i);
        return { type: 'get_alerts', location: locationMatch?.[1]?.trim() };
    }

    // Activity patterns
    if (/good\s+(?:day|time)\s+(?:for|to)|activities|suggest|recommend/.test(msg)) {
        return { type: 'suggest_activities' };
    }

    // Weather query patterns
    if (/weather|temperature|temp|how\s+(?:hot|cold|warm)|what's\s+it\s+like/.test(msg)) {
        const locationMatch = msg.match(/(?:in|for|at)\s+([a-zA-Z\s]+?)(?:\?|$)/i);
        return { type: 'get_weather', location: locationMatch?.[1]?.trim() };
    }

    // Help patterns
    if (/help|what\s+can\s+you|how\s+do\s+i/.test(msg)) {
        return { type: 'help' };
    }

    // Default: try to extract location for weather query
    const locationMatch = msg.match(/^([a-zA-Z\s]+?)(?:\s+weather)?(?:\?|$)/i);
    if (locationMatch?.[1]) {
        return { type: 'get_weather', location: locationMatch[1].trim() };
    }

    return { type: 'help' };
}

// Generate response for time-specific rain query
function generateRainAtTimeResponse(hourly: HourlyForecast[], targetHour: number | undefined, data: WeatherData): string {
    if (targetHour === undefined) {
        // General rain check for the day
        const rainHours = hourly.slice(0, 12).filter(h => h.precipitationProbability >= 30);
        if (rainHours.length === 0) {
            return `☀️ **No rain expected** in the next 12 hours. You're good to go!`;
        }
        const rainTimes = rainHours.map(h => {
            const hour = new Date(h.time).getHours();
            return `${hour}:00 (${h.precipitationProbability}%)`;
        });
        return `🌧️ **Rain likely** at: ${rainTimes.slice(0, 4).join(', ')}${rainTimes.length > 4 ? ' and more' : ''}. Consider bringing an umbrella.`;
    }

    // Find the specific hour
    const now = new Date();
    let targetDate = new Date(now);
    targetDate.setHours(targetHour, 0, 0, 0);

    // If the target time is earlier than now, assume tomorrow
    if (targetDate < now) {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    // Find matching hourly forecast
    const hourData = hourly.find(h => {
        const hDate = new Date(h.time);
        return hDate.getHours() === targetHour &&
               hDate.getDate() === targetDate.getDate();
    });

    if (!hourData) {
        return `I don't have forecast data for ${targetHour}:00. Try a time within the next 48 hours.`;
    }

    const timeLabel = targetHour < 12 ? `${targetHour}am` : targetHour === 12 ? '12pm' : `${targetHour - 12}pm`;
    const prob = hourData.precipitationProbability;
    const condition = hourData.condition;
    const temp = hourData.temperature;
    const confidence = hourData.confidence || 85;

    let response = '';
    if (prob < 20) {
        response = `☀️ **Very unlikely to rain at ${timeLabel}** (${prob}% chance). `;
        response += `Expecting ${temp}°C with ${condition.replace('_', ' ')}.`;
    } else if (prob < 40) {
        response = `🌤️ **Low chance of rain at ${timeLabel}** (${prob}% chance). `;
        response += `It'll be ${temp}°C - you can probably skip the umbrella.`;
    } else if (prob < 60) {
        response = `🌥️ **Moderate chance of rain at ${timeLabel}** (${prob}% chance). `;
        response += `Temperature: ${temp}°C. Maybe bring an umbrella just in case.`;
    } else if (prob < 80) {
        response = `🌧️ **Likely to rain at ${timeLabel}** (${prob}% chance). `;
        response += `It'll be ${temp}°C. Definitely bring an umbrella!`;
    } else {
        response = `⛈️ **Very likely to rain at ${timeLabel}** (${prob}% chance). `;
        response += `Expecting ${temp}°C. Plan for wet conditions.`;
    }

    response += `\n\n_Forecast confidence: ${confidence}%_`;

    return response;
}

// Generate air quality response
function generateAirQualityResponse(current: CurrentWeather, location: string): string {
    const aqi = current.airQuality;
    if (!aqi) {
        return `Air quality data is not available for ${location}. Try a larger city or different region.`;
    }

    const categoryLabels: Record<AirQuality['aqiCategory'], { label: string; emoji: string; advice: string }> = {
        good: {
            label: 'Good',
            emoji: '🟢',
            advice: 'Air quality is excellent. Perfect for outdoor activities!'
        },
        moderate: {
            label: 'Moderate',
            emoji: '🟡',
            advice: 'Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.'
        },
        unhealthy_sensitive: {
            label: 'Unhealthy for Sensitive Groups',
            emoji: '🟠',
            advice: 'Children, elderly, and people with respiratory issues should limit prolonged outdoor exertion.'
        },
        unhealthy: {
            label: 'Unhealthy',
            emoji: '🔴',
            advice: 'Everyone may begin to experience health effects. Limit outdoor activities.'
        },
        very_unhealthy: {
            label: 'Very Unhealthy',
            emoji: '🟣',
            advice: 'Health alert! Everyone should avoid prolonged outdoor exertion.'
        },
        hazardous: {
            label: 'Hazardous',
            emoji: '🟤',
            advice: 'Emergency conditions. Everyone should avoid all outdoor activity.'
        }
    };

    const info = categoryLabels[aqi.aqiCategory];
    let response = `**Air Quality in ${location}**: ${info.emoji} **${info.label}** (AQI: ${aqi.aqi})\n\n`;
    response += `${info.advice}\n\n`;
    response += `• PM2.5: ${aqi.pm2_5.toFixed(1)} µg/m³\n`;
    response += `• PM10: ${aqi.pm10.toFixed(1)} µg/m³`;

    if (aqi.europeanAqi !== undefined) {
        response += `\n• European AQI: ${aqi.europeanAqi}`;
    }

    // Add child safety note for sensitive/unhealthy conditions
    if (['unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'].includes(aqi.aqiCategory)) {
        response += `\n\n⚠️ **Not recommended for children** to play outside for extended periods.`;
    }

    return response;
}

// Generate clothing recommendations based on weather
function generateClothingRecommendations(
    current: CurrentWeather,
    hourly: HourlyForecast[],
    daily: DailyForecast[]
): string {
    const temp = current.temperature;
    const feelsLike = current.feelsLike;
    const condition = current.condition;
    const uvIndex = current.uvIndex;
    const windSpeed = current.windSpeed;
    const humidity = current.humidity;

    // Check for rain in the next 12 hours
    const rainLikely = hourly.slice(0, 12).some(h => h.precipitationProbability >= 40);
    const heavyRainLikely = hourly.slice(0, 12).some(h => h.precipitationProbability >= 70);

    // Temperature ranges for today
    const todayHigh = daily[0]?.tempHigh ?? temp;
    const todayLow = daily[0]?.tempLow ?? temp;
    const tempRange = todayHigh - todayLow;

    const items: string[] = [];
    const tips: string[] = [];

    // Base layers based on temperature
    if (feelsLike < 0) {
        items.push('🧥 Heavy winter coat');
        items.push('🧣 Scarf and warm hat');
        items.push('🧤 Insulated gloves');
        items.push('👢 Insulated winter boots');
        tips.push('Dress in multiple layers for warmth');
    } else if (feelsLike < 5) {
        items.push('🧥 Winter coat or heavy jacket');
        items.push('🧣 Scarf');
        items.push('🧤 Gloves');
        tips.push('Layer up - it\'s quite cold');
    } else if (feelsLike < 10) {
        items.push('🧥 Warm jacket or coat');
        items.push('👕 Long sleeves underneath');
        tips.push('A hat might be nice for the ears');
    } else if (feelsLike < 15) {
        items.push('🧥 Light jacket or sweater');
        items.push('👖 Long pants recommended');
    } else if (feelsLike < 20) {
        items.push('👕 Light layers');
        items.push('Could go with a light cardigan or hoodie');
    } else if (feelsLike < 25) {
        items.push('👕 T-shirt or light top');
        items.push('👖 Light pants or shorts');
        tips.push('Comfortable weather for most clothing');
    } else if (feelsLike < 30) {
        items.push('👕 Light, breathable clothing');
        items.push('🩳 Shorts recommended');
        tips.push('Choose light colors to stay cool');
    } else {
        items.push('👕 Very light, loose clothing');
        items.push('🩳 Shorts or light dress');
        items.push('🧢 Hat for sun protection');
        tips.push('Stay cool - avoid dark colors');
    }

    // Rain gear
    if (heavyRainLikely || ['heavy_rain', 'thunderstorm'].includes(condition)) {
        items.push('☔ Rain jacket or umbrella (essential!)');
        items.push('👢 Waterproof shoes');
        tips.push('Heavy rain expected - waterproof everything');
    } else if (rainLikely || ['rain', 'drizzle'].includes(condition)) {
        items.push('☔ Umbrella or light rain jacket');
        tips.push('Rain is possible - pack protection');
    }

    // Snow gear
    if (['snow', 'heavy_snow', 'sleet'].includes(condition)) {
        items.push('👢 Waterproof boots with grip');
        tips.push('Watch for slippery surfaces');
    }

    // Wind protection
    if (windSpeed > 40) {
        items.push('🧥 Windbreaker');
        tips.push('Strong winds - secure loose items');
    } else if (windSpeed > 25) {
        tips.push('Breezy - consider wind protection');
    }

    // Sun protection
    if (uvIndex >= 6 && current.isDay) {
        items.push('🕶️ Sunglasses');
        items.push('🧴 Sunscreen (SPF 30+)');
        if (uvIndex >= 8) {
            items.push('🧢 Sun hat');
            tips.push('UV is very high - limit midday sun exposure');
        } else {
            tips.push('Apply sunscreen before going out');
        }
    }

    // Humidity comfort
    if (humidity > 80 && temp > 20) {
        tips.push('High humidity - choose moisture-wicking fabrics');
    }

    // Temperature variation warning
    if (tempRange >= 10) {
        tips.push(`Temperature varies ${tempRange}° today (${todayLow}° to ${todayHigh}°) - bring layers`);
    }

    // Build response
    let response = `**What to Wear Today** (${temp}°C, feels like ${feelsLike}°C)\n\n`;

    if (items.length > 0) {
        response += `**Recommended:**\n${items.map(i => `• ${i}`).join('\n')}\n\n`;
    }

    if (tips.length > 0) {
        response += `**Tips:**\n${tips.map(t => `💡 ${t}`).join('\n')}`;
    }

    return response;
}

// ============================================================================
// Response Generation
// ============================================================================

function generateWeatherNarrative(data: WeatherData): string {
    const { current, daily, location, alerts } = data;
    const parts: string[] = [];

    // Alert banner (if any severe alerts)
    const severeAlerts = alerts.filter(a => a.type === 'severe' || a.type === 'extreme');
    if (severeAlerts.length > 0) {
        const alertIcon = severeAlerts[0].type === 'extreme' ? '🔴' : '🟠';
        parts.push(`${alertIcon} **ALERT: ${severeAlerts[0].event}** - ${severeAlerts[0].headline}`);
    }

    // Opening
    let tempFeel = '';
    if (current.temperature > 30) tempFeel = "It's hot";
    else if (current.temperature > 25) tempFeel = "It's warm";
    else if (current.temperature > 18) tempFeel = "The temperature is pleasant";
    else if (current.temperature > 10) tempFeel = "It's a bit cool";
    else if (current.temperature > 0) tempFeel = "It's cold";
    else tempFeel = "It's freezing";

    const feelsNote = Math.abs(current.feelsLike - current.temperature) >= 3
        ? ` (feels like ${current.feelsLike}°)`
        : '';

    parts.push(`**${location.name}**: ${tempFeel} at **${current.temperature}°C**${feelsNote} with ${current.conditionText.toLowerCase()}.`);

    // Tomorrow preview
    if (daily.length > 1) {
        const tomorrow = daily[1];
        parts.push(`Tomorrow: ${tomorrow.tempHigh}°/${tomorrow.tempLow}° with ${tomorrow.conditionText.toLowerCase()}.`);
    }

    // Rain warning
    const rainyDays = daily.filter(d => d.precipitationProbability > 50);
    if (rainyDays.length > 0 && rainyDays.length <= 3) {
        parts.push(`Rain likely on ${rainyDays.map(d => formatDayName(d.date)).join(' and ')}.`);
    }

    // UV warning
    if (current.uvIndex >= 6) {
        parts.push(`UV is ${current.uvIndex >= 8 ? 'very high' : 'high'} - wear sunscreen if going outside.`);
    }

    // Minor alerts at the end
    const minorAlerts = alerts.filter(a => a.type !== 'severe' && a.type !== 'extreme');
    if (minorAlerts.length > 0 && severeAlerts.length === 0) {
        parts.push(`ℹ️ ${minorAlerts.length} weather ${minorAlerts.length === 1 ? 'advisory' : 'advisories'} active. Ask for details with "show alerts".`);
    }

    return parts.join('\n\n');
}

function formatDayName(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// ============================================================================
// Session Management
// ============================================================================

function getOrCreateSession(contextId: string): SessionState {
    if (!sessions.has(contextId)) {
        // Default location: London
        const defaultLocation: WeatherLocation = {
            id: 'default',
            name: 'London',
            lat: 51.5074,
            lng: -0.1278,
            timezone: 'Europe/London',
            country: 'GB',
            region: 'EU'
        };

        sessions.set(contextId, {
            locations: [defaultLocation],
            weatherData: {},
            selectedLocationId: 'default'
        });
    }

    return sessions.get(contextId)!;
}

// ============================================================================
// Agent Card
// ============================================================================

export const getAuroraWeatherAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'AURORA Weather',
    description: 'Intelligent weather assistant with Liquid Glass UI. Get current conditions, forecasts, alerts, and activity suggestions. Supports global locations with Europe CAP-first alerts.',
    version: '1.0.0',
    supportedInterfaces: [
        {
            url: `${baseUrl}/agents/aurora-weather`,
            protocolBinding: 'JSONRPC'
        }
    ],
    capabilities: {
        streaming: false,
        pushNotifications: false
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'get-current-weather',
            name: 'Get Current Weather',
            description: 'Get current weather conditions for a location',
            tags: ['weather', 'current', 'conditions']
        },
        {
            id: 'get-forecast',
            name: 'Get Forecast',
            description: 'Get hourly and daily weather forecast',
            tags: ['weather', 'forecast', 'prediction']
        },
        {
            id: 'search-location',
            name: 'Search Location',
            description: 'Search for a location by name',
            tags: ['location', 'search', 'geocoding']
        },
        {
            id: 'add-location',
            name: 'Add Location',
            description: 'Add a location to track',
            tags: ['location', 'tracking']
        },
        {
            id: 'suggest-activities',
            name: 'Suggest Activities',
            description: 'Suggest outdoor activities based on weather conditions',
            tags: ['activities', 'recommendations', 'ai']
        }
    ],
    provider: {
        organization: 'LiquidCrypto Agents'
    }
});

// ============================================================================
// Request Handler
// ============================================================================

export async function handleAuroraWeatherRequest(params: SendMessageParams, contextId?: string): Promise<any> {
    const taskId = randomUUID();
    const sessionId = contextId || 'aurora-weather-default';

    try {
        const session = getOrCreateSession(sessionId);

        const prompt = params?.message?.parts
            ?.filter((p: any) => p.text !== undefined)
            .map((p: any) => p.text)
            .join(' ') || '';

        const intent = parseIntent(prompt);

        let textResponse: string;
        let weatherUpdate: WeatherUpdate | null = null;

        switch (intent.type) {
            case 'get_weather':
            case 'get_forecast': {
                let targetLocation: WeatherLocation | null = null;

                if (intent.location) {
                    // Try to find existing location or geocode new one
                    const existing = session.locations.find(
                        l => l.name.toLowerCase().includes(intent.location!.toLowerCase())
                    );
                    if (existing) {
                        targetLocation = existing;
                    } else {
                        targetLocation = await geocodeLocation(intent.location);
                        if (targetLocation) {
                            session.locations.push(targetLocation);
                        }
                    }
                } else {
                    // Use selected location
                    targetLocation = session.locations.find(l => l.id === session.selectedLocationId) || session.locations[0];
                }

                if (!targetLocation) {
                    textResponse = `I couldn't find "${intent.location}". Try a different city name.`;
                    break;
                }

                const data = await fetchFullWeatherData(targetLocation);
                session.weatherData[targetLocation.id] = data;
                session.selectedLocationId = targetLocation.id;

                textResponse = generateWeatherNarrative(data);
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'add_location': {
                if (!intent.location) {
                    textResponse = "Which city would you like to add? Try 'Add Paris' or 'Add Tokyo, Japan'.";
                    break;
                }

                const newLocation = await geocodeLocation(intent.location);
                if (!newLocation) {
                    textResponse = `I couldn't find "${intent.location}". Try a different city name.`;
                    break;
                }

                // Check if already exists
                const exists = session.locations.some(
                    l => Math.abs(l.lat - newLocation.lat) < 0.1 && Math.abs(l.lng - newLocation.lng) < 0.1
                );
                if (exists) {
                    textResponse = `${newLocation.name} is already in your locations.`;
                    break;
                }

                session.locations.push(newLocation);

                // Fetch weather for new location
                const data = await fetchFullWeatherData(newLocation);
                session.weatherData[newLocation.id] = data;
                session.selectedLocationId = newLocation.id;

                textResponse = `Added **${newLocation.name}** to your locations. Current temperature: ${data.current.temperature}°C with ${data.current.conditionText.toLowerCase()}.`;
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'remove_location': {
                if (!intent.location) {
                    textResponse = "Which location would you like to remove?";
                    break;
                }

                const toRemove = session.locations.find(
                    l => l.name.toLowerCase().includes(intent.location!.toLowerCase())
                );

                if (!toRemove) {
                    textResponse = `I couldn't find "${intent.location}" in your locations.`;
                    break;
                }

                if (session.locations.length === 1) {
                    textResponse = "You need at least one location. Add another before removing this one.";
                    break;
                }

                session.locations = session.locations.filter(l => l.id !== toRemove.id);
                delete session.weatherData[toRemove.id];

                if (session.selectedLocationId === toRemove.id) {
                    session.selectedLocationId = session.locations[0].id;
                }

                textResponse = `Removed ${toRemove.name} from your locations.`;
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'suggest_activities': {
                const currentLocation = session.locations.find(l => l.id === session.selectedLocationId);
                if (!currentLocation) {
                    textResponse = "Add a location first to get activity suggestions.";
                    break;
                }

                let data = session.weatherData[currentLocation.id];
                if (!data) {
                    data = await fetchFullWeatherData(currentLocation);
                    session.weatherData[currentLocation.id] = data;
                }

                // Generate detailed recommendations
                const recommendations = generateDetailedActivityRecommendations(data.current, data.hourly, data.daily);

                // Build text response
                const recText = recommendations.map(r => {
                    let line = `• **${r.activity}** (${r.suitability})`;
                    line += `\n  ${r.reason}`;
                    if (r.timeWindow) line += `\n  ${r.timeWindow}`;
                    if (r.tips && r.tips.length > 0) {
                        line += `\n  Tips: ${r.tips.join(', ')}`;
                    }
                    return line;
                }).join('\n\n');

                textResponse = `**Activity suggestions for ${currentLocation.name}**:\n\n${recText}`;

                // Include recommendations in weather update
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString(),
                    activityRecommendations: recommendations
                };
                break;
            }

            case 'get_alerts': {
                const currentLocation = session.locations.find(l => l.id === session.selectedLocationId);
                if (!currentLocation) {
                    textResponse = "Add a location first to check for weather alerts.";
                    break;
                }

                let data = session.weatherData[currentLocation.id];
                if (!data) {
                    data = await fetchFullWeatherData(currentLocation);
                    session.weatherData[currentLocation.id] = data;
                }

                const { alerts } = data;

                if (alerts.length === 0) {
                    textResponse = `**No active weather alerts** for ${currentLocation.name}. Conditions are normal.`;
                } else {
                    const alertText = alerts.map(a => {
                        const icon = a.type === 'extreme' ? '🔴' : a.type === 'severe' ? '🟠' : a.type === 'warning' ? '🟡' : 'ℹ️';
                        let line = `${icon} **${a.event}**\n${a.headline}`;
                        if (a.instruction) {
                            line += `\n\n_${a.instruction}_`;
                        }
                        const expires = new Date(a.expires);
                        line += `\n\nExpires: ${expires.toLocaleString()}`;
                        return line;
                    }).join('\n\n---\n\n');

                    textResponse = `**Weather Alerts for ${currentLocation.name}** (${alerts.length} active):\n\n${alertText}`;
                }

                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'will_it_rain': {
                const currentLocation = session.locations.find(l => l.id === session.selectedLocationId);
                if (!currentLocation) {
                    textResponse = "Add a location first to check rain forecasts.";
                    break;
                }

                let data = session.weatherData[currentLocation.id];
                if (!data) {
                    data = await fetchFullWeatherData(currentLocation);
                    session.weatherData[currentLocation.id] = data;
                }

                textResponse = generateRainAtTimeResponse(data.hourly, intent.targetHour, data);
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'air_quality': {
                const currentLocation = session.locations.find(l => l.id === session.selectedLocationId);
                if (!currentLocation) {
                    textResponse = "Add a location first to check air quality.";
                    break;
                }

                let data = session.weatherData[currentLocation.id];
                if (!data) {
                    data = await fetchFullWeatherData(currentLocation);
                    session.weatherData[currentLocation.id] = data;
                }

                textResponse = generateAirQualityResponse(data.current, currentLocation.name);
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'clothing': {
                const currentLocation = session.locations.find(l => l.id === session.selectedLocationId);
                if (!currentLocation) {
                    textResponse = "Add a location first to get clothing recommendations.";
                    break;
                }

                let data = session.weatherData[currentLocation.id];
                if (!data) {
                    data = await fetchFullWeatherData(currentLocation);
                    session.weatherData[currentLocation.id] = data;
                }

                textResponse = generateClothingRecommendations(data.current, data.hourly, data.daily);
                weatherUpdate = {
                    type: 'weather_update',
                    locations: session.locations,
                    weatherData: session.weatherData,
                    selectedLocationId: session.selectedLocationId,
                    lastUpdated: new Date().toISOString()
                };
                break;
            }

            case 'help':
            default: {
                textResponse = `**AURORA Weather** - Your intelligent weather assistant

I can help you with:
• **Get weather**: "What's the weather in Paris?" or just "Tokyo"
• **Add location**: "Add New York to my locations"
• **Get forecast**: "What's the forecast for this week?"
• **Will it rain?**: "Will it rain at 5pm?" or "Should I bring an umbrella?"
• **Air quality**: "What's the air quality?" or "Is it safe for my kid to play outside?"
• **What to wear**: "What should I wear today?"
• **Activity suggestions**: "What activities are good for today?"

Try asking me about the weather!`;
                break;
            }
        }

        // Build artifacts
        const artifacts: any[] = [
            {
                name: 'response',
                parts: [
                    { type: 'text', text: textResponse }
                ]
            }
        ];

        if (weatherUpdate) {
            artifacts[0].parts.push({
                type: 'data',
                data: weatherUpdate
            });
        }

        return {
            id: taskId,
            contextId: sessionId,
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts,
            history: []
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[AURORA Weather] Error:', errorMessage);

        return {
            id: taskId,
            contextId: sessionId,
            status: { state: 'failed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'error',
                    parts: [
                        { type: 'text', text: `Weather service error: ${errorMessage}. Please try again.` }
                    ]
                }
            ],
            history: []
        };
    }
}
