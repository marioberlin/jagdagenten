/**
 * Builder Container Runner
 *
 * Executes Claude CLI sessions inside Docker containers for isolated,
 * sandboxed builds. Uses the existing ContainerPool infrastructure.
 */

import type { ContainerPool } from '../container/pool.js';
import type {
  BuildRecord,
  RalphStory,
} from './types.js';

export interface BuilderContainerConfig {
  workDir: string;
  sessionsDir: string;
  prompt: string;
  model?: string;
  maxTurns?: number;
  allowedTools?: string[];
  sessionId?: string;
  timeout?: number;
}

export interface BuilderContainerResult {
  success: boolean;
  output: string;
  sessionId?: string;
  exitCode: number;
  durationMs: number;
  error?: string;
}

export interface IterationResult {
  success: boolean;
  storyId: string;
  output: string;
  durationMs: number;
  error?: string;
}

/**
 * Runs Builder tasks inside Docker containers using the Claude CLI.
 * Provides OS-level isolation for long-running or untrusted builds.
 */
export class BuilderContainerRunner {
  private pool: ContainerPool;
  private defaultModel = 'claude-sonnet-4-5';
  private defaultMaxTurns = 50;
  private defaultTimeout = 600000; // 10 minutes
  private defaultAllowedTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'];

  constructor(pool: ContainerPool) {
    this.pool = pool;
  }

  /**
   * Execute a Claude CLI session inside a Docker container.
   *
   * Requires:
   * - ContainerPool to be initialized and running
   * - Claude CLI image built (`server/container/build.sh claude-cli`)
   * - ANTHROPIC_API_KEY available in environment
   */
  async execute(config: BuilderContainerConfig): Promise<BuilderContainerResult> {
    const startTime = Date.now();

    try {
      // Acquire a container from the pool
      const container = await this.pool.acquire({
        agentId: 'builder',
        timeout: 10000,
      });

      try {
        // Initialize container with builder agent config
        await this.pool.initContainer(container.id, {
          agentId: 'builder',
          workdir: config.workDir,
          env: {
            CLAUDE_MODEL: config.model || this.defaultModel,
            CLAUDE_MAX_TURNS: String(config.maxTurns || this.defaultMaxTurns),
          },
        });

        // Build the Claude CLI command
        const args = [
          '--model', config.model || this.defaultModel,
          '--max-turns', String(config.maxTurns || this.defaultMaxTurns),
          '--output-format', 'stream-json',
          '--allowed-tools', (config.allowedTools || this.defaultAllowedTools).join(','),
        ];

        if (config.sessionId) {
          args.push('--resume', config.sessionId);
        }

        args.push('-p', config.prompt);

        // Execute in container
        const result = await this.pool.executeInContainer(container.id, {
          command: 'claude',
          args,
          timeout: config.timeout || this.defaultTimeout,
          cwd: config.workDir,
        });

        const durationMs = Date.now() - startTime;

        return {
          success: result.exitCode === 0,
          output: result.stdout,
          exitCode: result.exitCode,
          durationMs,
          error: result.exitCode !== 0 ? result.stderr : undefined,
        };
      } finally {
        // Release container back to pool
        await this.pool.release(container.id, { reason: 'builder-task-complete' });
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        exitCode: 1,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute a Ralph loop iteration inside a container.
   * Container persists sessions via mounted volumes.
   */
  async executeRalphIteration(
    record: BuildRecord,
    story: RalphStory
  ): Promise<IterationResult> {
    const prompt = this.buildStoryPrompt(story, record);

    const result = await this.execute({
      workDir: process.cwd(),
      sessionsDir: `.builder/sessions/${record.id}`,
      prompt,
      model: this.defaultModel,
      maxTurns: 30,
      allowedTools: this.defaultAllowedTools,
      sessionId: record.sessionId,
      timeout: this.defaultTimeout,
    });

    return {
      success: result.success,
      storyId: story.id,
      output: result.output,
      durationMs: result.durationMs,
    };
  }

  /**
   * Build the prompt for a specific Ralph story iteration.
   */
  private buildStoryPrompt(story: RalphStory, record: BuildRecord): string {
    const lines = [
      `You are implementing story ${story.id} for the app "${record.appId}".`,
      '',
      `## Story: ${story.title}`,
      '',
      story.description,
      '',
      '## Acceptance Criteria',
      '',
      ...story.acceptanceCriteria.map(c => `- ${c}`),
      '',
      '## Rules',
      '',
      '- Use lucide-react icons exclusively (never emojis)',
      '- Use semantic design tokens only (never hex colors)',
      '- Use Glass* component primitives from packages/ui/components/',
      '- Run typecheck after implementation: bun run typecheck',
      '- Verify in browser if criteria mentions it',
      '',
      '## When Complete',
      '',
      `Run: bun scripts/ralph_runner.ts pass ${story.id}`,
      '',
      'Output the result of the typecheck and any verification steps.',
    ];

    return lines.join('\n');
  }
}
