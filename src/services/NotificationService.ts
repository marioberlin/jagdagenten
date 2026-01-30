/**
 * NotificationService
 *
 * Central notification manager for proactive alerts.
 * Phase F: Proactive Notifications.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationCategory =
    | 'weather'
    | 'document'
    | 'maintenance'
    | 'hunt'
    | 'calendar'
    | 'system';

export interface NotificationPreferences {
    enabled: boolean;
    categories: Record<NotificationCategory, boolean>;
    quietHours: {
        enabled: boolean;
        start: string; // HH:mm
        end: string;   // HH:mm
    };
    maxPerDay: number;
    quietSeasonMode: boolean;
}

export interface ScheduledNotification {
    id: string;
    title: string;
    body: string;
    category: NotificationCategory;
    scheduledFor: Date;
    data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Default Preferences
// ---------------------------------------------------------------------------

export const DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    categories: {
        weather: true,
        document: true,
        maintenance: true,
        hunt: true,
        calendar: true,
        system: true,
    },
    quietHours: {
        enabled: true,
        start: '22:00',
        end: '06:00',
    },
    maxPerDay: 5,
    quietSeasonMode: false,
};

// ---------------------------------------------------------------------------
// Notification Service
// ---------------------------------------------------------------------------

class NotificationServiceClass {
    private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
    private scheduledNotifications: ScheduledNotification[] = [];
    private notificationsSentToday = 0;
    private lastResetDate: string = '';

    constructor() {
        this.loadPreferences();
        this.resetDailyCount();
    }

    // ---------------------------------------------------------------------------
    // Permission
    // ---------------------------------------------------------------------------

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    hasPermission(): boolean {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    // ---------------------------------------------------------------------------
    // Preferences
    // ---------------------------------------------------------------------------

    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    setPreferences(prefs: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        this.savePreferences();
    }

    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem('jagd-notification-prefs');
            if (stored) {
                this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
            }
        } catch {
            console.warn('Failed to load notification preferences');
        }
    }

    private savePreferences(): void {
        try {
            localStorage.setItem('jagd-notification-prefs', JSON.stringify(this.preferences));
        } catch {
            console.warn('Failed to save notification preferences');
        }
    }

    // ---------------------------------------------------------------------------
    // Sending Notifications
    // ---------------------------------------------------------------------------

    async send(
        title: string,
        body: string,
        category: NotificationCategory,
        options?: {
            icon?: string;
            data?: Record<string, unknown>;
            requireInteraction?: boolean;
        }
    ): Promise<boolean> {
        // Check if notifications are enabled
        if (!this.preferences.enabled) return false;
        if (!this.preferences.categories[category]) return false;
        if (!this.hasPermission()) return false;

        // Check quiet hours
        if (this.isQuietTime()) return false;

        // Check daily limit
        if (this.notificationsSentToday >= this.preferences.maxPerDay) return false;

        // Check quiet season mode
        if (this.preferences.quietSeasonMode && category !== 'system') return false;

        try {
            const notification = new Notification(title, {
                body,
                icon: options?.icon || '/icons/jagd-icon.png',
                badge: '/icons/jagd-badge.png',
                tag: `jagd-${category}-${Date.now()}`,
                requireInteraction: options?.requireInteraction || false,
                data: options?.data,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            this.notificationsSentToday++;
            return true;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return false;
        }
    }

    // ---------------------------------------------------------------------------
    // Scheduling
    // ---------------------------------------------------------------------------

    schedule(
        title: string,
        body: string,
        category: NotificationCategory,
        scheduledFor: Date,
        data?: Record<string, unknown>
    ): string {
        const id = `sched-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        this.scheduledNotifications.push({
            id,
            title,
            body,
            category,
            scheduledFor,
            data,
        });

        // Sort by scheduled time
        this.scheduledNotifications.sort(
            (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
        );

        this.saveScheduledNotifications();
        this.processScheduledNotifications();

        return id;
    }

    cancelScheduled(id: string): boolean {
        const index = this.scheduledNotifications.findIndex(n => n.id === id);
        if (index > -1) {
            this.scheduledNotifications.splice(index, 1);
            this.saveScheduledNotifications();
            return true;
        }
        return false;
    }

    getScheduled(): ScheduledNotification[] {
        return [...this.scheduledNotifications];
    }

    private processScheduledNotifications(): void {
        const now = new Date();

        while (this.scheduledNotifications.length > 0) {
            const next = this.scheduledNotifications[0];

            if (next.scheduledFor <= now) {
                this.scheduledNotifications.shift();
                this.send(next.title, next.body, next.category, { data: next.data });
            } else {
                // Schedule next check
                const delay = next.scheduledFor.getTime() - now.getTime();
                setTimeout(() => this.processScheduledNotifications(), Math.min(delay, 60000));
                break;
            }
        }
    }

    private saveScheduledNotifications(): void {
        try {
            const serializable = this.scheduledNotifications.map(n => ({
                ...n,
                scheduledFor: n.scheduledFor.toISOString(),
            }));
            localStorage.setItem('jagd-scheduled-notifications', JSON.stringify(serializable));
        } catch {
            console.warn('Failed to save scheduled notifications');
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private isQuietTime(): boolean {
        if (!this.preferences.quietHours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = this.preferences.quietHours.start.split(':').map(Number);
        const [endH, endM] = this.preferences.quietHours.end.split(':').map(Number);

        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        // Handle overnight quiet hours (e.g., 22:00 - 06:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        }

        return currentTime >= startTime && currentTime < endTime;
    }

    private resetDailyCount(): void {
        const today = new Date().toISOString().split('T')[0];

        if (this.lastResetDate !== today) {
            this.notificationsSentToday = 0;
            this.lastResetDate = today;
        }
    }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const NotificationService = new NotificationServiceClass();

// ---------------------------------------------------------------------------
// Predefined Notification Generators
// ---------------------------------------------------------------------------

export const JagdNotifications = {
    /**
     * Wind shift alert
     */
    windShift: (newDirection: string, expectedTime: string) => {
        NotificationService.send(
            'Windwechsel voraus',
            `Wind dreht auf ${newDirection} um ${expectedTime}. Stand wechseln?`,
            'weather',
            { requireInteraction: true }
        );
    },

    /**
     * Document expiration reminder
     */
    documentExpiring: (documentName: string, daysLeft: number) => {
        NotificationService.send(
            'Dokument läuft ab',
            `${documentName} läuft in ${daysLeft} Tagen ab.`,
            'document'
        );
    },

    /**
     * Zero check reminder
     */
    zeroCheckReminder: (daysSinceLastCheck: number) => {
        NotificationService.send(
            'Einschießkontrolle empfohlen',
            `Letzte Kontrolle vor ${daysSinceLastCheck} Tagen. 2-Minuten Checkliste?`,
            'maintenance',
            { requireInteraction: true }
        );
    },

    /**
     * Prime hunting conditions
     */
    primeConditions: (reason: string) => {
        NotificationService.send(
            'Optimale Jagdbedingungen',
            reason,
            'hunt'
        );
    },

    /**
     * Calendar reminder
     */
    calendarReminder: (eventName: string, timeUntil: string) => {
        NotificationService.send(
            'Jagdtermin',
            `${eventName} in ${timeUntil}`,
            'calendar'
        );
    },
};

export default NotificationService;
