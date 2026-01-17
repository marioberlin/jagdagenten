import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { searchWeb } from '../services/search.js';

// ============================================================================
// Types & State
// ============================================================================

interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
}

interface KeyFact {
    id: string;
    fact: string;
    confidence: 'high' | 'medium' | 'low';
}

interface ResearcherContext {
    query: string;
    results: SearchResult[];
    facts: KeyFact[];
    isSearching: boolean;
}

// In-memory state (session-based)
const researchState = new Map<string, ResearcherContext>();

function getContext(contextId: string): ResearcherContext {
    if (!researchState.has(contextId)) {
        researchState.set(contextId, {
            query: '',
            results: [],
            facts: [],
            isSearching: false
        });
    }
    return researchState.get(contextId)!;
}

// ============================================================================
// Tools Definition
// ============================================================================

const tools = [
    {
        name: 'search_web',
        description: 'Search the web for information (Simulated).',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: 'The search query' }
            },
            required: ['query']
        }
    },
    {
        name: 'extract_facts',
        description: 'Extract key facts from the current search results.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                focus: { type: SchemaType.STRING, description: 'Optional specific focus for extraction' }
            }
        }
    },
    {
        name: 'delete_item',
        description: 'Delete a search result or fact by ID.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: 'The ID of the item to delete' },
                type: { type: SchemaType.STRING, description: 'Type of item: "result" or "fact"' }
            },
            required: ['id', 'type']
        }
    }
];

// ============================================================================
// A2UI Generation
// ============================================================================

function generateResearcherUI(context: ResearcherContext): A2UIMessage[] {
    const { results, facts, isSearching } = context;

    const resultComponents = results.map(r => ({
        id: `result-${r.id}`,
        component: {
            Card: {
                children: [`res-header-${r.id}`, `res-snippet-${r.id}`, `res-footer-${r.id}`]
            }
        }
    }));

    const resultChildren = results.flatMap(r => [
        {
            id: `res-header-${r.id}`,
            component: {
                Row: { children: [`res-icon-${r.id}`, `res-title-${r.id}`], alignment: 'start' }
            }
        },
        {
            id: `res-icon-${r.id}`,
            component: { Text: { text: { literalString: '📄' } } }
        },
        {
            id: `res-title-${r.id}`,
            component: { Text: { text: { literalString: r.title }, semantic: 'h3' } }
        },
        {
            id: `res-snippet-${r.id}`,
            component: { Text: { text: { literalString: r.snippet }, variant: 'secondary' } }
        },
        {
            id: `res-footer-${r.id}`,
            component: { Text: { text: { literalString: `${r.source} • ${r.url}` }, variant: 'secondary' } }
        }
    ]);

    const factComponents = facts.map(f => ({
        id: `fact-${f.id}`,
        component: {
            Card: {
                children: [`fact-text-${f.id}`, `fact-badge-${f.id}`]
            }
        }
    }));

    const factChildren = facts.flatMap(f => [
        {
            id: `fact-text-${f.id}`,
            component: { Text: { text: { literalString: f.fact } } }
        },
        {
            id: `fact-badge-${f.id}`,
            component: { Text: { text: { literalString: `Confidence: ${f.confidence}` }, variant: 'secondary' } }
        }
    ]);

    return [
        { type: 'beginRendering', surfaceId: 'researcher-main', rootComponentId: 'root' },
        {
            type: 'surfaceUpdate',
            surfaceId: 'researcher-main',
            components: [
                {
                    id: 'root',
                    component: {
                        Row: { children: ['left-col', 'right-col'], alignment: 'start' }
                    }
                },
                // Left Column: Search Results
                {
                    id: 'left-col',
                    component: {
                        Column: { children: ['search-header', ...results.map(r => `result-${r.id}`)], alignment: 'stretch' }
                    }
                },
                {
                    id: 'search-header',
                    component: { Text: { text: { literalString: `Search Results (${results.length})` }, semantic: 'h2' } }
                },
                ...resultComponents,
                ...resultChildren,

                // Right Column: Facts
                {
                    id: 'right-col',
                    component: {
                        Column: { children: ['facts-header', ...facts.map(f => `fact-${f.id}`)], alignment: 'stretch' }
                    }
                },
                {
                    id: 'facts-header',
                    component: { Text: { text: { literalString: `Key Facts (${facts.length})` }, semantic: 'h2' } }
                },
                ...factComponents,
                ...factChildren
            ]
        }
    ];
}


// ============================================================================
// Agent Logic
// ============================================================================


export const getAIResearcherCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'AI Researcher',
    description: 'Autonomous web researcher. Searches, extracts facts, and summarizes.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/ai-researcher`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false },
    skills: [
        { id: 'web-search', name: 'Web Search', description: 'Simulated web search', examples: ['Search for quantum computing advancements'] },
        { id: 'fact-extraction', name: 'Fact Extraction', description: 'Extract key insights', examples: ['Extract facts from the results'] }
    ],
    provider: { organization: 'LiquidCrypto Agents' }
});

export async function handleAIResearcherRequest(params: SendMessageParams): Promise<any> {
    const messageText = params.message.parts
        .filter((p: { text?: string }) => p.text !== undefined)
        // @ts-ignore
        .map(p => p.text).join(' ');

    const contextId = params.contextId || 'default';
    const context = getContext(contextId);

    // 1. Setup Model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{ functionDeclarations: tools }]
    });

    const chat = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{
                    text: `You are an AI Researcher.

RULES:
1. **BE PROACTIVE**: If user asks to search, use 'search_web'.
2. If user asks for facts, use 'extract_facts'.
3. 'search_web' is a simulated tool. It returns distinct, realistic results.
4. 'extract_facts' should generate 3-5 bullet points based on the current results.

Current State:
Query: ${context.query}
Results: ${context.results.length} items
Facts: ${context.facts.length} items`
                }]
            },
            {
                role: 'model',
                parts: [{ text: 'Ready to research.' }]
            }
        ]
    });

    try {
        const result = await chat.sendMessage(messageText);
        const response = result.response;
        const functionCalls = response.functionCalls();
        let responseText = response.text() || "Research updated.";

        if (functionCalls && functionCalls.length > 0) {
            const updatesGiven: string[] = [];

            for (const call of functionCalls) {
                const args = call.args;

                if (call.name === 'search_web') {
                    const query = args.query as string;
                    context.query = query;

                    // Real Web Search
                    try {
                        context.isSearching = true;
                        const searchResults = await searchWeb(query);

                        context.results = searchResults.map(r => ({
                            id: randomUUID(),
                            title: r.title,
                            url: r.url,
                            snippet: r.snippet,
                            source: 'Web',
                            timestamp: new Date().toISOString()
                        }));

                        updatesGiven.push(`Found ${context.results.length} results for "${query}"`);
                    } catch (err) {
                        console.error("Search failed:", err);
                        updatesGiven.push(`Search failed for "${query}"`);
                    } finally {
                        context.isSearching = false;
                    }
                }
                else if (call.name === 'extract_facts') {
                    try {
                        context.isSearching = true;
                        if (context.results.length > 0) {
                            // Real Fact Extraction using another LLM call
                            const extractionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                            const prompt = `
                                Extract 3-5 key facts from the following search results about "${context.query}".
                                Format your response as a JSON array of objects with "fact" (string) and "confidence" ("high", "medium", or "low").
                                
                                Results:
                                ${JSON.stringify(context.results, null, 2)}
                                
                                Respond ONLY with the JSON array.
                            `;

                            const extractionResult = await extractionModel.generateContent(prompt);
                            const extractionText = extractionResult.response.text();

                            try {
                                // Clean up potential markdown formatting
                                const jsonMatch = extractionText.match(/\[.*\]/s);
                                const factsJson = jsonMatch ? jsonMatch[0] : extractionText;
                                const extractedFacts = JSON.parse(factsJson);

                                if (Array.isArray(extractedFacts)) {
                                    context.facts = extractedFacts.map(f => ({
                                        id: randomUUID(),
                                        fact: f.fact || f.text || String(f),
                                        confidence: f.confidence || 'medium'
                                    }));
                                    updatesGiven.push(`Extracted ${context.facts.length} real facts from results.`);
                                } else {
                                    throw new Error("Invalid format");
                                }
                            } catch (parseErr) {
                                console.error("Fact extraction parsing failed:", parseErr, extractionText);
                                updatesGiven.push("Failed to parse extracted facts.");
                            }
                        } else {
                            updatesGiven.push("No results to extract facts from.");
                        }
                    } finally {
                        context.isSearching = false;
                    }
                }
                else if (call.name === 'delete_item') {
                    const id = args.id as string;
                    if (args.type === 'result') {
                        const idx = context.results.findIndex(r => r.id === id);
                        if (idx !== -1) context.results.splice(idx, 1);
                    } else {
                        const idx = context.facts.findIndex(f => f.id === id);
                        if (idx !== -1) context.facts.splice(idx, 1);
                    }
                    updatesGiven.push("Deleted item");
                }
            }
            if (updatesGiven.length > 0) {
                responseText = updatesGiven.join(', ');
            }
        }

        const a2uiMessages = generateResearcherUI(context);

        return {
            id: randomUUID(),
            contextId: contextId,
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'research-dashboard',
                    parts: [
                        { type: 'text', text: responseText },
                        { type: 'a2ui', a2ui: a2uiMessages },
                        { type: 'data', mimeType: 'application/json', data: context }
                    ]
                }
            ],
            history: []
        };

    } catch (error) {
        console.error("LLM Error:", error);
        return {
            id: randomUUID(),
            contextId: contextId,
            status: { state: 'failed', error: String(error) },
            artifacts: []
        };
    }
}

