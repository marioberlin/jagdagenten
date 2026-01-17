/**
 * Copilot Form Agent - Server-side A2A agent
 * 
 * specializes in extracting structured form data from natural language for security incident reports.
 */

import { callGeminiAPI } from '../ai/gemini.js';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface IncidentFormData {
    reporterName?: string;
    reporterEmail?: string;
    incidentDate?: string;
    incidentType?: string;
    severity?: string;
    description?: string;
    affectedSystems?: string;
    actionsTaken?: string;
}

// ------------------------------------------------------------------
// Core Logic
// ------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a security incident reporting assistant.
Your goal is to extract structured information from the user's report to fill out an incident form.

Fields to extract:
- reporterName (string)
- reporterEmail (string)
- incidentDate (YYYY-MM-DD)
- incidentType (one of: data_breach, phishing, malware, unauthorized_access, other)
- severity (one of: low, medium, high, critical)
- description (detailed explanation)
- affectedSystems (list systems/services)
- actionsTaken (what has been done so far)

If information is missing, do not invent it.
If the date is "today", use the current date.

Respond ONLY with valid JSON containing the extracted fields.
Example:
{
    "incidentType": "phishing",
    "severity": "high",
    "description": "Received suspicious email..."
}`;

async function extractFormData(userMessage: string): Promise<IncidentFormData> {
    const prompt = `${SYSTEM_PROMPT}

Current Date: ${new Date().toISOString().split('T')[0]}

User Report: "${userMessage}"

JSON Response:`;

    const response = await callGeminiAPI([
        { role: 'user', content: prompt }
    ]);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch {
        console.error("Failed to parse JSON from Copilot Form Agent");
    }

    return { description: userMessage }; // Fallback
}

// ------------------------------------------------------------------
// Agent Card
// ------------------------------------------------------------------

export function getCopilotFormAgentCard(baseUrl: string) {
    return {
        name: 'Copilot Form Agent',
        description: 'Assists in filling out complex forms by extracting data from natural language',
        version: '1.0.0',
        protocolVersion: '1.0',
        url: `${baseUrl}/agents/copilot-form`,
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: false
        },
        defaultInputModes: ['text/plain'],
        defaultOutputModes: ['text/plain', 'application/json'],
        skills: [
            {
                id: 'extract-incident-data',
                name: 'Extract Incident Data',
                description: 'Extracts security incident details from text',
                tags: ['form-filling', 'extraction', 'security']
            }
        ]
    };
}

// ------------------------------------------------------------------
// A2A Request Handler
// ------------------------------------------------------------------

export async function handleCopilotFormRequest(params: any): Promise<any> {
    const contextId = params.contextId || 'default';

    // Extract user message
    const textPart = params.message?.parts?.find((p: any) => p.type === 'text' || p.text);
    const userMessage = textPart?.text || textPart?.content || '';

    if (!userMessage) {
        return {
            id: params.id,
            contextId,
            status: { state: 'completed' },
            artifacts: [{
                artifactId: `msg-${Date.now()}`,
                parts: [{ type: 'text', text: 'Please describe the incident.' }]
            }]
        };
    }

    // Process extraction
    const extractedData = await extractFormData(userMessage);

    // Create a confirmation message based on what was found
    const fieldsFound = Object.keys(extractedData).length;
    const message = fieldsFound > 0
        ? `I've updated the form with details about the ${extractedData.incidentType || 'incident'}.`
        : "I couldn't identify specific details. Please provide more information.";

    return {
        id: params.id,
        contextId,
        status: { state: 'completed' },
        artifacts: [
            {
                artifactId: `text-${Date.now()}`,
                parts: [{ type: 'text', text: message }]
            },
            {
                artifactId: `data-${Date.now()}`,
                parts: [{
                    type: 'data',
                    data: extractedData
                }]
            }
        ]
    };
}
