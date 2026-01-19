
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto'
});

async function main() {
    try {
        console.log('Connected to DB');

        // List tables
        const resTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('Tables:', resTables.rows.map(r => r.table_name));

        // List migrations
        const resMigrations = await pool.query(`
            SELECT * FROM _migrations ORDER BY id;
        `);
        console.log('Applied Migrations:', resMigrations.rows.map(r => r.name));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
