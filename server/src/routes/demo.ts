/**
 * Demo Data Routes — Seed and Clear Mock Data
 */

import { Elysia } from 'elysia';
import { getAllDemoData, getDemoStats } from '../mock/jagd-demo-data.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.http;

export function createDemoRoutes() {
    return new Elysia({ prefix: '/api/v1/demo' })
        .get('/stats', async () => {
            const stats = getDemoStats();
            return { success: true, stats };
        })
        .post('/seed', async ({ set }) => {
            try {
                const data = getAllDemoData();

                // In a full implementation, this would insert into the database
                // For now, we store in memory and return the data
                logger.info('Seeding demo data');

                return {
                    success: true,
                    message: 'Demo-Daten wurden geladen',
                    stats: getDemoStats(),
                    data,
                };
            } catch (error) {
                logger.error({ error }, 'Failed to seed demo data');
                set.status = 500;
                return { success: false, error: 'Failed to seed demo data' };
            }
        })
        .delete('/clear', async ({ set }) => {
            try {
                // In a full implementation, this would clear demo data from database
                logger.info('Clearing demo data');

                return {
                    success: true,
                    message: 'Demo-Daten wurden gelöscht',
                };
            } catch (error) {
                logger.error({ error }, 'Failed to clear demo data');
                set.status = 500;
                return { success: false, error: 'Failed to clear demo data' };
            }
        })
        .get('/sessions', async () => {
            const data = getAllDemoData();
            return { success: true, sessions: data.sessions };
        })
        .get('/events', async () => {
            const data = getAllDemoData();
            return { success: true, events: data.events };
        })
        .get('/feed', async () => {
            const data = getAllDemoData();
            return { success: true, posts: data.feedPosts };
        })
        .get('/pack-events', async () => {
            const data = getAllDemoData();
            return { success: true, events: data.packEvents };
        })
        .get('/equipment', async () => {
            const data = getAllDemoData();
            return { success: true, equipment: data.equipment };
        });
}

export default createDemoRoutes;
