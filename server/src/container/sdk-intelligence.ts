/**
 * SDK Intelligence System
 *
 * Task-based SDK selection for optimal AI agent routing.
 * Analyzes task characteristics and selects the best SDK.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import type { EnvironmentCapabilities } from './auto-config.js';
import type { SDKType } from './smart-defaults.js';
import { SDK_COST_ESTIMATES, SDK_CAPABILITIES } from './smart-defaults.js';

// ============================================================================
// Types
// ============================================================================

export type TaskType = 'ui' | 'api' | 'test' | 'security' | 'refactor' | 'docs' | 'general';
export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export interface TaskAnalysis {
    type: TaskType;
    complexity: TaskComplexity;
    estimatedTurns: number;
    estimatedCost: CostEstimate;
    filePatterns: string[];
    suggestedSdk: SDKType;
    reasoning: string;
    confidence: number;
    alternatives: SDKAlternative[];
}

export interface CostEstimate {
    low: number;
    high: number;
    currency: 'USD';
    breakdown: {
        sdk: SDKType;
        inputTokens: number;
        outputTokens: number;
    };
}

export interface SDKAlternative {
    sdk: SDKType;
    reason: string;
    costDifference: number; // Percentage difference from suggested
    qualityTradeoff: 'better' | 'same' | 'worse';
}

/**
 * Minimal SubPRD interface for SDK intelligence
 * Compatible with orchestrator SubPRD
 */
export interface SubPRD {
    domain?: string;
    stories: Story[];
    dependencies?: string[];
    // Additional orchestrator fields (optional)
    id?: string;
    agentId?: string;
}

export interface Story {
    id?: string;
    title: string;
    description?: string;
    affectedFiles: string[];
    acceptanceCriteria: string[];
    priority?: 'high' | 'medium' | 'low';
}

// ============================================================================
// Task Analysis
// ============================================================================

/**
 * Analyze a task and determine the best SDK to use
 */
export function analyzeTask(
    subPrd: SubPRD,
    env: EnvironmentCapabilities
): TaskAnalysis {
    const stories = subPrd.stories;

    // Analyze task characteristics from file patterns
    const filePatterns = stories.flatMap(s => s.affectedFiles);
    const taskType = determineTaskType(filePatterns, stories);
    const complexity = determineComplexity(stories, filePatterns);

    // Select best SDK based on task analysis
    const suggestedSdk = selectBestSdk(taskType, complexity, env);
    const estimatedTurns = estimateTurns(complexity);
    const estimatedCost = estimateCost(suggestedSdk, estimatedTurns);

    // Generate alternatives
    const alternatives = generateAlternatives(taskType, complexity, env, suggestedSdk);

    return {
        type: taskType,
        complexity,
        estimatedTurns,
        estimatedCost,
        filePatterns,
        suggestedSdk,
        reasoning: generateReasoning(taskType, complexity, suggestedSdk, env),
        confidence: calculateConfidence(taskType, suggestedSdk, env),
        alternatives,
    };
}

/**
 * Determine task type from file patterns and story content
 */
function determineTaskType(filePatterns: string[], stories: Story[]): TaskType {
    // Check for security keywords first (highest priority)
    const isSecurityTask = stories.some(s =>
        s.title.toLowerCase().includes('security') ||
        s.title.toLowerCase().includes('auth') ||
        s.title.toLowerCase().includes('permission') ||
        s.title.toLowerCase().includes('vulnerability') ||
        (s.description?.toLowerCase().includes('security') ?? false)
    );
    if (isSecurityTask) return 'security';

    // Check file patterns
    const isUiTask = filePatterns.some(f =>
        f.includes('/components/') ||
        f.includes('/pages/') ||
        f.includes('/layouts/') ||
        f.endsWith('.tsx') ||
        f.endsWith('.jsx') ||
        f.endsWith('.css') ||
        f.endsWith('.scss')
    );

    const isApiTask = filePatterns.some(f =>
        f.includes('/server/') ||
        f.includes('/api/') ||
        f.includes('/routes/') ||
        f.includes('/services/')
    );

    const isTestTask = filePatterns.some(f =>
        f.includes('.test.') ||
        f.includes('.spec.') ||
        f.includes('/tests/') ||
        f.includes('/__tests__/')
    );

    const isDocsTask = filePatterns.some(f =>
        f.endsWith('.md') ||
        f.includes('/docs/') ||
        f.includes('README')
    );

    const isRefactorTask = stories.some(s =>
        s.title.toLowerCase().includes('refactor') ||
        s.title.toLowerCase().includes('cleanup') ||
        s.title.toLowerCase().includes('optimize')
    );

    // Priority order: security > test > ui > api > refactor > docs > general
    if (isTestTask) return 'test';
    if (isUiTask && !isApiTask) return 'ui';
    if (isApiTask && !isUiTask) return 'api';
    if (isUiTask && isApiTask) return 'general'; // Mixed task
    if (isRefactorTask) return 'refactor';
    if (isDocsTask) return 'docs';

    return 'general';
}

/**
 * Determine task complexity from stories and file patterns
 */
function determineComplexity(stories: Story[], filePatterns: string[]): TaskComplexity {
    const totalFiles = new Set(filePatterns).size;
    const totalCriteria = stories.reduce((sum, s) => sum + s.acceptanceCriteria.length, 0);
    const highPriorityStories = stories.filter(s => s.priority === 'high').length;

    // Complex: Many files, many criteria, or multiple high-priority stories
    if (totalFiles > 5 || totalCriteria > 10 || highPriorityStories > 2) {
        return 'complex';
    }

    // Moderate: Several files or criteria
    if (totalFiles > 2 || totalCriteria > 5 || highPriorityStories > 0) {
        return 'moderate';
    }

    return 'simple';
}

/**
 * Select the best SDK based on task characteristics and environment
 */
export function selectBestSdk(
    type: TaskType,
    complexity: TaskComplexity,
    env: EnvironmentCapabilities
): SDKType {
    // Security tasks: Always Claude for careful reasoning
    if (type === 'security' && env.apiKeys.anthropic) {
        return 'claude-agent-sdk';
    }

    // Simple tasks: Gemini CLI for speed and cost
    if (complexity === 'simple' && env.cliTools.geminiCli && env.apiKeys.google) {
        return 'gemini-cli';
    }

    // UI tasks: Claude excels at React/CSS
    if (type === 'ui' && env.apiKeys.anthropic) {
        return 'claude-agent-sdk';
    }

    // Test tasks: Fast iteration needed
    if (type === 'test') {
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
        if (env.apiKeys.openai) return 'openai-agents-sdk';
    }

    // API tasks: Gemini CLI or Claude
    if (type === 'api') {
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
        if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    }

    // Docs tasks: Any model works well
    if (type === 'docs') {
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
        if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    }

    // Refactor tasks: Need careful analysis
    if (type === 'refactor') {
        if (env.apiKeys.anthropic) return 'claude-agent-sdk';
        if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
    }

    // Default: Best available by priority
    if (env.apiKeys.anthropic) return 'claude-agent-sdk';
    if (env.cliTools.geminiCli && env.apiKeys.google) return 'gemini-cli';
    if (env.apiKeys.openai) return 'openai-agents-sdk';
    if (env.apiKeys.google) return 'google-adk';

    return 'raw';
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Estimate turns based on complexity
 */
function estimateTurns(complexity: TaskComplexity): number {
    const turnEstimates: Record<TaskComplexity, number> = {
        simple: 10,
        moderate: 25,
        complex: 50,
    };
    return turnEstimates[complexity];
}

/**
 * Estimate cost for a given SDK and number of turns
 */
export function estimateCost(sdk: SDKType, turns: number): CostEstimate {
    const costs = SDK_COST_ESTIMATES[sdk];

    // Estimate tokens per turn
    const inputTokensPerTurn = 2000;  // Average input
    const outputTokensPerTurn = 1500; // Average output

    const totalInputTokens = turns * inputTokensPerTurn;
    const totalOutputTokens = turns * outputTokensPerTurn;

    // Calculate cost (per 1M tokens)
    const inputCost = (totalInputTokens / 1_000_000) * costs.inputPer1M;
    const outputCost = (totalOutputTokens / 1_000_000) * costs.outputPer1M;

    // Add variance for low/high estimates
    const baseCost = inputCost + outputCost;

    return {
        low: Math.round(baseCost * 0.7 * 100) / 100,
        high: Math.round(baseCost * 1.5 * 100) / 100,
        currency: 'USD',
        breakdown: {
            sdk,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
        },
    };
}

/**
 * Compare costs between SDKs
 */
export function compareCosts(sdks: SDKType[], turns: number): Map<SDKType, CostEstimate> {
    const costs = new Map<SDKType, CostEstimate>();
    for (const sdk of sdks) {
        costs.set(sdk, estimateCost(sdk, turns));
    }
    return costs;
}

// ============================================================================
// Reasoning & Confidence
// ============================================================================

/**
 * Generate human-readable reasoning for SDK selection
 */
function generateReasoning(
    type: TaskType,
    complexity: TaskComplexity,
    sdk: SDKType,
    _env: EnvironmentCapabilities
): string {
    const parts: string[] = [];

    // Task type reasoning
    const typeReasons: Record<TaskType, string> = {
        security: 'Security tasks require careful reasoning and thorough analysis',
        ui: 'UI tasks benefit from strong React/CSS understanding',
        api: 'API tasks need efficient code generation',
        test: 'Test tasks require fast iteration and good coverage',
        refactor: 'Refactoring needs careful code analysis',
        docs: 'Documentation tasks need clear writing',
        general: 'General tasks can use any available SDK',
    };
    parts.push(typeReasons[type]);

    // Complexity reasoning
    if (complexity === 'complex') {
        parts.push('Complex task may require multiple iterations');
    } else if (complexity === 'simple') {
        parts.push('Simple task can be completed quickly');
    }

    // SDK reasoning
    const sdkReasons: Record<SDKType, string> = {
        'claude-agent-sdk': 'Claude provides excellent reasoning and code quality',
        'gemini-cli': 'Gemini CLI offers fast execution and low cost',
        'openai-agents-sdk': 'OpenAI Agents provides good balance of speed and quality',
        'google-adk': 'Google ADK integrates well with Google Cloud services',
        'minimax': 'MiniMax offers competitive pricing',
        'raw': 'Direct execution without AI SDK',
    };
    parts.push(sdkReasons[sdk]);

    return parts.join('. ') + '.';
}

/**
 * Calculate confidence in SDK selection
 */
function calculateConfidence(
    type: TaskType,
    sdk: SDKType,
    _env: EnvironmentCapabilities
): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for well-matched task types
    const idealMatches: Record<TaskType, SDKType[]> = {
        security: ['claude-agent-sdk'],
        ui: ['claude-agent-sdk'],
        api: ['gemini-cli', 'claude-agent-sdk'],
        test: ['gemini-cli', 'openai-agents-sdk'],
        refactor: ['claude-agent-sdk'],
        docs: ['gemini-cli', 'claude-agent-sdk'],
        general: ['claude-agent-sdk', 'gemini-cli', 'openai-agents-sdk'],
    };

    if (idealMatches[type].includes(sdk)) {
        confidence += 0.2;
    }

    // Higher confidence if SDK is fully available
    const capabilities = SDK_CAPABILITIES[sdk];
    if (capabilities.streaming) confidence += 0.05;
    if (capabilities.toolUse) confidence += 0.05;

    return Math.min(1.0, confidence);
}

/**
 * Generate alternative SDK suggestions
 */
function generateAlternatives(
    type: TaskType,
    complexity: TaskComplexity,
    env: EnvironmentCapabilities,
    suggestedSdk: SDKType
): SDKAlternative[] {
    const alternatives: SDKAlternative[] = [];
    const suggestedCost = estimateCost(suggestedSdk, estimateTurns(complexity));
    const availableSdks = getAvailableSdks(env).filter(sdk => sdk !== suggestedSdk);

    for (const sdk of availableSdks) {
        const altCost = estimateCost(sdk, estimateTurns(complexity));
        const costDiff = ((altCost.high - suggestedCost.high) / suggestedCost.high) * 100;

        // Determine quality tradeoff
        let qualityTradeoff: 'better' | 'same' | 'worse' = 'same';
        if (type === 'security' && sdk !== 'claude-agent-sdk') {
            qualityTradeoff = 'worse';
        } else if (type === 'ui' && sdk === 'claude-agent-sdk') {
            qualityTradeoff = 'better';
        } else if (costDiff < -20) {
            qualityTradeoff = 'worse'; // Much cheaper usually means lower quality
        }

        const reasons: Record<SDKType, string> = {
            'claude-agent-sdk': 'Best for complex reasoning and code quality',
            'gemini-cli': 'Fastest execution with lowest cost',
            'openai-agents-sdk': 'Good balance of speed and capability',
            'google-adk': 'Native Google Cloud integration',
            'minimax': 'Budget-friendly option',
            'raw': 'Direct execution without overhead',
        };

        alternatives.push({
            sdk,
            reason: reasons[sdk],
            costDifference: Math.round(costDiff),
            qualityTradeoff,
        });
    }

    // Sort by cost difference (cheapest first)
    return alternatives.sort((a, b) => a.costDifference - b.costDifference);
}

/**
 * Get list of available SDKs based on environment
 */
export function getAvailableSdks(env: EnvironmentCapabilities): SDKType[] {
    const available: SDKType[] = [];

    if (env.apiKeys.anthropic) available.push('claude-agent-sdk');
    if (env.cliTools.geminiCli && env.apiKeys.google) available.push('gemini-cli');
    if (env.apiKeys.google) available.push('google-adk');
    if (env.apiKeys.openai) available.push('openai-agents-sdk');
    if (env.apiKeys.minimax) available.push('minimax');
    available.push('raw'); // Always available

    return available;
}

// ============================================================================
// Batch Analysis
// ============================================================================

/**
 * Analyze multiple tasks and optimize SDK allocation
 */
export function analyzeTaskBatch(
    tasks: SubPRD[],
    env: EnvironmentCapabilities
): {
    analyses: TaskAnalysis[];
    totalEstimatedCost: CostEstimate;
    sdkDistribution: Map<SDKType, number>;
    recommendations: string[];
} {
    const analyses = tasks.map(task => analyzeTask(task, env));

    // Calculate total cost
    const totalTurns = analyses.reduce((sum, a) => sum + a.estimatedTurns, 0);
    const avgSdk = analyses[0]?.suggestedSdk || 'raw';
    const totalEstimatedCost = estimateCost(avgSdk, totalTurns);

    // SDK distribution
    const sdkDistribution = new Map<SDKType, number>();
    for (const analysis of analyses) {
        const count = sdkDistribution.get(analysis.suggestedSdk) || 0;
        sdkDistribution.set(analysis.suggestedSdk, count + 1);
    }

    // Generate recommendations
    const recommendations: string[] = [];

    // Check for cost optimization opportunities
    const complexTasks = analyses.filter(a => a.complexity === 'complex').length;
    if (complexTasks > 3) {
        recommendations.push('Consider breaking down complex tasks to reduce costs');
    }

    // Check SDK diversity
    if (sdkDistribution.size === 1 && analyses.length > 3) {
        recommendations.push('Consider using multiple SDKs for better cost/quality balance');
    }

    // Check for missing capabilities
    if (!env.cliTools.geminiCli && analyses.some(a => a.type === 'test')) {
        recommendations.push('Installing Gemini CLI would speed up test tasks');
    }

    return {
        analyses,
        totalEstimatedCost,
        sdkDistribution,
        recommendations,
    };
}
