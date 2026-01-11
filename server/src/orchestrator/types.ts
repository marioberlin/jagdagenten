/**
 * Multi-Agent Orchestration Types
 *
 * Defines types for the orchestration system that splits
 * large tasks among specialist agents.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.3 Multi-Agent Orchestration
 */

/**
 * PRD Story for task decomposition
 */
export interface PRDStory {
    /** Unique story ID */
    id: string;
    /** Story title */
    title: string;
    /** Detailed description */
    description: string;
    /** Acceptance criteria */
    acceptanceCriteria: string[];
    /** Affected files */
    affectedFiles: string[];
    /** Estimated complexity (1-5) */
    complexity: number;
    /** Domain category */
    domain: 'ui' | 'api' | 'security' | 'test' | 'infrastructure' | 'general';
}

/**
 * Product Requirements Document
 */
export interface PRD {
    /** Unique PRD ID */
    id: string;
    /** PRD title */
    title: string;
    /** Summary description */
    summary: string;
    /** Individual stories */
    stories: PRDStory[];
    /** Creation timestamp */
    createdAt: string;
    /** PRD status */
    status: 'draft' | 'ready' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Agent specialization domains
 */
export type AgentDomain = 'ui' | 'api' | 'security' | 'test' | 'orchestrator' | 'merger';

/**
 * Specialist agent definition
 */
export interface SpecialistAgent {
    /** Agent ID */
    id: string;
    /** Agent name */
    name: string;
    /** Specialization domain */
    domain: AgentDomain;
    /** System prompt for the agent */
    systemPrompt: string;
    /** File patterns this agent can work on */
    filePatterns: string[];
    /** Priority (higher = more preferred for ambiguous tasks) */
    priority: number;
}

/**
 * Sub-PRD assigned to a specialist
 */
export interface SubPRD {
    /** Unique sub-PRD ID */
    id: string;
    /** Parent PRD ID */
    parentPrdId: string;
    /** Assigned agent */
    agentId: string;
    /** Stories assigned to this agent */
    stories: PRDStory[];
    /** Status */
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    /** Result of the work */
    result?: AgentWorkResult;
    /** Created timestamp */
    createdAt: string;
    /** Updated timestamp */
    updatedAt: string;
}

/**
 * Result of agent work
 */
export interface AgentWorkResult {
    /** Whether work was successful */
    success: boolean;
    /** Files modified */
    modifiedFiles: string[];
    /** Git branch name */
    branchName?: string;
    /** Commit hashes */
    commits: string[];
    /** Any errors encountered */
    errors: string[];
    /** Work duration in ms */
    duration: number;
}

/**
 * Orchestration session
 */
export interface OrchestrationSession {
    /** Session ID */
    id: string;
    /** Original PRD */
    prd: PRD;
    /** Sub-PRDs by agent */
    subPrds: SubPRD[];
    /** Session status */
    status: 'decomposing' | 'executing' | 'merging' | 'verifying' | 'completed' | 'failed';
    /** Main branch name */
    mainBranch: string;
    /** Feature branch name */
    featureBranch: string;
    /** Merge result */
    mergeResult?: MergeResult;
    /** Verification result */
    verificationResult?: VerificationResult;
    /** Created timestamp */
    createdAt: string;
    /** Updated timestamp */
    updatedAt: string;
}

/**
 * Result of merging agent work
 */
export interface MergeResult {
    /** Whether merge was successful */
    success: boolean;
    /** Merged files */
    mergedFiles: string[];
    /** Conflicts that were resolved */
    resolvedConflicts: string[];
    /** Conflicts that couldn't be resolved */
    unresolvedConflicts: string[];
    /** Merge duration in ms */
    duration: number;
}

/**
 * Result of verification
 */
export interface VerificationResult {
    /** Whether verification passed */
    passed: boolean;
    /** Tests run */
    testsRun: number;
    /** Tests passed */
    testsPassed: number;
    /** Tests failed */
    testsFailed: number;
    /** Lint issues found */
    lintIssues: number;
    /** Type errors found */
    typeErrors: number;
    /** Issues that need attention */
    issues: string[];
}

/**
 * Decomposition strategy
 */
export interface DecompositionStrategy {
    /** Strategy name */
    name: string;
    /** How to split stories */
    splitBy: 'domain' | 'file' | 'complexity' | 'dependency';
    /** Maximum stories per agent */
    maxStoriesPerAgent: number;
    /** Whether to allow parallel execution */
    allowParallel: boolean;
}

/**
 * Agent execution context
 */
export interface AgentContext {
    /** Session ID */
    sessionId: string;
    /** Sub-PRD being worked on */
    subPrd: SubPRD;
    /** Working directory */
    workingDir: string;
    /** Branch to work on */
    branchName: string;
    /** Environment variables */
    env: Record<string, string>;
    /** Timeout in ms */
    timeout: number;
}

/**
 * Orchestrator events
 */
export type OrchestratorEvent =
    | { type: 'session_started'; sessionId: string }
    | { type: 'decomposition_complete'; subPrdCount: number }
    | { type: 'agent_started'; agentId: string; subPrdId: string }
    | { type: 'agent_completed'; agentId: string; success: boolean }
    | { type: 'merge_started' }
    | { type: 'merge_completed'; success: boolean }
    | { type: 'verification_started' }
    | { type: 'verification_completed'; passed: boolean }
    | { type: 'session_completed'; success: boolean }
    | { type: 'error'; error: string };

/**
 * Event handler for orchestration
 */
export type OrchestratorEventHandler = (event: OrchestratorEvent) => void;
