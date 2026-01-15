/**
 * Orchestrator A2A Executor
 *
 * Exposes the multi-agent orchestration system via A2A protocol.
 * Allows external agents to submit PRDs and receive orchestrated results.
 */

import { v1 } from '@liquidcrypto/a2a-sdk';
import { BaseA2UIExecutor, type ExecutorA2UIMessage, type AgentExecutionContext, type AgentExecutionResult } from './base.js';
import {
  createSession,
  executeSession,
  getSession,
  getSessionStatus,
  cancelSession,
  getAllSessions,
  getOrchestratorStatus,
  estimateWork,
  type PRD,
} from '../../orchestrator/index.js';

// Helper to estimate time from complexity (1 minute per complexity point)
function estimateTimeMs(estimate: ReturnType<typeof estimateWork>): number {
  return estimate.totalComplexity * 60000;
}

// ============================================================================
// Types
// ============================================================================

interface OrchestratorCommand {
  action: 'create' | 'execute' | 'status' | 'cancel' | 'list' | 'info';
  sessionId?: string;
  prd?: PRD;
}

// ============================================================================
// Executor
// ============================================================================

export class OrchestratorExecutor extends BaseA2UIExecutor {
  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const text = this.extractText(message);
    const prompt = text.toLowerCase();
    const wantsUI = this.wantsA2UI(context);

    // Try to parse structured command from data part
    const dataPart = message.parts.find((p): p is v1.DataPart => v1.isDataPart(p));
    if (dataPart?.data) {
      const command = dataPart.data as unknown as OrchestratorCommand;
      return this.handleCommand(command, context, wantsUI);
    }

    // Natural language routing
    if (prompt.includes('create') && (prompt.includes('session') || prompt.includes('prd'))) {
      return this.handleCreateFromPrompt(text, context, wantsUI);
    }

    if (prompt.includes('execute') || prompt.includes('run')) {
      const sessionId = this.extractSessionId(prompt);
      if (sessionId) {
        return this.handleExecute(sessionId, context, wantsUI);
      }
    }

    if (prompt.includes('status')) {
      const sessionId = this.extractSessionId(prompt);
      if (sessionId) {
        return this.handleStatus(sessionId, context, wantsUI);
      }
    }

    if (prompt.includes('cancel')) {
      const sessionId = this.extractSessionId(prompt);
      if (sessionId) {
        return this.handleCancel(sessionId, context, wantsUI);
      }
    }

    if (prompt.includes('list') || prompt.includes('sessions')) {
      return this.handleList(context, wantsUI);
    }

    if (prompt.includes('info') || prompt.includes('orchestrator')) {
      return this.handleInfo(context, wantsUI);
    }

    // Default help response
    return this.handleHelp(context, wantsUI);
  }

  private async handleCommand(
    command: OrchestratorCommand,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): Promise<AgentExecutionResult> {
    switch (command.action) {
      case 'create':
        if (!command.prd) {
          return this.createErrorResponse(-32602, 'PRD required for create action');
        }
        return this.handleCreate(command.prd, context, wantsUI);

      case 'execute':
        if (!command.sessionId) {
          return this.createErrorResponse(-32602, 'sessionId required for execute action');
        }
        return this.handleExecute(command.sessionId, context, wantsUI);

      case 'status':
        if (!command.sessionId) {
          return this.createErrorResponse(-32602, 'sessionId required for status action');
        }
        return this.handleStatus(command.sessionId, context, wantsUI);

      case 'cancel':
        if (!command.sessionId) {
          return this.createErrorResponse(-32602, 'sessionId required for cancel action');
        }
        return this.handleCancel(command.sessionId, context, wantsUI);

      case 'list':
        return this.handleList(context, wantsUI);

      case 'info':
        return this.handleInfo(context, wantsUI);

      default:
        return this.createErrorResponse(-32602, `Unknown action: ${command.action}`);
    }
  }

  private handleCreate(
    prd: PRD,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const session = createSession(prd);
    const estimate = estimateWork(session.subPrds);

    const textResponse = `Created orchestration session ${session.id} with ${session.subPrds.length} specialist tasks. Estimated time: ${estimateTimeMs(estimate) / 1000}s`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'orchestrator',
        model: {
          session: {
            id: session.id,
            status: session.status,
            prdTitle: prd.title,
            subPrdCount: session.subPrds.length,
            createdAt: session.createdAt,
          },
          subPrds: session.subPrds.map(s => ({
            id: s.id,
            agentId: s.agentId,
            storyCount: s.stories.length,
            status: s.status,
          })),
          estimate,
        },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator',
        components: [
          { id: 'root', component: this.Card(['header', 'subprds', 'actions']) },
          { id: 'header', component: this.Column(['title', 'session-id', 'estimate']) },
          { id: 'title', component: this.Text(`Session: ${prd.title}`, 'h2') },
          { id: 'session-id', component: this.Text({ path: '/session/id' }, 'caption') },
          { id: 'estimate', component: this.Text(`Estimated: ${estimateTimeMs(estimate) / 1000}s`) },
          { id: 'subprds', component: this.List('/subPrds', ['subprd-row']) },
          { id: 'subprd-row', component: this.Row(['agent-name', 'story-count', 'status']) },
          { id: 'agent-name', component: this.Text({ path: 'agentId' }, 'label') },
          { id: 'story-count', component: this.Text({ path: 'storyCount' }) },
          { id: 'status', component: this.Text({ path: 'status' }) },
          { id: 'actions', component: this.Row(['execute-btn', 'cancel-btn']) },
          { id: 'execute-btn', component: this.Button('Execute Session', 'execute-session', 'primary') },
          { id: 'cancel-btn', component: this.Button('Cancel', 'cancel-session', 'secondary') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleCreateFromPrompt(
    _text: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    // Create a sample PRD for demonstration
    const samplePrd: PRD = {
      id: `prd_${Date.now()}`,
      title: 'Sample Feature Implementation',
      summary: 'Sample PRD created from natural language prompt',
      stories: [
        {
          id: 'story_1',
          title: 'UI Component',
          description: 'Create the UI component',
          acceptanceCriteria: ['Component renders', 'Accessible'],
          affectedFiles: ['src/components/Sample.tsx'],
          complexity: 2,
          domain: 'ui',
        },
        {
          id: 'story_2',
          title: 'API Endpoint',
          description: 'Create the API endpoint',
          acceptanceCriteria: ['Returns 200', 'Validates input'],
          affectedFiles: ['server/src/routes/sample.ts'],
          complexity: 3,
          domain: 'api',
        },
      ],
      createdAt: new Date().toISOString(),
      status: 'ready',
    };

    return this.handleCreate(samplePrd, context, wantsUI);
  }

  private async handleExecute(
    sessionId: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): Promise<AgentExecutionResult> {
    try {
      const results = await executeSession(sessionId);
      const session = getSession(sessionId);

      if (!session) {
        return this.createErrorResponse(-32602, `Session ${sessionId} not found`);
      }

      const successCount = results.filter(r => r.success).length;
      const textResponse = `Session ${sessionId} executed. ${successCount}/${results.length} tasks completed successfully.`;

      if (!wantsUI) {
        return this.createTextResponse(textResponse, context.contextId, context.taskId);
      }

      const a2ui: ExecutorA2UIMessage[] = [
        {
          type: 'beginRendering',
          surfaceId: 'orchestrator-results',
          rootComponentId: 'root',
          styling: { primaryColor: successCount === results.length ? '#22c55e' : '#ef4444' },
        },
        {
          type: 'setModel',
          surfaceId: 'orchestrator-results',
          model: {
            sessionId,
            status: session.status,
            results: results.map((r, i) => ({
              agentId: session.subPrds[i]?.agentId || 'unknown',
              success: r.success,
              filesModified: r.modifiedFiles.length,
              duration: r.duration,
            })),
            successCount,
            totalCount: results.length,
          },
        },
        {
          type: 'surfaceUpdate',
          surfaceId: 'orchestrator-results',
          components: [
            { id: 'root', component: this.Card(['header', 'summary', 'results-list']) },
            { id: 'header', component: this.Text('Execution Results', 'h2') },
            { id: 'summary', component: this.Row(['success-count', 'status-badge']) },
            { id: 'success-count', component: this.Text(`${successCount}/${results.length} tasks completed`) },
            { id: 'status-badge', component: this.Text({ path: '/status' }, 'label') },
            { id: 'results-list', component: this.List('/results', ['result-row']) },
            { id: 'result-row', component: this.Row(['result-agent', 'result-files', 'result-status']) },
            { id: 'result-agent', component: this.Text({ path: 'agentId' }, 'label') },
            { id: 'result-files', component: this.Text({ path: 'filesModified' }) },
            { id: 'result-status', component: this.Text({ path: 'success' }) },
          ],
        },
      ];

      return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
    } catch (error) {
      return this.createErrorResponse(
        -32603,
        error instanceof Error ? error.message : 'Execution failed'
      );
    }
  }

  private handleStatus(
    sessionId: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const status = getSessionStatus(sessionId);

    if (!status) {
      return this.createErrorResponse(-32602, `Session ${sessionId} not found`);
    }

    const textResponse = `Session ${sessionId}: ${status.status}. Progress: ${status.progress.completed}/${status.progress.total} completed, ${status.progress.failed} failed.`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator-status',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'orchestrator-status',
        model: {
          sessionId,
          ...status,
        },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator-status',
        components: [
          { id: 'root', component: this.Card(['header', 'progress', 'estimate']) },
          { id: 'header', component: this.Row(['title', 'status-badge']) },
          { id: 'title', component: this.Text('Session Status', 'h3') },
          { id: 'status-badge', component: this.Text({ path: '/status' }, 'label') },
          { id: 'progress', component: this.Column(['completed', 'pending', 'failed']) },
          { id: 'completed', component: this.Text(`Completed: ${status.progress.completed}`) },
          { id: 'pending', component: this.Text(`Pending: ${status.progress.pending}`) },
          { id: 'failed', component: this.Text(`Failed: ${status.progress.failed}`) },
          { id: 'estimate', component: this.Text(`Estimate: ${estimateTimeMs(status.estimate) / 1000}s`) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleCancel(
    sessionId: string,
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const cancelled = cancelSession(sessionId);

    if (!cancelled) {
      return this.createErrorResponse(-32602, `Session ${sessionId} not found`);
    }

    const textResponse = `Session ${sessionId} has been cancelled.`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator-cancelled',
        rootComponentId: 'root',
        styling: { primaryColor: '#ef4444' },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator-cancelled',
        components: [
          { id: 'root', component: this.Card(['message']) },
          { id: 'message', component: this.Text(`Session ${sessionId} cancelled`, 'h3') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleList(
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const sessions = getAllSessions();

    const textResponse = `Found ${sessions.length} orchestration sessions.`;

    if (!wantsUI) {
      const details = sessions
        .slice(0, 10)
        .map(s => `- ${s.id}: ${s.status} (${s.subPrds.length} tasks)`)
        .join('\n');
      return this.createTextResponse(
        `${textResponse}\n\n${details}`,
        context.contextId,
        context.taskId
      );
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator-list',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'orchestrator-list',
        model: {
          sessions: sessions.slice(0, 10).map(s => ({
            id: s.id,
            prdTitle: s.prd.title,
            status: s.status,
            taskCount: s.subPrds.length,
            createdAt: s.createdAt,
          })),
          total: sessions.length,
        },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator-list',
        components: [
          { id: 'root', component: this.Card(['header', 'session-list']) },
          { id: 'header', component: this.Row(['title', 'count']) },
          { id: 'title', component: this.Text('Orchestration Sessions', 'h3') },
          { id: 'count', component: this.Text({ path: '/total' }) },
          { id: 'session-list', component: this.List('/sessions', ['session-row']) },
          { id: 'session-row', component: this.Row(['session-id', 'session-title', 'session-status']) },
          { id: 'session-id', component: this.Text({ path: 'id' }, 'caption') },
          { id: 'session-title', component: this.Text({ path: 'prdTitle' }, 'label') },
          { id: 'session-status', component: this.Text({ path: 'status' }) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleInfo(
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const status = getOrchestratorStatus();

    const textResponse = `Orchestrator: ${status.activeSessions} active sessions, ${status.totalSessions} total. Parallel: ${status.config.parallelExecution}, Max concurrent: ${status.config.maxConcurrent}`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator-info',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'setModel',
        surfaceId: 'orchestrator-info',
        model: status,
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator-info',
        components: [
          { id: 'root', component: this.Card(['header', 'stats', 'config']) },
          { id: 'header', component: this.Text('Orchestrator Status', 'h3') },
          { id: 'stats', component: this.Row(['active', 'total']) },
          { id: 'active', component: this.Text(`Active: ${status.activeSessions}`) },
          { id: 'total', component: this.Text(`Total: ${status.totalSessions}`) },
          { id: 'config', component: this.Column(['parallel', 'concurrent', 'timeout']) },
          { id: 'parallel', component: this.Text(`Parallel: ${status.config.parallelExecution}`) },
          { id: 'concurrent', component: this.Text(`Max Concurrent: ${status.config.maxConcurrent}`) },
          { id: 'timeout', component: this.Text(`Timeout: ${status.config.agentTimeout}ms`) },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private handleHelp(
    context: AgentExecutionContext,
    wantsUI: boolean
  ): AgentExecutionResult {
    const textResponse = `Multi-Agent Orchestrator commands:
- Create session: Submit a PRD to create an orchestration session
- Execute session: Run all specialist agents for a session
- Status: Check session progress
- Cancel: Cancel a running session
- List: Show all sessions
- Info: Show orchestrator status`;

    if (!wantsUI) {
      return this.createTextResponse(textResponse, context.contextId, context.taskId);
    }

    const a2ui: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId: 'orchestrator-help',
        rootComponentId: 'root',
        styling: { primaryColor: '#6366f1' },
      },
      {
        type: 'surfaceUpdate',
        surfaceId: 'orchestrator-help',
        components: [
          { id: 'root', component: this.Card(['title', 'description', 'actions']) },
          { id: 'title', component: this.Text('Multi-Agent Orchestrator', 'h2') },
          { id: 'description', component: this.Text(textResponse) },
          { id: 'actions', component: this.Column(['create-btn', 'list-btn', 'info-btn']) },
          { id: 'create-btn', component: this.Button('Create Session', 'create-session', 'primary') },
          { id: 'list-btn', component: this.Button('List Sessions', 'list-sessions', 'secondary') },
          { id: 'info-btn', component: this.Button('Orchestrator Info', 'get-info', 'ghost') },
        ],
      },
    ];

    return this.createA2UIResponse(textResponse, a2ui, context.contextId, context.taskId);
  }

  private extractSessionId(text: string): string | null {
    // Match patterns like "session orch_123", "session: orch_123", etc.
    const patterns = [
      /session[:\s]+([a-zA-Z0-9_-]+)/i,
      /orch_\d+_[a-zA-Z0-9]+/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }
}

/**
 * Get the Orchestrator agent card
 */
export function getOrchestratorAgentCard(baseUrl: string): v1.AgentCard {
  return {
    name: 'Multi-Agent Orchestrator',
    url: baseUrl,
    version: '1.0.0',
    protocolVersions: ['1.0'],
    description: 'Orchestrates large development tasks across specialist AI agents',
    documentationUrl: `${baseUrl}/docs/orchestrator`,
    provider: {
      organization: 'LiquidCrypto',
      url: 'https://liquidcrypto.io',
    },
    capabilities: {
      streaming: true,
      pushNotifications: true,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: 'create-session',
        name: 'Create Orchestration Session',
        description: 'Create a new orchestration session from a PRD',
        tags: ['orchestration', 'prd', 'planning'],
        examples: ['Create a session for this PRD', 'Orchestrate this feature'],
      },
      {
        id: 'execute-session',
        name: 'Execute Session',
        description: 'Execute all specialist agents for a session',
        tags: ['orchestration', 'execution', 'agents'],
        examples: ['Execute session orch_123', 'Run the orchestration'],
      },
      {
        id: 'session-status',
        name: 'Session Status',
        description: 'Check the status and progress of an orchestration session',
        tags: ['orchestration', 'status', 'monitoring'],
        examples: ['Status of session orch_123', 'How is the orchestration going?'],
      },
      {
        id: 'list-sessions',
        name: 'List Sessions',
        description: 'List all orchestration sessions',
        tags: ['orchestration', 'list', 'sessions'],
        examples: ['List all sessions', 'Show orchestrations'],
      },
    ],
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
  };
}

export default OrchestratorExecutor;
