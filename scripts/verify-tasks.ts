
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto'
});

async function main() {
    try {
        console.log('--- A2A Tasks Verification ---');

        // Check recent tasks with correct column binding
        const resTasks = await pool.query(`
            SELECT id, context_id, status_state, created_at, artifacts
            FROM a2a_tasks
            ORDER BY created_at DESC
            LIMIT 10;
        `);

        console.log(`Found ${resTasks.rowCount} recent tasks:`);
        resTasks.rows.forEach(r => {
            console.log(`[${r.created_at.toISOString()}] ${r.id} | Context: ${r.context_id} | Status: ${r.status_state}`);
            if (r.artifacts && r.artifacts.length > 0) {
                console.log(`   Artifacts: ${JSON.stringify(r.artifacts).substring(0, 100)}...`);
            }
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
