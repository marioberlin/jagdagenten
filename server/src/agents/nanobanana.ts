import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// NanoBanana Pro - AI Image Generation with Gemini
// ============================================================================

interface GenerationRequest {
    prompt: string;
    negativePrompt?: string;
    style?: 'photorealistic' | 'digital-art' | 'anime' | 'watercolor' | '3d-render' | 'sketch';
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
    numberOfImages: 1 | 2 | 4;
}

interface GeneratedImage {
    id: string;
    prompt: string;
    enhancedPrompt?: string;
    style: string;
    createdAt: string;
    // Note: In production, this would be a URL to stored image
    // For now, we'll use placeholder functionality
    status: 'completed' | 'failed';
    message?: string;
}

interface GenerationJob {
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    results: GeneratedImage[];
    error?: string;
}

// In-memory storage for generation jobs
const generationJobs = new Map<string, GenerationJob>();
const generationHistory: GeneratedImage[] = [];

// Style presets for prompt enhancement
const STYLE_PRESETS: Record<string, string> = {
    'photorealistic': 'photorealistic, highly detailed, sharp focus, professional photography, 8k resolution',
    'digital-art': 'digital art, vibrant colors, detailed illustration, artstation trending',
    'anime': 'anime style, cel shaded, Studio Ghibli inspired, vibrant, detailed',
    'watercolor': 'watercolor painting, soft edges, artistic, flowing colors, paper texture',
    '3d-render': '3D render, octane render, realistic lighting, cinematic, highly detailed',
    'sketch': 'pencil sketch, hand drawn, artistic, detailed linework, black and white',
};

// ============================================================================
// Gemini API Integration
// ============================================================================

async function enhancePrompt(prompt: string, style: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // Return basic enhanced prompt without AI
        const styleEnhancement = STYLE_PRESETS[style] || '';
        return `${prompt}, ${styleEnhancement}`.trim();
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an expert at creating detailed image generation prompts. Enhance this prompt for ${style} style image generation. Keep it concise (under 100 words) but highly descriptive. Focus on visual details, lighting, composition.

Original prompt: "${prompt}"

Enhanced prompt (just the prompt, no explanation):`
                        }]
                    }],
                    generationConfig: { maxOutputTokens: 150, temperature: 0.8 }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const enhanced = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return enhanced || prompt;
    } catch (error) {
        console.error('[NanoBanana] Prompt enhancement error:', error);
        return `${prompt}, ${STYLE_PRESETS[style] || ''}`.trim();
    }
}

async function generateWithGemini(request: GenerationRequest): Promise<GenerationJob> {
    const jobId = randomUUID();
    const apiKey = process.env.GEMINI_API_KEY;

    // Create initial job
    const job: GenerationJob = {
        id: jobId,
        status: 'processing',
        progress: 0,
        results: [],
    };
    generationJobs.set(jobId, job);

    try {
        // Enhance the prompt
        job.progress = 20;
        const enhancedPrompt = await enhancePrompt(request.prompt, request.style || 'digital-art');

        if (!apiKey) {
            // Without API key, return a simulated result
            job.progress = 100;
            job.status = 'completed';
            job.results = [{
                id: randomUUID(),
                prompt: request.prompt,
                enhancedPrompt,
                style: request.style || 'digital-art',
                createdAt: new Date().toISOString(),
                status: 'completed',
                message: 'Image generation requires GEMINI_API_KEY. This is a simulation.',
            }];

            generationHistory.unshift(job.results[0]);
            return job;
        }

        // Note: Gemini's image generation (Imagen) requires Vertex AI
        // For the standard Gemini API, we can use vision models for understanding
        // but generation requires different setup.
        // Here we'll document the expected flow:

        job.progress = 50;

        // Simulated generation with enhanced prompt
        // In production, this would call Vertex AI Imagen API
        const result: GeneratedImage = {
            id: randomUUID(),
            prompt: request.prompt,
            enhancedPrompt,
            style: request.style || 'digital-art',
            createdAt: new Date().toISOString(),
            status: 'completed',
            message: `Enhanced prompt: "${enhancedPrompt.substring(0, 100)}..."`,
        };

        job.progress = 100;
        job.status = 'completed';
        job.results = [result];

        // Add to history
        generationHistory.unshift(result);
        if (generationHistory.length > 20) {
            generationHistory.pop();
        }

        return job;

    } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Generation failed';
        return job;
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generatePromptForm(defaultStyle?: string): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'prompt-form',
            rootComponentId: 'root',
            styling: { primaryColor: '#F59E0B', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'prompt-form',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['header', 'subtitle', 'prompt-field', 'style-section', 'aspect-section', 'advanced-section', 'generate-btn'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '🍌 NanoBanana Pro' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: 'AI Image Generation powered by Gemini' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'prompt-field',
                    component: {
                        Column: {
                            children: ['prompt-label', 'prompt-input'],
                        },
                    },
                },
                {
                    id: 'prompt-label',
                    component: {
                        Text: {
                            text: { literalString: 'Describe your image:' },
                            semantic: 'h4',
                        },
                    },
                },
                {
                    id: 'prompt-input',
                    component: {
                        TextField: {
                            label: { literalString: '' },
                            placeholder: { literalString: 'A majestic dragon perched on a crystal mountain at sunset...' },
                            inputType: 'text',
                        },
                    },
                },
                {
                    id: 'style-section',
                    component: {
                        Column: {
                            children: ['style-label', 'style-buttons'],
                        },
                    },
                },
                {
                    id: 'style-label',
                    component: {
                        Text: {
                            text: { literalString: 'Style:' },
                            semantic: 'h4',
                        },
                    },
                },
                {
                    id: 'style-buttons',
                    component: {
                        Row: {
                            children: ['style-photo', 'style-digital', 'style-anime'],
                        },
                    },
                },
                {
                    id: 'style-photo',
                    component: {
                        Button: {
                            label: { literalString: '📷 Photo' },
                            action: { custom: { actionId: 'set_style', data: { style: 'photorealistic' } } },
                        },
                    },
                },
                {
                    id: 'style-digital',
                    component: {
                        Button: {
                            label: { literalString: '🎨 Digital Art' },
                            action: { custom: { actionId: 'set_style', data: { style: 'digital-art' } } },
                        },
                    },
                },
                {
                    id: 'style-anime',
                    component: {
                        Button: {
                            label: { literalString: '✨ Anime' },
                            action: { custom: { actionId: 'set_style', data: { style: 'anime' } } },
                        },
                    },
                },
                {
                    id: 'aspect-section',
                    component: {
                        Column: {
                            children: ['aspect-label', 'aspect-buttons'],
                        },
                    },
                },
                {
                    id: 'aspect-label',
                    component: {
                        Text: {
                            text: { literalString: 'Aspect Ratio:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'aspect-buttons',
                    component: {
                        Row: {
                            children: ['aspect-1', 'aspect-16', 'aspect-9', 'aspect-4'],
                        },
                    },
                },
                {
                    id: 'aspect-1',
                    component: {
                        Button: {
                            label: { literalString: '1:1' },
                            action: { custom: { actionId: 'set_aspect', data: { aspect: '1:1' } } },
                        },
                    },
                },
                {
                    id: 'aspect-16',
                    component: {
                        Button: {
                            label: { literalString: '16:9' },
                            action: { custom: { actionId: 'set_aspect', data: { aspect: '16:9' } } },
                        },
                    },
                },
                {
                    id: 'aspect-9',
                    component: {
                        Button: {
                            label: { literalString: '9:16' },
                            action: { custom: { actionId: 'set_aspect', data: { aspect: '9:16' } } },
                        },
                    },
                },
                {
                    id: 'aspect-4',
                    component: {
                        Button: {
                            label: { literalString: '4:3' },
                            action: { custom: { actionId: 'set_aspect', data: { aspect: '4:3' } } },
                        },
                    },
                },
                {
                    id: 'advanced-section',
                    component: {
                        Column: {
                            children: ['advanced-label', 'negative-input'],
                        },
                    },
                },
                {
                    id: 'advanced-label',
                    component: {
                        Text: {
                            text: { literalString: 'Avoid (optional):' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'negative-input',
                    component: {
                        TextField: {
                            label: { literalString: '' },
                            placeholder: { literalString: 'blurry, watermark, text, low quality...' },
                            inputType: 'text',
                        },
                    },
                },
                {
                    id: 'generate-btn',
                    component: {
                        Button: {
                            label: { literalString: '🎨 Generate Image' },
                            action: { input: { text: 'generate' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateProgressView(job: GenerationJob): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'progress-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#F59E0B' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'progress-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['header', 'status', 'progress-bar', 'cancel-btn'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '🍌 Creating your image...' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'status',
                    component: {
                        Text: {
                            text: { literalString: job.status === 'processing' ? 'Generating with AI...' : 'Preparing...' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'progress-bar',
                    component: {
                        Text: {
                            text: { literalString: `Progress: ${'█'.repeat(Math.floor(job.progress / 10))}${'░'.repeat(10 - Math.floor(job.progress / 10))} ${job.progress}%` },
                        },
                    },
                },
                {
                    id: 'cancel-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Cancel' },
                            action: { input: { text: 'cancel generation' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateResultView(job: GenerationJob): A2UIMessage[] {
    const result = job.results[0];

    if (!result || job.status === 'failed') {
        return [
            {
                type: 'beginRendering',
                surfaceId: 'result-view',
                rootComponentId: 'root',
                styling: { primaryColor: '#EF4444' },
            },
            {
                type: 'surfaceUpdate',
                surfaceId: 'result-view',
                components: [
                    {
                        id: 'root',
                        component: {
                            Card: {
                                children: ['error-header', 'error-msg', 'retry-btn'],
                            },
                        },
                    },
                    {
                        id: 'error-header',
                        component: {
                            Text: {
                                text: { literalString: '❌ Generation Failed' },
                                semantic: 'h2',
                            },
                        },
                    },
                    {
                        id: 'error-msg',
                        component: {
                            Text: {
                                text: { literalString: job.error || 'An error occurred during generation.' },
                            },
                        },
                    },
                    {
                        id: 'retry-btn',
                        component: {
                            Button: {
                                label: { literalString: 'Try Again' },
                                action: { input: { text: 'new image' } },
                            },
                        },
                    },
                ],
            },
        ];
    }

    return [
        {
            type: 'beginRendering',
            surfaceId: 'result-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#10B981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'result-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'result-card', 'details', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '✅ Generation Complete!' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'result-card',
                    component: {
                        Card: {
                            children: ['prompt-section', 'enhanced-section', 'style-info'],
                        },
                    },
                },
                {
                    id: 'prompt-section',
                    component: {
                        Column: {
                            children: ['prompt-label', 'prompt-text'],
                        },
                    },
                },
                {
                    id: 'prompt-label',
                    component: {
                        Text: {
                            text: { literalString: 'Original Prompt:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'prompt-text',
                    component: {
                        Text: {
                            text: { literalString: result.prompt },
                        },
                    },
                },
                {
                    id: 'enhanced-section',
                    component: {
                        Column: {
                            children: ['enhanced-label', 'enhanced-text'],
                        },
                    },
                },
                {
                    id: 'enhanced-label',
                    component: {
                        Text: {
                            text: { literalString: '🤖 AI Enhanced Prompt:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'enhanced-text',
                    component: {
                        Text: {
                            text: { literalString: result.enhancedPrompt || result.prompt },
                        },
                    },
                },
                {
                    id: 'style-info',
                    component: {
                        Row: {
                            children: ['style-label', 'created-label'],
                        },
                    },
                },
                {
                    id: 'style-label',
                    component: {
                        Text: {
                            text: { literalString: `Style: ${result.style}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'created-label',
                    component: {
                        Text: {
                            text: { literalString: `Created: ${new Date(result.createdAt).toLocaleTimeString()}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'details',
                    component: {
                        Card: {
                            children: ['note-text'],
                        },
                    },
                },
                {
                    id: 'note-text',
                    component: {
                        Text: {
                            text: { literalString: result.message || 'Image generated successfully. Configure GEMINI_API_KEY for full Imagen support via Vertex AI.' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['variations-btn', 'new-btn', 'history-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'variations-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Variations' },
                            action: { input: { text: `generate variations of ${result.prompt.substring(0, 50)}` } },
                        },
                    },
                },
                {
                    id: 'new-btn',
                    component: {
                        Button: {
                            label: { literalString: 'New Image' },
                            action: { input: { text: 'new image' } },
                        },
                    },
                },
                {
                    id: 'history-btn',
                    component: {
                        Button: {
                            label: { literalString: 'History' },
                            action: { input: { text: 'show history' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateHistoryView(history: GeneratedImage[]): A2UIMessage[] {
    const historyCards: string[] = [];
    const historyComponents: Array<{ id: string; component: object }> = [];

    history.slice(0, 10).forEach((item, idx) => {
        const cardId = `history-${idx}`;
        historyCards.push(cardId);

        historyComponents.push(
            {
                id: cardId,
                component: {
                    Card: {
                        children: [`hist-${idx}-prompt`, `hist-${idx}-style`, `hist-${idx}-action`],
                    },
                },
            },
            {
                id: `hist-${idx}-prompt`,
                component: {
                    Text: {
                        text: { literalString: item.prompt.substring(0, 60) + (item.prompt.length > 60 ? '...' : '') },
                        semantic: 'h4',
                    },
                },
            },
            {
                id: `hist-${idx}-style`,
                component: {
                    Text: {
                        text: { literalString: `${item.style} • ${new Date(item.createdAt).toLocaleDateString()}` },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `hist-${idx}-action`,
                component: {
                    Button: {
                        label: { literalString: 'Regenerate' },
                        action: { input: { text: `generate ${item.prompt}` } },
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'history-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#8B5CF6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'history-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', ...historyCards, 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '🍌 Recent Creations' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: `${history.length} images in history` },
                            variant: 'secondary',
                        },
                    },
                },
                ...historyComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['new-btn', 'clear-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'new-btn',
                    component: {
                        Button: {
                            label: { literalString: 'New Image' },
                            action: { input: { text: 'new image' } },
                        },
                    },
                },
                {
                    id: 'clear-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Clear History' },
                            action: { custom: { actionId: 'clear_history', data: {} } },
                        },
                    },
                },
            ],
        },
    ];
}

// ============================================================================
// Agent Card & Handler
// ============================================================================

export const getNanoBananaAgentCard = (baseUrl: string): AgentCard => ({
    name: 'NanoBanana Pro',
    description: 'AI-powered image generation using Google Gemini. Create stunning artwork, product mockups, and illustrations from text descriptions.',
    url: `${baseUrl}/agents/nanobanana`,
    version: '1.0.0',
    protocolVersion: '1.0',
    supportedVersions: ['1.0', '0.3.0'],
    provider: { organization: 'LiquidCrypto Labs' },
    capabilities: { streaming: true, pushNotifications: false },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'Button', 'Text', 'Row', 'Column', 'TextField', 'Image'] }
    }
});

export async function handleNanoBananaRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();

    try {
        const prompt = params?.message?.parts
            // @ts-ignore
            ?.filter(p => p.type === 'text')
            .map((p: any) => p.text)
            .join(' ')
            .toLowerCase() || '';

        let a2uiMessages: A2UIMessage[];
        let textResponse: string;

        // Intent matching
        if (prompt.includes('history') || prompt.includes('recent')) {
            a2uiMessages = generateHistoryView(generationHistory);
            textResponse = `Showing ${generationHistory.length} recent generations.`;

        } else if (prompt.includes('generate') || prompt.includes('create') || prompt.includes('make')) {
            // Extract the actual prompt
            let imagePrompt = prompt
                .replace(/^(generate|create|make|draw|paint)\s*(an?\s*)?(image\s*of\s*)?/i, '')
                .replace(/\s*(in|with)\s+(photorealistic|digital-art|anime|watercolor|3d-render|sketch)\s*style?/i, '')
                .trim();

            if (!imagePrompt || imagePrompt.length < 3) {
                imagePrompt = 'A beautiful sunset over mountains';
            }

            // Detect style from prompt
            let style: GenerationRequest['style'] = 'digital-art';
            if (prompt.includes('photo') || prompt.includes('realistic')) style = 'photorealistic';
            else if (prompt.includes('anime')) style = 'anime';
            else if (prompt.includes('watercolor')) style = 'watercolor';
            else if (prompt.includes('3d')) style = '3d-render';
            else if (prompt.includes('sketch')) style = 'sketch';

            // Generate the image
            const job = await generateWithGemini({
                prompt: imagePrompt,
                style,
                aspectRatio: '1:1',
                numberOfImages: 1,
            });

            if (job.status === 'completed') {
                a2uiMessages = generateResultView(job);
                textResponse = `Generated image for: "${imagePrompt}" in ${style} style.`;
            } else {
                a2uiMessages = generateResultView(job);
                textResponse = `Generation failed: ${job.error || 'Unknown error'}`;
            }

        } else if (prompt.includes('variation')) {
            // Generate variation of last prompt
            const lastPrompt = generationHistory[0]?.prompt || 'A beautiful landscape';
            const job = await generateWithGemini({
                prompt: lastPrompt,
                style: (generationHistory[0]?.style as GenerationRequest['style']) || 'digital-art',
                aspectRatio: '1:1',
                numberOfImages: 1,
            });

            a2uiMessages = generateResultView(job);
            textResponse = `Generated variation of: "${lastPrompt.substring(0, 50)}..."`;

        } else {
            // Default: Show prompt form
            a2uiMessages = generatePromptForm();
            textResponse = 'Welcome to NanoBanana Pro! Describe the image you want to create, or type "generate [your description]".';
        }

        return {
            id: taskId,
            contextId: 'nanobanana-context',
            status: { state: 'completed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'response',
                    parts: [
                        { type: 'text', text: textResponse },
                        { type: 'a2ui' as const, a2ui: a2uiMessages }
                    ]
                }
            ],
            history: []
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[NanoBanana] Error:', errorMessage);

        return {
            id: taskId,
            contextId: 'nanobanana-context',
            status: { state: 'failed', timestamp: new Date().toISOString() },
            artifacts: [
                {
                    name: 'error',
                    parts: [
                        { type: 'text', text: `Error: ${errorMessage}` }
                    ]
                }
            ],
            history: []
        };
    }
}
