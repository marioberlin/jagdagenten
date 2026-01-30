/**
 * Maintenance Scheduler
 *
 * Equipment maintenance reminder service.
 * Features:
 * - Track maintenance schedules per equipment type
 * - Generate reminders based on usage and time
 * - Integration with quartermaster routes
 */

import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.db;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaintenanceSchedule {
    id: string;
    equipmentId: string;
    equipmentName: string;
    equipmentType: 'weapon' | 'optic' | 'silencer' | 'accessory';
    maintenanceType: MaintenanceType;
    lastPerformed: string | null;
    nextDue: string;
    intervalDays: number | null;
    intervalRounds: number | null;
    currentRounds: number;
    status: 'ok' | 'due_soon' | 'overdue';
}

export type MaintenanceType =
    | 'barrel_cleaning'      // After X rounds
    | 'silencer_drying'      // After each use
    | 'optic_check'          // Annual
    | 'gunsmith_service'     // Per manufacturer
    | 'general_cleaning'     // Regular
    | 'storage_check';       // Periodic

export interface MaintenanceReminder {
    scheduleId: string;
    equipmentId: string;
    equipmentName: string;
    maintenanceType: MaintenanceType;
    daysOverdue: number;
    message: string;
    priority: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
    barrel_cleaning: 'Laufreinigung',
    silencer_drying: 'Schalldämpfer trocknen',
    optic_check: 'Optik-Kontrolle',
    gunsmith_service: 'Büchsenmacher-Service',
    general_cleaning: 'Allgemeine Reinigung',
    storage_check: 'Lagerungskontrolle',
};

const DEFAULT_INTERVALS: Record<MaintenanceType, { days?: number; rounds?: number }> = {
    barrel_cleaning: { rounds: 75 },          // Every 50-100 rounds
    silencer_drying: { days: 1 },             // After each use (check daily)
    optic_check: { days: 365 },               // Annual
    gunsmith_service: { days: 730 },          // Every 2 years
    general_cleaning: { days: 30 },           // Monthly
    storage_check: { days: 90 },              // Quarterly
};

// ---------------------------------------------------------------------------
// MaintenanceScheduler Class
// ---------------------------------------------------------------------------

export class MaintenanceScheduler {
    /**
     * Get all maintenance schedules for a user
     */
    async getSchedules(userId: string): Promise<MaintenanceSchedule[]> {
        try {
            const sql = `
                SELECT 
                    ms.id,
                    ms.equipment_id,
                    e.name as equipment_name,
                    e.item_type as equipment_type,
                    ms.maintenance_type,
                    ms.last_performed,
                    ms.next_due,
                    ms.interval_days,
                    ms.interval_rounds,
                    COALESCE(
                        (SELECT SUM(rounds_used) FROM ammo_logs WHERE equipment_id = e.id AND logged_at > ms.last_performed),
                        0
                    ) as current_rounds
                FROM maintenance_schedules ms
                JOIN equipment e ON e.id = ms.equipment_id
                WHERE e.user_id = $1
                ORDER BY ms.next_due ASC
            `;

            const result = await query(sql, [userId]);
            const now = new Date();

            return result.rows.map((row) => {
                const nextDue = new Date(row.next_due);
                const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                let status: MaintenanceSchedule['status'] = 'ok';
                if (daysUntilDue < 0) status = 'overdue';
                else if (daysUntilDue < 7) status = 'due_soon';

                // Check rounds-based maintenance
                if (row.interval_rounds && row.current_rounds >= row.interval_rounds) {
                    status = 'overdue';
                } else if (row.interval_rounds && row.current_rounds >= row.interval_rounds * 0.8) {
                    status = 'due_soon';
                }

                return {
                    id: row.id,
                    equipmentId: row.equipment_id,
                    equipmentName: row.equipment_name,
                    equipmentType: row.equipment_type,
                    maintenanceType: row.maintenance_type,
                    lastPerformed: row.last_performed,
                    nextDue: row.next_due,
                    intervalDays: row.interval_days,
                    intervalRounds: row.interval_rounds,
                    currentRounds: parseInt(row.current_rounds) || 0,
                    status,
                };
            });
        } catch (error) {
            log.error({ error }, 'Failed to get maintenance schedules');
            return [];
        }
    }

    /**
     * Get pending reminders for a user
     */
    async getReminders(userId: string): Promise<MaintenanceReminder[]> {
        const schedules = await this.getSchedules(userId);
        const reminders: MaintenanceReminder[] = [];
        const now = new Date();

        for (const schedule of schedules) {
            if (schedule.status === 'ok') continue;

            const nextDue = new Date(schedule.nextDue);
            const daysOverdue = Math.ceil((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));

            const label = MAINTENANCE_LABELS[schedule.maintenanceType];
            let message: string;
            let priority: MaintenanceReminder['priority'];

            if (daysOverdue > 30) {
                message = `${label} für ${schedule.equipmentName} ist seit ${daysOverdue} Tagen überfällig!`;
                priority = 'high';
            } else if (daysOverdue > 0) {
                message = `${label} für ${schedule.equipmentName} ist fällig.`;
                priority = 'medium';
            } else {
                message = `${label} für ${schedule.equipmentName} in ${Math.abs(daysOverdue)} Tagen.`;
                priority = 'low';
            }

            reminders.push({
                scheduleId: schedule.id,
                equipmentId: schedule.equipmentId,
                equipmentName: schedule.equipmentName,
                maintenanceType: schedule.maintenanceType,
                daysOverdue,
                message,
                priority,
            });
        }

        // Sort by priority (high first)
        return reminders.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Mark maintenance as completed
     */
    async markCompleted(scheduleId: string): Promise<boolean> {
        try {
            const now = new Date().toISOString();

            // Get current schedule to calculate next due date
            const scheduleResult = await query(
                'SELECT interval_days FROM maintenance_schedules WHERE id = $1',
                [scheduleId]
            );

            if (scheduleResult.rows.length === 0) return false;

            const intervalDays = scheduleResult.rows[0].interval_days || 30;
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + intervalDays);

            await query(
                `UPDATE maintenance_schedules 
                 SET last_performed = $1, next_due = $2 
                 WHERE id = $3`,
                [now, nextDue.toISOString(), scheduleId]
            );

            log.info({ scheduleId }, 'Maintenance marked as completed');
            return true;
        } catch (error) {
            log.error({ error, scheduleId }, 'Failed to mark maintenance completed');
            return false;
        }
    }

    /**
     * Create default maintenance schedules for new equipment
     */
    async createDefaultSchedules(equipmentId: string, equipmentType: string): Promise<void> {
        const now = new Date();
        const schedules: Array<{ type: MaintenanceType; intervalDays: number | null; intervalRounds: number | null }> = [];

        if (equipmentType === 'weapon') {
            schedules.push(
                { type: 'barrel_cleaning', intervalDays: null, intervalRounds: 75 },
                { type: 'general_cleaning', intervalDays: 30, intervalRounds: null },
                { type: 'gunsmith_service', intervalDays: 730, intervalRounds: null }
            );
        } else if (equipmentType === 'optic') {
            schedules.push(
                { type: 'optic_check', intervalDays: 365, intervalRounds: null }
            );
        } else if (equipmentType === 'silencer') {
            schedules.push(
                { type: 'silencer_drying', intervalDays: 1, intervalRounds: null }
            );
        }

        for (const sched of schedules) {
            const nextDue = new Date();
            if (sched.intervalDays) {
                nextDue.setDate(nextDue.getDate() + sched.intervalDays);
            } else {
                nextDue.setDate(nextDue.getDate() + 30); // Default 30 days for rounds-based
            }

            try {
                await query(
                    `INSERT INTO maintenance_schedules 
                     (id, equipment_id, maintenance_type, interval_days, interval_rounds, next_due, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        crypto.randomUUID(),
                        equipmentId,
                        sched.type,
                        sched.intervalDays,
                        sched.intervalRounds,
                        nextDue.toISOString(),
                        now.toISOString(),
                    ]
                );
            } catch (error) {
                log.error({ error, equipmentId, type: sched.type }, 'Failed to create maintenance schedule');
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let instance: MaintenanceScheduler | null = null;

export function getMaintenanceScheduler(): MaintenanceScheduler {
    if (!instance) {
        instance = new MaintenanceScheduler();
    }
    return instance;
}

export default MaintenanceScheduler;
