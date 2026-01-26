/**
 * Topic Clusterer
 * 
 * Groups conversation turns by topic for smarter summarization.
 * Enables topic-aware compaction: summarize each topic separately.
 * 
 * Uses LLM to identify topic transitions and cluster related content.
 */

import { callGeminiAPI } from '../ai/gemini.js';
import type { AIMessage } from '../ai/types.js';

// ============================================================================
// Types
// ============================================================================

export interface ConversationTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface TopicCluster {
    /** Topic label/name */
    topic: string;
    /** Indices of turns in this cluster */
    turnIndices: number[];
    /** Optional generated summary of this topic */
    summary?: string;
    /** Importance score for the topic (0-1) */
    importance?: number;
}

export interface ClusterResult {
    /** Identified topic clusters */
    clusters: TopicCluster[];
    /** Turns that don't fit any cluster */
    unclustered: number[];
    /** Whether clustering was performed */
    wasClustered: boolean;
}

export interface TopicClustererConfig {
    /** Minimum turns to consider for clustering (default: 6) */
    minTurnsForClustering?: number;
    /** Maximum topics to identify (default: 5) */
    maxTopics?: number;
    /** Generate summaries for each topic (default: false) */
    generateSummaries?: boolean;
}

// ============================================================================
// System Prompts
// ============================================================================

const TOPIC_IDENTIFICATION_PROMPT = `You are a conversation topic analyzer. Your task is to identify distinct topics discussed in a conversation and group related messages.

Rules:
1. Identify the main topics/themes discussed
2. Assign each message to a topic (by index)
3. Topics should be concise labels (2-5 words)
4. Messages can only belong to ONE topic
5. Return max 5 topics
6. If a message doesn't fit any topic, mark it as unclustered

Respond with ONLY a JSON object:
{
  "topics": [
    {"topic": "Topic Name", "indices": [0, 1, 2], "importance": 0.8},
    {"topic": "Another Topic", "indices": [3, 4], "importance": 0.6}
  ],
  "unclustered": [5, 6]
}`;

const TOPIC_SUMMARY_PROMPT = `Summarize the following conversation segment about a specific topic. 
Be concise (2-3 sentences max). Focus on key decisions, outcomes, or learnings.

Topic: {topic}

Conversation:
{conversation}

Summary:`;

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: Required<TopicClustererConfig> = {
    minTurnsForClustering: 6,
    maxTopics: 5,
    generateSummaries: false,
};

// ============================================================================
// Topic Clusterer
// ============================================================================

export class TopicClusterer {
    private config: Required<TopicClustererConfig>;

    constructor(config?: TopicClustererConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Cluster conversation turns by topic
     */
    async cluster(conversation: ConversationTurn[]): Promise<ClusterResult> {
        // Skip if not enough turns
        if (conversation.length < this.config.minTurnsForClustering) {
            return {
                clusters: [],
                unclustered: conversation.map((_, i) => i),
                wasClustered: false,
            };
        }

        try {
            // Build conversation text for LLM
            const conversationText = conversation
                .map((turn, i) => `[${i}] ${turn.role.toUpperCase()}: ${turn.content.slice(0, 150)}`)
                .join('\n');

            const messages: AIMessage[] = [
                { role: 'system', content: TOPIC_IDENTIFICATION_PROMPT },
                { role: 'user', content: `Analyze this conversation:\n\n${conversationText}` }
            ];

            const response = await callGeminiAPI(messages);
            const result = this.parseClusterResponse(response, conversation.length);

            // Optionally generate summaries for each topic
            if (this.config.generateSummaries && result.clusters.length > 0) {
                await this.generateTopicSummaries(result.clusters, conversation);
            }

            return result;
        } catch (error) {
            console.error('[TopicClusterer] Clustering failed:', error);
            return {
                clusters: [],
                unclustered: conversation.map((_, i) => i),
                wasClustered: false,
            };
        }
    }

    /**
     * Generate summaries for each topic cluster
     */
    async generateTopicSummaries(
        clusters: TopicCluster[],
        conversation: ConversationTurn[]
    ): Promise<void> {
        for (const cluster of clusters) {
            try {
                const clusterConversation = cluster.turnIndices
                    .map(i => `${conversation[i].role.toUpperCase()}: ${conversation[i].content}`)
                    .join('\n\n');

                const prompt = TOPIC_SUMMARY_PROMPT
                    .replace('{topic}', cluster.topic)
                    .replace('{conversation}', clusterConversation);

                const messages: AIMessage[] = [
                    { role: 'user', content: prompt }
                ];

                const summary = await callGeminiAPI(messages);
                cluster.summary = summary.trim();
            } catch (error) {
                console.error(`[TopicClusterer] Summary generation failed for "${cluster.topic}":`, error);
                cluster.summary = undefined;
            }
        }
    }

    /**
     * Get topic-aware summary for compaction
     * Summarizes each topic separately, then combines
     */
    async getTopicAwareSummary(conversation: ConversationTurn[]): Promise<string> {
        const result = await this.cluster(conversation);

        if (!result.wasClustered || result.clusters.length === 0) {
            // Fallback: just concatenate all content
            return conversation.map(t => t.content).join('\n');
        }

        // Generate summaries if not already done
        if (!result.clusters[0].summary) {
            await this.generateTopicSummaries(result.clusters, conversation);
        }

        // Combine topic summaries
        const summaries = result.clusters
            .filter(c => c.summary)
            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
            .map(c => `**${c.topic}:** ${c.summary}`)
            .join('\n\n');

        return summaries || '[No topics identified]';
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private parseClusterResponse(response: string, conversationLength: number): ClusterResult {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackResult(conversationLength);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!Array.isArray(parsed.topics)) {
                return this.createFallbackResult(conversationLength);
            }

            const clusters: TopicCluster[] = parsed.topics
                .slice(0, this.config.maxTopics)
                .map((t: any) => ({
                    topic: String(t.topic || 'Unknown'),
                    turnIndices: Array.isArray(t.indices)
                        ? t.indices.filter((i: number) => i >= 0 && i < conversationLength)
                        : [],
                    importance: typeof t.importance === 'number'
                        ? Math.max(0, Math.min(1, t.importance))
                        : 0.5,
                }))
                .filter((c: TopicCluster) => c.turnIndices.length > 0);

            // Calculate unclustered
            const clusteredIndices = new Set(clusters.flatMap(c => c.turnIndices));
            const unclustered = Array.from({ length: conversationLength }, (_, i) => i)
                .filter(i => !clusteredIndices.has(i));

            return {
                clusters,
                unclustered,
                wasClustered: clusters.length > 0,
            };
        } catch {
            return this.createFallbackResult(conversationLength);
        }
    }

    private createFallbackResult(conversationLength: number): ClusterResult {
        return {
            clusters: [],
            unclustered: Array.from({ length: conversationLength }, (_, i) => i),
            wasClustered: false,
        };
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createTopicClusterer(config?: TopicClustererConfig): TopicClusterer {
    return new TopicClusterer(config);
}

export default TopicClusterer;
