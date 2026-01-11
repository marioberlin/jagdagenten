import { readFileSync } from 'fs';

/**
 * Liquid Glass Design Auditor
 * Triggered via PostToolUse hook to ensure Glass component compliance.
 */
async function runAudit() {
    const filePath = process.env.CLAUDE_EXTERNAL_FILE_MODIFIED;
    if (!filePath) return;

    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;

    const content = readFileSync(filePath, 'utf-8');

    // Basic heuristic: searching for plain HTML elements that should be Glass components
    const issues = [];

    if (content.includes('<button') && !content.includes('<GlassButton')) {
        issues.push("Found plain <button> tag. Use <GlassButton> for glassmorphism consistency.");
    }

    if (content.includes('<input') && !content.includes('<GlassInput')) {
        issues.push("Found plain <input> tag. Use <GlassInput> for glassmorphism consistency.");
    }

    if (issues.length > 0) {
        console.log("--- 🎨 Liquid Design Audit ---");
        issues.forEach(issue => console.log(`[WARNING] ${issue}`));
        console.log("------------------------------");
    }
}

runAudit();
