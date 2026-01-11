import fs from 'fs';
import path from 'path';

/**
 * Ralph Runner Utility
 * Manages the state of the PRD for the autonomous loop.
 */

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, '..');
const prdPath = path.join(projectRoot, 'prd.json');
const progressPath = path.join(projectRoot, 'progress.txt');
const archiveDir = path.join(projectRoot, 'archive');
const lastBranchPath = path.join(scriptDir, '.last-branch');

interface UserStory {
    id: string;
    title: string;
    priority: number | string;
    passes: boolean;
    acceptanceCriteria: string[];
}

interface PRD {
    branchName: string;
    stories?: UserStory[];
    userStories?: UserStory[];
}

function getPriorityValue(priority: number | string): number {
    if (typeof priority === 'number') return priority;
    const map: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return map[priority.toLowerCase()] || 0;
}

function loadPRD(): PRD {
    if (!fs.existsSync(prdPath)) {
        console.error('Error: prd.json not found in project root.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(prdPath, 'utf8'));
}

function savePRD(prd: PRD) {
    fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2));
}

function getStories(prd: PRD): UserStory[] {
    return prd.stories || prd.userStories || [];
}

function getPendingStory(prd: PRD): UserStory | null {
    const stories = getStories(prd);
    return stories
        .filter(s => !s.passes)
        .sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority))[0] || null;
}

function status() {
    const prd = loadPRD();
    const stories = getStories(prd);
    const pending = stories.filter(s => !s.passes);
    const completed = stories.filter(s => s.passes);

    console.log(`\n--- Ralph Status ---`);
    console.log(`Branch: ${prd.branchName}`);
    console.log(`Progress: ${completed.length} / ${stories.length} stories complete`);

    if (pending.length > 0) {
        const next = getPendingStory(prd);
        console.log(`\nNext Story: [${next?.id}] ${next?.title}`);
    } else {
        console.log(`\nCOMPLETE: All stories pass!`);
    }
}

function markPass(id: string) {
    const prd = loadPRD();
    const stories = getStories(prd);
    const story = stories.find(s => s.id === id);
    if (!story) {
        console.error(`Error: Story with ID "${id}" not found.`);
        process.exit(1);
    }
    story.passes = true;
    savePRD(prd);
    console.log(`Success: Story [${id}] marked as passes: true.`);
}

function initProgress() {
    if (!fs.existsSync(progressPath) || fs.readFileSync(progressPath, 'utf8').trim() === '') {
        const header = `## Codebase Patterns\n- (New project: No patterns identified yet)\n\n---\n\n# Ralph Progress Log\nStarted: ${new Date().toLocaleString()}\n---\n\n`;
        fs.writeFileSync(progressPath, header);
        console.log('Initialized progress.txt with Codebase Patterns header.');
    }
}

function archive() {
    if (!fs.existsSync(prdPath)) return;
    const prd = loadPRD();
    const currentBranch = prd.branchName || 'unknown-feature';

    let lastBranch = '';
    if (fs.existsSync(lastBranchPath)) {
        lastBranch = fs.readFileSync(lastBranchPath, 'utf8').trim();
    }

    if (lastBranch && lastBranch !== currentBranch) {
        const date = new Date().toISOString().split('T')[0];
        const folderName = `${date}-${lastBranch.replace(/^ralph\//, '')}`;
        const targetDir = path.join(archiveDir, folderName);

        console.log(`Archiving previous run: ${lastBranch} -> ${folderName}`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        if (fs.existsSync(prdPath)) fs.copyFileSync(prdPath, path.join(targetDir, 'prd.json'));
        if (fs.existsSync(progressPath)) fs.copyFileSync(progressPath, path.join(targetDir, 'progress.txt'));

        // Reset progress for new feature
        const header = `## Codebase Patterns\n- (Carried over from ${lastBranch}:)\n\n---\n\n# Ralph Progress Log\nRestarted for: ${currentBranch}\n---\n\n`;
        fs.writeFileSync(progressPath, header);
    }

    fs.writeFileSync(lastBranchPath, currentBranch);
}

// CLI Routing
const [, , command, arg] = process.argv;

switch (command) {
    case 'status':
        status();
        break;
    case 'next':
        const prd = loadPRD();
        const next = getPendingStory(prd);
        if (next) {
            console.log(next.id);
        } else {
            console.log('NONE');
        }
        break;
    case 'pass':
        if (!arg) {
            console.error('Usage: bun scripts/ralph_runner.ts pass [id]');
            process.exit(1);
        }
        markPass(arg);
        break;
    case 'init':
        initProgress();
        break;
    case 'archive':
        archive();
        break;
    default:
        console.log('Ralph Runner');
        console.log('Usage: bun scripts/ralph_runner.ts [status|next|pass|init|archive]');
}
