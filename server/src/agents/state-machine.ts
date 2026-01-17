/**
 * State Machine Agent - Server-side A2A agent
 * 
 * Provides AI-guided workflow/wizard state management.
 */

import { callGeminiAPI } from '../ai/gemini.js';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface FlowStage {
    id: string;
    name: string;
    description: string;
    next: string[];
}

interface FlowData {
    [key: string]: string | number | boolean | string[];
}

interface FlowContext {
    stages: FlowStage[];
    currentStage: string;
    data: FlowData;
    history: string[];
}

// In-memory context storage
const contexts = new Map<string, FlowContext>();

const DEFAULT_STAGES: FlowStage[] = [
    { id: 'contact', name: 'Contact Info', description: 'Collect customer details', next: ['car'] },
    { id: 'car', name: 'Car Selection', description: 'Configure dream car', next: ['payment'] },
    { id: 'payment', name: 'Payment', description: 'Process payment', next: ['confirm'] },
    { id: 'confirm', name: 'Confirmation', description: 'Order complete', next: [] }
];

function getContext(contextId: string): FlowContext {
    if (!contexts.has(contextId)) {
        contexts.set(contextId, {
            stages: DEFAULT_STAGES,
            currentStage: 'contact',
            data: {
                name: '', email: '', phone: '',
                model: '', color: '', trim: '',
                paymentMethod: '', cardNumber: ''
            },
            history: ['contact']
        });
    }
    return contexts.get(contextId)!;
}

// ------------------------------------------------------------------
// Core Flow Logic
// ------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a helpful car purchase assistant guiding customers through a wizard workflow.

Current stages: contact → car → payment → confirm

Your capabilities:
1. Update form fields (name, email, phone, model, color, trim, paymentMethod, cardNumber)
2. Navigate between stages
3. Provide helpful suggestions based on the current stage

Available models: sedan, suv, truck, coupe
Available colors: white, black, silver, blue, red
Available trims: base, sport, luxury, performance
Payment methods: credit, debit, financing, cash

When a user gives you information, extract and return it as JSON:
{
    "action": "update" | "navigate" | "suggest",
    "updates": { "field": "value" },
    "targetStage": "stage_id",
    "message": "Your response to the user"
}

Be proactive and helpful. If they mention their name, update the name field. If they want to see payment options, navigate to payment.`;

async function processFlowRequest(userMessage: string, context: FlowContext): Promise<{
    updates?: FlowData;
    targetStage?: string;
    message: string;
}> {
    const prompt = `${SYSTEM_PROMPT}

Current state:
- Stage: ${context.currentStage} (${context.stages.find(s => s.id === context.currentStage)?.name})
- Data collected: ${JSON.stringify(context.data)}
- History: ${context.history.join(' → ')}

User says: "${userMessage}"

Respond with JSON.`;

    const response = await callGeminiAPI([
        { role: 'user', content: prompt }
    ]);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                updates: parsed.updates,
                targetStage: parsed.targetStage,
                message: parsed.message || 'Got it!'
            };
        }
    } catch {
        // Fall back to plain text response
    }

    return { message: response };
}

// ------------------------------------------------------------------
// Agent Card
// ------------------------------------------------------------------

export function getStateMachineAgentCard(baseUrl: string) {
    return {
        name: 'State Machine Agent',
        description: 'AI-guided workflow/wizard state management for multi-step processes',
        version: '1.0.0',
        protocolVersion: '1.0',
        url: `${baseUrl}/agents/state-machine`,
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: true
        },
        defaultInputModes: ['text/plain'],
        defaultOutputModes: ['text/plain', 'application/json'],
        skills: [
            {
                id: 'guided-workflow',
                name: 'Guided Workflow',
                description: 'Guide users through multi-step wizard flows with AI assistance',
                tags: ['workflow', 'wizard', 'state-machine', 'forms']
            },
            {
                id: 'form-assistant',
                name: 'Form Assistant',
                description: 'Help users fill out forms by extracting information from natural language',
                tags: ['forms', 'data-extraction', 'assistant']
            }
        ]
    };
}

// ------------------------------------------------------------------
// A2A Request Handler
// ------------------------------------------------------------------

export async function handleStateMachineRequest(params: any): Promise<any> {
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
                artifactId: `flow-${Date.now()}`,
                parts: [{ type: 'text', text: `You're currently on the ${context.stages.find(s => s.id === context.currentStage)?.name} step. How can I help?` }]
            }]
        };
    }

    // Process the request
    const result = await processFlowRequest(userMessage, context);

    // Apply updates
    if (result.updates) {
        Object.assign(context.data, result.updates);
    }

    // Navigate if requested
    if (result.targetStage && context.stages.find(s => s.id === result.targetStage)) {
        context.currentStage = result.targetStage;
        if (!context.history.includes(result.targetStage)) {
            context.history.push(result.targetStage);
        }
    }

    // Return response with both text and data
    return {
        id: params.id,
        contextId,
        status: { state: 'completed' },
        artifacts: [
            {
                artifactId: `text-${Date.now()}`,
                parts: [{ type: 'text', text: result.message }]
            },
            {
                artifactId: `data-${Date.now()}`,
                parts: [{
                    type: 'data',
                    data: {
                        currentStage: context.currentStage,
                        stage: context.stages.find(s => s.id === context.currentStage),
                        data: context.data,
                        history: context.history,
                        updates: result.updates
                    }
                }]
            }
        ]
    };
}
