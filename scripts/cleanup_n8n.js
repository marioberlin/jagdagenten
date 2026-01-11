
const API_KEY = process.argv[2];
const BASE_URL = process.argv[3] || 'http://localhost:5678/api/v1';

if (!API_KEY) {
    console.error("Usage: node cleanup_n8n.js <API_KEY> [BASE_URL]");
    process.exit(1);
}

const PROTECTED_IDS = [
    'zv6Sx2jMMTGYGdf8', // Trading Master
    'yDmXITAFTOLeVL7Q', // Trade Execution
    '1JJVbvS3beInJtqg', // Strategy Agent
    'UAqLtYYKf65isjIV', // Webhook Handler
    'XfB3OLD7UzpbrXct', // Binance Assets
    'yGLOhGIuCmlk9FbL', // Market Data
    'XZKiTww934UPgFOK', // Postgres Sync
    '28nGIwBle7qUF378', // Directus Collections
    '18TSM8jpEZIivtvl', // TaskManagement
    'zdKfTkRPOFI5kVuy', // ImageGen
    'xKPhMSUQe2DRfP5h', // VideoGen
    '1TwdVW00oqij85pz', // AI Image Gen
    'zaN7bDDfOFnBhGg7', // Google Sheet Subflow
    'zWTJzOSmgA1dVef6', // Text2Image
    'UcrFd9F212iQXqby', // AudioAgent
    'SqWmGDg5dwxdb3LM', // Bot Integration Manager
    'wzbie8FAsFde9FPE', // Telegram Chatbot
    'CZfgAWMbZoeM252h'  // Migration
];

async function main() {
    try {
        console.log("Fetching all workflows...");
        let allWorkflows = [];
        let cursor = null;

        do {
            const url = `${BASE_URL}/workflows?limit=100${cursor ? `&cursor=${cursor}` : ''}`;
            const response = await fetch(url, { headers: { 'X-N8N-API-KEY': API_KEY } });

            if (!response.ok) {
                console.error(`Error fetching workflows: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(text);
                break;
            }

            const data = await response.json();

            if (!data.data) {
                console.error("Error fetching workflows: data field missing", data);
                break;
            }

            allWorkflows = allWorkflows.concat(data.data);
            cursor = data.nextCursor;
        } while (cursor);

        console.log(`Found ${allWorkflows.length} total workflows.`);

        const workflowsToDelete = allWorkflows.filter(w => {
            const isProtected = PROTECTED_IDS.includes(w.id);
            if (isProtected) return false;

            // Delete "My workflow X" or "Untitled"
            // Check strict patterns to avoid accidents
            if (w.name === "Untitled") return true;
            if (w.name.startsWith("My workflow")) return true;

            return false;
        });

        console.log(`Identified ${workflowsToDelete.length} 'Junk' workflows to delete.`);

        if (workflowsToDelete.length === 0) {
            console.log("No workflows to delete.");
            return;
        }

        console.log("Starting deletion...");

        for (const w of workflowsToDelete) {
            console.log(`Deleting ${w.name} (${w.id})...`);
            const delUrl = `${BASE_URL}/workflows/${w.id}`;
            const res = await fetch(delUrl, { method: 'DELETE', headers: { 'X-N8N-API-KEY': API_KEY } });
            if (res.ok) {
                console.log(`✅ Deleted ${w.id}`);
            } else {
                console.error(`❌ Failed to delete ${w.id}: ${res.statusText}`);
            }
            // Small delay to be nice to the server
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log("Cleanup complete!");

    } catch (error) {
        console.error("Script failed:", error);
    }
}

main();
