/**
 * DailyCockpit
 *
 * Full-featured daily cockpit dashboard for the Jagd-Agenten hunting companion.
 * Shows huntability score, best hunting windows, weather/wind conditions,
 * recent sessions, and action buttons.
 */

import { useState, useEffect } from 'react';
import {
  Compass,
  Thermometer,
  Droplets,
  Moon,
  Sun,
  Wind,
  Play,
  ClipboardList,
  Clock,
  Target,
} from 'lucide-react';
import { useCockpitStore } from '@/stores/useCockpitStore';
import type { ConditionsSnapshot, HuntWindow, RecentSession } from '@/stores/useCockpitStore';
import CockpitChatPanel from './CockpitChatPanel';
import { BuechsenlichtCountdown } from './BuechsenlichtCountdown';
import { StartHuntModal } from './StartHuntModal';
import { HuntModeView } from './HuntModeView';
import { EndHuntSummary } from './EndHuntSummary';
import { useHuntSessionStore, selectActiveSession, selectIsHunting } from '../stores/useHuntSessionStore';
import type { SessionType, StandReference, WeatherSnapshot, HuntSession } from '../types/HuntSession';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_TYPE_LABELS: Record<string, string> = {
  ansitz: 'Ansitz',
  pirsch: 'Pirsch',
  drueckjagd: 'Drueckjagd',
  other: 'Sonstige',
};

const WIND_DIRECTIONS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score > 70) return 'var(--glass-accent)';
  if (score > 40) return 'var(--status-warning, #f59e0b)';
  return 'var(--status-error, #ef4444)';
}

function windDirectionLabel(degrees: number): string {
  const idx = Math.round(degrees / 45) % 8;
  return WIND_DIRECTIONS[idx];
}

function formatDuration(start: string, end?: string): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const mins = Math.floor((e - s) / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HuntabilityScoreCard({ score }: { score: number | null }) {
  const displayScore = score ?? 0;
  const color = score !== null ? scoreColor(displayScore) : 'var(--text-secondary)';

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? (displayScore / 100) * circumference : 0;
  const offset = circumference - progress;

  return (
    <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 self-start">
        <Target size={18} style={{ color: 'var(--text-secondary)' }} />
        <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
          Jagdbarkeit
        </h3>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          {/* Background track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score !== null ? displayScore : '--'}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">/ 100</span>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] text-center">
        {score === null
          ? 'Score wird berechnet...'
          : displayScore > 70
            ? 'Gute Bedingungen'
            : displayScore > 40
              ? 'Maessige Bedingungen'
              : 'Ungünstige Bedingungen'}
      </p>
    </div>
  );
}

function BestWindowsCard({ windows }: { windows: HuntWindow[] }) {
  return (
    <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
        <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
          Beste Zeitfenster
        </h3>
      </div>

      {windows.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Keine Daten vorhanden</p>
      ) : (
        <div className="flex flex-col gap-2">
          {windows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
                  {w.start} - {w.end}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: scoreColor(w.score),
                    color: '#fff',
                  }}
                >
                  {w.score}
                </span>
                <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {w.reason}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConditionsCard({ conditions }: { conditions: ConditionsSnapshot | null }) {
  if (!conditions) {
    return (
      <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={18} style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
            Witterung
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">Standort wird ermittelt...</p>
      </div>
    );
  }

  const { wind, temperature, humidity, pressure, moonPhase, twilight, precipitation, cloudCover } =
    conditions;

  return (
    <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wind size={18} style={{ color: 'var(--text-secondary)' }} />
        <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
          Witterung
        </h3>
      </div>

      {/* Wind compass rose */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="var(--glass-border)"
              strokeWidth="2"
            />
            {/* Cardinal direction marks */}
            {[0, 90, 180, 270].map((deg) => (
              <line
                key={deg}
                x1="36"
                y1="8"
                x2="36"
                y2="14"
                stroke="var(--text-secondary)"
                strokeWidth="1.5"
                transform={`rotate(${deg} 36 36)`}
              />
            ))}
            {/* Wind arrow */}
            <line
              x1="36"
              y1="36"
              x2="36"
              y2="12"
              stroke="var(--glass-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${wind.direction} 36 36)`}
            />
            <circle cx="36" cy="36" r="3" fill="var(--glass-accent)" />
          </svg>
          {/* Direction labels */}
          <span
            className="absolute text-[10px] font-bold text-[var(--text-secondary)]"
            style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            N
          </span>
          <span
            className="absolute text-[10px] font-bold text-[var(--text-secondary)]"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            S
          </span>
          <span
            className="absolute text-[10px] font-bold text-[var(--text-secondary)]"
            style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
          >
            W
          </span>
          <span
            className="absolute text-[10px] font-bold text-[var(--text-secondary)]"
            style={{ right: 0, top: '50%', transform: 'translateY(-50%)' }}
          >
            O
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-[var(--text-primary)]">
            {wind.speed} km/h {windDirectionLabel(wind.direction)}
          </span>
          {wind.gustSpeed != null && (
            <span className="text-xs text-[var(--text-secondary)]">
              Boeen bis {wind.gustSpeed} km/h
            </span>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Thermometer size={16} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{temperature}°C</p>
            <p className="text-xs text-[var(--text-secondary)]">Temperatur</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets size={16} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{humidity}%</p>
            <p className="text-xs text-[var(--text-secondary)]">Luftfeuchtigkeit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Moon size={16} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{moonPhase}</p>
            <p className="text-xs text-[var(--text-secondary)]">Mondphase</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Compass size={16} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{pressure} hPa</p>
            <p className="text-xs text-[var(--text-secondary)]">Luftdruck</p>
          </div>
        </div>
      </div>

      {/* Twilight times */}
      <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]">
        <Sun size={14} style={{ color: 'var(--text-secondary)' }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
          <span>Daemmerung {twilight.civilDawn}</span>
          <span>Aufgang {twilight.sunrise}</span>
          <span>Untergang {twilight.sunset}</span>
          <span>Daemmerung {twilight.civilDusk}</span>
        </div>
      </div>

      {/* Extra: precipitation & cloud cover */}
      <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
        <span>Niederschlag: {precipitation} mm</span>
        <span>Bewoelkung: {cloudCover}%</span>
      </div>
    </div>
  );
}

function RecentSessionsCard({ sessions }: { sessions: RecentSession[] }) {
  const displayed = sessions.slice(0, 3);

  return (
    <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
        <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
          Letzte Jagden
        </h3>
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Noch keine Jagden erfasst</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Target size={14} style={{ color: 'var(--glass-accent)' }} />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-[var(--text-secondary)]">
                <span>{new Date(s.startTime).toLocaleDateString('de-DE')}</span>
                <span>{formatDuration(s.startTime, s.endTime)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DailyCockpit() {
  const {
    huntabilityScore,
    bestWindows,
    conditions,
    recentSessions,
    loading,
    error,
    fetchDashboard,
  } = useCockpitStore();

  // Hunt session state
  const activeSession = useHuntSessionStore(selectActiveSession);
  const isHunting = useHuntSessionStore(selectIsHunting);
  const { startSession, endSession } = useHuntSessionStore();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndSummary, setShowEndSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState<{ session: HuntSession; summary: any } | null>(null);

  // Get personalized greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const name = 'Jäger'; // TODO: Get from user profile
    if (hour < 12) return `Guten Morgen, ${name}`;
    if (hour < 18) return `Guten Tag, ${name}`;
    return `Guten Abend, ${name}`;
  };

  // Get wind summary for greeting
  const getWindSummary = (): string => {
    if (!conditions) return '';
    const dir = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(conditions.wind.direction / 45) % 8];
    return `Wind stabil aus ${dir} mit ${conditions.wind.speed} km/h`;
  };

  // Handle starting a hunt
  const handleStartHunt = async (type: SessionType, stand?: StandReference) => {
    // Convert conditions to WeatherSnapshot
    const weather: WeatherSnapshot | undefined = conditions ? {
      temperature: conditions.temperature,
      feelsLike: conditions.temperature - 2, // Approximate
      humidity: conditions.humidity,
      windSpeed: conditions.wind.speed,
      windDirection: conditions.wind.direction,
      pressure: conditions.pressure,
      visibility: 10000,
      cloudCover: conditions.cloudCover,
      precipitation: conditions.precipitation,
      moonPhase: conditions.moonPhase,
      capturedAt: new Date().toISOString(),
    } : undefined;

    await startSession(type, stand, weather);
    setShowStartModal(false);
  };

  // Handle ending a hunt
  const handleEndHunt = async () => {
    if (!activeSession) return;
    const summary = await endSession();
    setCompletedSession({ session: activeSession, summary });
    setShowEndSummary(true);
  };

  useEffect(() => {
    // Request browser geolocation, fallback to central Germany
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchDashboard(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback: approximate center of Germany
          fetchDashboard(51.1657, 10.4515);
        },
      );
    } else {
      fetchDashboard(51.1657, 10.4515);
    }
  }, [fetchDashboard]);

  return (
    <>
      {/* Hunt Mode View (full screen when active) */}
      {isHunting && (
        <HuntModeView onEnd={handleEndHunt} />
      )}

      {/* Start Hunt Modal */}
      <StartHuntModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleStartHunt}
        stands={[]} // TODO: Load from user's stands
        currentWeather={conditions ? {
          temperature: conditions.temperature,
          feelsLike: conditions.temperature - 2,
          humidity: conditions.humidity,
          windSpeed: conditions.wind.speed,
          windDirection: conditions.wind.direction,
          pressure: conditions.pressure,
          visibility: 10000,
          cloudCover: conditions.cloudCover,
          precipitation: conditions.precipitation,
          moonPhase: conditions.moonPhase,
          capturedAt: new Date().toISOString(),
        } : undefined}
      />

      {/* End Hunt Summary */}
      {showEndSummary && completedSession && (
        <EndHuntSummary
          session={completedSession.session}
          summary={completedSession.summary}
          onClose={() => {
            setShowEndSummary(false);
            setCompletedSession(null);
          }}
          onSaveToJournal={() => {
            // TODO: Save to journal
            console.log('Saving to journal...');
          }}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {getGreeting()}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {getWindSummary() || 'Jagdbarkeit, beste Zeitfenster, Wind & Witterung - alles auf einen Blick.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)] text-sm text-[var(--text-secondary)]">
            Fehler beim Laden: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--glass-accent)', borderTopColor: 'transparent' }}
              />
              <span className="text-sm text-[var(--text-secondary)]">Daten werden geladen...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Main dashboard grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <HuntabilityScoreCard score={huntabilityScore} />
              <BuechsenlichtCountdown twilight={conditions?.twilight ?? null} />
              <BestWindowsCard windows={bestWindows} />
              <ConditionsCard conditions={conditions} />
            </div>

            {/* Recent sessions */}
            <RecentSessionsCard sessions={recentSessions} />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--glass-accent)] text-white font-semibold text-lg transition-opacity hover:opacity-90"
              >
                <Play size={20} />
                Jagd starten
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] font-semibold text-lg transition-opacity hover:opacity-90">
                <ClipboardList size={20} />
                Checkliste
              </button>
            </div>

            {/* AI Chat Panel */}
            <CockpitChatPanel />
          </>
        )}
      </div>
    </>
  );
}
