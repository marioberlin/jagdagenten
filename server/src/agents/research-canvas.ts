import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// ============================================================================
// Types & State
// ============================================================================

type BlockType = 'text' | 'quote' | 'source';

interface ResearchBlock {
    id: string;
    type: BlockType;
    content: string;
    source?: string;
    url?: string;
}

interface ResearchContext {
    topic: string;
    blocks: ResearchBlock[];
}

// In-memory state (session-based)
const researchState = new Map<string, ResearchContext>();

function getContext(contextId: string): ResearchContext {
    if (!researchState.has(contextId)) {
        researchState.set(contextId, {
            topic: 'Artificial Intelligence in Healthcare',
            blocks: [
                {
                    id: '1',
                    type: 'text',
                    content: 'AI is transforming healthcare through early disease detection, personalized treatment plans, and improved diagnostic accuracy. Machine learning algorithms can analyze medical images, predict patient outcomes, and streamline administrative tasks.',
                },
                {
                    id: '2',
                    type: 'source',
                    content: 'AI in Healthcare: A Comprehensive Review',
                    source: 'Nature Medicine',
                    url: 'https://nature.com/articles/ai-healthcare'
                }
            ]
        });
    }
    return researchState.get(contextId)!;
}

// ============================================================================
// Tools Definition
// ============================================================================

const tools = [
    {
        name: 'add_block',
        description: 'Add a new content block to the research canvas.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING, description: 'Block type: text, quote, or source' },
                content: { type: SchemaType.STRING, description: 'The content text' },
                source: { type: SchemaType.STRING, description: 'Source name (optional for text)' },
                url: { type: SchemaType.STRING, description: 'Source URL (optional)' }
            },
            required: ['type', 'content']
        }
    },
    {
        name: 'delete_block',
        description: 'Remove a block from the canvas by ID or content matching.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                blockId: { type: SchemaType.STRING, description: 'ID of the block to delete' }
            },
            required: ['blockId']
        }
    },
    {
        name: 'update_topic',
        description: 'Change the main research topic.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                topic: { type: SchemaType.STRING, description: 'The new research topic' }
            },
            required: ['topic']
        }
    }
];

// ============================================================================
// A2UI Generation
// ============================================================================

function generateResearchUI(context: ResearchContext): A2UIMessage[] {
    const { topic, blocks } = context;

    const blockComponents = blocks.flatMap(block => {
        const isQuote = block.type === 'quote';
        const isSource = block.type === 'source';

        // Icon mapping (visualized via text for now, or specific icons if A2UI supports)
        const icon = isQuote ? '❝' : isSource ? '🔗' : '📄';

        // Color hints (simulated via variant/text)
        const titlePrefix = isQuote ? 'Quote' : isSource ? 'Source' : 'Note';

        return [
            {
                id: `block-${block.id}`,
                component: {
                    Card: {
                        children: [`header-${block.id}`, `content-${block.id}`, `footer-${block.id}`],
                    }
                }
            },
            {
                id: `header-${block.id}`,
                component: {
                    Row: {
                        children: [`icon-${block.id}`, `meta-${block.id}`],
                        alignment: 'center'
                    }
                }
            },
            {
                id: `icon-${block.id}`,
                component: {
                    Text: { text: { literalString: icon }, variant: 'secondary' }
                }
            },
            {
                id: `meta-${block.id}`,
                component: {
                    Text: { text: { literalString: titlePrefix }, variant: 'secondary' }
                }
            },
            {
                id: `content-${block.id}`,
                component: {
                    Text: {
                        text: { literalString: block.content },
                        variant: isQuote ? 'primary' : 'secondary' // Highlight quotes
                    }
                }
            },
            {
                id: `footer-${block.id}`,
                component: {
                    Text: {
                        text: { literalString: block.source ? `— ${block.source}` : `ID: ${block.id}` },
                        variant: 'secondary'
                    }
                }
            }
        ];
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'research-main',
            rootComponentId: 'root',
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'research-main',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['topic-header', 'blocks-container'],
                            alignment: 'start'
                        }
                    }
                },
                {
                    id: 'topic-header',
                    component: {
                        Card: {
                            children: ['topic-label', 'topic-value']
                        }
                    }
                },
                {
                    id: 'topic-label',
                    component: { Text: { text: { literalString: 'Research Topic' }, variant: 'secondary' } }
                },
                {
                    id: 'topic-value',
                    component: { Text: { text: { literalString: topic }, semantic: 'h2' } }
                },
                {
                    id: 'blocks-container',
                    component: {
                        Column: {
                            children: blocks.map(b => `block-${b.id}`),
                            alignment: 'stretch'
                        }
                    }
                },
                ...blockComponents
            ]
        }
    ];
}


// ============================================================================
// Agent Logic
// ============================================================================


export const getResearchCanvasAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'Research Canvas',
    description: 'AI-powered research assistant. Organizes findings into blocks.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/research-canvas`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: false },
    skills: [
        {
            id: 'organize-research',
            name: 'Organize Research',
            description: 'Add, update, and structure research content',
            examples: ['Add a quote about AI', 'Change topic to Quantum Computing', 'Remove the last note'],
        }
    ],
    provider: { organization: 'LiquidCrypto Agents' }
});

export async function handleResearchCanvasRequest(params: SendMessageParams): Promise<any> {
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
                    text: `You are a helpful and proactive research assistant managing a canvas of content blocks.

RULES:
1. **BE PROACTIVE**: When the user asks to add notes, summaries, or quotes, **YOU MUST GENERATE THE CONTENT YOURSELF** based on your knowledge. Do not ask the user to write it for you.
2. Use 'add_block' to save the content you generated.
   - For 'quote' type, try to include a 'source' if known.
   - For 'text' type, write clear, concise summaries or explanations.
3. Use 'delete_block' to remove items.
4. Use 'update_topic' if the user changes the research subject.
5. **Defaults**: If type is unspecified, assume 'text'.

Current State:
Topic: ${context.topic}
Blocks: ${JSON.stringify(context.blocks, null, 2)}`
                }]
            },
            {
                role: 'model',
                parts: [{ text: 'Ready to assist with your research canvas.' }]
            }
        ]
    });

    try {
        const result = await chat.sendMessage(messageText);
        const response = result.response;
        const functionCalls = response.functionCalls();
        let responseText = response.text() || "Canvas updated.";

        if (functionCalls && functionCalls.length > 0) {
            const updatesGiven = [];

            for (const call of functionCalls) {
                const args = call.args;

                if (call.name === 'add_block') {
                    const newBlock: ResearchBlock = {
                        id: Date.now().toString() + Math.random().toString().slice(2, 5),
                        type: (args.type as BlockType) || 'text',
                        content: args.content as string,
                        source: args.source as string,
                        url: args.url as string
                    };
                    context.blocks.push(newBlock);
                    updatesGiven.push(`Added ${newBlock.type} block`);
                }
                else if (call.name === 'delete_block') {
                    const id = args.blockId as string;
                    const idx = context.blocks.findIndex(b => b.id === id);
                    if (idx !== -1) {
                        context.blocks.splice(idx, 1);
                        updatesGiven.push("Deleted block");
                    }
                }
                else if (call.name === 'update_topic') {
                    context.topic = args.topic as string;
                    updatesGiven.push(`Topic updated to "${context.topic}"`);
                }
            }

            if (updatesGiven.length > 0) responseText = updatesGiven.join(', ');
        }

        const a2uiMessages = generateResearchUI(context);
        const taskId = randomUUID();

        return {
            id: taskId,
            contextId: contextId,
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'research-board',
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
            status: { state: 'failed', error: String(error) }, // Return detailed error for debugging
            artifacts: []
        };
    }
}
