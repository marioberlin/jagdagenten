/**
 * Büchsenlicht & Moon Planner Dashboard
 *
 * - 7-day shooting light windows
 * - Moon phase calendar
 * - Best hunting windows
 * - Education tile
 */

import { useState, useEffect } from 'react';
import {
    Sun,
    Sunrise,
    Sunset,
    Star,
    Calendar,
    Clock,
    Info,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DayForecast {
    date: string;
    weekday: string;
    sunrise: string;
    sunset: string;
    buechsenlichtStart: string; // 1.5h before sunrise
    buechsenlichtEnd: string;   // 1.5h after sunset
    moonPhase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
    moonIllumination: number;   // 0-100%
    huntingScore: number;       // 0-100
    bestWindow: string;         // e.g., "17:30-19:00"
}

interface BuechsenlichtData {
    forecast: DayForecast[];
    location: string;
    timezone: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockData(): BuechsenlichtData {
    const today = new Date();
    const forecast: DayForecast[] = [];

    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const phases: DayForecast['moonPhase'][] = [
        'waning_crescent', 'new', 'waxing_crescent', 'first_quarter',
        'waxing_gibbous', 'full', 'waning_gibbous',
    ];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Simulate varying times
        const baseSunrise = 7 + Math.floor(i / 3) * 0.1;
        const baseSunset = 17 + (i % 3) * 0.15;

        const sunriseHour = Math.floor(baseSunrise);
        const sunriseMin = Math.floor((baseSunrise % 1) * 60);
        const sunsetHour = Math.floor(baseSunset);
        const sunsetMin = Math.floor((baseSunset % 1) * 60);

        forecast.push({
            date: date.toISOString().split('T')[0],
            weekday: weekdays[date.getDay()],
            sunrise: `${sunriseHour.toString().padStart(2, '0')}:${sunriseMin.toString().padStart(2, '0')}`,
            sunset: `${sunsetHour.toString().padStart(2, '0')}:${sunsetMin.toString().padStart(2, '0')}`,
            buechsenlichtStart: `${(sunriseHour - 1).toString().padStart(2, '0')}:${(sunriseMin + 30).toString().padStart(2, '0')}`,
            buechsenlichtEnd: `${(sunsetHour + 1).toString().padStart(2, '0')}:${(sunsetMin + 30).toString().padStart(2, '0')}`,
            moonPhase: phases[i],
            moonIllumination: [5, 0, 15, 50, 85, 100, 85][i],
            huntingScore: 60 + Math.floor(Math.random() * 35),
            bestWindow: `${sunsetHour - 1}:30-${sunsetHour}:${sunsetMin.toString().padStart(2, '0')}`,
        });
    }

    return {
        forecast,
        location: 'Bayern, Deutschland',
        timezone: 'Europe/Berlin',
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MoonIcon({ phase, size = 20 }: { phase: DayForecast['moonPhase']; size?: number }) {
    const phaseSymbols: Record<string, string> = {
        new: '🌑',
        waxing_crescent: '🌒',
        first_quarter: '🌓',
        waxing_gibbous: '🌔',
        full: '🌕',
        waning_gibbous: '🌖',
        last_quarter: '🌗',
        waning_crescent: '🌘',
    };

    return <span style={{ fontSize: size }}>{phaseSymbols[phase]}</span>;
}

function DayCard({ day, isToday }: { day: DayForecast; isToday: boolean }) {
    return (
        <div className={`day-card ${isToday ? 'today' : ''}`}>
            <div className="day-header">
                <span className="weekday">{day.weekday}</span>
                <span className="date">{new Date(day.date).getDate()}</span>
            </div>

            <div className="moon-section">
                <MoonIcon phase={day.moonPhase} size={24} />
                <span className="illumination">{day.moonIllumination}%</span>
            </div>

            <div className="times-section">
                <div className="time-row">
                    <Sunrise className="w-3 h-3" />
                    <span>{day.sunrise}</span>
                </div>
                <div className="time-row">
                    <Sunset className="w-3 h-3" />
                    <span>{day.sunset}</span>
                </div>
            </div>

            <div className="buechsenlicht">
                <span className="bl-label">Büchsenlicht</span>
                <span className="bl-times">{day.buechsenlichtStart} - {day.buechsenlichtEnd}</span>
            </div>

            <div className="score" style={{
                background: day.huntingScore >= 80 ? 'rgba(16, 185, 129, 0.2)' :
                    day.huntingScore >= 60 ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(239, 68, 68, 0.2)',
                color: day.huntingScore >= 80 ? '#10b981' :
                    day.huntingScore >= 60 ? '#f59e0b' : '#ef4444',
            }}>
                {day.huntingScore}
            </div>

            <style>{`
                .day-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 10px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    min-width: 85px;
                }
                .day-card.today {
                    border-color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }
                .day-header {
                    text-align: center;
                }
                .weekday {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .date {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .moon-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
                .illumination {
                    font-size: 0.6rem;
                    color: var(--text-tertiary);
                }
                .times-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .time-row {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }
                .buechsenlicht {
                    text-align: center;
                }
                .bl-label {
                    display: block;
                    font-size: 0.55rem;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                }
                .bl-times {
                    font-size: 0.65rem;
                    color: #f59e0b;
                }
                .score {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}

function EducationTile() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="education-tile">
            <button className="education-header" onClick={() => setExpanded(!expanded)}>
                <Info className="w-4 h-4" />
                <span>Was ist Büchsenlicht?</span>
                <ChevronRight className={`w-4 h-4 chevron ${expanded ? 'expanded' : ''}`} />
            </button>

            {expanded && (
                <div className="education-content">
                    <p>
                        <strong>Büchsenlicht</strong> bezeichnet die Zeit, in der nach deutschem Jagdrecht
                        mit der Büchse gejagt werden darf.
                    </p>
                    <p>
                        Es beginnt etwa <strong>1,5 Stunden vor Sonnenaufgang</strong> und endet etwa
                        <strong> 1,5 Stunden nach Sonnenuntergang</strong>.
                    </p>
                    <p>
                        <strong>Nachtzeit</strong> ist die Zeit dazwischen, in der regulär nicht gejagt
                        werden darf (außer bei Sondergenehmigungen für Schwarzwild).
                    </p>
                </div>
            )}

            <style>{`
                .education-tile {
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .education-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 14px;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    text-align: left;
                }
                .chevron {
                    margin-left: auto;
                    transition: transform 0.2s;
                }
                .chevron.expanded {
                    transform: rotate(90deg);
                }
                .education-content {
                    padding: 0 14px 14px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
                .education-content p {
                    margin: 0 0 10px;
                }
                .education-content p:last-child {
                    margin-bottom: 0;
                }
                .education-content strong {
                    color: #f59e0b;
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BuechsenlichtMoon() {
    const [data, setData] = useState<BuechsenlichtData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 400);
    }, []);

    if (loading || !data) {
        return (
            <div className="bl-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Berechne Jagdzeiten...</span>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const todayData = data.forecast.find(d => d.date === today) || data.forecast[0];

    return (
        <div className="buechsenlicht-moon">
            {/* Header */}
            <div className="bl-header">
                <div className="header-title">
                    <Sun className="w-5 h-5" />
                    <h2>Büchsenlicht & Mond</h2>
                </div>
                <div className="location">
                    {data.location}
                </div>
            </div>

            {/* Today Highlight */}
            <div className="today-highlight">
                <div className="today-section">
                    <Sunrise className="w-5 h-5" />
                    <div>
                        <span className="label">Sonnenaufgang</span>
                        <span className="value">{todayData.sunrise}</span>
                    </div>
                </div>
                <div className="today-divider" />
                <div className="today-section">
                    <Clock className="w-5 h-5" />
                    <div>
                        <span className="label">Büchsenlicht</span>
                        <span className="value">{todayData.buechsenlichtStart} - {todayData.buechsenlichtEnd}</span>
                    </div>
                </div>
                <div className="today-divider" />
                <div className="today-section">
                    <Sunset className="w-5 h-5" />
                    <div>
                        <span className="label">Sonnenuntergang</span>
                        <span className="value">{todayData.sunset}</span>
                    </div>
                </div>
            </div>

            {/* 7-Day Forecast */}
            <section className="forecast-section">
                <h3 className="section-title">
                    <Calendar className="w-4 h-4" />
                    7-Tage Vorschau
                </h3>
                <div className="forecast-scroll">
                    {data.forecast.map((day, i) => (
                        <DayCard key={day.date} day={day} isToday={i === 0} />
                    ))}
                </div>
            </section>

            {/* Best Window Today */}
            <div className="best-window">
                <Star className="w-5 h-5" />
                <div>
                    <span className="bw-label">Beste Jagdzeit heute</span>
                    <span className="bw-value">{todayData.bestWindow}</span>
                </div>
            </div>

            {/* Education */}
            <EducationTile />

            <style>{`
                .buechsenlicht-moon {
                    padding: 16px;
                }
                .bl-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary);
                }
                .bl-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-title h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .location {
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                }
                .today-highlight {
                    display: flex;
                    align-items: center;
                    justify-content: space-around;
                    padding: 16px;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 12px;
                    margin-bottom: 20px;
                }
                .today-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #f59e0b;
                }
                .today-section .label {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }
                .today-section .value {
                    display: block;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .today-divider {
                    width: 1px;
                    height: 40px;
                    background: rgba(245, 158, 11, 0.3);
                }
                .forecast-section {
                    margin-bottom: 20px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin: 0 0 12px;
                }
                .forecast-scroll {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                }
                .best-window {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    margin-bottom: 16px;
                    color: #10b981;
                }
                .bw-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .bw-value {
                    display: block;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
}
