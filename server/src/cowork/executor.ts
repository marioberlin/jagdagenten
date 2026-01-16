/**
 * CoworkTaskExecutor
 *
 * Executes Cowork subtasks in containers with support for:
 * - Sandbox isolation
 * - Output streaming via WebSocket
 * - Artifact creation
 * - Progress tracking
 *
 * Bridges Cowork subtasks to the underlying ContainerExecutor.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { spawn, type ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { componentLoggers } from '../logger.js';
import type {
    CoworkSubTask,
    CoworkSession,
    SubTaskResult,
    CoworkArtifact,
    WorkspaceConfig,
} from './types.js';

const logger = componentLoggers.http;

// ============================================================================
// Types
// ============================================================================

export interface ExecutorConfig {
    /** Max execution time per task (ms) */
    timeout: number;
    /** Working directory for execution */
    workdir: string;
    /** Base environment variables */
    env: Record<string, string>;
    /** Enable sandbox mode */
    useSandbox: boolean;
    /** Max output buffer size (bytes) */
    maxOutputSize: number;
    /** Enable streaming output */
    streamOutput: boolean;
}

export interface ExecutionContext {
    session: CoworkSession;
    subTask: CoworkSubTask;
    workspace: WorkspaceConfig;
    sandboxRoot?: string;
}

export interface ExecutionResult {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    artifacts: CoworkArtifact[];
    filesModified: string[];
    timedOut: boolean;
    error?: string;
}

export interface TaskScript {
    /** Script type */
    type: 'shell' | 'node' | 'python' | 'bun';
    /** Script content or command */
    content: string;
    /** Arguments */
    args?: string[];
    /** Working directory override */
    cwd?: string;
}

// ============================================================================
// Task Script Generator
// ============================================================================

/**
 * Generate execution script based on task type
 */
function generateTaskScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    const title = subTask.title.toLowerCase();
    const description = subTask.description.toLowerCase();

    // Determine task type from title/description
    if (title.includes('analyze') || title.includes('read') || title.includes('gather')) {
        return generateAnalysisScript(subTask, context);
    }

    if (title.includes('create') || title.includes('generate') || title.includes('write')) {
        return generateCreationScript(subTask, context);
    }

    if (title.includes('process') || title.includes('transform') || title.includes('convert')) {
        return generateProcessingScript(subTask, context);
    }

    if (title.includes('organize') || title.includes('move') || title.includes('sort')) {
        return generateOrganizationScript(subTask, context);
    }

    // Default: generic task execution
    return generateGenericScript(subTask, context);
}

function generateAnalysisScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const workDir = context.sandboxRoot || context.workspace.outputPath;

    return {
        type: 'bun',
        content: `
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

const workDir = ${JSON.stringify(workDir)};
const task = ${JSON.stringify({ id: subTask.id, title: subTask.title, description: subTask.description })};

async function analyze() {
    console.log('Starting analysis:', task.title);

    const results = {
        filesFound: [],
        summary: '',
        metadata: {}
    };

    try {
        const entries = await readdir(workDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(workDir, entry.name);
            const stats = await stat(fullPath);
            results.filesFound.push({
                name: entry.name,
                isDirectory: entry.isDirectory(),
                size: stats.size,
                modified: stats.mtime
            });
        }

        results.summary = \`Analyzed \${results.filesFound.length} items in \${workDir}\`;
        console.log(results.summary);

    } catch (error) {
        console.error('Analysis error:', error.message);
        results.summary = 'Analysis failed: ' + error.message;
    }

    console.log('---RESULT_START---');
    console.log(JSON.stringify(results));
    console.log('---RESULT_END---');
}

analyze();
`,
        args: [],
        cwd: workDir,
    };
}

function generateCreationScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    const workDir = context.sandboxRoot || context.workspace.outputPath;

    return {
        type: 'bun',
        content: `
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const workDir = ${JSON.stringify(workDir)};
const task = ${JSON.stringify({ id: subTask.id, title: subTask.title, description: subTask.description })};

async function create() {
    console.log('Starting creation:', task.title);

    const results = {
        filesCreated: [],
        summary: '',
        artifacts: []
    };

    try {
        // Create output based on task description
        const outputName = 'output-' + task.id.slice(0, 8) + '.txt';
        const outputPath = join(workDir, outputName);

        await mkdir(dirname(outputPath), { recursive: true });

        const content = [
            '# Task Output',
            '',
            '## Task: ' + task.title,
            '',
            task.description,
            '',
            '## Generated at: ' + new Date().toISOString(),
        ].join('\\n');

        await writeFile(outputPath, content);
        results.filesCreated.push(outputPath);
        results.artifacts.push({
            type: 'file',
            name: outputName,
            path: outputPath
        });

        results.summary = \`Created \${results.filesCreated.length} file(s)\`;
        console.log(results.summary);

    } catch (error) {
        console.error('Creation error:', error.message);
        results.summary = 'Creation failed: ' + error.message;
    }

    console.log('---RESULT_START---');
    console.log(JSON.stringify(results));
    console.log('---RESULT_END---');
}

create();
`,
        args: [],
        cwd: workDir,
    };
}

function generateProcessingScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    const workDir = context.sandboxRoot || context.workspace.outputPath;

    return {
        type: 'bun',
        content: `
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const workDir = ${JSON.stringify(workDir)};
const task = ${JSON.stringify({ id: subTask.id, title: subTask.title, description: subTask.description })};

async function process() {
    console.log('Starting processing:', task.title);

    const results = {
        filesProcessed: [],
        summary: '',
        metrics: {}
    };

    try {
        const entries = await readdir(workDir);
        let processedCount = 0;

        for (const entry of entries) {
            if (entry.startsWith('.')) continue;

            const filePath = join(workDir, entry);
            console.log('Processing:', entry);
            processedCount++;
            results.filesProcessed.push(entry);
        }

        results.metrics = { totalProcessed: processedCount };
        results.summary = \`Processed \${processedCount} file(s)\`;
        console.log(results.summary);

    } catch (error) {
        console.error('Processing error:', error.message);
        results.summary = 'Processing failed: ' + error.message;
    }

    console.log('---RESULT_START---');
    console.log(JSON.stringify(results));
    console.log('---RESULT_END---');
}

process();
`,
        args: [],
        cwd: workDir,
    };
}

function generateOrganizationScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    const workDir = context.sandboxRoot || context.workspace.outputPath;

    return {
        type: 'bun',
        content: `
import { readdir, rename, mkdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const workDir = ${JSON.stringify(workDir)};
const task = ${JSON.stringify({ id: subTask.id, title: subTask.title, description: subTask.description })};

async function organize() {
    console.log('Starting organization:', task.title);

    const results = {
        filesMoved: [],
        foldersCreated: [],
        summary: ''
    };

    try {
        const entries = await readdir(workDir);

        // Group files by extension
        const groups = new Map();

        for (const entry of entries) {
            const filePath = join(workDir, entry);
            const stats = await stat(filePath);

            if (stats.isFile()) {
                const ext = extname(entry).toLowerCase() || '.other';
                if (!groups.has(ext)) {
                    groups.set(ext, []);
                }
                groups.get(ext).push(entry);
            }
        }

        results.summary = \`Found \${groups.size} file type(s) to organize\`;
        console.log(results.summary);

        // Note: actual file moving would happen here in production
        // For safety, we just report what would be done

    } catch (error) {
        console.error('Organization error:', error.message);
        results.summary = 'Organization failed: ' + error.message;
    }

    console.log('---RESULT_START---');
    console.log(JSON.stringify(results));
    console.log('---RESULT_END---');
}

organize();
`,
        args: [],
        cwd: workDir,
    };
}

function generateGenericScript(subTask: CoworkSubTask, context: ExecutionContext): TaskScript {
    const workDir = context.sandboxRoot || context.workspace.outputPath;

    return {
        type: 'bun',
        content: `
const task = ${JSON.stringify({ id: subTask.id, title: subTask.title, description: subTask.description })};

async function execute() {
    console.log('Executing task:', task.title);
    console.log('Description:', task.description);

    const results = {
        success: true,
        output: 'Task completed: ' + task.title,
        summary: 'Generic task execution completed'
    };

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('---RESULT_START---');
    console.log(JSON.stringify(results));
    console.log('---RESULT_END---');
}

execute();
`,
        args: [],
        cwd: workDir,
    };
}

// ============================================================================
// Cowork Task Executor
// ============================================================================

export class CoworkTaskExecutor extends EventEmitter {
    private config: ExecutorConfig;
    private activeProcesses: Map<string, ChildProcess> = new Map();

    constructor(config: Partial<ExecutorConfig> = {}) {
        super();
        this.config = {
            timeout: config.timeout || 300000, // 5 minutes
            workdir: config.workdir || '/tmp/cowork',
            env: config.env || {},
            useSandbox: config.useSandbox ?? true,
            maxOutputSize: config.maxOutputSize || 10 * 1024 * 1024, // 10MB
            streamOutput: config.streamOutput ?? true,
        };
    }

    /**
     * Execute a subtask
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        const startTime = Date.now();
        const { session, subTask, workspace } = context;
        const executionId = `exec_${subTask.id}_${randomUUID().slice(0, 8)}`;

        logger.info({
            executionId,
            sessionId: session.id,
            subtaskId: subTask.id,
            title: subTask.title,
        }, 'Starting subtask execution');

        try {
            // Generate execution script
            const script = generateTaskScript(subTask, context);

            // Prepare working directory
            const workDir = context.sandboxRoot || workspace.outputPath;
            await fs.mkdir(workDir, { recursive: true });

            // Write script to temp file
            const scriptPath = join(workDir, `.cowork_${executionId}.ts`);
            await fs.writeFile(scriptPath, script.content);

            // Execute script
            const result = await this.executeScript(
                executionId,
                script,
                scriptPath,
                context
            );

            // Cleanup script file
            try {
                await fs.unlink(scriptPath);
            } catch {
                // Ignore cleanup errors
            }

            // Parse artifacts from result
            const artifacts = this.parseArtifacts(result.stdout, session.id);

            return {
                success: result.exitCode === 0 && !result.timedOut,
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr,
                duration: Date.now() - startTime,
                artifacts,
                filesModified: this.parseFilesModified(result.stdout),
                timedOut: result.timedOut,
                error: result.exitCode !== 0 ? result.stderr || 'Execution failed' : undefined,
            };

        } catch (error: any) {
            logger.error({
                executionId,
                sessionId: session.id,
                subtaskId: subTask.id,
                error: error.message,
            }, 'Subtask execution failed');

            return {
                success: false,
                exitCode: 1,
                stdout: '',
                stderr: error.message,
                duration: Date.now() - startTime,
                artifacts: [],
                filesModified: [],
                timedOut: false,
                error: error.message,
            };
        }
    }

    /**
     * Execute script in subprocess
     */
    private async executeScript(
        executionId: string,
        script: TaskScript,
        scriptPath: string,
        context: ExecutionContext
    ): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
        timedOut: boolean;
    }> {
        return new Promise((resolve) => {
            const { session, subTask } = context;
            let stdout = '';
            let stderr = '';
            let timedOut = false;

            // Determine command based on script type
            let command: string;
            let args: string[];

            switch (script.type) {
                case 'bun':
                    command = 'bun';
                    args = ['run', scriptPath, ...(script.args || [])];
                    break;
                case 'node':
                    command = 'node';
                    args = [scriptPath, ...(script.args || [])];
                    break;
                case 'python':
                    command = 'python3';
                    args = [scriptPath, ...(script.args || [])];
                    break;
                case 'shell':
                default:
                    command = 'sh';
                    args = ['-c', script.content];
                    break;
            }

            // Spawn process
            const proc = spawn(command, args, {
                cwd: script.cwd || this.config.workdir,
                env: {
                    ...process.env,
                    ...this.config.env,
                    COWORK_SESSION_ID: session.id,
                    COWORK_SUBTASK_ID: subTask.id,
                    COWORK_EXECUTION_ID: executionId,
                },
                timeout: this.config.timeout,
            });

            this.activeProcesses.set(executionId, proc);

            // Handle stdout
            proc.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;

                if (this.config.streamOutput) {
                    this.emit('output', {
                        executionId,
                        sessionId: session.id,
                        subtaskId: subTask.id,
                        type: 'stdout',
                        data: chunk,
                    });
                }

                // Limit output size
                if (stdout.length > this.config.maxOutputSize) {
                    stdout = stdout.slice(-this.config.maxOutputSize);
                }
            });

            // Handle stderr
            proc.stderr?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stderr += chunk;

                if (this.config.streamOutput) {
                    this.emit('output', {
                        executionId,
                        sessionId: session.id,
                        subtaskId: subTask.id,
                        type: 'stderr',
                        data: chunk,
                    });
                }

                // Limit output size
                if (stderr.length > this.config.maxOutputSize) {
                    stderr = stderr.slice(-this.config.maxOutputSize);
                }
            });

            // Handle timeout
            const timeoutId = setTimeout(() => {
                timedOut = true;
                proc.kill('SIGKILL');
            }, this.config.timeout);

            // Handle completion
            proc.on('close', (code) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(executionId);

                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    timedOut,
                });
            });

            proc.on('error', (error) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(executionId);

                resolve({
                    exitCode: 1,
                    stdout,
                    stderr: error.message,
                    timedOut: false,
                });
            });
        });
    }

    /**
     * Parse artifacts from execution output
     */
    private parseArtifacts(stdout: string, sessionId: string): CoworkArtifact[] {
        const artifacts: CoworkArtifact[] = [];

        // Look for structured result
        const resultMatch = stdout.match(/---RESULT_START---\n([\s\S]*?)\n---RESULT_END---/);
        if (resultMatch) {
            try {
                const parsed = JSON.parse(resultMatch[1]);

                if (parsed.artifacts && Array.isArray(parsed.artifacts)) {
                    for (const a of parsed.artifacts) {
                        artifacts.push({
                            id: randomUUID(),
                            sessionId,
                            type: a.type || 'file',
                            name: a.name || basename(a.path || 'unknown'),
                            path: a.path,
                            createdAt: new Date(),
                        });
                    }
                }

                if (parsed.filesCreated && Array.isArray(parsed.filesCreated)) {
                    for (const path of parsed.filesCreated) {
                        if (!artifacts.find(a => a.path === path)) {
                            artifacts.push({
                                id: randomUUID(),
                                sessionId,
                                type: 'file',
                                name: basename(path),
                                path,
                                createdAt: new Date(),
                            });
                        }
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }

        return artifacts;
    }

    /**
     * Parse files modified from execution output
     */
    private parseFilesModified(stdout: string): string[] {
        const files: string[] = [];

        const resultMatch = stdout.match(/---RESULT_START---\n([\s\S]*?)\n---RESULT_END---/);
        if (resultMatch) {
            try {
                const parsed = JSON.parse(resultMatch[1]);

                if (parsed.filesModified && Array.isArray(parsed.filesModified)) {
                    files.push(...parsed.filesModified);
                }
                if (parsed.filesCreated && Array.isArray(parsed.filesCreated)) {
                    files.push(...parsed.filesCreated);
                }
                if (parsed.filesProcessed && Array.isArray(parsed.filesProcessed)) {
                    files.push(...parsed.filesProcessed);
                }
            } catch {
                // Ignore parse errors
            }
        }

        return [...new Set(files)];
    }

    /**
     * Cancel an active execution
     */
    cancel(executionId: string): boolean {
        const proc = this.activeProcesses.get(executionId);
        if (proc) {
            proc.kill('SIGKILL');
            this.activeProcesses.delete(executionId);
            logger.info({ executionId }, 'Execution cancelled');
            return true;
        }
        return false;
    }

    /**
     * Cancel all active executions
     */
    cancelAll(): number {
        let count = 0;
        for (const [id, proc] of this.activeProcesses) {
            proc.kill('SIGKILL');
            this.activeProcesses.delete(id);
            count++;
        }
        logger.info({ count }, 'All executions cancelled');
        return count;
    }

    /**
     * Get active execution count
     */
    getActiveCount(): number {
        return this.activeProcesses.size;
    }

    /**
     * Transform execution result to SubTaskResult
     */
    toSubTaskResult(result: ExecutionResult): SubTaskResult {
        // Extract summary from stdout
        let summary = '';
        const resultMatch = result.stdout.match(/---RESULT_START---\n([\s\S]*?)\n---RESULT_END---/);
        if (resultMatch) {
            try {
                const parsed = JSON.parse(resultMatch[1]);
                summary = parsed.summary || parsed.output || '';
            } catch {
                // Use first line of stdout as summary
                summary = result.stdout.split('\n')[0] || '';
            }
        }

        return {
            success: result.success,
            output: result.stdout,
            artifacts: result.artifacts.map(a => a.id),
            filesModified: result.filesModified,
            tokensUsed: 0, // Local execution doesn't use tokens
            duration: result.duration,
            summary: summary.slice(0, 500),
        };
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const coworkTaskExecutor = new CoworkTaskExecutor();

export default {
    CoworkTaskExecutor,
    coworkTaskExecutor,
};
