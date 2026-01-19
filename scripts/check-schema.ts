
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto'
});

async function main() {
    try {
        console.log('--- Media Artifacts Schema ---');
        const resCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'media_artifacts';
        `);
        console.log(resCols.rows.map(r => `${r.column_name}(${r.data_type})`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
