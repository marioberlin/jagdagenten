/**
 * Claude Agent SDK Runner
 *
 * Executes tasks using the Claude Agent SDK (agentic mode).
 * Claude provides the highest quality reasoning and code generation.
 *
 * @see docs/LIQUID_CONTAINER_SDK_IMPLEMENTATION_PLAN.md
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

// ============================================================================
// Types
// ============================================================================

export interface ClaudeRunnerConfig {
    /** Path to claude executable or script */
    executablePath: string;
    /** Working directory for execution */
    workDir: string;
    /** Model to use */
    model: 'claude-sonnet-4-5' | 'claude-opus-4' | 'claude-haiku-3-5' | string;
    /** Maximum number of turns */
    maxTurns: number;
    /** Session ID for resumption */
    sessionId?: string;
    /** Enable streaming output */
    streaming: boolean;
    /** Environment variables to pass */
    env: Record<string, string>;
    /** Timeout in milliseconds */
    timeout: number;
    /** Allowed tools */
    allowedTools: string[];
    /** Enable print mode (no file modifications) */
    printMode: boolean;
    /** Allow edit self (modifications to its own code) */
    dangerouslyAllowEditSelf: boolean;
}

export interface ClaudeRunnerResult {
    /** Whether execution was successful */
    success: boolean;
    /** Output text from Claude */
    output: string;
    /** Session ID for resumption */
    sessionId?: string;
    /** Error message if failed */
    error?: string;
    /** Exit code */
    exitCode: number;
    /** Execution duration in ms */
    durationMs: number;
    /** Token usage */
    tokenUsage?: {
        input: number;
        output: number;
        cacheRead?: number;
        cacheWrite?: number;
    };
    /** Cost estimate in USD */
    estimatedCost?: number;
}

export interface ClaudeStreamEvent {
    type: 'output' | 'progress' | 'tool_use' | 'tool_result' | 'thinking' | 'error' | 'session' | 'done';
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CLAUDE_CONFIG: ClaudeRunnerConfig = {
    executablePath: 'claude',
    workDir: process.cwd(),
    model: 'claude-sonnet-4-5',
    maxTurns: 50,
    streaming: true,
    env: {},
    timeout: 600000, // 10 minutes (Claude can take longer)
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
    printMode: false,
    dangerouslyAllowEditSelf: false,
};

// ============================================================================
// Claude Runner
// ============================================================================

export class ClaudeRunner extends EventEmitter {
    private config: ClaudeRunnerConfig;
    private process: ChildProcess | null = null;
    private killed = false;

    constructor(config: Partial<ClaudeRunnerConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CLAUDE_CONFIG, ...config };
    }

    /**
     * Execute a prompt using Claude Agent SDK
     */
    async execute(prompt: string): Promise<ClaudeRunnerResult> {
        const startTime = Date.now();

        try {
            const args = this.buildArgs(prompt);
            const result = await this.runProcess(args, prompt);

            return {
                ...result,
                durationMs: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: (error as Error).message,
                exitCode: 1,
                durationMs: Date.now() - startTime,
            };
        }
    }

    /**
     * Execute with streaming output
     */
    executeStreaming(prompt: string): AsyncGenerator<ClaudeStreamEvent> {
        const self = this;
        const args = this.buildArgs(prompt);

        return (async function* () {
            const startTime = Date.now();

            try {
                yield {
                    type: 'progress',
                    content: 'Starting Claude Agent SDK...',
                    timestamp: Date.now(),
                };

                for await (const event of self.runProcessStreaming(args, prompt)) {
                    yield event;
                }

                yield {
                    type: 'done',
                    content: 'Execution complete',
                    timestamp: Date.now(),
                    metadata: { durationMs: Date.now() - startTime },
                };
            } catch (error) {
                yield {
                    type: 'error',
                    content: (error as Error).message,
                    timestamp: Date.now(),
                };
            }
        })();
    }

    /**
     * Resume a previous session
     */
    async resume(sessionId: string, prompt?: string): Promise<ClaudeRunnerResult> {
        this.config.sessionId = sessionId;
        return this.execute(prompt || 'continue');
    }

    /**
     * Kill the running process
     */
    kill(): void {
        this.killed = true;
        if (this.process) {
            this.process.kill('SIGTERM');
            setTimeout(() => {
                if (this.process) {
                    this.process.kill('SIGKILL');
                }
            }, 5000);
        }
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Build command line arguments
     */
    private buildArgs(prompt: string): string[] {
        const args: string[] = [];

        // Model selection
        args.push('--model', this.config.model);

        // Maximum turns
        if (this.config.maxTurns > 0) {
            args.push('--max-turns', String(this.config.maxTurns));
        }

        // Session resumption
        if (this.config.sessionId) {
            args.push('--resume', this.config.sessionId);
        }

        // Print mode (read-only)
        if (this.config.printMode) {
            args.push('--print');
        }

        // Allow edit self
        if (this.config.dangerouslyAllowEditSelf) {
            args.push('--dangerously-skip-permissions');
        }

        // Output format for parsing
        args.push('--output-format', 'stream-json');

        // The prompt (via -p flag or positional)
        args.push('-p', prompt);

        return args;
    }

    /**
     * Run the process and collect output
     */
    private runProcess(args: string[], _prompt: string): Promise<Omit<ClaudeRunnerResult, 'durationMs'>> {
        return new Promise((resolve, reject) => {
            const stdout: string[] = [];
            const stderr: string[] = [];
            let sessionId: string | undefined;
            let tokenUsage: ClaudeRunnerResult['tokenUsage'];

            this.process = spawn(this.config.executablePath, args, {
                cwd: this.config.workDir,
                env: {
                    ...process.env,
                    ...this.config.env,
                },
                shell: false,
            });

            // Set timeout
            const timeout = setTimeout(() => {
                this.kill();
                reject(new Error(`Execution timed out after ${this.config.timeout}ms`));
            }, this.config.timeout);

            this.process.stdout?.on('data', (data: Buffer) => {
                const text = data.toString();
                stdout.push(text);
                this.emit('output', text);

                // Parse for session ID
                const parsed = this.parseOutputLine(text);
                if (parsed.sessionId) {
                    sessionId = parsed.sessionId;
                }
                if (parsed.tokenUsage) {
                    tokenUsage = parsed.tokenUsage;
                }
            });

            this.process.stderr?.on('data', (data: Buffer) => {
                const text = data.toString();
                stderr.push(text);
                this.emit('error', text);
            });

            this.process.on('close', (code) => {
                clearTimeout(timeout);
                this.process = null;

                const output = stdout.join('');
                const errorOutput = stderr.join('');

                if (this.killed) {
                    resolve({
                        success: false,
                        output,
                        sessionId,
                        error: 'Process was killed',
                        exitCode: code ?? 1,
                        tokenUsage,
                    });
                } else if (code === 0) {
                    resolve({
                        success: true,
                        output,
                        sessionId,
                        exitCode: 0,
                        tokenUsage,
                        estimatedCost: this.estimateCost(tokenUsage),
                    });
                } else {
                    resolve({
                        success: false,
                        output,
                        sessionId,
                        error: errorOutput || `Process exited with code ${code}`,
                        exitCode: code ?? 1,
                        tokenUsage,
                    });
                }
            });

            this.process.on('error', (error) => {
                clearTimeout(timeout);
                this.process = null;
                reject(error);
            });
        });
    }

    /**
     * Run the process with streaming events
     */
    private async *runProcessStreaming(args: string[], _prompt: string): AsyncGenerator<ClaudeStreamEvent> {
        this.process = spawn(this.config.executablePath, args, {
            cwd: this.config.workDir,
            env: {
                ...process.env,
                ...this.config.env,
            },
            shell: false,
        });

        // Create a promise that resolves when process exits
        const exitPromise = new Promise<number | null>((resolve) => {
            this.process!.on('close', resolve);
        });

        // Stream stdout
        if (this.process.stdout) {
            for await (const chunk of this.process.stdout) {
                const text = chunk.toString();

                // Parse and yield events
                for (const event of this.parseStreamEvents(text)) {
                    yield event;
                }
            }
        }

        // Wait for process to exit
        const exitCode = await exitPromise;
        this.process = null;

        // Yield final result
        if (exitCode !== 0 && !this.killed) {
            yield {
                type: 'error',
                content: `Process exited with code ${exitCode}`,
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Parse a single output line
     */
    private parseOutputLine(text: string): {
        sessionId?: string;
        tokenUsage?: ClaudeRunnerResult['tokenUsage'];
    } {
        const result: {
            sessionId?: string;
            tokenUsage?: ClaudeRunnerResult['tokenUsage'];
        } = {};

        // Look for session ID
        const sessionMatch = text.match(/SESSION_ID:(\S+)/i) || text.match(/"session_id":\s*"([^"]+)"/);
        if (sessionMatch) {
            result.sessionId = sessionMatch[1];
        }

        // Look for token usage
        try {
            const lines = text.split('\n');
            for (const line of lines) {
                if (line.includes('"usage"') || line.includes('"tokens"')) {
                    const data = JSON.parse(line);
                    if (data.usage || data.tokens) {
                        const usage = data.usage || data.tokens;
                        result.tokenUsage = {
                            input: usage.input_tokens || usage.input || 0,
                            output: usage.output_tokens || usage.output || 0,
                            cacheRead: usage.cache_read_input_tokens || 0,
                            cacheWrite: usage.cache_creation_input_tokens || 0,
                        };
                    }
                }
            }
        } catch {
            // Ignore JSON parse errors
        }

        return result;
    }

    /**
     * Parse stream events from output text
     */
    private parseStreamEvents(text: string): ClaudeStreamEvent[] {
        const events: ClaudeStreamEvent[] = [];
        const lines = text.split('\n');

        for (const line of lines) {
            if (!line.trim()) continue;

            // Try to parse as JSON (Claude stream-json format)
            try {
                const data = JSON.parse(line);

                // Session ID event
                if (data.session_id) {
                    events.push({
                        type: 'session',
                        content: data.session_id,
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Tool use event
                if (data.type === 'tool_use' || data.tool) {
                    events.push({
                        type: 'tool_use',
                        content: data.name || data.tool || 'unknown',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Tool result event
                if (data.type === 'tool_result') {
                    events.push({
                        type: 'tool_result',
                        content: data.content || '',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Thinking/reasoning event
                if (data.type === 'thinking' || data.thinking) {
                    events.push({
                        type: 'thinking',
                        content: data.thinking || data.content || '',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Text output
                if (data.type === 'text' || data.text || data.content) {
                    events.push({
                        type: 'output',
                        content: data.text || data.content || '',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Error event
                if (data.error) {
                    events.push({
                        type: 'error',
                        content: data.error.message || data.error || '',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }

                // Generic event
                events.push({
                    type: 'output',
                    content: JSON.stringify(data),
                    timestamp: Date.now(),
                    metadata: data,
                });
            } catch {
                // Not JSON, treat as plain output
                events.push({
                    type: 'output',
                    content: line,
                    timestamp: Date.now(),
                });
            }
        }

        return events;
    }

    /**
     * Estimate cost based on token usage
     */
    private estimateCost(usage?: ClaudeRunnerResult['tokenUsage']): number | undefined {
        if (!usage) return undefined;

        // Claude Sonnet 4.5 pricing (per 1M tokens)
        const pricing = {
            'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
            'claude-opus-4': { input: 15.00, output: 75.00 },
            'claude-haiku-3-5': { input: 0.80, output: 4.00 },
        };

        const modelPricing = pricing[this.config.model as keyof typeof pricing] || pricing['claude-sonnet-4-5'];

        const inputCost = (usage.input / 1_000_000) * modelPricing.input;
        const outputCost = (usage.output / 1_000_000) * modelPricing.output;

        // Cache hits are cheaper (90% discount)
        const cacheReadCost = ((usage.cacheRead || 0) / 1_000_000) * modelPricing.input * 0.1;

        return Math.round((inputCost + outputCost + cacheReadCost) * 10000) / 10000;
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a Claude runner with configuration
 */
export function createClaudeRunner(config: Partial<ClaudeRunnerConfig> = {}): ClaudeRunner {
    return new ClaudeRunner(config);
}

/**
 * Check if Claude CLI is installed
 */
export async function isClaudeCliInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn('which', ['claude'], { shell: true });

        proc.on('close', (code) => {
            resolve(code === 0);
        });

        proc.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Get Claude CLI version
 */
export async function getClaudeCliVersion(): Promise<string | null> {
    return new Promise((resolve) => {
        const proc = spawn('claude', ['--version'], { shell: true });
        let output = '';

        proc.stdout?.on('data', (data: Buffer) => {
            output += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                resolve(null);
            }
        });

        proc.on('error', () => {
            resolve(null);
        });
    });
}

/**
 * Quick execute without creating a runner instance
 */
export async function executeClaude(
    prompt: string,
    config: Partial<ClaudeRunnerConfig> = {}
): Promise<ClaudeRunnerResult> {
    const runner = createClaudeRunner(config);
    return runner.execute(prompt);
}
