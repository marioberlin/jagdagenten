
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://liquidcrypto:liquidcrypto_dev@localhost:5432/liquidcrypto'
});

async function main() {
    try {
        console.log('--- Generated Video Artifacts ---');
        const resVideos = await pool.query(`
            SELECT id, destination, condition, status, created_at, metadata
            FROM media_artifacts
            WHERE type = 'video'
            ORDER BY created_at DESC;
        `);

        if (resVideos.rows.length === 0) {
            console.log('No video artifacts found in DB.');
        } else {
            console.table(resVideos.rows.map(r => ({
                id: r.id,
                dest: r.destination,
                cond: r.condition,
                status: r.status,
                created: r.created_at
            })));
        }

        console.log('\n--- Generated Image Artifacts (Summary) ---');
        const resImages = await pool.query(`
            SELECT count(*) as count FROM media_artifacts WHERE type = 'image';
        `);
        console.log(`Total Images: ${resImages.rows[0].count}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
