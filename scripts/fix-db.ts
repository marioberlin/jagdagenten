
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto'
});

async function main() {
    try {
        console.log('Applying missing schemas...');

        // 1. Apply 003_sandbox_system.sql
        console.log('Applying 003_sandbox_system.sql...');
        const sql003 = readFileSync(join(process.cwd(), 'server/sql/003_sandbox_system.sql'), 'utf-8');
        await pool.query(sql003);
        console.log('✅ Applied 003');

        // 2. Apply 004_cowork_system.sql
        console.log('Applying 004_cowork_system.sql...');
        const sql004 = readFileSync(join(process.cwd(), 'server/sql/004_cowork_system.sql'), 'utf-8');
        await pool.query(sql004);
        console.log('✅ Applied 004');

    } catch (err) {
        console.error('Error applying schemas:', err);
    } finally {
        await pool.end();
    }
}

main();
