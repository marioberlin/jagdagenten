/**
 * NLWeb Module Index
 * 
 * Exports the Secure NLWeb pipeline components.
 */

export { NLWebOrchestrator, type PipelineStage, type SecureSession, type OrchestratorConfig, type OrchestratorResult } from './NLWebOrchestrator';
export {
    DECONTEXTUALIZER_SYSTEM_PROMPT,
    buildDecontextualizerPrompt,
    buildHistoryContext,
    needsDecontextualization,
    type ConversationTurn,
    type DecontextualizeResult
} from './Decontextualizer';
export {
    useSecureNLWeb,
    type UseSecureNLWebOptions,
    type UseSecureNLWebReturn,
    type SecureNLWebState,
    type SynthesisContext
} from './useSecureNLWeb';
export {
    createSession,
    loadSession,
    saveSession,
    clearSession,
    getPreference,
    setPreference,
    removePreference,
    detectMemoryRequest
} from './SecureSession';
