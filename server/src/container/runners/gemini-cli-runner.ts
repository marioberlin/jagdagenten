/**
 * Gemini CLI Runner
 *
 * Executes tasks using the Gemini CLI (agentic mode).
 * Gemini CLI provides the fastest, most cost-effective execution.
 *
 * @see docs/LIQUID_CONTAINER_SDK_IMPLEMENTATION_PLAN.md
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

// ============================================================================
// Types
// ============================================================================

export interface GeminiCliConfig {
    /** Path to gemini executable */
    executablePath: string;
    /** Working directory for execution */
    workDir: string;
    /** Enable sandbox mode (Docker-in-Docker) */
    sandbox: boolean;
    /** Model to use (default: gemini-2.5-flash) */
    model: string;
    /** Maximum number of turns */
    maxTurns: number;
    /** Enable streaming output */
    streaming: boolean;
    /** Environment variables to pass */
    env: Record<string, string>;
    /** Timeout in milliseconds */
    timeout: number;
    /** Allowed tools */
    allowedTools: string[];
}

export interface GeminiCliResult {
    /** Whether execution was successful */
    success: boolean;
    /** Output text from the CLI */
    output: string;
    /** Error message if failed */
    error?: string;
    /** Exit code */
    exitCode: number;
    /** Execution duration in ms */
    durationMs: number;
    /** Token usage if available */
    tokenUsage?: {
        input: number;
        output: number;
    };
}

export interface GeminiStreamEvent {
    type: 'output' | 'progress' | 'tool_use' | 'error' | 'done';
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_GEMINI_CLI_CONFIG: GeminiCliConfig = {
    executablePath: 'gemini',
    workDir: process.cwd(),
    sandbox: false,
    model: 'gemini-2.5-flash',
    maxTurns: 50,
    streaming: true,
    env: {},
    timeout: 300000, // 5 minutes
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
};

// ============================================================================
// Gemini CLI Runner
// ============================================================================

export class GeminiCliRunner extends EventEmitter {
    private config: GeminiCliConfig;
    private process: ChildProcess | null = null;
    private killed = false;

    constructor(config: Partial<GeminiCliConfig> = {}) {
        super();
        this.config = { ...DEFAULT_GEMINI_CLI_CONFIG, ...config };
    }

    /**
     * Execute a prompt using Gemini CLI
     */
    async execute(prompt: string): Promise<GeminiCliResult> {
        const startTime = Date.now();

        try {
            const args = this.buildArgs(prompt);
            const result = await this.runProcess(args);

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
    executeStreaming(prompt: string): AsyncGenerator<GeminiStreamEvent> {
        const self = this;
        const args = this.buildArgs(prompt);

        return (async function* () {
            const startTime = Date.now();

            try {
                yield {
                    type: 'progress',
                    content: 'Starting Gemini CLI...',
                    timestamp: Date.now(),
                };

                for await (const event of self.runProcessStreaming(args)) {
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

        // Sandbox mode
        if (this.config.sandbox) {
            args.push('--sandbox');
        }

        // Maximum turns
        if (this.config.maxTurns > 0) {
            args.push('--max-turns', String(this.config.maxTurns));
        }

        // Streaming mode (usually default)
        if (this.config.streaming) {
            args.push('--stream');
        }

        // Allowed tools
        if (this.config.allowedTools.length > 0) {
            args.push('--tools', this.config.allowedTools.join(','));
        }

        // The prompt itself (use stdin for longer prompts)
        args.push('--prompt', prompt);

        return args;
    }

    /**
     * Run the process and collect output
     */
    private runProcess(args: string[]): Promise<Omit<GeminiCliResult, 'durationMs'>> {
        return new Promise((resolve, reject) => {
            const stdout: string[] = [];
            const stderr: string[] = [];

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
                        error: 'Process was killed',
                        exitCode: code ?? 1,
                    });
                } else if (code === 0) {
                    resolve({
                        success: true,
                        output,
                        exitCode: 0,
                        tokenUsage: this.parseTokenUsage(output),
                    });
                } else {
                    resolve({
                        success: false,
                        output,
                        error: errorOutput || `Process exited with code ${code}`,
                        exitCode: code ?? 1,
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
    private async *runProcessStreaming(args: string[]): AsyncGenerator<GeminiStreamEvent> {
        const outputBuffer: string[] = [];

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
                outputBuffer.push(text);

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
     * Parse stream events from output text
     */
    private parseStreamEvents(text: string): GeminiStreamEvent[] {
        const events: GeminiStreamEvent[] = [];
        const lines = text.split('\n');

        for (const line of lines) {
            if (!line.trim()) continue;

            // Try to parse as JSON
            try {
                const data = JSON.parse(line);
                if (data.type) {
                    events.push({
                        type: data.type,
                        content: data.content || data.text || '',
                        timestamp: Date.now(),
                        metadata: data,
                    });
                    continue;
                }
            } catch {
                // Not JSON, treat as plain output
            }

            // Check for tool use markers
            if (line.includes('Running tool:') || line.includes('Tool:')) {
                events.push({
                    type: 'tool_use',
                    content: line,
                    timestamp: Date.now(),
                });
            } else if (line.includes('Error:') || line.includes('ERROR:')) {
                events.push({
                    type: 'error',
                    content: line,
                    timestamp: Date.now(),
                });
            } else {
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
     * Parse token usage from output
     */
    private parseTokenUsage(output: string): { input: number; output: number } | undefined {
        // Look for token usage in output
        const inputMatch = output.match(/input[_\s]?tokens?:\s*(\d+)/i);
        const outputMatch = output.match(/output[_\s]?tokens?:\s*(\d+)/i);

        if (inputMatch || outputMatch) {
            return {
                input: inputMatch ? parseInt(inputMatch[1], 10) : 0,
                output: outputMatch ? parseInt(outputMatch[1], 10) : 0,
            };
        }

        return undefined;
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a Gemini CLI runner with configuration
 */
export function createGeminiCliRunner(config: Partial<GeminiCliConfig> = {}): GeminiCliRunner {
    return new GeminiCliRunner(config);
}

/**
 * Check if Gemini CLI is installed
 */
export async function isGeminiCliInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn('which', ['gemini'], { shell: true });

        proc.on('close', (code) => {
            resolve(code === 0);
        });

        proc.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * Get Gemini CLI version
 */
export async function getGeminiCliVersion(): Promise<string | null> {
    return new Promise((resolve) => {
        const proc = spawn('gemini', ['--version'], { shell: true });
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
export async function executeGeminiCli(
    prompt: string,
    config: Partial<GeminiCliConfig> = {}
): Promise<GeminiCliResult> {
    const runner = createGeminiCliRunner(config);
    return runner.execute(prompt);
}
