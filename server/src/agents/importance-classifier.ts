/**
 * Importance Classifier
 * 
 * LLM-powered classifier that scores conversation turns for memory importance.
 * Modeled after the Guard Dog pattern from NLWEB pipeline.
 * 
 * Runs eagerly during conversation to provide real-time importance scoring.
 */

import { callGeminiAPI } from '../ai/gemini.js';
import type { AIMessage } from '../ai/types.js';

// ============================================================================
// Types
// ============================================================================

export type MemoryCategory =
    | 'observation'   // Something noticed about user or their work
    | 'learning'      // Technique, approach, or knowledge gained
    | 'preference'    // User preferences or working styles
    | 'fact'          // Concrete facts about projects, systems, or domain
    | 'correction'    // Mistakes to avoid or corrections
    | 'none';         // Not worth remembering

export interface ImportanceResult {
    /** Importance score from 0-100 */
    importance_score: number;
    /** Category of the memory */
    category: MemoryCategory;
    /** Confidence in the classification (0-1) */
    confidence: number;
    /** Optional brief rationale */
    rationale?: string;
    /** Whether this should be persisted (score >= threshold) */
    should_persist: boolean;
    /** Original content that was classified */
    original_content: string;
}

export interface ClassifierConfig {
    /** Threshold for persistence (default: 60) */
    importanceThreshold?: number;
    /** Include rationale in response (default: false, saves tokens) */
    includeRationale?: boolean;
    /** Maximum tokens per classification (default: 150) */
    maxTokens?: number;
}

// ============================================================================
// System Prompt
// ============================================================================

const IMPORTANCE_CLASSIFIER_PROMPT = `You are a memory importance classifier. Your task is to evaluate conversation content and determine if it should be saved to long-term memory.

Score each piece of content from 0-100 based on:
- 90-100: Critical facts, corrections to previous understanding, explicit user preferences
- 70-89: Useful learnings, project-specific knowledge, patterns worth remembering
- 50-69: Moderately useful observations, context that might help later
- 30-49: Low value, transient information
- 0-29: Not worth remembering, routine exchanges

Categories:
- observation: Something noticed about user or their work
- learning: Technique, approach, or knowledge gained
- preference: User preferences or working styles  
- fact: Concrete facts about projects, systems, or domain
- correction: Mistakes to avoid or corrections to previous understanding
- none: Not worth remembering

Respond with ONLY a JSON object:
{"score": <0-100>, "category": "<category>", "confidence": <0-1>}`;

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: Required<ClassifierConfig> = {
    importanceThreshold: 60,
    includeRationale: false,
    maxTokens: 150,
};

// ============================================================================
// Importance Classifier
// ============================================================================

export class ImportanceClassifier {
    private config: Required<ClassifierConfig>;

    constructor(config?: ClassifierConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Classify a single piece of content
     */
    async classify(content: string): Promise<ImportanceResult> {
        if (!content || content.trim().length < 10) {
            return this.createEmptyResult(content);
        }

        try {
            const messages: AIMessage[] = [
                { role: 'system', content: IMPORTANCE_CLASSIFIER_PROMPT },
                { role: 'user', content: `Classify this content:\n\n${content.slice(0, 500)}` }
            ];

            const response = await callGeminiAPI(messages);
            return this.parseResponse(response, content);
        } catch (error) {
            console.error('[ImportanceClassifier] Classification failed:', error);
            return this.createFallbackResult(content);
        }
    }

    /**
     * Classify multiple pieces of content in a batch (more token efficient)
     */
    async classifyBatch(contents: string[]): Promise<ImportanceResult[]> {
        if (contents.length === 0) return [];

        // For small batches, classify individually
        if (contents.length <= 2) {
            return Promise.all(contents.map(c => this.classify(c)));
        }

        // For larger batches, use batch prompt
        try {
            const batchPrompt = contents
                .slice(0, 10) // Limit to 10 items per batch
                .map((c, i) => `[${i}] ${c.slice(0, 200)}`)
                .join('\n\n');

            const messages: AIMessage[] = [
                { role: 'system', content: IMPORTANCE_CLASSIFIER_PROMPT + '\n\nFor multiple items, respond with a JSON array of objects in order.' },
                { role: 'user', content: `Classify these items:\n\n${batchPrompt}` }
            ];

            const response = await callGeminiAPI(messages);
            return this.parseBatchResponse(response, contents);
        } catch (error) {
            console.error('[ImportanceClassifier] Batch classification failed:', error);
            // Fallback to individual classification
            return Promise.all(contents.map(c => this.classify(c)));
        }
    }

    /**
     * Quick heuristic check (no LLM) - useful for pre-filtering
     */
    quickCheck(content: string): { likelyImportant: boolean; reason?: string } {
        const lowerContent = content.toLowerCase();

        // High-importance patterns
        const highPatterns = [
            { pattern: /\[remember\]|\[important\]/i, reason: 'explicit marker' },
            { pattern: /i prefer|i always|i never|i don't like/i, reason: 'preference statement' },
            { pattern: /that's wrong|actually,|correction:|that's not correct/i, reason: 'correction' },
            { pattern: /the key (thing|insight|learning)/i, reason: 'key insight' },
            { pattern: /always use|never use|make sure to/i, reason: 'instruction' },
        ];

        for (const { pattern, reason } of highPatterns) {
            if (pattern.test(lowerContent)) {
                return { likelyImportant: true, reason };
            }
        }

        // Low-importance patterns
        const lowPatterns = [
            /^(ok|okay|sure|thanks|got it|understood)\.?$/i,
            /^(yes|no|maybe)\.?$/i,
        ];

        for (const pattern of lowPatterns) {
            if (pattern.test(content.trim())) {
                return { likelyImportant: false, reason: 'routine response' };
            }
        }

        return { likelyImportant: false };
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private parseResponse(response: string, originalContent: string): ImportanceResult {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/\{[\s\S]*?\}/);
            if (!jsonMatch) {
                return this.createFallbackResult(originalContent);
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const score = Math.max(0, Math.min(100, parsed.score || 0));
            const category = this.validateCategory(parsed.category);
            const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

            return {
                importance_score: score,
                category,
                confidence,
                rationale: parsed.rationale,
                should_persist: score >= this.config.importanceThreshold,
                original_content: originalContent,
            };
        } catch {
            return this.createFallbackResult(originalContent);
        }
    }

    private parseBatchResponse(response: string, originalContents: string[]): ImportanceResult[] {
        try {
            // Extract JSON array from response
            const jsonMatch = response.match(/\[[\s\S]*?\]/);
            if (!jsonMatch) {
                return originalContents.map(c => this.createFallbackResult(c));
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return originalContents.map((content, i) => {
                const item = parsed[i] || {};
                const score = Math.max(0, Math.min(100, item.score || 0));
                const category = this.validateCategory(item.category);
                const confidence = Math.max(0, Math.min(1, item.confidence || 0.5));

                return {
                    importance_score: score,
                    category,
                    confidence,
                    should_persist: score >= this.config.importanceThreshold,
                    original_content: content,
                };
            });
        } catch {
            return originalContents.map(c => this.createFallbackResult(c));
        }
    }

    private validateCategory(category: string | undefined): MemoryCategory {
        const validCategories: MemoryCategory[] = ['observation', 'learning', 'preference', 'fact', 'correction', 'none'];
        if (category && validCategories.includes(category as MemoryCategory)) {
            return category as MemoryCategory;
        }
        return 'none';
    }

    private createEmptyResult(content: string): ImportanceResult {
        return {
            importance_score: 0,
            category: 'none',
            confidence: 1,
            should_persist: false,
            original_content: content,
        };
    }

    private createFallbackResult(content: string): ImportanceResult {
        // Use quick heuristics as fallback
        const quick = this.quickCheck(content);
        return {
            importance_score: quick.likelyImportant ? 65 : 30,
            category: quick.likelyImportant ? 'observation' : 'none',
            confidence: 0.3,
            should_persist: quick.likelyImportant,
            original_content: content,
        };
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createImportanceClassifier(config?: ClassifierConfig): ImportanceClassifier {
    return new ImportanceClassifier(config);
}

export default ImportanceClassifier;
