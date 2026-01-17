import type { AgentCard, A2UIMessage, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';

// ============================================================================
// DocuMind - AI Document Analysis with Gemini
// ============================================================================

interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'text' | 'markdown';
    size: number;
    uploadedAt: string;
    status: 'processing' | 'ready' | 'error';
    pageCount?: number;
    wordCount?: number;
    extractedText?: string;
}

interface DocumentAnalysis {
    documentId: string;
    summary: string;
    keyPoints: string[];
    entities: Array<{ type: string; value: string }>;
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    readingTime: number;
}

interface QAResponse {
    question: string;
    answer: string;
    confidence: number;
    sources: string[];
}

// In-memory document storage (in production, use proper storage)
const documents = new Map<string, Document>();
const documentAnalyses = new Map<string, DocumentAnalysis>();

// Sample document for demo
const SAMPLE_DOCUMENT: Document = {
    id: 'sample-doc-1',
    name: 'Sample Contract.pdf',
    type: 'pdf',
    size: 245000,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
    pageCount: 12,
    wordCount: 4500,
    extractedText: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of January 1, 2025 ("Effective Date") between:

Company A Inc., a Delaware corporation ("Provider")
and
Company B LLC, a California limited liability company ("Client")

1. SERVICES
Provider agrees to provide the following services:
- Software development and maintenance
- Technical support and consulting
- System integration services

2. TERM
This Agreement shall commence on the Effective Date and continue for a period of 24 months, unless earlier terminated in accordance with Section 7.

3. COMPENSATION
Client shall pay Provider a monthly fee of $15,000 USD, due on the first business day of each month.

4. CONFIDENTIALITY
Each party agrees to maintain the confidentiality of all proprietary information disclosed by the other party.

5. INTELLECTUAL PROPERTY
All intellectual property created under this Agreement shall be owned by the Client upon full payment.

6. LIABILITY
Provider's total liability under this Agreement shall not exceed $500,000 USD.

7. TERMINATION
Either party may terminate this Agreement with 90 days written notice. Early termination without cause incurs a fee of 25% of the remaining contract value.

8. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

Company A Inc.                    Company B LLC
By: John Smith, CEO               By: Jane Doe, Managing Partner
Date: January 1, 2025             Date: January 1, 2025`,
};

// Initialize with sample document
documents.set(SAMPLE_DOCUMENT.id, SAMPLE_DOCUMENT);

// ============================================================================
// Gemini AI Integration
// ============================================================================

async function analyzeDocumentWithGemini(doc: Document): Promise<DocumentAnalysis> {
    const apiKey = process.env.GEMINI_API_KEY;
    const text = doc.extractedText || '';

    // Default analysis
    const defaultAnalysis: DocumentAnalysis = {
        documentId: doc.id,
        summary: 'Document analysis requires GEMINI_API_KEY. This is a sample analysis.',
        keyPoints: [
            'Configure GEMINI_API_KEY for AI-powered analysis',
            'Upload documents for automatic text extraction',
            'Ask questions about your documents',
        ],
        entities: [{ type: 'Note', value: 'AI analysis not configured' }],
        topics: ['General'],
        sentiment: 'neutral',
        readingTime: Math.ceil((doc.wordCount || 500) / 200),
    };

    if (!apiKey || !text) {
        return defaultAnalysis;
    }

    try {
        const prompt = `Analyze this document and provide:
1. A 2-3 sentence summary
2. 5 key points (bullet points)
3. Important entities (people, companies, dates, amounts)
4. Main topics
5. Overall sentiment (positive/negative/neutral)

Document text:
"""
${text.substring(0, 8000)}
"""

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "entities": [{"type": "Company", "value": "..."}, ...],
  "topics": ["...", "..."],
  "sentiment": "positive|negative|neutral"
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 1000, temperature: 0.3 }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Try to parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                documentId: doc.id,
                summary: parsed.summary || defaultAnalysis.summary,
                keyPoints: parsed.keyPoints || defaultAnalysis.keyPoints,
                entities: parsed.entities || defaultAnalysis.entities,
                topics: parsed.topics || defaultAnalysis.topics,
                sentiment: parsed.sentiment || 'neutral',
                readingTime: Math.ceil((doc.wordCount || 500) / 200),
            };
        }

        return defaultAnalysis;
    } catch (error) {
        console.error('[DocuMind] Analysis error:', error);
        return defaultAnalysis;
    }
}

async function answerQuestionWithGemini(doc: Document, question: string): Promise<QAResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    const text = doc.extractedText || '';

    const defaultResponse: QAResponse = {
        question,
        answer: 'AI-powered Q&A requires GEMINI_API_KEY to be configured.',
        confidence: 0,
        sources: [],
    };

    if (!apiKey || !text) {
        return defaultResponse;
    }

    try {
        const prompt = `Based on the following document, answer this question concisely and accurately.

Document:
"""
${text.substring(0, 8000)}
"""

Question: ${question}

Provide your answer in 1-3 sentences. If the answer is not in the document, say so.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 300, temperature: 0.3 }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || defaultResponse.answer;

        return {
            question,
            answer,
            confidence: 85,
            sources: ['Document content'],
        };
    } catch (error) {
        console.error('[DocuMind] Q&A error:', error);
        return defaultResponse;
    }
}

// ============================================================================
// A2UI Generation
// ============================================================================

function generateUploadView(): A2UIMessage[] {
    const recentDocs = Array.from(documents.values()).slice(0, 5);

    const docListComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const docListIds: string[] = [];

    recentDocs.forEach((doc, idx) => {
        const docId = `doc-${idx}`;
        docListIds.push(docId);

        docListComponents.push(
            {
                id: docId,
                component: {
                    Row: {
                        children: [`doc-${idx}-icon`, `doc-${idx}-name`, `doc-${idx}-status`, `doc-${idx}-action`],
                    },
                },
            },
            {
                id: `doc-${idx}-icon`,
                component: {
                    Text: {
                        text: { literalString: doc.type === 'pdf' ? '📄' : '📝' },
                    },
                },
            },
            {
                id: `doc-${idx}-name`,
                component: {
                    Text: {
                        text: { literalString: doc.name },
                    },
                },
            },
            {
                id: `doc-${idx}-status`,
                component: {
                    Text: {
                        text: { literalString: doc.status === 'ready' ? '✓ Ready' : '⏳ Processing' },
                        variant: 'secondary',
                    },
                },
            },
            {
                id: `doc-${idx}-action`,
                component: {
                    Button: {
                        label: { literalString: 'Analyze' },
                        action: { input: { text: `analyze document ${doc.id}` } },
                    },
                },
            }
        );
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'upload-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#8B5CF6', fontFamily: 'Inter, system-ui, sans-serif' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'upload-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'subtitle', 'upload-card', 'recent-header', ...docListIds],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '📄 DocuMind' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'subtitle',
                    component: {
                        Text: {
                            text: { literalString: 'AI Document Analysis powered by Gemini' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'upload-card',
                    component: {
                        Card: {
                            children: ['upload-icon', 'upload-text', 'upload-formats'],
                        },
                    },
                },
                {
                    id: 'upload-icon',
                    component: {
                        Text: {
                            text: { literalString: '📁 Drop files here or click to browse' },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'upload-text',
                    component: {
                        Text: {
                            text: { literalString: 'PDF, Images, Text files up to 50MB' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'upload-formats',
                    component: {
                        Text: {
                            text: { literalString: 'Note: File upload requires full implementation. Use sample document for demo.' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'recent-header',
                    component: {
                        Text: {
                            text: { literalString: 'Recent Documents:' },
                            semantic: 'h4',
                        },
                    },
                },
                ...docListComponents,
            ],
        },
    ];
}

function generateSummaryView(doc: Document, analysis: DocumentAnalysis): A2UIMessage[] {
    const keyPointComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const keyPointIds: string[] = [];

    analysis.keyPoints.forEach((point, idx) => {
        const pointId = `kp-${idx}`;
        keyPointIds.push(pointId);

        keyPointComponents.push({
            id: pointId,
            component: {
                Text: {
                    text: { literalString: `• ${point}` },
                },
            },
        });
    });

    const entityComponents: Array<{ id: string; component: Record<string, unknown> }> = [];
    const entityIds: string[] = [];

    analysis.entities.slice(0, 5).forEach((entity, idx) => {
        const entityId = `ent-${idx}`;
        entityIds.push(entityId);

        entityComponents.push({
            id: entityId,
            component: {
                Text: {
                    text: { literalString: `${entity.type}: ${entity.value}` },
                    variant: 'secondary',
                },
            },
        });
    });

    return [
        {
            type: 'beginRendering',
            surfaceId: 'summary-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#8B5CF6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'summary-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'doc-info', 'summary-section', 'keypoints-section', 'entities-section', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Row: {
                            children: ['doc-icon', 'doc-name'],
                        },
                    },
                },
                {
                    id: 'doc-icon',
                    component: {
                        Text: {
                            text: { literalString: '📄' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'doc-name',
                    component: {
                        Text: {
                            text: { literalString: doc.name },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'doc-info',
                    component: {
                        Text: {
                            text: { literalString: `${doc.pageCount || 0} pages • ${doc.wordCount?.toLocaleString() || 0} words • ~${analysis.readingTime} min read` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'summary-section',
                    component: {
                        Card: {
                            children: ['summary-title', 'summary-text'],
                        },
                    },
                },
                {
                    id: 'summary-title',
                    component: {
                        Text: {
                            text: { literalString: 'Summary' },
                            semantic: 'h3',
                        },
                    },
                },
                {
                    id: 'summary-text',
                    component: {
                        Text: {
                            text: { literalString: analysis.summary },
                        },
                    },
                },
                {
                    id: 'keypoints-section',
                    component: {
                        Card: {
                            children: ['keypoints-title', ...keyPointIds],
                        },
                    },
                },
                {
                    id: 'keypoints-title',
                    component: {
                        Text: {
                            text: { literalString: 'Key Points' },
                            semantic: 'h3',
                        },
                    },
                },
                ...keyPointComponents,
                {
                    id: 'entities-section',
                    component: {
                        Card: {
                            children: ['entities-title', ...entityIds],
                        },
                    },
                },
                {
                    id: 'entities-title',
                    component: {
                        Text: {
                            text: { literalString: 'Entities Found' },
                            semantic: 'h3',
                        },
                    },
                },
                ...entityComponents,
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['ask-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'ask-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Ask Question' },
                            action: { input: { text: 'ask about the document' } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'All Documents' },
                            action: { input: { text: 'show documents' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateQAView(doc: Document, qa: QAResponse): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'qa-view',
            rootComponentId: 'root',
            styling: { primaryColor: '#10B981' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'qa-view',
            components: [
                {
                    id: 'root',
                    component: {
                        Column: {
                            children: ['header', 'doc-ref', 'question-section', 'answer-section', 'confidence-row', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '💬 Document Q&A' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'doc-ref',
                    component: {
                        Text: {
                            text: { literalString: `Answering from: ${doc.name}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'question-section',
                    component: {
                        Card: {
                            children: ['question-label', 'question-text'],
                        },
                    },
                },
                {
                    id: 'question-label',
                    component: {
                        Text: {
                            text: { literalString: 'Your Question:' },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'question-text',
                    component: {
                        Text: {
                            text: { literalString: qa.question },
                            semantic: 'h4',
                        },
                    },
                },
                {
                    id: 'answer-section',
                    component: {
                        Card: {
                            children: ['answer-label', 'answer-text'],
                        },
                    },
                },
                {
                    id: 'answer-label',
                    component: {
                        Text: {
                            text: { literalString: '🤖 Answer:' },
                            semantic: 'h4',
                        },
                    },
                },
                {
                    id: 'answer-text',
                    component: {
                        Text: {
                            text: { literalString: qa.answer },
                        },
                    },
                },
                {
                    id: 'confidence-row',
                    component: {
                        Row: {
                            children: ['confidence-label', 'sources-label'],
                        },
                    },
                },
                {
                    id: 'confidence-label',
                    component: {
                        Text: {
                            text: { literalString: `Confidence: ${qa.confidence}%` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'sources-label',
                    component: {
                        Text: {
                            text: { literalString: `Sources: ${qa.sources.join(', ')}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['another-btn', 'summary-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'another-btn',
                    component: {
                        Button: {
                            label: { literalString: 'Ask Another' },
                            action: { input: { text: 'ask about the document' } },
                        },
                    },
                },
                {
                    id: 'summary-btn',
                    component: {
                        Button: {
                            label: { literalString: 'View Summary' },
                            action: { input: { text: `summarize document ${doc.id}` } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'All Documents' },
                            action: { input: { text: 'show documents' } },
                        },
                    },
                },
            ],
        },
    ];
}

function generateAskPrompt(doc: Document): A2UIMessage[] {
    return [
        {
            type: 'beginRendering',
            surfaceId: 'ask-prompt',
            rootComponentId: 'root',
            styling: { primaryColor: '#8B5CF6' },
        },
        {
            type: 'surfaceUpdate',
            surfaceId: 'ask-prompt',
            components: [
                {
                    id: 'root',
                    component: {
                        Card: {
                            children: ['header', 'doc-ref', 'prompt-text', 'examples', 'actions'],
                        },
                    },
                },
                {
                    id: 'header',
                    component: {
                        Text: {
                            text: { literalString: '💬 Ask a Question' },
                            semantic: 'h2',
                        },
                    },
                },
                {
                    id: 'doc-ref',
                    component: {
                        Text: {
                            text: { literalString: `About: ${doc.name}` },
                            variant: 'secondary',
                        },
                    },
                },
                {
                    id: 'prompt-text',
                    component: {
                        Text: {
                            text: { literalString: 'Type your question in the chat, for example:' },
                        },
                    },
                },
                {
                    id: 'examples',
                    component: {
                        Column: {
                            children: ['ex-1', 'ex-2', 'ex-3'],
                        },
                    },
                },
                {
                    id: 'ex-1',
                    component: {
                        Button: {
                            label: { literalString: 'What is the contract duration?' },
                            action: { input: { text: 'What is the contract duration?' } },
                        },
                    },
                },
                {
                    id: 'ex-2',
                    component: {
                        Button: {
                            label: { literalString: 'What is the monthly payment?' },
                            action: { input: { text: 'What is the monthly payment?' } },
                        },
                    },
                },
                {
                    id: 'ex-3',
                    component: {
                        Button: {
                            label: { literalString: 'What is the termination clause?' },
                            action: { input: { text: 'What is the termination clause?' } },
                        },
                    },
                },
                {
                    id: 'actions',
                    component: {
                        Row: {
                            children: ['summary-btn', 'back-btn'],
                            alignment: 'center',
                        },
                    },
                },
                {
                    id: 'summary-btn',
                    component: {
                        Button: {
                            label: { literalString: 'View Summary' },
                            action: { input: { text: `summarize document ${doc.id}` } },
                        },
                    },
                },
                {
                    id: 'back-btn',
                    component: {
                        Button: {
                            label: { literalString: 'All Documents' },
                            action: { input: { text: 'show documents' } },
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

export const getDocuMindAgentCard = (baseUrl: string): AgentCard => ({
    protocolVersions: ['1.0'],
    name: 'DocuMind',
    description: 'AI-powered document analysis and knowledge extraction. Upload PDFs or text and get instant summaries, key insights, and answers to your questions.',
    version: '1.0.0',
    supportedInterfaces: [
        { url: `${baseUrl}/agents/documind`, protocolBinding: 'JSONRPC' },
    ],
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ['text/plain', 'application/pdf'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
        {
            id: 'summarize-document',
            name: 'Summarize Document',
            description: 'Generate concise summaries of documents',
            tags: ['document', 'summary', 'analysis', 'PDF'],
            examples: ['Summarize this PDF', 'Give me the key points'],
        },
        {
            id: 'extract-insights',
            name: 'Extract Insights',
            description: 'Extract key insights and findings from documents',
            tags: ['insights', 'extraction', 'knowledge'],
            examples: ['What are the main findings?', 'Extract key data'],
        },
        {
            id: 'question-answering',
            name: 'Question Answering',
            description: 'Answer questions about uploaded documents',
            tags: ['Q&A', 'questions', 'answers'],
            examples: ['What does the document say about X?', 'Find information about Y'],
        },
    ],
    provider: { organization: 'LiquidCrypto Labs' },
    extensions: {
        a2ui: { version: '0.8', supportedComponents: ['Card', 'Button', 'Text', 'Row', 'Column', 'TextField'] },
    },
});

// Keep track of current document for Q&A
let currentDocumentId: string | null = SAMPLE_DOCUMENT.id;

export async function handleDocuMindRequest(params: SendMessageParams): Promise<any> {
    const taskId = randomUUID();

    try {
        const prompt = params?.message?.parts
            // @ts-ignore
            ?.filter((p: { text?: string }) => p.text !== undefined)
            .map((p: any) => p.text)
            .join(' ')
            .toLowerCase() || '';

        let a2uiMessages: A2UIMessage[];
        let textResponse: string;

        // Intent matching
        if (prompt.includes('upload') || prompt.includes('document') && !prompt.includes('analyze') && !prompt.includes('summarize')) {
            a2uiMessages = generateUploadView();
            textResponse = 'Welcome to DocuMind! Upload a document or select from recent files to analyze.';

        } else if (prompt.includes('analyze') || prompt.includes('summarize')) {
            // Get document - try to extract ID from prompt or use current
            let doc: Document | undefined;
            const idMatch = prompt.match(/document\s+([a-z0-9-]+)/i);
            if (idMatch) {
                doc = documents.get(idMatch[1]);
                if (doc) currentDocumentId = doc.id;
            }

            if (!doc && currentDocumentId) {
                doc = documents.get(currentDocumentId);
            }

            if (!doc) {
                doc = SAMPLE_DOCUMENT;
                currentDocumentId = doc.id;
            }

            // Get or create analysis
            let analysis = documentAnalyses.get(doc.id);
            if (!analysis) {
                analysis = await analyzeDocumentWithGemini(doc);
                documentAnalyses.set(doc.id, analysis);
            }

            a2uiMessages = generateSummaryView(doc, analysis);
            textResponse = `Analysis of "${doc.name}": ${analysis.summary.substring(0, 100)}...`;

        } else if (prompt.includes('ask')) {
            // Show Q&A prompt
            const doc = currentDocumentId ? documents.get(currentDocumentId) : SAMPLE_DOCUMENT;
            a2uiMessages = generateAskPrompt(doc || SAMPLE_DOCUMENT);
            textResponse = `Ask any question about "${doc?.name || 'the document'}".`;

        } else if (prompt.includes('?') || prompt.length > 20) {
            // Treat as a question
            const doc = currentDocumentId ? documents.get(currentDocumentId) : SAMPLE_DOCUMENT;
            if (!doc) {
                a2uiMessages = generateUploadView();
                textResponse = 'Please upload or select a document first.';
            } else {
                const qa = await answerQuestionWithGemini(doc, prompt);
                a2uiMessages = generateQAView(doc, qa);
                textResponse = qa.answer.substring(0, 100) + (qa.answer.length > 100 ? '...' : '');
            }

        } else {
            // Default: Show upload view
            a2uiMessages = generateUploadView();
            textResponse = 'Welcome to DocuMind! Upload a document or select from recent files to analyze.';
        }

        return {
            id: taskId,
            contextId: 'documind-context',
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
        console.error('[DocuMind] Error:', errorMessage);

        return {
            id: taskId,
            contextId: 'documind-context',
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
