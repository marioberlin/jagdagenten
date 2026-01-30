/**
 * EmergencyBeacon
 *
 * Safety feature for solo hunters with motion detection.
 * - Monitors device motion/orientation
 * - Triggers after configured inactivity period
 * - Shows confirmation prompt before sending alert
 * - Sends emergency notification to pack members
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmergencyBeaconConfig {
    /** Inactivity timeout in minutes before triggering alert */
    inactivityTimeoutMinutes: number;
    /** Motion threshold to detect activity (m/s²) */
    motionThreshold: number;
    /** Pack ID to send alerts to */
    packId: string;
    /** Current user's member ID */
    memberId: string;
    /** Current user's name */
    memberName: string;
}

export interface EmergencyBeaconState {
    isActive: boolean;
    lastMotionTime: number;
    currentPosition: GeolocationPosition | null;
    alertTriggered: boolean;
    alertConfirmed: boolean;
}

type BeaconEventType =
    | 'activated'
    | 'deactivated'
    | 'motion_detected'
    | 'inactivity_warning'
    | 'alert_triggered'
    | 'alert_sent'
    | 'alert_cancelled'
    | 'error';

type BeaconEventHandler = (event: BeaconEventType, data?: unknown) => void;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Partial<EmergencyBeaconConfig> = {
    inactivityTimeoutMinutes: 30,
    motionThreshold: 0.5, // m/s²
};

const CHECK_INTERVAL_MS = 60000; // Check every minute
const WARNING_MINUTES_BEFORE = 5; // Warn 5 minutes before alert

// ---------------------------------------------------------------------------
// EmergencyBeacon Class
// ---------------------------------------------------------------------------

export class EmergencyBeacon {
    private config: EmergencyBeaconConfig;
    private state: EmergencyBeaconState;
    private checkIntervalId: ReturnType<typeof setInterval> | null = null;
    private positionWatchId: number | null = null;
    private eventHandler: BeaconEventHandler | null = null;

    constructor(config: EmergencyBeaconConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config } as EmergencyBeaconConfig;
        this.state = {
            isActive: false,
            lastMotionTime: Date.now(),
            currentPosition: null,
            alertTriggered: false,
            alertConfirmed: false,
        };
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Register event handler for beacon events
     */
    onEvent(handler: BeaconEventHandler): void {
        this.eventHandler = handler;
    }

    /**
     * Activate the emergency beacon
     */
    activate(): boolean {
        if (this.state.isActive) return true;

        // Check for required APIs
        if (!('DeviceMotionEvent' in window)) {
            this.emit('error', { message: 'DeviceMotionEvent not supported' });
            return false;
        }

        if (!('geolocation' in navigator)) {
            this.emit('error', { message: 'Geolocation not supported' });
            return false;
        }

        // Request permissions (iOS 13+ requires explicit permission)
        this.requestPermissions().then((granted) => {
            if (!granted) {
                this.emit('error', { message: 'Motion permission denied' });
                return;
            }

            // Start motion detection
            window.addEventListener('devicemotion', this.handleMotion);

            // Start position tracking
            this.positionWatchId = navigator.geolocation.watchPosition(
                (pos) => {
                    this.state.currentPosition = pos;
                },
                (err) => {
                    this.emit('error', { message: `Geolocation error: ${err.message}` });
                },
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
            );

            // Start inactivity check interval
            this.checkIntervalId = setInterval(
                () => this.checkInactivity(),
                CHECK_INTERVAL_MS
            );

            this.state.isActive = true;
            this.state.lastMotionTime = Date.now();
            this.emit('activated');
        });

        return true;
    }

    /**
     * Deactivate the emergency beacon
     */
    deactivate(): void {
        if (!this.state.isActive) return;

        // Remove motion listener
        window.removeEventListener('devicemotion', this.handleMotion);

        // Clear position watch
        if (this.positionWatchId !== null) {
            navigator.geolocation.clearWatch(this.positionWatchId);
            this.positionWatchId = null;
        }

        // Clear check interval
        if (this.checkIntervalId !== null) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }

        this.state.isActive = false;
        this.state.alertTriggered = false;
        this.state.alertConfirmed = false;
        this.emit('deactivated');
    }

    /**
     * User confirms they're OK (cancels pending alert)
     */
    confirmOk(): void {
        this.state.lastMotionTime = Date.now();
        this.state.alertTriggered = false;
        this.state.alertConfirmed = false;
        this.emit('alert_cancelled');
    }

    /**
     * User confirms emergency (sends alert immediately)
     */
    confirmEmergency(): void {
        this.state.alertConfirmed = true;
        this.sendEmergencyAlert();
    }

    /**
     * Get current beacon state
     */
    getState(): Readonly<EmergencyBeaconState> {
        return { ...this.state };
    }

    /**
     * Get minutes until alert triggers
     */
    getMinutesUntilAlert(): number {
        const elapsed = Date.now() - this.state.lastMotionTime;
        const remaining =
            this.config.inactivityTimeoutMinutes * 60000 - elapsed;
        return Math.max(0, Math.ceil(remaining / 60000));
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private emit(event: BeaconEventType, data?: unknown): void {
        this.eventHandler?.(event, data);
    }

    private handleMotion = (event: DeviceMotionEvent): void => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        // Calculate total acceleration magnitude (subtract gravity)
        const magnitude = Math.sqrt(
            (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
        );

        // Subtract gravity (~9.8 m/s²) and check threshold
        const netAcceleration = Math.abs(magnitude - 9.8);

        if (netAcceleration > this.config.motionThreshold) {
            this.state.lastMotionTime = Date.now();
            this.state.alertTriggered = false;
            this.emit('motion_detected', { acceleration: netAcceleration });
        }
    };

    private checkInactivity(): void {
        const elapsedMinutes =
            (Date.now() - this.state.lastMotionTime) / 60000;
        const timeoutMinutes = this.config.inactivityTimeoutMinutes;

        // Warning before alert
        if (
            elapsedMinutes >= timeoutMinutes - WARNING_MINUTES_BEFORE &&
            !this.state.alertTriggered
        ) {
            this.state.alertTriggered = true;
            this.emit('inactivity_warning', {
                minutesRemaining: WARNING_MINUTES_BEFORE,
            });
        }

        // Trigger alert
        if (elapsedMinutes >= timeoutMinutes && this.state.alertTriggered) {
            this.emit('alert_triggered');
            // Auto-send after additional 2 minutes without confirmation
            setTimeout(() => {
                if (this.state.alertTriggered && !this.state.alertConfirmed) {
                    this.sendEmergencyAlert();
                }
            }, 2 * 60000);
        }
    }

    private async sendEmergencyAlert(): Promise<void> {
        try {
            const position = this.state.currentPosition;
            const location = position
                ? {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }
                : undefined;

            const response = await fetch(
                `/api/v1/jagd/packs/${this.config.packId}/alerts`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'medical',
                        message: `NOTFALL: ${this.config.memberName} reagiert nicht seit ${this.config.inactivityTimeoutMinutes} Minuten.`,
                        senderName: this.config.memberName,
                        senderId: this.config.memberId,
                        location,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to send alert');
            }

            this.emit('alert_sent', { location });
        } catch (error) {
            this.emit('error', { message: (error as Error).message });
        }
    }

    private async requestPermissions(): Promise<boolean> {
        // iOS 13+ requires explicit permission for DeviceMotionEvent
        if (
            typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
                .requestPermission === 'function'
        ) {
            try {
                const permission = await (
                    DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
                ).requestPermission();
                return permission === 'granted';
            } catch {
                return false;
            }
        }
        // Permission not required on other platforms
        return true;
    }
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseEmergencyBeaconOptions {
    packId: string;
    memberId: string;
    memberName: string;
    inactivityTimeoutMinutes?: number;
    motionThreshold?: number;
    onEvent?: BeaconEventHandler;
}

export interface UseEmergencyBeaconReturn {
    isActive: boolean;
    isWarning: boolean;
    minutesRemaining: number;
    activate: () => void;
    deactivate: () => void;
    confirmOk: () => void;
    confirmEmergency: () => void;
}

export function useEmergencyBeacon(
    options: UseEmergencyBeaconOptions
): UseEmergencyBeaconReturn {
    const beaconRef = useRef<EmergencyBeacon | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    const [minutesRemaining, setMinutesRemaining] = useState(
        options.inactivityTimeoutMinutes ?? 30
    );

    // Initialize beacon
    useEffect(() => {
        beaconRef.current = new EmergencyBeacon({
            packId: options.packId,
            memberId: options.memberId,
            memberName: options.memberName,
            inactivityTimeoutMinutes: options.inactivityTimeoutMinutes ?? 30,
            motionThreshold: options.motionThreshold ?? 0.5,
        });

        beaconRef.current.onEvent((event, data) => {
            options.onEvent?.(event, data);

            switch (event) {
                case 'activated':
                    setIsActive(true);
                    break;
                case 'deactivated':
                    setIsActive(false);
                    setIsWarning(false);
                    break;
                case 'inactivity_warning':
                    setIsWarning(true);
                    break;
                case 'alert_cancelled':
                    setIsWarning(false);
                    break;
                case 'motion_detected':
                    setIsWarning(false);
                    break;
            }
        });

        return () => {
            beaconRef.current?.deactivate();
        };
    }, [options.packId, options.memberId, options.memberName]);

    // Update minutes remaining
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const remaining = beaconRef.current?.getMinutesUntilAlert() ?? 0;
            setMinutesRemaining(remaining);
        }, 10000);

        return () => clearInterval(interval);
    }, [isActive]);

    const activate = useCallback(() => {
        beaconRef.current?.activate();
    }, []);

    const deactivate = useCallback(() => {
        beaconRef.current?.deactivate();
    }, []);

    const confirmOk = useCallback(() => {
        beaconRef.current?.confirmOk();
    }, []);

    const confirmEmergency = useCallback(() => {
        beaconRef.current?.confirmEmergency();
    }, []);

    return {
        isActive,
        isWarning,
        minutesRemaining,
        activate,
        deactivate,
        confirmOk,
        confirmEmergency,
    };
}

export default EmergencyBeacon;
