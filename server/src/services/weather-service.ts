/**
 * Weather Service
 * 
 * Integrates with OpenWeatherMap API to provide real hunting-relevant weather data.
 * Falls back to mock data when API key is not available.
 */

import type { ConditionsSnapshot } from '../types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenWeatherResponse {
    coord: { lat: number; lon: number };
    weather: Array<{ id: number; main: string; description: string }>;
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
    };
    wind: {
        speed: number;
        deg: number;
        gust?: number;
    };
    clouds: { all: number };
    rain?: { '1h'?: number; '3h'?: number };
    snow?: { '1h'?: number; '3h'?: number };
    sys: { sunrise: number; sunset: number };
    visibility: number;
}

interface SunCalcResult {
    sunrise: Date;
    sunset: Date;
    civilDawn: Date;
    civilDusk: Date;
}

// ---------------------------------------------------------------------------
// SunCalc (simplified twilight calculation)
// ---------------------------------------------------------------------------

/**
 * Calculate sunrise, sunset, and civil twilight times.
 * Civil twilight is ~6 degrees below horizon - legal "Büchsenlicht" time.
 */
function calculateTwilight(lat: number, lon: number, date: Date): SunCalcResult {
    // Simplified solar calculation
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180);

    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;

    // Hour angle for sunrise/sunset (sun at horizon)
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;

    // Civil twilight is when sun is 6 degrees below horizon
    const cosHourAngleCivil = (Math.sin(-6 * Math.PI / 180) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad));
    const hourAngleCivil = Math.acos(Math.max(-1, Math.min(1, cosHourAngleCivil))) * 180 / Math.PI;

    // Solar noon (simplified)
    const solarNoon = 12 - lon / 15;

    const sunrise = solarNoon - hourAngle / 15;
    const sunset = solarNoon + hourAngle / 15;
    const civilDawn = solarNoon - hourAngleCivil / 15;
    const civilDusk = solarNoon + hourAngleCivil / 15;

    // Convert hours to Date objects
    const toDate = (hours: number): Date => {
        const result = new Date(date);
        result.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
        return result;
    };

    return {
        sunrise: toDate(sunrise),
        sunset: toDate(sunset),
        civilDawn: toDate(civilDawn),
        civilDusk: toDate(civilDusk),
    };
}

/**
 * Format time as HH:MM
 */
function formatTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Moon Phase Calculation
// ---------------------------------------------------------------------------

function getMoonPhase(date: Date): string {
    // Synodic month is ~29.53 days
    const synodicMonth = 29.53058867;

    // Known new moon: January 6, 2000
    const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / 86400000;

    const phase = ((daysSinceNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
    const phasePercent = phase / synodicMonth;

    if (phasePercent < 0.0625) return 'Neumond';
    if (phasePercent < 0.1875) return 'Zunehmende Sichel';
    if (phasePercent < 0.3125) return 'Erstes Viertel';
    if (phasePercent < 0.4375) return 'Zunehmender Mond';
    if (phasePercent < 0.5625) return 'Vollmond';
    if (phasePercent < 0.6875) return 'Abnehmender Mond';
    if (phasePercent < 0.8125) return 'Letztes Viertel';
    if (phasePercent < 0.9375) return 'Abnehmende Sichel';
    return 'Neumond';
}

// ---------------------------------------------------------------------------
// OpenWeatherMap Integration
// ---------------------------------------------------------------------------

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetch weather from OpenWeatherMap and convert to ConditionsSnapshot
 */
export async function fetchWeatherConditions(
    lat: number,
    lon: number
): Promise<ConditionsSnapshot> {
    // If no API key, use mock data
    if (!OPENWEATHER_API_KEY) {
        console.log('[WeatherService] No API key, returning mock data');
        return getMockConditions(lat, lon);
    }

    try {
        const url = new URL(OPENWEATHER_BASE_URL);
        url.searchParams.set('lat', lat.toString());
        url.searchParams.set('lon', lon.toString());
        url.searchParams.set('appid', OPENWEATHER_API_KEY);
        url.searchParams.set('units', 'metric');
        url.searchParams.set('lang', 'de');

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error('[WeatherService] API error:', response.status);
            return getMockConditions(lat, lon);
        }

        const data = await response.json() as OpenWeatherResponse;
        return transformWeatherResponse(data, lat, lon);
    } catch (error) {
        console.error('[WeatherService] Fetch error:', error);
        return getMockConditions(lat, lon);
    }
}

/**
 * Transform OpenWeatherMap response to our ConditionsSnapshot format
 */
function transformWeatherResponse(
    data: OpenWeatherResponse,
    lat: number,
    lon: number
): ConditionsSnapshot {
    const now = new Date();
    const twilight = calculateTwilight(lat, lon, now);

    // Calculate precipitation (rain + snow)
    const precipitation = (data.rain?.['1h'] || 0) + (data.snow?.['1h'] || 0);

    return {
        wind: {
            direction: data.wind.deg,
            speed: Math.round(data.wind.speed * 3.6), // m/s to km/h
            gustSpeed: data.wind.gust ? Math.round(data.wind.gust * 3.6) : undefined,
        },
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        moonPhase: getMoonPhase(now),
        twilight: {
            civilDawn: formatTime(twilight.civilDawn),
            sunrise: formatTime(twilight.sunrise),
            sunset: formatTime(twilight.sunset),
            civilDusk: formatTime(twilight.civilDusk),
        },
        precipitation: Math.round(precipitation * 10) / 10,
        cloudCover: data.clouds.all,
        visibility: Math.round(data.visibility / 1000), // meters to km
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0]?.description || 'unbekannt',
    };
}

// ---------------------------------------------------------------------------
// Mock Data (fallback when no API key)
// ---------------------------------------------------------------------------

function getMockConditions(lat: number, lon: number): ConditionsSnapshot {
    const now = new Date();
    const twilight = calculateTwilight(lat, lon, now);

    // Realistic mock data for German hunting conditions
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 20;

    return {
        wind: {
            direction: 225, // SW
            speed: 8 + Math.floor(Math.random() * 10),
            gustSpeed: 15 + Math.floor(Math.random() * 10),
        },
        temperature: isNight ? 2 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 8),
        humidity: 65 + Math.floor(Math.random() * 25),
        pressure: 1010 + Math.floor(Math.random() * 20),
        moonPhase: getMoonPhase(now),
        twilight: {
            civilDawn: formatTime(twilight.civilDawn),
            sunrise: formatTime(twilight.sunrise),
            sunset: formatTime(twilight.sunset),
            civilDusk: formatTime(twilight.civilDusk),
        },
        precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 5 * 10) / 10 : 0,
        cloudCover: Math.floor(Math.random() * 100),
        visibility: 8 + Math.floor(Math.random() * 12),
        feelsLike: isNight ? Math.floor(Math.random() * 5) : 6 + Math.floor(Math.random() * 8),
        condition: ['Klar', 'Leicht bewölkt', 'Bewölkt', 'Bedeckt'][Math.floor(Math.random() * 4)],
    };
}

// ---------------------------------------------------------------------------
// Huntability Score Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate hunting score (0-100) based on weather conditions.
 * Factors in wind, precipitation, pressure changes, moon phase, etc.
 */
export function calculateHuntabilityScore(conditions: ConditionsSnapshot): number {
    let score = 70; // Base score

    // Wind penalty (strong wind = lower score)
    if (conditions.wind.speed < 5) score += 10;
    else if (conditions.wind.speed > 25) score -= 20;
    else if (conditions.wind.speed > 15) score -= 10;

    // Precipitation penalty
    if (conditions.precipitation > 5) score -= 25;
    else if (conditions.precipitation > 2) score -= 15;
    else if (conditions.precipitation > 0) score -= 5;

    // Pressure bonus (high = stable = good)
    if (conditions.pressure > 1020) score += 10;
    else if (conditions.pressure < 1000) score -= 10;

    // Moon phase bonus (full moon = more activity)
    if (conditions.moonPhase === 'Vollmond') score += 5;
    else if (conditions.moonPhase === 'Neumond') score -= 5;

    // Temperature (extreme temps are bad)
    if (conditions.temperature < -5) score -= 15;
    else if (conditions.temperature > 25) score -= 10;
    else if (conditions.temperature >= 5 && conditions.temperature <= 15) score += 5;

    // Visibility
    if (conditions.visibility && conditions.visibility < 3) score -= 15;

    // Cloud cover (overcast = good for hunting)
    if (conditions.cloudCover && conditions.cloudCover > 70) score += 5;

    return Math.max(0, Math.min(100, score));
}

export default {
    fetchWeatherConditions,
    calculateHuntabilityScore,
    getMoonPhase,
    calculateTwilight,
};
