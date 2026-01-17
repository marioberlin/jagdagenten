/**
 * Run SQL migration
 */
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto';

async function runMigration() {
    const pool = new Pool({ connectionString });

    try {
        const sqlPath = join(import.meta.dir, '../sql/006_admin_console.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('[Migration] Running 006_admin_console.sql...');
        await pool.query(sql);
        console.log('[Migration] ✅ Success!');
    } catch (error) {
        console.error('[Migration] ❌ Error:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
