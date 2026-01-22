/**
 * Project Assistant Agent
 * 
 * A Gemini-powered assistant that answers questions about the LiquidOS project,
 * including architecture, design system, A2A agents, and more.
 * 
 * Supports two modes:
 * 1. RAG Mode: Uses FileSearch store for dynamic, cited responses
 * 2. Fallback Mode: Uses static system prompt when no store is configured
 */

import { callAI } from '../ai/index.js';
import { queryWithRAG, getStore, type RAGQueryResult } from '../services/fileSearchService.js';

// Default store name for project documentation
const PROJECT_DOCS_STORE = 'fileSearchStores/project-assistant-docs';

// Fallback system prompt when RAG is not configured
const PROJECT_KNOWLEDGE_PROMPT = `You are the Liquid OS Project Assistant - an expert on the LiquidOS codebase and architecture. You help developers and users understand the project structure, design patterns, and capabilities.

## LiquidOS Overview

LiquidOS is an **Experimental Agentic Operating System** - a unified spatial desktop experience where all applications run as windowed Glass Apps. The system is built with React, TypeScript, and follows Apple's Human Interface Guidelines for glassmorphism design.

### Key Routes
- \`/os\` - LiquidOS Desktop (home screen with AgentCommandCenter)
- \`/os/settings/*\` - System preferences
- \`/os/agents\` - Agent Hub for AI agent management
- \`/os/console\` - A2A Console for debugging
- \`/os/showcase\` - Component library showcase

---

## Liquid Glass Design System

### Core Philosophy: "Liquid Intelligence"
The design system treats UI as a **living material** rather than static containers.

### Design Principles
1. **Material Reactivity**: Glass responds to data (volatility = vibrating glass, calm data = soft/misty)
2. **Semantic Tinting**: Colors extracted from content drive glass tint and glow
3. **Hand-Crafted Generativity**: LLM determines layout, but components enforce premium aesthetics

### Material Tiers
- \`ultraThin\` - Highest blur, most transparent
- \`thin\` - Light glass effect
- \`regular\` - Balanced appearance
- \`thick\` - Strong presence
- \`ultraThick\` - Maximum solidity

### Component Organization (390+ components)
\`\`\`
src/components/
├── primitives/     - GlassButton, GlassLabel, GlassContainer
├── forms/          - Inputs, DatePicker, Select
├── layout/         - Navbar, Sidebar, Dock, Tabs
├── feedback/       - Toast, Alert, Progress
├── data-display/   - Card, Table, Chart, Badge
├── overlays/       - Modal, Drawer, CommandPalette
├── features/       - Chat, Editor, Terminal
├── agentic/        - GlassAgent, GlassCopilot
├── trading/        - Trading-specific components
└── cowork/         - Collaboration components
\`\`\`

---

## A2A Protocol (Agent-to-Agent)

### v1.0 Standards
- **Methods**: PascalCase (SendMessage, GetTask, GetAgentCard)
- **Discovery**: Agents serve cards at \`/.well-known/agent-card.json\`
- **Task States**: submitted, working, input-required, completed, failed, canceled

### Agent Fleet (25+ agents)
- aurora-weather, neon-tokyo, documind, nanobanana
- travel-planner, dashboard-builder, research-canvas
- ai-researcher, qa-agent, state-machine, copilot-form
- Trading fleet: market-data, trade-executor, strategy, risk

---

Answer questions accurately and helpfully. When referencing code, use proper file paths and component names.`;

// Minimal system prompt for RAG mode (context comes from FileSearch)
const RAG_SYSTEM_PROMPT = `You are the Liquid OS Project Assistant. Answer questions about the LiquidOS codebase using the retrieved documentation. Be accurate and cite sources when possible.`;

/**
 * Check if RAG store is configured and available
 */
async function isRAGConfigured(): Promise<boolean> {
    try {
        const store = await getStore(PROJECT_DOCS_STORE);
        return store !== null;
    } catch {
        return false;
    }
}

/**
 * Get the agent card for discovery
 */
export function getProjectAssistantCard(baseUrl: string) {
    return {
        name: 'project-assistant',
        displayName: 'LiquidOS Project Assistant',
        description: 'Expert assistant for the LiquidOS codebase, architecture, design system, and A2A agents',
        version: '1.1.0',
        protocolVersion: '1.0',
        capabilities: {
            streaming: true,
            a2ui: false,
            fileSearch: true  // Indicates RAG capability
        },
        skills: [
            { id: 'architecture', name: 'Architecture Knowledge', description: 'Explains LiquidOS architecture and patterns' },
            { id: 'design-system', name: 'Design System', description: 'Liquid Glass design system expertise' },
            { id: 'a2a-protocol', name: 'A2A Protocol', description: 'Agent-to-Agent protocol knowledge' },
            { id: 'components', name: 'Component Library', description: '390+ component documentation' }
        ],
        url: `${baseUrl}/agents/project-assistant`
    };
}

/**
 * Handle A2A protocol requests
 */
export async function handleProjectAssistantRequest(params: any) {
    const message = params?.message;
    const textPart = message?.parts?.find((p: any) => 'text' in p);
    const userPrompt = textPart?.text || params?.prompt || 'Hello';
    const useRAG = params?.useRAG !== false; // Default to RAG if available

    try {
        let response: string;
        let citations: any[] = [];

        // Try RAG mode first if enabled
        if (useRAG) {
            const ragConfigured = await isRAGConfigured();
            if (ragConfigured) {
                console.log('[ProjectAssistant] Using RAG mode with FileSearch');
                const result = await queryWithRAG(
                    PROJECT_DOCS_STORE,
                    userPrompt,
                    'gemini-2.5-pro',
                    RAG_SYSTEM_PROMPT
                );
                response = result.text;
                citations = result.citations || [];
            } else {
                // Fallback to static prompt
                console.log('[ProjectAssistant] RAG not configured, using static prompt');
                response = await callAI('gemini', [
                    { role: 'system', content: PROJECT_KNOWLEDGE_PROMPT },
                    { role: 'user', content: userPrompt }
                ]);
            }
        } else {
            // Explicitly requested non-RAG mode
            response = await callAI('gemini', [
                { role: 'system', content: PROJECT_KNOWLEDGE_PROMPT },
                { role: 'user', content: userPrompt }
            ]);
        }

        return {
            status: 'completed',
            message: {
                role: 'agent',
                parts: [{ text: response }]
            },
            citations: citations.length > 0 ? citations : undefined
        };
    } catch (error) {
        console.error('[ProjectAssistant] Error:', error);
        return {
            status: 'failed',
            message: {
                role: 'agent',
                parts: [{ text: 'I encountered an error processing your request. Please try again.' }]
            }
        };
    }
}

/**
 * Handle simple chat requests (non-A2A)
 * Returns response with optional citations
 */
export async function handleProjectAssistantChat(
    prompt: string,
    options?: { useRAG?: boolean; storeName?: string }
): Promise<{ text: string; citations?: any[] }> {
    const useRAG = options?.useRAG !== false;
    const storeName = options?.storeName || PROJECT_DOCS_STORE;

    try {
        // Try RAG mode first if enabled
        if (useRAG) {
            const ragConfigured = await isRAGConfigured();
            if (ragConfigured) {
                console.log('[ProjectAssistant] Chat using RAG mode');
                const result = await queryWithRAG(
                    storeName,
                    prompt,
                    'gemini-2.5-pro',
                    RAG_SYSTEM_PROMPT
                );
                return {
                    text: result.text,
                    citations: result.citations
                };
            }
        }

        // Fallback to static prompt
        console.log('[ProjectAssistant] Chat using static prompt');
        const response = await callAI('gemini', [
            { role: 'system', content: PROJECT_KNOWLEDGE_PROMPT },
            { role: 'user', content: prompt }
        ]);
        return { text: response };
    } catch (error) {
        console.error('[ProjectAssistant] Chat error:', error);
        throw error;
    }
}

/**
 * Get the current RAG configuration status
 */
export async function getRAGStatus(): Promise<{
    enabled: boolean;
    storeName: string;
    configured: boolean;
}> {
    const configured = await isRAGConfigured();
    return {
        enabled: true,
        storeName: PROJECT_DOCS_STORE,
        configured
    };
}

