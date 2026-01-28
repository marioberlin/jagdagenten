/**
 * TaskPlanner Service
 *
 * AI-powered task analysis and plan generation using Gemini.
 */

import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger';
import type { TaskPlan, PlanStep, TaskType, TaskContext } from './types';

const logger = componentLoggers.http;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

interface PlanRequest {
    sessionId: string;
    description: string;
    context?: TaskContext;
}

interface AnalysisResult {
    taskType: TaskType;
    complexity: 'simple' | 'moderate' | 'complex';
    approach: string;
    steps: Array<{
        title: string;
        description: string;
        estimatedDuration: string;
        parallelizable: boolean;
        fileOperations: string[];
    }>;
    risks: string[];
    alternatives: string[];
    estimatedCost: number;
    estimatedTurns: number;
}

/**
 * TaskPlanner Service
 */
export class TaskPlanner {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || GEMINI_API_KEY || '';
    }

    /**
     * Generate a task title from description
     */
    async generateTitle(description: string): Promise<string> {
        if (!this.apiKey) {
            // Fallback: use first 50 chars
            const words = description.split(' ').slice(0, 6);
            return words.join(' ') + (words.length < description.split(' ').length ? '...' : '');
        }

        try {
            const prompt = `Generate a concise, action-oriented title (max 8 words) for this task:
"${description}"

Return ONLY the title, no quotes or explanation.`;

            const response = await this.callGemini(prompt);
            return response.trim().slice(0, 80);
        } catch (error) {
            logger.warn({ error }, 'Failed to generate title with AI, using fallback');
            return description.slice(0, 60) + (description.length > 60 ? '...' : '');
        }
    }

    /**
     * Analyze task and generate execution plan
     */
    async generatePlan(request: PlanRequest): Promise<TaskPlan> {
        const { sessionId, description, context } = request;

        logger.info({ sessionId }, 'Generating plan for task');

        let analysis: AnalysisResult;

        if (this.apiKey) {
            analysis = await this.analyzeWithAI(description, context);
        } else {
            analysis = this.generateFallbackAnalysis(description);
        }

        // Convert analysis to TaskPlan
        const plan: TaskPlan = {
            id: randomUUID(),
            sessionId,
            taskType: analysis.taskType,
            complexity: analysis.complexity,
            estimatedDuration: this.calculateDuration(analysis.steps),
            estimatedTurns: analysis.estimatedTurns,
            estimatedCost: analysis.estimatedCost,
            filesAffected: this.countFilesAffected(analysis.steps),
            steps: analysis.steps.map((step, index) => ({
                id: randomUUID(),
                order: index + 1,
                title: step.title,
                description: step.description,
                agentType: index === 0 ? 'primary' : 'sub-agent' as const,
                estimatedDuration: step.estimatedDuration,
                dependencies: index > 0 ? [analysis.steps[index - 1].title] : [],
                parallelizable: step.parallelizable,
                fileOperations: step.fileOperations as any[]
            })),
            approach: analysis.approach,
            risks: analysis.risks,
            alternatives: analysis.alternatives,
            generatedAt: new Date(),
            modelUsed: this.apiKey ? GEMINI_MODEL : 'fallback'
        };

        logger.info({ sessionId, steps: plan.steps.length }, 'Plan generated');

        return plan;
    }

    /**
     * Analyze task using Gemini AI
     */
    private async analyzeWithAI(description: string, context?: TaskContext): Promise<AnalysisResult> {
        const systemPrompt = `You are a task planning AI. Analyze the user's task and create an execution plan.

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "taskType": "file_organization" | "document_creation" | "data_processing" | "research_synthesis" | "code_generation" | "content_editing" | "batch_processing" | "mixed",
  "complexity": "simple" | "moderate" | "complex",
  "approach": "Brief description of overall approach (1-2 sentences)",
  "steps": [
    {
      "title": "Step title",
      "description": "What this step does",
      "estimatedDuration": "30s" | "1m" | "2m" | "5m",
      "parallelizable": true | false,
      "fileOperations": ["create", "read", "update", "delete", "move", "copy"]
    }
  ],
  "risks": ["Potential risk 1", "Potential risk 2"],
  "alternatives": ["Alternative approach 1"],
  "estimatedCost": 0.15,
  "estimatedTurns": 4
}

Guidelines:
- Break complex tasks into 3-7 steps
- Simple tasks: 1-3 steps, moderate: 3-5 steps, complex: 5-7 steps
- Be specific about what each step accomplishes
- Mark steps as parallelizable only if they don't depend on each other`;

        const userPrompt = `Task: ${description}${context ? `\n\nContext: ${JSON.stringify(context)}` : ''}`;

        try {
            const response = await this.callGemini(`${systemPrompt}\n\n${userPrompt}`);

            // Parse JSON from response (handle potential markdown wrapping)
            let jsonStr = response;
            if (response.includes('```json')) {
                jsonStr = response.split('```json')[1].split('```')[0];
            } else if (response.includes('```')) {
                jsonStr = response.split('```')[1].split('```')[0];
            }

            const analysis = JSON.parse(jsonStr.trim()) as AnalysisResult;

            // Validate and sanitize
            if (!analysis.steps || analysis.steps.length === 0) {
                throw new Error('No steps in analysis');
            }

            return {
                taskType: analysis.taskType || 'mixed',
                complexity: analysis.complexity || 'moderate',
                approach: analysis.approach || 'Executing the requested task step by step.',
                steps: analysis.steps.slice(0, 10),
                risks: analysis.risks || [],
                alternatives: analysis.alternatives || [],
                estimatedCost: analysis.estimatedCost || 0.10,
                estimatedTurns: analysis.estimatedTurns || analysis.steps.length
            };
        } catch (error) {
            logger.error({ error }, 'AI analysis failed, using fallback');
            return this.generateFallbackAnalysis(description);
        }
    }

    /**
     * Generate fallback analysis without AI
     */
    private generateFallbackAnalysis(description: string): AnalysisResult {
        // Detect task type from keywords
        const lowerDesc = description.toLowerCase();
        let taskType: TaskType = 'mixed';

        if (lowerDesc.includes('organize') || lowerDesc.includes('sort') || lowerDesc.includes('folder')) {
            taskType = 'file_organization';
        } else if (lowerDesc.includes('document') || lowerDesc.includes('write') || lowerDesc.includes('create')) {
            taskType = 'document_creation';
        } else if (lowerDesc.includes('data') || lowerDesc.includes('analyze') || lowerDesc.includes('csv')) {
            taskType = 'data_processing';
        } else if (lowerDesc.includes('code') || lowerDesc.includes('implement') || lowerDesc.includes('function')) {
            taskType = 'code_generation';
        } else if (lowerDesc.includes('research') || lowerDesc.includes('find') || lowerDesc.includes('search')) {
            taskType = 'research_synthesis';
        }

        return {
            taskType,
            complexity: 'moderate',
            approach: `I'll analyze the request and break it down into manageable steps: "${description.slice(0, 100)}..."`,
            steps: [
                {
                    title: 'Analyze requirements',
                    description: 'Parse the task description and identify key objectives',
                    estimatedDuration: '30s',
                    parallelizable: false,
                    fileOperations: ['read']
                },
                {
                    title: 'Gather context',
                    description: 'Collect necessary information from workspace',
                    estimatedDuration: '45s',
                    parallelizable: true,
                    fileOperations: ['read']
                },
                {
                    title: 'Execute main task',
                    description: 'Perform the core work as specified',
                    estimatedDuration: '2m',
                    parallelizable: false,
                    fileOperations: ['create', 'update']
                },
                {
                    title: 'Finalize results',
                    description: 'Prepare output artifacts and summary',
                    estimatedDuration: '30s',
                    parallelizable: false,
                    fileOperations: ['create']
                }
            ],
            risks: ['Task may require manual review'],
            alternatives: ['Alternative approach using different method'],
            estimatedCost: 0.10,
            estimatedTurns: 4
        };
    }

    /**
     * Call Gemini API
     */
    private async callGemini(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json() as {
            candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        return text;
    }

    /**
     * Calculate total duration from steps
     */
    private calculateDuration(steps: Array<{ estimatedDuration: string }>): string {
        let totalMs = 0;

        for (const step of steps) {
            const match = step.estimatedDuration.match(/(\d+)(s|m|h)/);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2];
                if (unit === 's') totalMs += value * 1000;
                else if (unit === 'm') totalMs += value * 60000;
                else if (unit === 'h') totalMs += value * 3600000;
            }
        }

        if (totalMs < 60000) return `${Math.round(totalMs / 1000)}s`;
        if (totalMs < 3600000) return `${Math.round(totalMs / 60000)}m`;
        return `${Math.round(totalMs / 3600000)}h`;
    }

    /**
     * Count files affected from steps
     */
    private countFilesAffected(steps: Array<{ fileOperations: string[] }>): number {
        const operations = steps.flatMap(s => s.fileOperations);
        const writeOps = operations.filter(op =>
            ['create', 'update', 'delete', 'move', 'copy'].includes(op)
        );
        return Math.max(1, Math.min(writeOps.length, 10));
    }
}

// Export singleton
export const taskPlanner = new TaskPlanner();
export default taskPlanner;
