/**
 * Builder Executor
 *
 * A2A executor that handles build requests, status queries, and history.
 * Routes natural language to the BuilderOrchestrator for app creation.
 */

import { randomUUID } from 'crypto';
import { v1 } from '@liquidcrypto/a2a-sdk';
import {
  BaseA2UIExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type ExecutorA2UIMessage,
} from './base.js';
import { BuilderOrchestrator } from '../../builder/orchestrator.js';
import type { BuildRequest, BuildRecord } from '../../builder/types.js';

const BUILD_KEYWORDS = ['build', 'create', 'scaffold', 'make', 'generate', 'new app'];
const STATUS_KEYWORDS = ['status', 'progress', 'how is', 'build going'];
const HISTORY_KEYWORDS = ['history', 'past builds', 'previous', 'list builds'];
const EDIT_KEYWORDS = ['edit', 'update', 'modify', 'change', 'fix'];

export function getBuilderAgentCard(baseUrl: string): v1.AgentCard {
  return {
    name: 'LiquidOS Builder',
    description: 'AI-powered app builder for LiquidOS. Creates full-stack apps from natural language descriptions.',
    supportedInterfaces: [
      { url: `${baseUrl}/a2a`, protocolBinding: 'JSONRPC' },
    ],
    skills: [
      {
        id: 'build-app',
        name: 'Build App',
        description: 'Create a new LiquidOS app from a natural language description',
        tags: ['build', 'create', 'scaffold', 'app', 'generate'],
        examples: [
          'Build a weather dashboard',
          'Create a task manager app with AI assistant',
          'Make a crypto alerts dashboard with real-time prices',
        ],
      },
      {
        id: 'edit-app',
        name: 'Edit App',
        description: 'Modify an existing app with full build history context',
        tags: ['edit', 'update', 'modify', 'change'],
        examples: [
          'Add dark mode to crypto-alerts',
          'Update the weather app layout',
        ],
      },
      {
        id: 'build-status',
        name: 'Build Status',
        description: 'Check status of an active build',
        tags: ['status', 'progress'],
        examples: [
          'How is my build going?',
          'Build status',
        ],
      },
      {
        id: 'build-history',
        name: 'Build History',
        description: 'View past builds and manage RAG corpora',
        tags: ['history', 'past', 'builds'],
        examples: [
          'Show my past builds',
          'List build history',
        ],
      },
    ],
  };
}

export class BuilderExecutor extends BaseA2UIExecutor {
  private orchestrator = new BuilderOrchestrator();
  private pendingApprovals: Map<string, string> = new Map(); // contextId -> buildId

  async execute(
    message: v1.Message,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const text = this.extractText(message);
    const lower = text.toLowerCase();

    // Check for approval of pending build
    const contextId = context.metadata?.contextId as string | undefined;
    if (contextId && this.pendingApprovals.has(contextId)) {
      if (lower.includes('approve') || lower.includes('yes') || lower.includes('confirm')) {
        return this.handleApproval(contextId, context);
      }
      if (lower.includes('cancel') || lower.includes('no') || lower.includes('reject')) {
        this.pendingApprovals.delete(contextId);
        return this.createTextResponse('Build cancelled.', contextId);
      }
    }

    // Intent matching
    if (this.matchesIntent(lower, STATUS_KEYWORDS)) {
      return this.handleStatus(context);
    }
    if (this.matchesIntent(lower, HISTORY_KEYWORDS)) {
      return this.handleHistory(context);
    }
    if (this.matchesIntent(lower, EDIT_KEYWORDS)) {
      return this.handleEdit(text, context);
    }
    if (this.matchesIntent(lower, BUILD_KEYWORDS) || lower.length > 20) {
      return this.handleBuild(text, context);
    }

    return this.handleHelp(context);
  }

  private async handleBuild(
    text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;
    const request = this.parseBuildRequest(text);
    const record = await this.orchestrator.createBuild(request);

    // Store pending approval
    if (contextId) {
      this.pendingApprovals.set(contextId, record.id);
    }

    if (this.wantsA2UI(context)) {
      return this.createBuildPlanA2UI(record, contextId);
    }

    return this.createTextResponse(
      `Build plan created for "${record.appId}".\n\n` +
      `Build ID: ${record.id}\n` +
      `Phase: ${record.phase}\n\n` +
      `Reply "approve" to start building, or "cancel" to abort.`,
      contextId
    );
  }

  private async handleApproval(
    contextId: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const buildId = this.pendingApprovals.get(contextId)!;
    this.pendingApprovals.delete(contextId);

    // Start build execution (non-blocking — returns immediately)
    this.orchestrator.executeBuild(buildId).catch(() => {});

    if (this.wantsA2UI(context)) {
      return this.createBuildProgressA2UI(buildId, contextId);
    }

    return this.createTextResponse(
      `Build ${buildId} started. Use "build status" to check progress.`,
      contextId
    );
  }

  private async handleStatus(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;
    const builds = this.orchestrator.listBuilds();
    const active = builds.filter(b => b.phase !== 'complete' && b.phase !== 'failed');

    if (active.length === 0) {
      return this.createTextResponse('No active builds.', contextId);
    }

    const statusLines = active.map(b =>
      `${b.appId}: ${b.phase} (${b.progress.completed}/${b.progress.total} stories)`
    );

    return this.createTextResponse(
      `Active builds:\n${statusLines.join('\n')}`,
      contextId
    );
  }

  private async handleHistory(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;
    const builds = this.orchestrator.listBuilds();

    if (builds.length === 0) {
      return this.createTextResponse('No build history yet.', contextId);
    }

    const lines = builds.map(b =>
      `${b.appId} | ${b.phase} | ${b.createdAt}`
    );

    return this.createTextResponse(
      `Build history:\n${lines.join('\n')}`,
      contextId
    );
  }

  private async handleEdit(
    _text: string,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    const contextId = context.metadata?.contextId as string | undefined;
    return this.createTextResponse(
      'Edit mode will be available in a future update. ' +
      'For now, you can start a new build with your updated requirements.',
      contextId
    );
  }

  private handleHelp(context: AgentExecutionContext): AgentExecutionResult {
    const contextId = context.metadata?.contextId as string | undefined;
    return this.createTextResponse(
      'LiquidOS Builder - AI-powered app creation\n\n' +
      'Commands:\n' +
      '- "Build [description]" - Create a new app\n' +
      '- "Build status" - Check active builds\n' +
      '- "Build history" - View past builds\n' +
      '- "Edit [app-id] [changes]" - Modify existing app\n\n' +
      'Example: "Build a crypto alerts dashboard with real-time WebSocket prices"',
      contextId
    );
  }

  private parseBuildRequest(text: string): BuildRequest {
    const lower = text.toLowerCase();
    const description = text
      .replace(/^(build|create|make|scaffold|generate)\s+(me\s+)?/i, '')
      .replace(/^(a|an)\s+/i, '')
      .trim();

    return {
      description: description || text,
      hasAgent: lower.includes('agent') || lower.includes('ai') || lower.includes('assistant'),
      hasResources: lower.includes('resource') || lower.includes('knowledge') || lower.includes('memory'),
      hasCustomComponents: lower.includes('custom component') || lower.includes('new component'),
      category: this.inferCategory(lower),
      researchMode: lower.includes('deep research') || lower.includes('research') ? 'deep' : 'standard',
    };
  }

  private inferCategory(text: string): BuildRequest['category'] {
    if (text.includes('finance') || text.includes('crypto') || text.includes('trading')) return 'finance';
    if (text.includes('developer') || text.includes('code') || text.includes('debug')) return 'developer';
    if (text.includes('media') || text.includes('video') || text.includes('music')) return 'media';
    if (text.includes('demo') || text.includes('example')) return 'demo';
    return 'productivity';
  }

  private matchesIntent(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }

  private createBuildPlanA2UI(
    record: BuildRecord,
    contextId?: string
  ): AgentExecutionResult {
    const surfaceId = randomUUID();

    const messages: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId,
        rootComponentId: 'plan-root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId,
        components: [
          {
            id: 'plan-root',
            component: this.Column(['header', 'details', 'actions'], { gap: 16 }),
          },
          {
            id: 'header',
            component: this.Text(`Build Plan: ${record.appId}`, 'heading'),
          },
          {
            id: 'details',
            component: this.Column(['desc', 'phase-text']),
          },
          {
            id: 'desc',
            component: this.Text(record.request.description),
          },
          {
            id: 'phase-text',
            component: this.Text(`Phase: ${record.phase} | Build ID: ${record.id}`),
          },
          {
            id: 'actions',
            component: this.Row(['approve-btn', 'cancel-btn'], { gap: 8 }),
          },
          {
            id: 'approve-btn',
            component: this.Button('Approve & Build', 'approve-build', 'primary'),
          },
          {
            id: 'cancel-btn',
            component: this.Button('Cancel', 'cancel-build', 'ghost'),
          },
        ],
      },
      {
        type: 'setModel',
        surfaceId,
        model: {
          buildId: record.id,
          appId: record.appId,
          phase: record.phase,
          description: record.request.description,
        },
      },
    ];

    return this.createA2UIResponse(
      `Build plan created for "${record.appId}". Review and approve to start building.`,
      messages,
      contextId
    );
  }

  private createBuildProgressA2UI(
    buildId: string,
    contextId?: string
  ): AgentExecutionResult {
    const surfaceId = randomUUID();

    const messages: ExecutorA2UIMessage[] = [
      {
        type: 'beginRendering',
        surfaceId,
        rootComponentId: 'progress-root',
      },
      {
        type: 'surfaceUpdate',
        surfaceId,
        components: [
          {
            id: 'progress-root',
            component: this.Column(['progress-header', 'progress-status']),
          },
          {
            id: 'progress-header',
            component: this.Text('Build In Progress', 'heading'),
          },
          {
            id: 'progress-status',
            component: this.Text(`Build ${buildId} is executing. Check status for updates.`),
          },
        ],
      },
    ];

    return this.createA2UIResponse(
      `Build ${buildId} started successfully.`,
      messages,
      contextId
    );
  }
}
