import { GoogleGenerativeAI, Tool, SchemaType } from "@google/generative-ai";
import { LiquidClient, ActionDefinition } from "../liquid-engine/client";
import { LiquidGeminiAdapter } from "../liquid-engine/adapters/gemini";
import { LLMServiceBase, ToolSchema } from "./types";

// Default fallback tools (used when no actions are registered)
const DEFAULT_TOOLS: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "get_weather",
                description: "Get the current weather and forecast for a given location.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        location: { type: SchemaType.STRING, description: "The city and state, e.g. San Francisco, CA" },
                        condition: { type: SchemaType.STRING, description: "The weather condition (sunny, cloudy, rainy, windy)" },
                        temperature: { type: SchemaType.NUMBER, description: "The current temperature in fahrenheit" },
                        forecast: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                            description: "3-day forecast summary"
                        }
                    },
                    required: ["location", "condition", "temperature"]
                }
            },
            {
                name: "generate_list",
                description: "Generate a checklist or todo list.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "Title of the list" },
                        items: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                            description: "Items in the list"
                        }
                    },
                    required: ["title", "items"]
                }
            },
            {
                name: "generate_card",
                description: "Generate a rich content card with title and body.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING, description: "Title of the card" },
                        body: { type: SchemaType.STRING, description: "Body content" },
                        footer: { type: SchemaType.STRING, description: "Footer text" }
                    },
                    required: ["title", "body"]
                }
            }
        ]
    }
] as Tool[];

export class GeminiService extends LLMServiceBase {
    private genAI: GoogleGenerativeAI;
    private adapter: LiquidGeminiAdapter;

    constructor(apiKey: string, liquidClient: LiquidClient) {
        console.warn('[DEPRECATED] GeminiService with API key exposes credentials to browser. Use GeminiProxyService for secure AI calls.');
        super(liquidClient, "gemini-2.0-flash");
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.adapter = new LiquidGeminiAdapter();
    }

    // Note: setModel() is inherited from LLMServiceBase

    /**
     * Build Gemini-specific tools from registered actions or use defaults.
     * Named differently from base class buildTools() to return Gemini SDK Tool type.
     */
    private buildGeminiTools(): Tool[] {
        const registeredActions = this.client.getActions();

        if (registeredActions.length === 0) {
            return DEFAULT_TOOLS;
        }

        // Convert registered actions to Gemini function declarations
        const functionDeclarations = registeredActions.map(action => ({
            name: action.name,
            description: action.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: Object.fromEntries(
                    action.parameters.map(p => {
                        const prop: Record<string, any> = {
                            type: this.mapParamType(p.type),
                            description: p.description
                        };

                        // Critical: Include items for array types (required by Gemini API)
                        if (p.type === 'array') {
                            if (p.items) {
                                prop.items = {
                                    type: this.mapParamType(p.items.type),
                                    ...(p.items.properties ? { properties: p.items.properties } : {})
                                };
                            } else {
                                // Default to string array if items not specified
                                prop.items = { type: SchemaType.STRING };
                            }
                        }

                        return [p.name, prop];
                    })
                ),
                required: action.parameters.filter(p => p.required).map(p => p.name)
            }
        }));

        // Cast needed due to Gemini SDK strict typing
        const tools: Tool[] = [{ functionDeclarations } as Tool];

        // ADDED: File Search Tool
        if (this.fileSearchConfig.enabled && this.fileSearchConfig.stores.length > 0) {
            // We use 'any' cast because the SDK types might not have file_search yet if they are old
            const fileSearchTool: any = {
                file_search: {
                    file_search_store_names: this.fileSearchConfig.stores
                }
            };
            tools.push(fileSearchTool);
        }

        return tools;
    }

    private mapParamType(type: string): SchemaType {
        const typeMap: Record<string, SchemaType> = {
            'string': SchemaType.STRING,
            'number': SchemaType.NUMBER,
            'boolean': SchemaType.BOOLEAN,
            'object': SchemaType.OBJECT,
            'array': SchemaType.ARRAY
        };
        return typeMap[type] || SchemaType.STRING;
    }

    /**
     * Implement abstract method from LLMServiceBase.
     * Converts ActionDefinition to Gemini-specific tool schema.
     */
    protected mapActionToToolSchema(action: ActionDefinition): ToolSchema {
        return {
            name: action.name,
            description: action.description,
            parameters: {
                type: 'OBJECT',
                properties: Object.fromEntries(
                    action.parameters.map(p => {
                        const prop: Record<string, any> = {
                            type: p.type.toUpperCase(),
                            description: p.description
                        };
                        if (p.type === 'array' && p.items) {
                            prop.items = { type: p.items.type.toUpperCase() };
                        }
                        return [p.name, prop];
                    })
                ),
                required: action.parameters.filter(p => p.required).map(p => p.name)
            }
        };
    }

    // buildSystemPrompt() is now inherited from LLMServiceBase
    // We override only if we need Gemini-specific behavior
    protected override buildSystemPrompt(basePrompt?: string): string {
        const defaultBase = "You are a helpful UI assistant. You can use tools to generate UI components and interact with the application. When asked to show something or perform an action, use the appropriate tool.";
        return super.buildSystemPrompt(basePrompt || defaultBase);
    }

    /**
     * Send a message to Gemini and stream the response into the Liquid Engine.
     */
    public async sendMessage(prompt: string) {
        try {
            // Build fresh model with current tools
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                tools: this.buildGeminiTools()
            });

            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: this.buildSystemPrompt() }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I will use the provided tools to render UI components and interact with the application whenever appropriate." }]
                    }
                ]
            });

            const result = await chat.sendMessageStream(prompt);

            // Iterate gracefully over the stream
            for await (const chunk of result.stream) {
                // DEBUG: Log raw chunk
                console.log("[GeminiService] Raw Chunk:", JSON.stringify(chunk, null, 2));

                // Transform Gemini chunk -> Liquid Events
                const events = this.adapter.transform(chunk);

                // DEBUG: Log parsed events
                if (events.length > 0) {
                    console.log("[GeminiService] Parsed Events:", JSON.stringify(events, null, 2));
                }

                // Ingest into Engine
                for (const event of events) {
                    this.client.ingest(event);

                    // If this is a tool completion, try to execute the registered action
                    if (event.type === 'tool_complete') {
                        const toolState = this.client.getToolState(event.id);
                        if (toolState) {
                            try {
                                const actionResult = await this.client.executeAction(toolState.name, toolState.args);
                                console.log(`[GeminiService] Action ${toolState.name} executed:`, actionResult);
                            } catch (e) {
                                // Action might not be registered (using default tools)
                                console.log(`[GeminiService] No registered handler for ${toolState.name}`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Gemini Stream Error:", error);
            throw error; // Re-throw so the UI knows it failed
        }
    }

    /**
     * Simple chat method for plain text responses (no tool calling).
     * Used by Guard Dog and Decontextualizer for quick classification tasks.
     */
    public async chat(
        prompt: string,
        systemPrompt?: string,
        options?: { temperature?: number }
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                }
            });

            const history = systemPrompt ? [
                { role: "user" as const, parts: [{ text: systemPrompt }] },
                { role: "model" as const, parts: [{ text: "Understood." }] }
            ] : [];

            const chat = model.startChat({ history });
            const result = await chat.sendMessage(prompt);

            return result.response.text();
        } catch (error) {
            console.error("[GeminiService] Chat error:", error);
            throw error;
        }
    }

    /**
     * Generate an image using Gemini 3 Pro Image Preview
     * Supports Text-to-Image and Image-to-Image
     */
    public async generateImage(
        prompt: string,
        options: {
            referenceImages?: string[]; // array of base64 strings
            aspectRatio?: string; // "16:9", "1:1", etc.
            imageSize?: string; // "1K", "2K"
        } = {}
    ): Promise<string[]> {
        try {
            const model = this.genAI.getGenerativeModel({
                model: "gemini-3-pro-image-preview",
            });

            const parts: any[] = [{ text: prompt }];

            // Add reference images if provided
            if (options.referenceImages && options.referenceImages.length > 0) {
                options.referenceImages.forEach(base64Data => {
                    // Extract base64 data if it contains the prefix
                    const cleanBase64 = base64Data.split(',')[1] || base64Data;
                    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';

                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: cleanBase64
                        }
                    });
                });
            }

            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    responseModalities: ["IMAGE"], // Force image only response for this method
                    imageConfig: {
                        aspectRatio: options.aspectRatio || "16:9",
                        imageSize: options.imageSize || "1K"
                    }
                } as any // Cast to any to support responseModalities which might be missing in current SDK types
            });

            const response = result.response;
            const images: string[] = [];

            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    }
                }
            }

            return images;
        } catch (error) {
            console.error("Gemini Image Generation Error:", error);
            throw error;
        }
    }

    // ==========================================
    // File Search API (REST Implementation)
    // ==========================================

    private get baseUrl() {
        return "https://generativelanguage.googleapis.com/v1beta";
    }

    private async restFetch(endpoint: string, method: string, body?: any) {
        const url = `${this.baseUrl}/${endpoint}?key=${this.genAI.apiKey}`;
        const headers: Record<string, string> = {};

        if (!(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method,
            headers,
            body: body instanceof FormData ? body : JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Create a new File Search Store
     */
    public async createFileSearchStore(displayName: string) {
        return this.restFetch('fileSearchStores', 'POST', { displayName });
    }

    /**
     * List available File Search Stores
     */
    public async listFileSearchStores() {
        return this.restFetch('fileSearchStores', 'GET');
    }

    /**
     * Upload a file directly to a File Search Store (Upload + Import)
     * Note: This implements the "Directly upload" pattern which is more efficient.
     */
    public async uploadToFileSearchStore(storeName: string, file: File, displayName?: string) {
        // 1. Upload the file using the Media Upload API
        // https://generativelanguage.googleapis.com/upload/v1beta/files

        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.genAI.apiKey}`;

        const metadata = {
            file: { displayName: displayName || file.name }
        };

        // Multipart upload
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const error = await uploadResponse.json().catch(() => ({ error: { message: uploadResponse.statusText } }));
            throw new Error(`File Upload Failed: ${error.error?.message || uploadResponse.statusText}`);
        }

        const fileResult = await uploadResponse.json();
        const fileName = fileResult.file.name; // This is the resource ID, e.g. files/12345

        // Note: The correct endpoint for import might be different based on API version.
        // Using `client.file_search_stores.import_file` logic maps to: 
        // POST v1beta/{name=fileSearchStores/*}:importFiles

        // Let's try the correct import endpoint:
        // POST https://generativelanguage.googleapis.com/v1beta/{name=fileSearchStores/*}:importFiles
        return this.restFetch(`${storeName}:importFiles`, 'POST', {
            requests: [{ file: { name: fileName } }]
        });
    }

    // Note: setFileSearchConfig() is inherited from LLMServiceBase

    /**
     * Convert natural text to a JSON-LD object based on Schema.org definitions
     */
    public async convertTextToSchema(text: string, schemaContext: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a Schema.org expert. Your task is to convert the following text prompt into a valid JSON-LD object using Schema.org vocabulary.
        
        Text to convert: "${text}"
        
        Use the provided Schema.org context to ensure correct types and properties. 
        If the text describes a person, organization, event, product, or any other entity, map it to the most specific Type available.
        
        Return ONLY the JSON-LD object. No markdown block, no explanation.
        
        Simplified Schema Context (Reference):
        ${schemaContext.slice(0, 30000)}... (truncated for efficiency, use general knowledge but validate against standard schema.org types)
        
        Result:
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Clean markdown code blocks if present
        return response.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    /**
     * Update an existing JSON-LD object with new information
     */
    public async updateSchema(existingJson: string, refinementText: string, schemaContext: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a Schema.org expert. Your task is to UPDATE an existing JSON-LD object with new information.
        
        Existing JSON-LD:
        ${existingJson}
        
        New Information to Add:
        "${refinementText}"
        
        Instructions:
        1. Parse the existing JSON-LD.
        2. Incorporate the New Information into the object, respecting Schema.org structure.
        3. If the new information contradicts existing fields, update them. If it adds new details, add properties.
        4. Maintain the valid JSON-LD format.
        
        Return ONLY the updated JSON-LD object. No markdown block, no explanation.
        
        Simplified Schema Context (Reference):
        ${schemaContext.slice(0, 30000)}...
        
        Result:
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Clean markdown code blocks if present
        return response.replace(/```json/g, '').replace(/```/g, '').trim();
    }
}

