import { readFileSync } from 'fs';

/**
 * Liquid Glass Design Auditor
 * Triggered via PostToolUse hook to ensure Glass component compliance.
 *
 * Checks for:
 * - Plain HTML elements that should be Glass components
 * - Hardcoded color values that should use design tokens
 * - Hardcoded typography values that should use TYPOGRAPHY constants
 */

// Forbidden hardcoded color patterns (Tailwind defaults that should be System Colors)
const FORBIDDEN_COLORS = [
    { pattern: /#60a5fa/gi, name: 'blue-400', replacement: "APPLE_SYSTEM_COLORS.blue" },
    { pattern: /#3b82f6/gi, name: 'blue-500', replacement: "APPLE_SYSTEM_COLORS.blue" },
    { pattern: /#4ade80/gi, name: 'green-400', replacement: "APPLE_SYSTEM_COLORS.green" },
    { pattern: /#22c55e/gi, name: 'green-500', replacement: "APPLE_SYSTEM_COLORS.green" },
    { pattern: /#ef4444/gi, name: 'red-500', replacement: "APPLE_SYSTEM_COLORS.red" },
    { pattern: /#f87171/gi, name: 'red-400', replacement: "APPLE_SYSTEM_COLORS.red" },
    { pattern: /#facc15/gi, name: 'yellow-400', replacement: "APPLE_SYSTEM_COLORS.yellow" },
    { pattern: /#c084fc/gi, name: 'purple-400', replacement: "APPLE_SYSTEM_COLORS.purple" },
];

// Forbidden hardcoded typography patterns
const FORBIDDEN_TYPOGRAPHY = [
    { pattern: /text-\[10px\]/g, name: 'text-[10px]', replacement: "TYPOGRAPHY.chart.label (11px)" },
    { pattern: /text-\[11px\]/g, name: 'text-[11px]', replacement: "TYPOGRAPHY.chart.label" },
    { pattern: /fontSize="11"/g, name: 'fontSize="11"', replacement: "fontSize={TYPOGRAPHY.chart.label}" },
    { pattern: /fontSize="10"/g, name: 'fontSize="10"', replacement: "fontSize={TYPOGRAPHY.chart.label}" },
    { pattern: /fontFamily="monospace"/g, name: 'fontFamily="monospace"', replacement: "fontFamily={TYPOGRAPHY.fontFamily.mono}" },
];

// Forbidden tooltip patterns (should use GlassContainer)
const FORBIDDEN_TOOLTIPS = [
    { pattern: /bg-black\/80/g, name: 'bg-black/80', replacement: "<GlassContainer material=\"thick\">" },
    { pattern: /bg-black\/90/g, name: 'bg-black/90', replacement: "<GlassContainer material=\"thick\">" },
];

async function runAudit() {
    const filePath = process.env.CLAUDE_EXTERNAL_FILE_MODIFIED;
    if (!filePath) return;

    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;

    const content = readFileSync(filePath, 'utf-8');

    const issues: string[] = [];

    // Check for plain HTML elements that should be Glass components
    if (content.includes('<button') && !content.includes('<GlassButton')) {
        issues.push("Found plain <button> tag. Use <GlassButton> for glassmorphism consistency.");
    }

    if (content.includes('<input') && !content.includes('<GlassInput')) {
        issues.push("Found plain <input> tag. Use <GlassInput> for glassmorphism consistency.");
    }

    // Check for forbidden hardcoded colors
    for (const { pattern, name, replacement } of FORBIDDEN_COLORS) {
        if (pattern.test(content)) {
            issues.push(`Found hardcoded color '${name}'. Use ${replacement} from design-tokens.ts instead.`);
        }
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0;
    }

    // Check for forbidden typography patterns
    for (const { pattern, name, replacement } of FORBIDDEN_TYPOGRAPHY) {
        if (pattern.test(content)) {
            issues.push(`Found hardcoded typography '${name}'. Use ${replacement} from design-tokens.ts instead.`);
        }
        pattern.lastIndex = 0;
    }

    // Check for forbidden tooltip patterns
    for (const { pattern, name, replacement } of FORBIDDEN_TOOLTIPS) {
        if (pattern.test(content)) {
            issues.push(`Found hardcoded tooltip style '${name}'. Use ${replacement} instead.`);
        }
        pattern.lastIndex = 0;
    }

    // Check for Tailwind color classes that should be System Colors (in chart contexts)
    if (filePath.includes('Chart') || filePath.includes('chart')) {
        const tailwindColorClasses = /text-(green|red|blue|yellow|purple|orange|pink)-\d{3}/g;
        const matches = content.match(tailwindColorClasses);
        if (matches) {
            const uniqueMatches = [...new Set(matches)];
            issues.push(`Found Tailwind color classes in chart: ${uniqueMatches.join(', ')}. Use System Colors from design-tokens.ts instead.`);
        }
    }

    if (issues.length > 0) {
        console.log("--- 🎨 Liquid Design Audit ---");
        issues.forEach(issue => console.log(`[WARNING] ${issue}`));
        console.log("------------------------------");
        console.log(`\nRecommendation: Import design tokens with:`);
        console.log(`  import { useChartColors, TYPOGRAPHY } from '@/styles/design-tokens';`);
        console.log("------------------------------");
    }
}

runAudit();
