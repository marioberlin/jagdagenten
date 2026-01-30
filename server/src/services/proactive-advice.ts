/**
 * Proactive Advice Engine
 *
 * AI-powered notification system that provides hunting advice
 * based on conditions, document status, and equipment state.
 */

import { getExpirationMonitor } from './expiration-monitor.js';
import { getMaintenanceScheduler } from './maintenance-scheduler.js';
import weatherService from './weather-service.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Advice {
    id: string;
    type: AdviceType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionLabel?: string;
    actionRoute?: string;
    icon: string;
    createdAt: string;
    expiresAt?: string;
}

export type AdviceType =
    | 'weather_optimal'
    | 'weather_warning'
    | 'document_expiring'
    | 'equipment_maintenance'
    | 'low_ammo'
    | 'session_reminder'
    | 'moon_phase'
    | 'general_tip';

// ---------------------------------------------------------------------------
// Advice Templates
// ---------------------------------------------------------------------------

const HUNTING_TIPS = [
    {
        title: 'Windrichtung beachten',
        message: 'Positionieren Sie sich immer mit dem Wind im Gesicht zum Wild.',
        icon: '🌬️',
    },
    {
        title: 'Ruhe bewahren',
        message: 'Vermeiden Sie hektische Bewegungen. Wild reagiert am stärksten auf Bewegung.',
        icon: '🤫',
    },
    {
        title: 'Dämmerung nutzen',
        message: 'Die aktivste Zeit für Schalenwild ist die Morgendämmerung.',
        icon: '🌅',
    },
    {
        title: 'Barometer steigt',
        message: 'Steigender Luftdruck bedeutet oft erhöhte Wildaktivität.',
        icon: '📊',
    },
];

// ---------------------------------------------------------------------------
// ProactiveAdviceEngine Class
// ---------------------------------------------------------------------------

export class ProactiveAdviceEngine {
    /**
     * Generate all relevant advice for a user
     */
    async getAdvice(userId: string, location?: { lat: number; lng: number }): Promise<Advice[]> {
        const advice: Advice[] = [];
        const now = new Date();

        // 1. Weather-based advice
        if (location) {
            const weatherAdvice = await this.getWeatherAdvice(location.lat, location.lng);
            if (weatherAdvice) advice.push(weatherAdvice);
        }

        // 2. Document expiration advice
        const expirationAdvice = await this.getExpirationAdvice(userId);
        advice.push(...expirationAdvice);

        // 3. Equipment maintenance advice
        const maintenanceAdvice = await this.getMaintenanceAdvice(userId);
        advice.push(...maintenanceAdvice);

        // 4. Daily tip (random)
        const tipAdvice = this.getDailyTip();
        if (tipAdvice) advice.push(tipAdvice);

        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        advice.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return advice;
    }

    /**
     * Weather-based hunting advice
     */
    async getWeatherAdvice(lat: number, lng: number): Promise<Advice | null> {
        try {
            const conditions = await weatherService.fetchWeatherConditions(lat, lng);
            const score = weatherService.calculateHuntabilityScore(conditions);

            if (score >= 75) {
                return {
                    id: `weather-${Date.now()}`,
                    type: 'weather_optimal',
                    priority: 'high',
                    title: `Jagdscore: ${score}/100`,
                    message: 'Heute sind die Bedingungen optimal für die Jagd!',
                    actionLabel: 'Karte öffnen',
                    actionRoute: '/map',
                    icon: '🎯',
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6h
                };
            }

            if (conditions.wind && conditions.wind.speed > 10) {
                return {
                    id: `weather-wind-${Date.now()}`,
                    type: 'weather_warning',
                    priority: 'medium',
                    title: 'Starker Wind',
                    message: `Wind ${conditions.wind.speed.toFixed(1)} m/s aus ${conditions.wind.direction}. Erschwerte Bedingungen.`,
                    icon: '💨',
                    createdAt: new Date().toISOString(),
                };
            }

            if (conditions.rain && conditions.rain > 2) {
                return {
                    id: `weather-rain-${Date.now()}`,
                    type: 'weather_warning',
                    priority: 'medium',
                    title: 'Starker Regen',
                    message: 'Starker Niederschlag erwartet. Jagd heute nicht empfohlen.',
                    icon: '🌧️',
                    createdAt: new Date().toISOString(),
                };
            }

            return null;
        } catch (error) {
            log.error({ error }, 'Failed to get weather advice');
            return null;
        }
    }

    /**
     * Document expiration advice
     */
    async getExpirationAdvice(userId: string): Promise<Advice[]> {
        try {
            const monitor = getExpirationMonitor();
            const alerts = await monitor.getUserAlerts(userId);

            return alerts
                .filter((a) => a.daysRemaining <= 14) // Only urgent ones
                .slice(0, 2) // Max 2 alerts
                .map((alert) => ({
                    id: `doc-${alert.documentId}`,
                    type: 'document_expiring' as AdviceType,
                    priority: alert.alertLevel === 'critical' ? 'critical' : 'high',
                    title: monitor.getNotificationTitle(alert.alertLevel),
                    message: monitor.formatAlertMessage(alert),
                    actionLabel: 'Dokument anzeigen',
                    actionRoute: `/documents/${alert.documentId}`,
                    icon: '📄',
                    createdAt: new Date().toISOString(),
                }));
        } catch (error) {
            log.error({ error }, 'Failed to get expiration advice');
            return [];
        }
    }

    /**
     * Equipment maintenance advice
     */
    async getMaintenanceAdvice(userId: string): Promise<Advice[]> {
        try {
            const scheduler = getMaintenanceScheduler();
            const reminders = await scheduler.getReminders(userId);

            return reminders
                .filter((r) => r.priority !== 'low')
                .slice(0, 2) // Max 2 reminders
                .map((reminder) => ({
                    id: `maint-${reminder.scheduleId}`,
                    type: 'equipment_maintenance' as AdviceType,
                    priority: reminder.priority === 'high' ? 'high' : 'medium',
                    title: 'Wartung fällig',
                    message: reminder.message,
                    actionLabel: 'Wartung anzeigen',
                    actionRoute: `/equipment/${reminder.equipmentId}`,
                    icon: '🔧',
                    createdAt: new Date().toISOString(),
                }));
        } catch (error) {
            log.error({ error }, 'Failed to get maintenance advice');
            return [];
        }
    }

    /**
     * Daily hunting tip
     */
    getDailyTip(): Advice | null {
        // Use date to get consistent tip for the day
        const dayOfYear = Math.floor(
            (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const tipIndex = dayOfYear % HUNTING_TIPS.length;
        const tip = HUNTING_TIPS[tipIndex];

        return {
            id: `tip-${dayOfYear}`,
            type: 'general_tip',
            priority: 'low',
            title: tip.title,
            message: tip.message,
            icon: tip.icon,
            createdAt: new Date().toISOString(),
        };
    }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let instance: ProactiveAdviceEngine | null = null;

export function getProactiveAdviceEngine(): ProactiveAdviceEngine {
    if (!instance) {
        instance = new ProactiveAdviceEngine();
    }
    return instance;
}

export default ProactiveAdviceEngine;
