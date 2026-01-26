/**
 * Session Compaction Service
 * 
 * Manages conversation compaction to prevent context overflow.
 * 
 * Features:
 * - Auto-compaction trigger based on token count
 * - Pre-compaction memory flush (save important context)
 * - /compact chat command support
 * - Configurable compaction strategies
 * - NLWEB-inspired smart memory extraction with parallel pre-processing
 */

import type { AIResource, ResourceStore, OwnerType } from '../resources/types.js';
import type { DailyMemoryLogService, MemoryEntry } from '../resources/daily-memory-log.js';
import { ImportanceClassifier, type ImportanceResult } from './importance-classifier.js';
import { MemoryDecontextualizer } from './memory-decontextualizer.js';
import { TopicClusterer, type TopicCluster } from './topic-clusterer.js';

// ============================================================================
// Pipeline Stage Types (NLWEB-inspired)
// ============================================================================

export type CompactionStage =
    | 'idle'
    | 'analyzing'      // Scoring turn importance
    | 'clustering'     // Grouping by topic
    | 'extracting'     // Decontextualizing memories
    | 'summarizing'    // Generating summary
    | 'persisting'     // Storing to memory log
    | 'complete';

const STAGE_MESSAGES: Record<CompactionStage, string> = {
    idle: '',
    analyzing: 'Reviewing conversation insights...',
    clustering: 'Grouping related topics...',
    extracting: 'Finding key learnings...',
    summarizing: 'Creating memory snapshot...',
    persisting: 'Saving to long-term memory...',
    complete: 'Memory refreshed! ✨'
};

// ============================================================================
// Types
// ============================================================================

export interface CompactionConfig {
    /** Token threshold to trigger auto-compaction */
    tokenThreshold: number;

    /** Warning threshold (percentage of tokenThreshold) */
    warningThreshold: number;

    /** Strategy for compaction */
    strategy: 'summarize' | 'truncate' | 'hybrid';

    /** Keep last N messages regardless of compaction */
    keepLastMessages: number;

    /** Auto-flush memories before compaction */
    autoFlushMemories: boolean;

    /** Enable topic clustering for smarter summarization */
    enableTopicClustering: boolean;

    /** System prompt for memory extraction */
    memoryFlushPrompt: string;
}

export interface ConversationTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    tokenCount?: number;
}

export interface CompactionResult {
    originalTokens: number;
    compactedTokens: number;
    removedTurns: number;
    memoriesFlushed: number;
    summary?: string;
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
    tokenThreshold: 80000, // ~80k tokens before compaction
    warningThreshold: 0.8, // Warn at 80% of threshold
    strategy: 'hybrid',
    keepLastMessages: 10,
    autoFlushMemories: true,
    enableTopicClustering: true, // Use TopicClusterer for smarter summaries
    memoryFlushPrompt: `Before this conversation is compacted, extract any important information that should be remembered for future sessions.

For each piece of information, categorize it as:
- **observation**: Something you noticed about the user or their work
- **learning**: A technique, approach, or knowledge gained
- **preference**: User preferences or working styles
- **fact**: Concrete facts about projects, systems, or domain
- **correction**: Mistakes to avoid or corrections to previous understanding

Format each as a concise statement. Only include information worth remembering long-term.`,
};

// ============================================================================
// Compaction Service
// ============================================================================

export class CompactionService {
    private config: CompactionConfig;
    private resourceStore: ResourceStore | null;
    private memoryLog: DailyMemoryLogService | null;
    private ownerType: OwnerType;
    private ownerId: string;
    private onStageChange?: (stage: CompactionStage, message: string) => void;
    private importanceClassifier: ImportanceClassifier;
    private decontextualizer: MemoryDecontextualizer;
    private topicClusterer: TopicClusterer;
    private currentStage: CompactionStage = 'idle';

    constructor(
        ownerType: OwnerType,
        ownerId: string,
        config?: Partial<CompactionConfig>,
        resourceStore?: ResourceStore,
        memoryLog?: DailyMemoryLogService,
        onStageChange?: (stage: CompactionStage, message: string) => void
    ) {
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.config = { ...DEFAULT_COMPACTION_CONFIG, ...config };
        this.resourceStore = resourceStore ?? null;
        this.memoryLog = memoryLog ?? null;
        this.onStageChange = onStageChange;
        this.importanceClassifier = new ImportanceClassifier();
        this.decontextualizer = new MemoryDecontextualizer();
        this.topicClusterer = new TopicClusterer({ generateSummaries: true });
    }

    /**
     * Set the stage change callback (NLWEB-style pipeline tracking)
     */
    setStageCallback(callback: (stage: CompactionStage, message: string) => void): void {
        this.onStageChange = callback;
    }

    /**
     * Get current pipeline stage
     */
    getStage(): CompactionStage {
        return this.currentStage;
    }

    /**
     * Update pipeline stage (triggers callback)
     */
    private setStage(stage: CompactionStage): void {
        this.currentStage = stage;
        this.onStageChange?.(stage, STAGE_MESSAGES[stage]);
    }

    // ============================================================================
    // Auto-Compaction Check
    // ============================================================================

    /**
     * Check if compaction is needed based on current token count
     */
    shouldCompact(currentTokens: number): { needed: boolean; warning: boolean; percentUsed: number } {
        const percentUsed = currentTokens / this.config.tokenThreshold;
        const warning = percentUsed >= this.config.warningThreshold;
        const needed = currentTokens >= this.config.tokenThreshold;

        return { needed, warning, percentUsed };
    }

    /**
     * Get status message for UI
     */
    getStatusMessage(currentTokens: number): string | null {
        const { needed, warning, percentUsed } = this.shouldCompact(currentTokens);

        if (needed) {
            return `⚠️ Context limit reached (${Math.round(percentUsed * 100)}%). Compaction needed. Use /compact or continue for auto-compaction.`;
        }

        if (warning) {
            return `📊 Context usage: ${Math.round(percentUsed * 100)}%. Consider compacting soon with /compact.`;
        }

        return null;
    }

    // ============================================================================
    // Compaction Execution
    // ============================================================================

    /**
     * Perform compaction on conversation history
     */
    async compact(
        conversation: ConversationTurn[],
        options?: {
            flushMemories?: boolean;
            generateSummary?: boolean;
            summarizer?: (text: string) => Promise<string>;
        }
    ): Promise<{
        compactedConversation: ConversationTurn[];
        result: CompactionResult;
    }> {
        const originalTokens = this.estimateTokens(conversation);
        let memoriesFlushed = 0;

        // Step 1: Flush memories if enabled (stages are set inside flushMemories)
        if ((options?.flushMemories ?? this.config.autoFlushMemories) && this.memoryLog) {
            memoriesFlushed = await this.flushMemories(conversation);
        }

        // Step 2: Apply compaction strategy
        this.setStage('summarizing');
        let compactedConversation: ConversationTurn[];
        let summary: string | undefined;

        switch (this.config.strategy) {
            case 'summarize':
                if (options?.summarizer) {
                    const result = await this.compactWithSummary(conversation, options.summarizer);
                    compactedConversation = result.conversation;
                    summary = result.summary;
                } else {
                    compactedConversation = this.compactByTruncation(conversation);
                }
                break;

            case 'truncate':
                compactedConversation = this.compactByTruncation(conversation);
                break;

            case 'hybrid':
            default:
                if (options?.summarizer) {
                    const result = await this.compactHybrid(conversation, options.summarizer);
                    compactedConversation = result.conversation;
                    summary = result.summary;
                } else {
                    compactedConversation = this.compactByTruncation(conversation);
                }
                break;
        }

        const compactedTokens = this.estimateTokens(compactedConversation);
        const removedTurns = conversation.length - compactedConversation.length;

        // Step 3: Store compaction event
        if (this.resourceStore) {
            await this.recordCompactionEvent(originalTokens, compactedTokens, removedTurns, summary);
        }

        this.setStage('complete');

        return {
            compactedConversation,
            result: {
                originalTokens,
                compactedTokens,
                removedTurns,
                memoriesFlushed,
                summary,
            },
        };
    }

    // ============================================================================
    // Compaction Strategies
    // ============================================================================

    /**
     * Simple truncation: keep last N messages
     */
    private compactByTruncation(conversation: ConversationTurn[]): ConversationTurn[] {
        const keepCount = this.config.keepLastMessages;

        if (conversation.length <= keepCount) {
            return conversation;
        }

        // Always keep system messages
        const systemMessages = conversation.filter(t => t.role === 'system');
        const nonSystemMessages = conversation.filter(t => t.role !== 'system');

        // Keep last N non-system messages
        const keptMessages = nonSystemMessages.slice(-keepCount);

        return [...systemMessages, ...keptMessages];
    }

    /**
     * Summarize older messages, keep recent ones
     */
    private async compactWithSummary(
        conversation: ConversationTurn[],
        summarizer: (text: string) => Promise<string>
    ): Promise<{ conversation: ConversationTurn[]; summary: string }> {
        const keepCount = this.config.keepLastMessages;

        // Separate older and recent messages
        const systemMessages = conversation.filter(t => t.role === 'system');
        const nonSystemMessages = conversation.filter(t => t.role !== 'system');

        const toSummarize = nonSystemMessages.slice(0, -keepCount);
        const toKeep = nonSystemMessages.slice(-keepCount);

        // Generate summary of older messages
        const textToSummarize = toSummarize
            .map(t => `${t.role.toUpperCase()}: ${t.content}`)
            .join('\n\n');

        const summary = await summarizer(textToSummarize);

        // Create summary turn
        const summaryTurn: ConversationTurn = {
            role: 'system',
            content: `[Compacted Summary of ${toSummarize.length} previous messages]\n\n${summary}`,
            timestamp: new Date(),
        };

        return {
            conversation: [...systemMessages, summaryTurn, ...toKeep],
            summary,
        };
    }

    /**
     * Hybrid: summarize by topic, then truncate
     * Uses TopicClusterer for smarter topic-aware summarization
     */
    private async compactHybrid(
        conversation: ConversationTurn[],
        summarizer: (text: string) => Promise<string>
    ): Promise<{ conversation: ConversationTurn[]; summary: string }> {
        const keepCount = this.config.keepLastMessages;
        const systemMessages = conversation.filter(t => t.role === 'system');
        const nonSystemMessages = conversation.filter(t => t.role !== 'system');

        const toSummarize = nonSystemMessages.slice(0, -keepCount);
        const toKeep = nonSystemMessages.slice(-keepCount);

        // Use topic clustering if enabled and there's enough content
        if (this.config.enableTopicClustering && toSummarize.length >= 6) {
            this.setStage('clustering');
            const summary = await this.topicClusterer.getTopicAwareSummary(toSummarize);

            const summaryTurn: ConversationTurn = {
                role: 'system',
                content: `[Topic-Aware Summary of ${toSummarize.length} previous messages]\n\n${summary}`,
                timestamp: new Date(),
            };

            return {
                conversation: [...systemMessages, summaryTurn, ...toKeep],
                summary,
            };
        }

        // Fallback to standard summarization
        return this.compactWithSummary(conversation, summarizer);
    }

    // ============================================================================
    // Memory Flush
    // ============================================================================

    /**
     * Extract and store memories before compaction (NLWEB-inspired smart extraction)
     * Uses parallel pre-processing pattern from NLWebOrchestrator
     */
    private async flushMemories(conversation: ConversationTurn[]): Promise<number> {
        if (!this.memoryLog) return 0;

        this.setStage('analyzing');

        // Filter to user turns only (most valuable for memory extraction)
        const userTurns = conversation.filter(t => t.role === 'user');

        if (userTurns.length === 0) return 0;

        // Parallel pre-processing: Score importance for all turns at once
        const contents = userTurns.map(t => t.content);
        const importanceResults = await this.importanceClassifier.classifyBatch(contents);

        this.setStage('extracting');

        // Filter to high-importance turns
        const highImportancePairs = importanceResults
            .map((result, i) => ({ result, turn: userTurns[i], index: i }))
            .filter(pair => pair.result.should_persist);

        if (highImportancePairs.length === 0) {
            this.setStage('complete');
            return 0;
        }

        // Decontextualize each high-importance memory
        const resolvedMemories = await Promise.all(
            highImportancePairs.map(async ({ result, turn }) => {
                const decontextualized = await this.decontextualizer.decontextualize(
                    turn.content,
                    conversation
                );
                return {
                    content: decontextualized.resolved,
                    category: result.category,
                    importance: result.importance_score / 100, // Normalize to 0-1
                    wasResolved: decontextualized.wasResolved,
                };
            })
        );

        this.setStage('persisting');

        // Store all memories
        for (const memory of resolvedMemories) {
            // Map ImportanceClassifier category to MemoryEntry category
            const category = this.mapToMemoryCategory(memory.category);

            await this.memoryLog.addMemory({
                category,
                content: memory.content,
                source: `compaction:${this.ownerId}`,
                importance: memory.importance,
                tags: [
                    'compaction',
                    'smart-extracted',
                    memory.wasResolved ? 'decontextualized' : 'original'
                ],
            });
        }

        this.setStage('complete');
        return resolvedMemories.length;
    }

    /**
     * Map ImportanceClassifier category to MemoryEntry category
     */
    private mapToMemoryCategory(category: string): MemoryEntry['category'] {
        const mapping: Record<string, MemoryEntry['category']> = {
            'observation': 'observation',
            'learning': 'learning',
            'preference': 'preference',
            'fact': 'fact',
            'correction': 'correction',
            'none': 'observation', // Fallback
        };
        return mapping[category] ?? 'observation';
    }

    /**
     * Legacy memory extraction (fallback without AI)
     * @deprecated Use flushMemories with smart extraction instead
     */
    private extractMemoriesFromConversationLegacy(conversation: ConversationTurn[]): Array<{
        category: MemoryEntry['category'];
        content: string;
        importance: number;
    }> {
        const memories: Array<{
            category: MemoryEntry['category'];
            content: string;
            importance: number;
        }> = [];

        for (const turn of conversation) {
            // Look for explicit memory markers
            if (turn.content.includes('[REMEMBER]') || turn.content.includes('[IMPORTANT]')) {
                const content = turn.content
                    .replace(/\[REMEMBER\]/g, '')
                    .replace(/\[IMPORTANT\]/g, '')
                    .trim();

                memories.push({
                    category: 'learning',
                    content,
                    importance: 0.8,
                });
            }

            // Look for preference statements
            if (turn.role === 'user' && (
                turn.content.toLowerCase().includes('i prefer') ||
                turn.content.toLowerCase().includes("i don't like") ||
                turn.content.toLowerCase().includes('always use') ||
                turn.content.toLowerCase().includes('never use')
            )) {
                memories.push({
                    category: 'preference',
                    content: turn.content.slice(0, 200),
                    importance: 0.7,
                });
            }

            // Look for corrections
            if (turn.role === 'user' && (
                turn.content.toLowerCase().includes("that's wrong") ||
                turn.content.toLowerCase().includes('actually,') ||
                turn.content.toLowerCase().includes("that's not correct")
            )) {
                memories.push({
                    category: 'correction',
                    content: turn.content.slice(0, 200),
                    importance: 0.9,
                });
            }
        }

        return memories;
    }

    // ============================================================================
    // Compaction Event Recording
    // ============================================================================

    /**
     * Record compaction event as a resource
     */
    private async recordCompactionEvent(
        originalTokens: number,
        compactedTokens: number,
        removedTurns: number,
        summary?: string
    ): Promise<void> {
        if (!this.resourceStore) return;

        await this.resourceStore.create({
            resourceType: 'context',
            ownerType: this.ownerType,
            ownerId: this.ownerId,
            name: `Compaction Event ${new Date().toISOString()}`,
            content: summary ?? `Compacted ${removedTurns} turns, ${originalTokens - compactedTokens} tokens saved`,
            parts: [{
                type: 'data',
                data: {
                    originalTokens,
                    compactedTokens,
                    removedTurns,
                    timestamp: new Date().toISOString(),
                },
            }],
            typeMetadata: {
                type: 'context',
                strategy: 'flat',
                priority: 1,
                contextType: 'global',
                valueType: 'json',
            },
            version: 1,
            isActive: true,
            isPinned: false,
            tags: ['compaction', 'system'],
            provenance: 'agent_generated',
            usageFrequency: 0,
            syncToFile: false,
        });
    }

    // ============================================================================
    // Chat Command Handler
    // ============================================================================

    /**
     * Handle /compact chat command
     */
    async handleCompactCommand(
        args: string[],
        conversation: ConversationTurn[],
        summarizer?: (text: string) => Promise<string>
    ): Promise<{
        response: string;
        compactedConversation?: ConversationTurn[];
    }> {
        const subcommand = args[0]?.toLowerCase();

        switch (subcommand) {
            case 'status':
                return this.handleStatusCommand(conversation);

            case 'force':
                return this.handleForceCompact(conversation, summarizer);

            case 'config':
                return this.handleConfigCommand(args.slice(1));

            default:
                // Default: show status and offer to compact if needed
                const { needed, percentUsed } = this.shouldCompact(this.estimateTokens(conversation));

                if (needed) {
                    const result = await this.compact(conversation, { summarizer });
                    return {
                        response: `✅ Compaction complete:\n- Removed ${result.result.removedTurns} turns\n- Saved ${result.result.originalTokens - result.result.compactedTokens} tokens\n- Flushed ${result.result.memoriesFlushed} memories`,
                        compactedConversation: result.compactedConversation,
                    };
                }

                return {
                    response: `📊 Context usage: ${Math.round(percentUsed * 100)}%\nNo compaction needed. Use \`/compact force\` to compact anyway.`,
                };
        }
    }

    private async handleStatusCommand(conversation: ConversationTurn[]): Promise<{ response: string }> {
        const tokens = this.estimateTokens(conversation);
        const { percentUsed, warning, needed } = this.shouldCompact(tokens);

        const status = needed ? '🔴 Compaction needed' :
            warning ? '🟡 Approaching limit' :
                '🟢 Healthy';

        return {
            response: `**Compaction Status: ${status}**\n\n` +
                `- Current tokens: ${tokens.toLocaleString()}\n` +
                `- Threshold: ${this.config.tokenThreshold.toLocaleString()}\n` +
                `- Usage: ${Math.round(percentUsed * 100)}%\n` +
                `- Messages: ${conversation.length}\n` +
                `- Strategy: ${this.config.strategy}\n` +
                `- Auto-flush memories: ${this.config.autoFlushMemories ? 'Yes' : 'No'}`,
        };
    }

    private async handleForceCompact(
        conversation: ConversationTurn[],
        summarizer?: (text: string) => Promise<string>
    ): Promise<{ response: string; compactedConversation: ConversationTurn[] }> {
        const result = await this.compact(conversation, { summarizer });

        return {
            response: `✅ Forced compaction complete:\n` +
                `- Removed ${result.result.removedTurns} turns\n` +
                `- ${result.result.originalTokens.toLocaleString()} → ${result.result.compactedTokens.toLocaleString()} tokens\n` +
                `- Flushed ${result.result.memoriesFlushed} memories`,
            compactedConversation: result.compactedConversation,
        };
    }

    private handleConfigCommand(args: string[]): { response: string } {
        if (args.length === 0) {
            return {
                response: `**Compaction Config**\n\n` +
                    `- \`threshold\`: ${this.config.tokenThreshold}\n` +
                    `- \`strategy\`: ${this.config.strategy}\n` +
                    `- \`keepMessages\`: ${this.config.keepLastMessages}\n` +
                    `- \`autoFlush\`: ${this.config.autoFlushMemories}\n\n` +
                    `Use \`/compact config <key> <value>\` to update.`,
            };
        }

        const [key, value] = args;

        switch (key) {
            case 'threshold':
                this.config.tokenThreshold = parseInt(value, 10);
                break;
            case 'strategy':
                this.config.strategy = value as CompactionConfig['strategy'];
                break;
            case 'keepMessages':
                this.config.keepLastMessages = parseInt(value, 10);
                break;
            case 'autoFlush':
                this.config.autoFlushMemories = value === 'true';
                break;
            default:
                return { response: `Unknown config key: ${key}` };
        }

        return { response: `✅ Updated ${key} to ${value}` };
    }

    // ============================================================================
    // Utilities
    // ============================================================================

    /**
     * Estimate token count for conversation
     */
    estimateTokens(conversation: ConversationTurn[]): number {
        // Rough estimate: 1 token ≈ 4 characters
        return conversation.reduce((sum, turn) => {
            return sum + Math.ceil(turn.content.length / 4);
        }, 0);
    }

    /**
     * Get current config
     */
    getConfig(): CompactionConfig {
        return { ...this.config };
    }

    /**
     * Update config
     */
    updateConfig(updates: Partial<CompactionConfig>): void {
        this.config = { ...this.config, ...updates };
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createCompactionService(
    ownerType: OwnerType,
    ownerId: string,
    config?: Partial<CompactionConfig>,
    resourceStore?: ResourceStore,
    memoryLog?: DailyMemoryLogService,
    onStageChange?: (stage: CompactionStage, message: string) => void
): CompactionService {
    return new CompactionService(ownerType, ownerId, config, resourceStore, memoryLog, onStageChange);
}

export default CompactionService;
