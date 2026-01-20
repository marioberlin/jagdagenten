/**
 * NLWebOrchestrator.ts
 * 
 * Core orchestrator for the Secure NLWeb pipeline.
 * Manages parallel pre-processing and decision gating.
 */

import { GeminiProxyService } from '../../services/proxy/gemini';
import {
    runDeterministicFilters,
    createCustomFilter,
    GUARD_DOG_SYSTEM_PROMPT,
    SAFETY_THRESHOLD,
    parseGuardDogResponse,
    getRefusalMessage,
    type FilterResult,
    type GuardDogResult
} from '../security';
import {
    DECONTEXTUALIZER_SYSTEM_PROMPT,
    buildDecontextualizerPrompt,
    needsDecontextualization,
    type ConversationTurn,
    type DecontextualizeResult
} from './Decontextualizer';

// ============================================================================
// TYPES
// ============================================================================

export type PipelineStage =
    | 'idle'
    | 'filtering'        // Layer 0: Deterministic checks
    | 'analyzing'        // Layer 1: Parallel pre-processing (Guard Dog + Decontextualizer)
    | 'retrieving'       // Layer 2: Knowledge retrieval
    | 'synthesizing'     // Layer 3: Main agent response
    | 'blocked'          // Request was blocked
    | 'complete';

export interface SecureSession {
    sessionId: string;
    preferredLanguage: string | null;
    userPreferences: Record<string, string>;
    blockedAttempts: number;
    lastActive: number;
}

export interface PreProcessingResult {
    guardDog: GuardDogResult;
    decontextualized: DecontextualizeResult;
    memoryContext: Record<string, string>;
}

export interface OrchestratorConfig {
    geminiService: GeminiProxyService;
    session: SecureSession;
    conversationHistory: ConversationTurn[];
    knowledgeBase?: string[];       // Schema.org JSON-LD or plain text from Settings
    customBlacklist?: string[];     // Custom security filter phrases from Settings
    onStageChange?: (stage: PipelineStage, message: string) => void;
}

export interface OrchestratorResult {
    success: boolean;
    blocked: boolean;
    refusalMessage?: string;
    resolvedQuery?: string;
    retrievedContext?: string[];
    stage: PipelineStage;
    session: SecureSession;         // Updated session state
}

// ============================================================================
// STAGE DISPLAY MESSAGES (Jolly/Abstract)
// ============================================================================

const STAGE_MESSAGES: Record<PipelineStage, string> = {
    idle: '',
    filtering: 'Warming up...',
    analyzing: 'Connecting the dots...',
    retrieving: 'Exploring...',
    synthesizing: 'Crafting your answer...',
    blocked: "Let's try something else!",
    complete: '',
};

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class NLWebOrchestrator {
    private geminiService: GeminiProxyService;
    private session: SecureSession;
    private conversationHistory: ConversationTurn[];
    private knowledgeBase: string[];
    private customBlacklist: string[];
    private onStageChange?: (stage: PipelineStage, message: string) => void;

    constructor(config: OrchestratorConfig) {
        this.geminiService = config.geminiService;
        this.session = config.session;
        this.conversationHistory = config.conversationHistory;
        this.knowledgeBase = config.knowledgeBase || [];
        this.customBlacklist = config.customBlacklist || [];
        this.onStageChange = config.onStageChange;
    }

    /**
     * Main entry point: Process a user query through the Secure NLWeb pipeline.
     */
    async process(query: string): Promise<OrchestratorResult> {
        // =====================================================================
        // LAYER 0: Deterministic Filters (instant, no LLM)
        // =====================================================================
        this.setStage('filtering');

        // Use custom filter if blacklist has items, otherwise use standard
        const runFilters = this.customBlacklist.length > 0
            ? createCustomFilter(this.customBlacklist)
            : runDeterministicFilters;
        const filterResult = runFilters(query);
        if (!filterResult.passed) {
            console.warn('[NLWeb] Blocked by deterministic filter:', filterResult.matchedPattern);
            return this.createBlockedResult(filterResult);
        }

        // =====================================================================
        // LAYER 1: Parallel Pre-processing (Fan-out)
        // =====================================================================
        this.setStage('analyzing');

        const preProcessingResult = await this.runParallelPreProcessing(query);

        // =====================================================================
        // DECISION GATE: Check Guard Dog result
        // =====================================================================
        if (preProcessingResult.guardDog.safety_score < SAFETY_THRESHOLD) {
            console.warn('[NLWeb] Blocked by Guard Dog:', preProcessingResult.guardDog);
            this.session.blockedAttempts++;
            return this.createBlockedResult(undefined, preProcessingResult.guardDog);
        }

        // Update session with language preference
        this.updateSessionLanguage(preProcessingResult.guardDog);

        // =====================================================================
        // LAYER 2: Retrieval (if knowledge base configured)
        // =====================================================================
        this.setStage('retrieving');

        const retrievedContext = await this.retrieveKnowledge(
            preProcessingResult.decontextualized.resolvedQuery
        );

        // =====================================================================
        // Return pre-synthesis result (Main Agent call happens in the hook)
        // =====================================================================
        this.setStage('synthesizing');

        return {
            success: true,
            blocked: false,
            resolvedQuery: preProcessingResult.decontextualized.resolvedQuery,
            retrievedContext,
            stage: 'synthesizing',
            session: this.session,
        };
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    private setStage(stage: PipelineStage): void {
        this.onStageChange?.(stage, STAGE_MESSAGES[stage]);
    }

    private async runParallelPreProcessing(query: string): Promise<PreProcessingResult> {
        // Run Guard Dog and Decontextualizer in parallel
        const [guardDogResult, decontextResult] = await Promise.all([
            this.runGuardDog(query),
            this.runDecontextualizer(query),
        ]);

        // Memory access is synchronous (localStorage)
        const memoryContext = this.accessMemory();

        return {
            guardDog: guardDogResult,
            decontextualized: decontextResult,
            memoryContext,
        };
    }

    private async runGuardDog(query: string): Promise<GuardDogResult> {
        try {
            const response = await this.geminiService.chat(
                query,
                GUARD_DOG_SYSTEM_PROMPT,
                { temperature: 0.1 } // Low temperature for consistent classification
            );
            return parseGuardDogResponse(response);
        } catch (error) {
            console.error('[GuardDog] LLM call failed:', error);
            // Fail-open with uncertain score (will likely pass but flag for review)
            return {
                safety_score: 50,
                risk_category: 'none',
                detected_language: 'unknown',
                language_confidence: 0,
            };
        }
    }

    private async runDecontextualizer(query: string): Promise<DecontextualizeResult> {
        // Skip if query doesn't need decontextualization
        if (!needsDecontextualization(query) || this.conversationHistory.length === 0) {
            return { originalQuery: query, resolvedQuery: query, wasResolved: false };
        }

        try {
            const prompt = buildDecontextualizerPrompt(query, this.conversationHistory);
            const response = await this.geminiService.chat(
                prompt,
                DECONTEXTUALIZER_SYSTEM_PROMPT,
                { temperature: 0.3 }
            );

            const resolvedQuery = response.trim();
            return {
                originalQuery: query,
                resolvedQuery: resolvedQuery || query,
                wasResolved: resolvedQuery !== query,
            };
        } catch (error) {
            console.error('[Decontextualizer] LLM call failed:', error);
            return { originalQuery: query, resolvedQuery: query, wasResolved: false };
        }
    }

    private accessMemory(): Record<string, string> {
        // Combine session preferences with any localStorage-based memory
        return { ...this.session.userPreferences };
    }

    private async retrieveKnowledge(query: string): Promise<string[]> {
        // For now, return the static knowledge base from Settings
        // TODO: Integrate with GlassFileSearch for vector retrieval
        if (this.knowledgeBase.length === 0) {
            return [];
        }

        // Simple keyword matching for now (can be enhanced with embeddings)
        const queryTerms = query.toLowerCase().split(/\s+/);
        return this.knowledgeBase.filter(item => {
            const itemLower = item.toLowerCase();
            return queryTerms.some(term => itemLower.includes(term));
        });
    }

    private updateSessionLanguage(guardDog: GuardDogResult): void {
        // Only update if confidence is high enough
        if (guardDog.language_confidence > 0.7 && guardDog.detected_language !== 'unknown') {
            this.session.preferredLanguage = guardDog.detected_language;
        }
        this.session.lastActive = Date.now();
    }

    private createBlockedResult(
        _filterResult?: FilterResult,
        guardDogResult?: GuardDogResult
    ): OrchestratorResult {
        const language = this.session.preferredLanguage ||
            guardDogResult?.detected_language ||
            'en';

        this.setStage('blocked');

        return {
            success: false,
            blocked: true,
            refusalMessage: getRefusalMessage(language),
            stage: 'blocked',
            session: this.session,
        };
    }
}
