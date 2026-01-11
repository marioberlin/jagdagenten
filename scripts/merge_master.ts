import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Merge Master Utility
 * Validates parallel specialist merges for file-level conflicts and regression.
 */

const projectRoot = process.cwd();

interface FileChange {
    file: string;
    specialist: string;
}

function getGitChanges(specialistBranch: string): string[] {
    try {
        const output = execSync(`git diff --name-only main...${specialistBranch}`, { encoding: 'utf8' });
        return output.split('\n').filter(Boolean);
    } catch (e) {
        console.error(`[MergeMaster] Error fetching changes for branch ${specialistBranch}`);
        return [];
    }
}

function checkConflicts(branchA: string, branchB: string) {
    console.log(`\n--- Comparing Specialist Braches ---`);
    console.log(`Branch A: ${branchA}`);
    console.log(`Branch B: ${branchB}`);

    const changesA = getGitChanges(branchA);
    const changesB = getGitChanges(branchB);

    const common = changesA.filter(f => changesB.includes(f));

    if (common.length > 0) {
        console.warn(`\n[WARNING] Semantic Conflict Detected!`);
        console.warn(`Both specialists modified the following files:`);
        common.forEach(f => console.log(` - ${f}`));
        return false;
    }

    console.log(`\n[SUCCESS] No file-level conflicts detected.`);
    return true;
}

function runVerification() {
    console.log(`\n--- Running Full Regression Suite ---`);
    try {
        execSync('bun test', { stdio: 'inherit' });
        console.log(`\n[SUCCESS] All tests passed post-merge.`);
        return true;
    } catch (e) {
        console.error(`\n[FAILURE] Tests failed after merge. Rollback recommended.`);
        return false;
    }
}

// Simple CLI usage
const [, , action, arg1, arg2] = process.argv;

switch (action) {
    case 'check':
        if (!arg1 || !arg2) {
            console.error('Usage: bun scripts/merge_master.ts check [branchA] [branchB]');
            process.exit(1);
        }
        const safe = checkConflicts(arg1, arg2);
        process.exit(safe ? 0 : 1);
        break;
    case 'verify':
        const passed = runVerification();
        process.exit(passed ? 0 : 1);
        break;
    default:
        console.log('Merge Master');
        console.log('Usage: bun scripts/merge_master.ts [check|verify] [args]');
}
