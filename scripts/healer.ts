import fs from 'fs';
import path from 'path';

/**
 * Healing Orchestrator
 * Converts entries in healing_queue.json into Ralph PRDs.
 */

const projectRoot = process.cwd();
const queuePath = fs.existsSync(path.join(projectRoot, 'healing_queue.json'))
    ? path.join(projectRoot, 'healing_queue.json')
    : path.join(projectRoot, 'server', 'healing_queue.json');
const prdPath = path.join(projectRoot, 'prd.json');

interface HealingTask {
    id: string;
    type: string;
    message: string;
    stack?: string;
    context: Record<string, unknown>;
    timestamp: string;
}

function processQueue() {
    if (!fs.existsSync(queuePath)) {
        console.log('[Healer] No queue found.');
        return;
    }

    const queue: HealingTask[] = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

    if (queue.length === 0) {
        console.log('[Healer] Queue is empty.');
        return;
    }

    // Take the first task (highest priority in next version)
    const task = queue.shift()!;
    console.log(`[Healer] Processing task ${task.id}: "${task.message}"`);

    const healingPRD = {
        projectName: `Self-Heal: ${task.context.componentName || 'Unknown'} - ${task.id}`,
        branchName: `fix/self-heal-${task.id}`,
        stories: [
            {
                id: `FIX-${task.id}`,
                title: `Fix error in ${task.context.componentName || 'component'}`,
                priority: "high",
                status: "pending",
                passes: false,
                acceptanceCriteria: [
                    `Resolve the error: "${task.message}"`,
                    `Prevent regression in ${task.context.componentName}`,
                    `Component must pass its respective tests after fix`
                ]
            }
        ]
    };

    // Backup current PRD if it exists
    if (fs.existsSync(prdPath)) {
        const backupPath = path.join(projectRoot, `prd.backup-${Date.now()}.json`);
        fs.copyFileSync(prdPath, backupPath);
        console.log(`[Healer] Backed up current prd.json to ${path.basename(backupPath)}`);
    }

    // Write the healing PRD
    fs.writeFileSync(prdPath, JSON.stringify(healingPRD, null, 2));

    // Update queue
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));

    console.log(`\n[Healer] SUCCESS: Healing PRD generated for ${task.id}.`);
    console.log(`[Healer] Error Context:`);
    console.log(`- Message: ${task.message}`);
    console.log(`- Component: ${task.context.componentName}`);
    console.log(`- URL: ${task.context.url}`);
    console.log(`\n[Healer] Next Step: Run 'bun scripts/ralph_runner.ts status' to begin the healing loop.`);
}

processQueue();
