/**
 * QA Agent - Server-side A2A agent
 * 
 * Provides intelligent question-answering with source citations.
 */

import { callGeminiAPI } from '../ai/gemini.js';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface Answer {
    id: string;
    question: string;
    answer: string;
    sources?: string[];
    timestamp: string;
    helpful?: boolean;
}

interface QAContext {
    answers: Answer[];
}

// In-memory context storage
const contexts = new Map<string, QAContext>();

function getContext(contextId: string): QAContext {
    if (!contexts.has(contextId)) {
        contexts.set(contextId, { answers: [] });
    }
    return contexts.get(contextId)!;
}

// ------------------------------------------------------------------
// Core QA Logic
// ------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a knowledgeable Q&A assistant. Your job is to:
1. Answer questions thoroughly and accurately
2. Cite sources when possible (URLs or references)
3. Be concise but comprehensive
4. If you don't know something, say so honestly

When answering, structure your response as JSON:
{
    "answer": "Your detailed answer here",
    "sources": ["https://example.com/source1", "Reference: Book Name"]
}

Keep answers informative but digestible. Use markdown formatting where helpful.`;

async function answerQuestion(question: string, context: QAContext): Promise<{ answer: string; sources?: string[] }> {
    // Build context from recent answers
    const recentAnswers = context.answers.slice(-3).map(a =>
        `Q: ${a.question}\nA: ${a.answer.substring(0, 200)}...`
    ).join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}

${recentAnswers ? `Previous Q&A for context:\n${recentAnswers}\n\n` : ''}New question: ${question}

Provide a thorough answer with sources if applicable. Respond in JSON format.`;

    const response = await callGeminiAPI([
        { role: 'user', content: fullPrompt }
    ]);

    // Parse JSON response
    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                answer: parsed.answer || response,
                sources: parsed.sources || []
            };
        }
    } catch {
        // Fall back to plain text
    }

    return { answer: response };
}

// ------------------------------------------------------------------
// Agent Card
// ------------------------------------------------------------------

export function getQAAgentCard(baseUrl: string) {
    return {
        name: 'QA Agent',
        description: 'Intelligent question-answering agent with source citations',
        version: '1.0.0',
        protocolVersion: '1.0',
        url: `${baseUrl}/agents/qa`,
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: false
        },
        defaultInputModes: ['text/plain'],
        defaultOutputModes: ['text/plain', 'application/json'],
        skills: [
            {
                id: 'answer-questions',
                name: 'Answer Questions',
                description: 'Provide comprehensive answers to user questions with source citations',
                tags: ['qa', 'knowledge', 'search']
            }
        ]
    };
}

// ------------------------------------------------------------------
// A2A Request Handler
// ------------------------------------------------------------------

export async function handleQAAgentRequest(params: any): Promise<any> {
    const contextId = params.contextId || 'default';
    const context = getContext(contextId);

    // Extract user message
    const textPart = params.message?.parts?.find((p: { text?: string }) => p.text !== undefined);
    const userMessage = textPart?.text || textPart?.content || '';

    if (!userMessage) {
        return {
            id: params.id,
            contextId,
            status: { state: 'completed' },
            artifacts: [{
                artifactId: `qa-${Date.now()}`,
                parts: [{ type: 'text', text: 'Please ask a question.' }]
            }]
        };
    }

    // Answer the question
    const { answer, sources } = await answerQuestion(userMessage, context);

    // Store in context
    const newAnswer: Answer = {
        id: `answer-${Date.now()}`,
        question: userMessage,
        answer,
        sources,
        timestamp: new Date().toISOString()
    };
    context.answers.push(newAnswer);

    // Return response with both text (for chat) and data (for UI update)
    return {
        id: params.id,
        contextId,
        status: { state: 'completed' },
        artifacts: [
            {
                artifactId: `text-${Date.now()}`,
                parts: [{ type: 'text', text: answer }]
            },
            {
                artifactId: `data-${Date.now()}`,
                parts: [{
                    type: 'data',
                    data: {
                        answer: newAnswer,
                        allAnswers: context.answers
                    }
                }]
            }
        ]
    };
}
