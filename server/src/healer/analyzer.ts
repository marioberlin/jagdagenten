/**
 * Error Analyzer for Self-Healing System
 *
 * Uses AI to analyze errors and generate fix PRDs.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.2 Self-Healing Production Loop
 */

import { randomUUID } from 'crypto';
import type {
    ErrorReport,
    HealingPRD,
    HealingStory,
    AnalysisContext
} from './types.js';
import { HEALER_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompts.js';
import {
    hashError,
    isRecentlyHealed,
    markHealingStarted
} from './queue.js';
import { componentLoggers } from '../logger.js';

const healerLog = componentLoggers.ai;

/**
 * AI provider function type
 */
type AIProvider = (messages: Array<{ role: string; content: string }>) => Promise<string>;

/**
 * Analyzer configuration
 */
interface AnalyzerConfig {
    /** AI provider function */
    aiProvider?: AIProvider;
    /** Maximum stories per PRD */
    maxStories: number;
    /** Enable mock mode for testing */
    mockMode: boolean;
}

const DEFAULT_CONFIG: AnalyzerConfig = {
    maxStories: 5,
    mockMode: process.env.NODE_ENV === 'test'
};

/**
 * Parse AI response into PRD structure
 */
function parseAIResponse(response: string): {
    rootCause: string;
    affectedFiles: string[];
    complexity: number;
    stories: Array<{
        title: string;
        description: string;
        acceptanceCriteria: string[];
    }>;
    testingStrategy?: string;
} | null {
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            healerLog.warn({ response: response.slice(0, 200) }, 'No JSON found in AI response');
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.rootCause || !parsed.stories || !Array.isArray(parsed.stories)) {
            healerLog.warn({ parsed }, 'AI response missing required fields');
            return null;
        }

        return {
            rootCause: String(parsed.rootCause),
            affectedFiles: Array.isArray(parsed.affectedFiles)
                ? parsed.affectedFiles.map(String)
                : [],
            complexity: Math.min(5, Math.max(1, Number(parsed.complexity) || 3)),
            stories: parsed.stories.slice(0, 5).map((s: any) => ({
                title: String(s.title || 'Untitled'),
                description: String(s.description || ''),
                acceptanceCriteria: Array.isArray(s.acceptanceCriteria)
                    ? s.acceptanceCriteria.map(String)
                    : []
            })),
            testingStrategy: parsed.testingStrategy
                ? String(parsed.testingStrategy)
                : undefined
        };
    } catch (error) {
        healerLog.error({
            error: (error as Error).message,
            response: response.slice(0, 500)
        }, 'Failed to parse AI response');
        return null;
    }
}

/**
 * Generate mock PRD for testing
 */
function generateMockPRD(error: ErrorReport): HealingPRD {
    const errorHash = hashError(error);
    const now = new Date().toISOString();

    return {
        id: `prd_${Date.now()}`,
        title: `Fix: ${error.message.slice(0, 50)}`,
        summary: `Automated fix for ${error.type} in ${error.context.componentName || 'unknown component'}`,
        rootCause: 'Mock root cause analysis',
        stories: [{
            id: `story_${Date.now()}_1`,
            title: 'Fix the immediate error',
            description: `Address the error: ${error.message}`,
            acceptanceCriteria: [
                'Error no longer occurs',
                'No regressions introduced'
            ],
            affectedFiles: error.context.componentName
                ? [`src/components/${error.context.componentName}.tsx`]
                : [],
            complexity: 2
        }],
        errorHash,
        priority: error.context.level === 'app' ? 'critical' : 'medium',
        createdAt: now,
        status: 'pending',
        relatedErrors: []
    };
}

/**
 * Determine priority from error context
 */
function determinePriority(error: ErrorReport): HealingPRD['priority'] {
    // Critical: App-level errors or security breaches
    if (error.context.level === 'app' || error.type === 'security_breach') {
        return 'critical';
    }

    // High: Page-level errors or high frequency
    if (error.context.level === 'page' || (error.context.errorCount || 0) > 10) {
        return 'high';
    }

    // Medium: Component errors with moderate frequency
    if ((error.context.errorCount || 0) > 3) {
        return 'medium';
    }

    return 'low';
}

/**
 * Analyze error and generate healing PRD
 *
 * @param error - Error report to analyze
 * @param config - Analyzer configuration
 * @returns Healing PRD or null if analysis fails
 */
export async function analyzeError(
    error: ErrorReport,
    config?: Partial<AnalyzerConfig>
): Promise<HealingPRD | null> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const errorHash = hashError(error);

    healerLog.info({
        errorHash,
        errorType: error.type,
        component: error.context.componentName
    }, 'Starting error analysis');

    // Check deduplication
    if (await isRecentlyHealed(errorHash)) {
        healerLog.info({ errorHash }, 'Error recently healed, skipping analysis');
        return null;
    }

    // Use mock mode for testing
    if (cfg.mockMode || !cfg.aiProvider) {
        healerLog.info({ errorHash }, 'Using mock PRD generation');
        return generateMockPRD(error);
    }

    try {
        // Build analysis context
        const context: AnalysisContext = {
            error,
            // TODO: Add similar errors from queue
            // TODO: Add code context from codebase
        };

        // Build prompt
        const prompt = buildAnalysisPrompt(context);

        // Call AI
        const response = await cfg.aiProvider([
            { role: 'system', content: HEALER_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ]);

        // Parse response
        const parsed = parseAIResponse(response);
        if (!parsed) {
            healerLog.warn({ errorHash }, 'Failed to parse AI analysis response');
            return null;
        }

        // Mark as in progress
        await markHealingStarted(errorHash);

        // Build PRD
        const now = new Date().toISOString();
        const stories: HealingStory[] = parsed.stories.slice(0, cfg.maxStories).map((s, i) => ({
            id: `story_${Date.now()}_${i + 1}`,
            title: s.title,
            description: s.description,
            acceptanceCriteria: s.acceptanceCriteria,
            affectedFiles: parsed.affectedFiles,
            complexity: Math.ceil(parsed.complexity / parsed.stories.length)
        }));

        const prd: HealingPRD = {
            id: `prd_${Date.now()}_${randomUUID().slice(0, 8)}`,
            title: `Fix: ${error.message.slice(0, 60)}`,
            summary: `Automated fix for ${error.type} in ${error.context.componentName || 'unknown'}`,
            rootCause: parsed.rootCause,
            stories,
            errorHash,
            priority: determinePriority(error),
            createdAt: now,
            status: 'pending',
            relatedErrors: []
        };

        healerLog.info({
            prdId: prd.id,
            storiesCount: stories.length,
            priority: prd.priority,
            rootCause: parsed.rootCause.slice(0, 100)
        }, 'PRD generated successfully');

        return prd;

    } catch (error) {
        healerLog.error({
            errorHash,
            error: (error as Error).message
        }, 'Error analysis failed');
        return null;
    }
}

/**
 * Validate PRD is actionable
 */
export function validatePRD(prd: HealingPRD): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (!prd.stories || prd.stories.length === 0) {
        issues.push('PRD has no stories');
    }

    for (const story of prd.stories) {
        if (!story.title || story.title.length < 5) {
            issues.push(`Story ${story.id} has invalid title`);
        }
        if (!story.description || story.description.length < 10) {
            issues.push(`Story ${story.id} has invalid description`);
        }
        if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
            issues.push(`Story ${story.id} has no acceptance criteria`);
        }
    }

    if (!prd.rootCause || prd.rootCause.length < 10) {
        issues.push('PRD has invalid root cause');
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Enrich error report with additional context
 */
export async function enrichErrorContext(
    error: ErrorReport
): Promise<AnalysisContext> {
    const context: AnalysisContext = {
        error
    };

    // Try to identify affected files from stack trace
    if (error.stack) {
        const fileMatches = error.stack.match(/\(?(src\/[^:)]+):\d+/g);
        if (fileMatches) {
            const files = [...new Set(fileMatches.map(m =>
                m.replace(/^\(/, '').replace(/:\d+$/, '')
            ))];

            context.projectStructure = files;
        }
    }

    // Try to identify component hierarchy
    if (error.context.componentName) {
        context.projectStructure = context.projectStructure || [];
        context.projectStructure.push(
            `Component: ${error.context.componentName}`,
            `Error level: ${error.context.level || 'component'}`
        );
    }

    return context;
}

export default {
    analyzeError,
    validatePRD,
    enrichErrorContext
};
