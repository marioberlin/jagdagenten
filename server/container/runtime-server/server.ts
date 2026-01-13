/**
 * LiquidContainer Runtime Server
 *
 * HTTP server that runs inside each container, providing:
 * - Health checks for pool management
 * - Agent initialization
 * - Command execution with streaming
 * - State reset for container recycling
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 4
 */

import { Elysia } from 'elysia';
import { spawn, type ChildProcess } from 'child_process';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

interface RuntimeState {
    mode: 'idle' | 'initializing' | 'ready' | 'executing' | 'error';
    agentId?: string;
    workdir: string;
    env: Record<string, string>;
    process?: ChildProcess;
    lastError?: string;
    startedAt: number;
    executionCount: number;
}

interface InitRequest {
    agentId: string;
    script?: {
        type: 'path' | 'inline';
        content: string;
        filename?: string;
    };
    env?: Record<string, string>;
    workdir?: string;
    secrets?: string[];
}

interface ExecuteRequest {
    command: string;
    args?: string[];
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
    stream?: boolean;
}

interface ExecuteResponse {
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    timedOut: boolean;
    oomKilled: boolean;
}

// ============================================================================
// Runtime State
// ============================================================================

const runtime: RuntimeState = {
    mode: 'idle',
    workdir: '/app',
    env: {},
    startedAt: Date.now(),
    executionCount: 0,
};

// Configuration from environment
const config = {
    port: parseInt(process.env.LIQUID_RUNTIME_PORT ?? '8080'),
    maxExecutionTime: parseInt(process.env.LIQUID_MAX_EXECUTION_TIME ?? '300000'),
    maxOutputSize: 10 * 1024 * 1024, // 10MB
    logLevel: process.env.LIQUID_LOG_LEVEL ?? 'info',
};

// ============================================================================
// Logging
// ============================================================================

const log = {
    info: (msg: string, data?: Record<string, unknown>) => {
        if (config.logLevel !== 'error') {
            console.log(JSON.stringify({ level: 'info', msg, ...data, ts: Date.now() }));
        }
    },
    warn: (msg: string, data?: Record<string, unknown>) => {
        if (config.logLevel !== 'error') {
            console.warn(JSON.stringify({ level: 'warn', msg, ...data, ts: Date.now() }));
        }
    },
    error: (msg: string, data?: Record<string, unknown>) => {
        console.error(JSON.stringify({ level: 'error', msg, ...data, ts: Date.now() }));
    },
    debug: (msg: string, data?: Record<string, unknown>) => {
        if (config.logLevel === 'debug') {
            console.log(JSON.stringify({ level: 'debug', msg, ...data, ts: Date.now() }));
        }
    },
};

// ============================================================================
// Secrets Management
// ============================================================================

async function loadSecrets(secretNames: string[]): Promise<Record<string, string>> {
    const secrets: Record<string, string> = {};

    try {
        // Try to read from /secrets/secrets.json (injected by pool manager)
        const secretsFile = await readFile('/secrets/secrets.json', 'utf-8');
        const allSecrets = JSON.parse(secretsFile);

        for (const name of secretNames) {
            if (allSecrets[name]) {
                secrets[name] = allSecrets[name];
            } else {
                log.warn('Secret not found', { name });
            }
        }
    } catch {
        // Fall back to environment variables with LIQUID_SECRET_ prefix
        for (const name of secretNames) {
            const envKey = `LIQUID_SECRET_${name.toUpperCase().replace(/-/g, '_')}`;
            if (process.env[envKey]) {
                secrets[name] = process.env[envKey]!;
            } else {
                log.warn('Secret not found in env', { name, envKey });
            }
        }
    }

    return secrets;
}

// ============================================================================
// Command Execution
// ============================================================================

async function executeCommand(
    command: string,
    args: string[],
    options: {
        timeout: number;
        cwd: string;
        env: Record<string, string>;
    }
): Promise<ExecuteResponse> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        let resolved = false;

        log.debug('Executing command', { command, args, cwd: options.cwd });

        const proc = spawn(command, args, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env },
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        runtime.process = proc;

        // Collect stdout with size limit
        proc.stdout.on('data', (chunk: Buffer) => {
            if (stdout.length < config.maxOutputSize) {
                stdout += chunk.toString();
            }
        });

        // Collect stderr with size limit
        proc.stderr.on('data', (chunk: Buffer) => {
            if (stderr.length < config.maxOutputSize) {
                stderr += chunk.toString();
            }
        });

        // Timeout handler
        const timeoutHandle = setTimeout(() => {
            if (!resolved) {
                timedOut = true;
                proc.kill('SIGKILL');
                log.warn('Process killed due to timeout', { timeout: options.timeout });
            }
        }, options.timeout);

        // Process completion
        proc.on('close', (code, signal) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutHandle);
                runtime.process = undefined;

                const duration = Date.now() - startTime;
                const oomKilled = signal === 'SIGKILL' && !timedOut;

                log.info('Command completed', {
                    exitCode: code,
                    duration,
                    timedOut,
                    oomKilled,
                    signal,
                });

                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: timedOut ? 124 : (code ?? 1),
                    duration,
                    timedOut,
                    oomKilled,
                });
            }
        });

        // Process error
        proc.on('error', (error) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeoutHandle);
                runtime.process = undefined;

                log.error('Command failed', { error: error.message });

                resolve({
                    stdout: '',
                    stderr: error.message,
                    exitCode: 1,
                    duration: Date.now() - startTime,
                    timedOut: false,
                    oomKilled: false,
                });
            }
        });
    });
}

// ============================================================================
// Cleanup
// ============================================================================

async function cleanup(): Promise<void> {
    // Kill any running process
    if (runtime.process) {
        runtime.process.kill('SIGKILL');
        runtime.process = undefined;
    }

    // Clear agent-specific files
    try {
        const agentDir = join(runtime.workdir, '.agent');
        await rm(agentDir, { recursive: true, force: true });
    } catch {
        // Ignore cleanup errors
    }

    // Clear secrets
    try {
        await rm('/secrets/secrets.json', { force: true });
    } catch {
        // Ignore
    }
}

// ============================================================================
// HTTP Server
// ============================================================================

const app = new Elysia()
    // Health check endpoint
    .get('/health', () => {
        const memoryUsage = process.memoryUsage();
        return {
            status: runtime.mode === 'error' ? 'error' : 'ok',
            mode: runtime.mode,
            uptime: Math.floor((Date.now() - runtime.startedAt) / 1000),
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss,
                external: memoryUsage.external,
            },
            agentId: runtime.agentId,
            executionCount: runtime.executionCount,
            lastError: runtime.lastError,
        };
    })

    // Initialize container for an agent
    .post('/init', async ({ body }) => {
        const req = body as InitRequest;

        if (runtime.mode !== 'idle') {
            return {
                error: `Cannot initialize: container is ${runtime.mode}`,
                status: 'error',
            };
        }

        runtime.mode = 'initializing';
        log.info('Initializing container', { agentId: req.agentId });

        try {
            runtime.agentId = req.agentId;
            runtime.workdir = req.workdir ?? '/app';
            runtime.env = { ...req.env };

            // Create agent directory
            const agentDir = join(runtime.workdir, '.agent');
            await mkdir(agentDir, { recursive: true });

            // Write inline script if provided
            if (req.script?.type === 'inline') {
                const filename = req.script.filename ?? 'agent-script.ts';
                const scriptPath = join(agentDir, filename);
                await writeFile(scriptPath, req.script.content, 'utf-8');
                runtime.env['LIQUID_AGENT_SCRIPT'] = scriptPath;
            } else if (req.script?.type === 'path') {
                runtime.env['LIQUID_AGENT_SCRIPT'] = req.script.content;
            }

            // Load secrets if requested
            if (req.secrets && req.secrets.length > 0) {
                const secrets = await loadSecrets(req.secrets);
                // Make secrets available via environment
                for (const [name, value] of Object.entries(secrets)) {
                    runtime.env[`SECRET_${name.toUpperCase().replace(/-/g, '_')}`] = value;
                }
            }

            runtime.mode = 'ready';
            log.info('Container initialized', { agentId: req.agentId });

            return {
                status: 'initialized',
                agentId: req.agentId,
                workdir: runtime.workdir,
            };
        } catch (error) {
            runtime.mode = 'error';
            runtime.lastError = (error as Error).message;
            log.error('Initialization failed', { error: (error as Error).message });

            return {
                status: 'error',
                error: (error as Error).message,
            };
        }
    })

    // Execute a command
    .post('/execute', async ({ body }) => {
        const req = body as ExecuteRequest;

        if (runtime.mode !== 'ready') {
            return {
                error: `Cannot execute: container is ${runtime.mode}`,
                status: 'error',
            };
        }

        runtime.mode = 'executing';
        runtime.executionCount++;

        try {
            const result = await executeCommand(req.command, req.args ?? [], {
                timeout: req.timeout ?? config.maxExecutionTime,
                cwd: req.cwd ?? runtime.workdir,
                env: { ...runtime.env, ...req.env },
            });

            runtime.mode = 'ready';
            return result;
        } catch (error) {
            runtime.mode = 'error';
            runtime.lastError = (error as Error).message;

            return {
                exitCode: 1,
                stdout: '',
                stderr: (error as Error).message,
                duration: 0,
                timedOut: false,
                oomKilled: false,
            };
        }
    })

    // Streaming execution via Server-Sent Events
    .get('/execute/stream', async ({ query, set }) => {
        const command = query.command as string;
        const args = (query.args as string)?.split(',') ?? [];
        const timeout = parseInt(query.timeout as string) || config.maxExecutionTime;
        const cwd = (query.cwd as string) ?? runtime.workdir;

        if (runtime.mode !== 'ready') {
            set.status = 400;
            return { error: `Cannot execute: container is ${runtime.mode}` };
        }

        set.headers['content-type'] = 'text/event-stream';
        set.headers['cache-control'] = 'no-cache';
        set.headers['connection'] = 'keep-alive';

        runtime.mode = 'executing';
        runtime.executionCount++;

        const startTime = Date.now();

        return new ReadableStream({
            async start(controller) {
                const sendEvent = (event: string, data: unknown) => {
                    controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
                };

                const proc = spawn(command, args, {
                    cwd,
                    env: { ...process.env, ...runtime.env },
                    shell: false,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });

                runtime.process = proc;

                proc.stdout.on('data', (chunk: Buffer) => {
                    sendEvent('stdout', { data: chunk.toString() });
                });

                proc.stderr.on('data', (chunk: Buffer) => {
                    sendEvent('stderr', { data: chunk.toString() });
                });

                const timeoutHandle = setTimeout(() => {
                    proc.kill('SIGKILL');
                    sendEvent('timeout', { timeout });
                }, timeout);

                proc.on('close', (code, signal) => {
                    clearTimeout(timeoutHandle);
                    runtime.process = undefined;
                    runtime.mode = 'ready';

                    sendEvent('exit', {
                        exitCode: code ?? 1,
                        signal,
                        duration: Date.now() - startTime,
                    });

                    controller.close();
                });

                proc.on('error', (error) => {
                    clearTimeout(timeoutHandle);
                    runtime.process = undefined;
                    runtime.mode = 'error';
                    runtime.lastError = error.message;

                    sendEvent('error', { message: error.message });
                    controller.close();
                });
            },
        });
    })

    // Reset container state for reuse
    .post('/reset', async () => {
        log.info('Resetting container', { agentId: runtime.agentId });

        await cleanup();

        runtime.mode = 'idle';
        runtime.agentId = undefined;
        runtime.env = {};
        runtime.lastError = undefined;

        return { status: 'reset' };
    })

    // Graceful shutdown
    .post('/shutdown', async () => {
        log.info('Shutting down');
        await cleanup();

        // Schedule exit after response
        setTimeout(() => process.exit(0), 100);

        return { status: 'shutting_down' };
    })

    // Get current state (for debugging)
    .get('/state', () => ({
        mode: runtime.mode,
        agentId: runtime.agentId,
        workdir: runtime.workdir,
        envKeys: Object.keys(runtime.env),
        executionCount: runtime.executionCount,
        uptime: Math.floor((Date.now() - runtime.startedAt) / 1000),
        hasProcess: !!runtime.process,
    }));

// ============================================================================
// Start Server
// ============================================================================

app.listen(config.port, () => {
    log.info('Runtime server started', {
        port: config.port,
        maxExecutionTime: config.maxExecutionTime,
    });
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    log.info('Received SIGTERM');
    await cleanup();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info('Received SIGINT');
    await cleanup();
    process.exit(0);
});
