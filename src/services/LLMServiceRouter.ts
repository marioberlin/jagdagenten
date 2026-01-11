/**
 * LLMServiceRouter.ts
 * 
 * Capability-based routing for LLM services.
 * Routes requests to appropriate providers based on capability:
 * - Text/Chat → Primary provider (user's selection)
 * - Image generation → Always Gemini
 * - File Search → Always Gemini
 */

import { LiquidClient } from '../liquid-engine/client';
import { GeminiService } from './gemini';
import { ClaudeService } from './claude';
import { GeminiProxyService } from './proxy/gemini';
import { ILiquidLLMService, FileSearchConfig, ChatOptions } from './types';
import type { LLMProvider } from '../context/AgentConfigContext';

export interface RouterConfig {
    provider: LLMProvider;
    geminiApiKey: string;
    claudeApiKey?: string;
    client: LiquidClient;
    proxyUrl?: string;
}

export class LLMServiceRouter implements ILiquidLLMService {
    private primaryService: ILiquidLLMService;
    private imageService: GeminiService;
    private currentProvider: LLMProvider;

    constructor(config: RouterConfig) {
        // Always create Gemini for image generation and file search
        this.imageService = new GeminiService(config.geminiApiKey, config.client);
        this.currentProvider = config.provider;

        // Create primary service based on user selection
        switch (config.provider) {
            case 'claude':
                if (!config.claudeApiKey) {
                    console.warn('[LLMServiceRouter] Claude selected but no API key provided, falling back to Gemini');
                    this.primaryService = this.imageService;
                } else {
                    this.primaryService = new ClaudeService(config.claudeApiKey, config.client);
                }
                break;

            case 'proxy':
                this.primaryService = new GeminiProxyService(config.client, config.proxyUrl);
                break;

            case 'gemini':
            default:
                // Same instance as imageService
                this.primaryService = this.imageService;
                break;
        }
    }

    // =========================================================================
    // ROUTED TO PRIMARY
    // =========================================================================

    setModel(modelName: string): void {
        this.primaryService.setModel(modelName);
    }

    sendMessage(prompt: string): Promise<void> {
        return this.primaryService.sendMessage(prompt);
    }

    chat(prompt: string, systemPrompt?: string, options?: ChatOptions): Promise<string> {
        return this.primaryService.chat(prompt, systemPrompt, options);
    }

    // =========================================================================
    // ROUTED TO GEMINI (always)
    // =========================================================================

    setFileSearchConfig(config: FileSearchConfig): void {
        // File search is Gemini-specific, always route there
        this.imageService.setFileSearchConfig(config);
    }

    generateImage(
        prompt: string,
        options: {
            referenceImages?: string[];
            aspectRatio?: string;
            imageSize?: string;
        } = {}
    ): Promise<string[]> {
        // Image generation is Gemini-specific, always route there
        console.log(`[LLMServiceRouter] Routing image generation to Gemini (primary: ${this.currentProvider})`);
        return this.imageService.generateImage(prompt, options);
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Get the current primary provider
     */
    getProvider(): LLMProvider {
        return this.currentProvider;
    }

    /**
     * Check if image generation is available
     */
    hasImageGeneration(): boolean {
        return true; // Always available via Gemini
    }

    /**
     * Get the underlying Gemini service for advanced operations
     * (file search store management, schema conversion, etc.)
     */
    getGeminiService(): GeminiService {
        return this.imageService;
    }
}
