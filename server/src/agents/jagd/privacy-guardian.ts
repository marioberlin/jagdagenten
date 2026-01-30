/**
 * Privacy Guardian Implementation
 *
 * Enforces privacy rules: geo blurring, time delays, weapon redaction,
 * and k-threshold checks for aggregations.
 */

import type { GeoScope } from '@jagdagenten/types-jagd';
import type { AgentContext, GuardrailResult } from './types.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.agents;

// ============================================================================
// Types
// ============================================================================

export interface TimelineEvent {
    id: string;
    time: string;
    eventType: string;
    data: Record<string, unknown>;
    geo?: GeoScope;
}

export interface Aggregation {
    type: string;
    count: number;
    items: unknown[];
}

// ============================================================================
// Privacy Guardian Class
// ============================================================================

export class PrivacyGuardian {
    /**
     * Apply geo blurring based on target visibility mode.
     */
    applyGeoBlur(geo: GeoScope, targetMode: 'public' | 'team' | 'private'): GeoScope {
        if (targetMode === 'private') {
            // Private mode: keep as-is
            return geo;
        }

        if (targetMode === 'team') {
            // Team mode: allow coarse_grid
            if (geo.mode === 'precise') {
                logger.info({ originalMode: geo.mode }, 'Downgrading geo to coarse_grid for team');
                return {
                    mode: 'coarse_grid',
                    gridId: this.calculateGridId(geo.lat!, geo.lon!),
                    blurMeters: 1000,
                };
            }
            return geo;
        }

        // Public mode: always coarse_grid with blur
        if (geo.mode === 'precise' || geo.mode === 'coarse_grid') {
            logger.info({ originalMode: geo.mode }, 'Downgrading geo to coarse_grid for public');
            return {
                mode: 'coarse_grid',
                gridId: geo.gridId || this.calculateGridId(geo.lat!, geo.lon!),
                blurMeters: Math.max(geo.blurMeters || 0, 2000),
            };
        }

        return geo;
    }

    /**
     * Apply time delay for public events.
     */
    applyTimeDelay(event: TimelineEvent, hours: number = 24): TimelineEvent {
        const originalTime = new Date(event.time);
        const delayedTime = new Date(originalTime.getTime() + hours * 60 * 60 * 1000);

        logger.info({ eventId: event.id, delayHours: hours }, 'Applied time delay to event');

        return {
            ...event,
            time: delayedTime.toISOString(),
            data: {
                ...event.data,
                _originalTime: event.time,
                _delayApplied: hours,
            },
        };
    }

    /**
     * Redact weapon serial numbers and sensitive details.
     */
    redactWeaponSerials(data: Record<string, unknown>): Record<string, unknown> {
        const redacted = { ...data };
        const sensitiveKeys = ['serialNumber', 'serial', 'wknr', 'waffenNummer', 'weaponSerial'];

        const redactRecursive = (obj: Record<string, unknown>): Record<string, unknown> => {
            const result: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                    result[key] = '[REDACTED]';
                    logger.info({ key }, 'Redacted sensitive weapon data');
                } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                    result[key] = redactRecursive(value as Record<string, unknown>);
                } else if (Array.isArray(value)) {
                    result[key] = value.map(item =>
                        typeof item === 'object' && item !== null
                            ? redactRecursive(item as Record<string, unknown>)
                            : item
                    );
                } else {
                    result[key] = value;
                }
            }

            return result;
        };

        return redactRecursive(redacted);
    }

    /**
     * Check if aggregation meets k-threshold for anonymity.
     */
    checkKThreshold(aggregation: Aggregation, k: number = 10): boolean {
        const passed = aggregation.count >= k;

        if (!passed) {
            logger.warn(
                { type: aggregation.type, count: aggregation.count, required: k },
                'K-threshold check failed'
            );
        }

        return passed;
    }

    /**
     * Run all privacy guardrails on a payload.
     */
    enforcePrivacy(
        data: Record<string, unknown>,
        context: AgentContext,
        targetScope: 'public' | 'team' | 'private'
    ): GuardrailResult {
        const redactions: string[] = [];
        let transformedData = { ...data };

        // Redact weapon serials for any non-private scope
        if (targetScope !== 'private') {
            transformedData = this.redactWeaponSerials(transformedData);
            redactions.push('weapon_serials');
        }

        // Apply geo blur
        if (transformedData.geo && typeof transformedData.geo === 'object') {
            const originalGeo = transformedData.geo as GeoScope;
            const blurredGeo = this.applyGeoBlur(originalGeo, targetScope);
            if (blurredGeo.mode !== originalGeo.mode || blurredGeo.blurMeters !== originalGeo.blurMeters) {
                transformedData.geo = blurredGeo;
                redactions.push('geo_blur');
            }
        }

        return {
            passed: true,
            redactions,
            transformedParams: transformedData,
        };
    }

    /**
     * Calculate grid ID from coordinates (simplified 10km grid).
     */
    private calculateGridId(lat: number, lon: number): string {
        const gridLat = Math.floor(lat * 10) / 10;
        const gridLon = Math.floor(lon * 10) / 10;
        return `G${gridLat.toFixed(1)}_${gridLon.toFixed(1)}`;
    }
}

export default PrivacyGuardian;
