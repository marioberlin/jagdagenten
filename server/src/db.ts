import { Pool } from 'pg';
import { componentLoggers } from './logger';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto',
    max: 20,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    componentLoggers.db?.error({ error: err }, 'Unexpected error on idle client');
});

export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // componentLoggers.db?.debug({ text, duration, rows: res.rowCount }, 'Executed query');
        return res;
    } catch (error) {
        const duration = Date.now() - start;
        componentLoggers.db?.error({ text, duration, error }, 'Query failed');
        throw error;
    }
}
