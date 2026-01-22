/**
 * FileSearchService - Gemini File Search Tool Integration
 * 
 * Provides RAG capabilities through Google's File Search API.
 * Manages FileSearchStores, document uploads, and semantic queries.
 * 
 * @see https://ai.google.dev/gemini-api/docs/file-search
 */

import { GoogleGenAI, FileSearchStore } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Initialize the Google GenAI client
const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }
    return new GoogleGenAI({ apiKey });
};

// Default model for RAG queries (must support File Search)
const DEFAULT_RAG_MODEL = 'gemini-2.5-pro';

/**
 * Result from a RAG query including citations
 */
export interface RAGQueryResult {
    text: string;
    citations?: {
        uri?: string;
        title?: string;
        startIndex?: number;
        endIndex?: number;
    }[];
    groundingMetadata?: any;
}

/**
 * Document info from a FileSearchStore
 */
export interface FileSearchDocument {
    name: string;
    displayName?: string;
    createTime?: string;
    updateTime?: string;
}

/**
 * Store info
 */
export interface FileSearchStoreInfo {
    name: string;
    displayName?: string;
    createTime?: string;
}

/**
 * Auto-index result
 */
export interface AutoIndexResult {
    storeName: string;
    filesProcessed: number;
    filesSkipped: number;
    errors: string[];
}

// ============================================================================
// STORE MANAGEMENT
// ============================================================================

/**
 * Create a new FileSearchStore
 */
export async function createStore(displayName: string): Promise<FileSearchStoreInfo> {
    const ai = getClient();
    const result = await ai.fileSearchStores.create({
        config: { displayName }
    });
    return {
        name: result.name || '',
        displayName: result.displayName || displayName,
        createTime: result.createTime
    };
}

/**
 * List all FileSearchStores
 */
export async function listStores(): Promise<FileSearchStoreInfo[]> {
    const ai = getClient();
    const stores: FileSearchStoreInfo[] = [];

    const result = await ai.fileSearchStores.list();
    for await (const store of result) {
        stores.push({
            name: store.name || '',
            displayName: store.displayName,
            createTime: store.createTime
        });
    }

    return stores;
}

/**
 * Get a specific FileSearchStore
 */
export async function getStore(name: string): Promise<FileSearchStoreInfo | null> {
    try {
        const ai = getClient();
        const store = await ai.fileSearchStores.get({ name });
        return {
            name: store.name || '',
            displayName: store.displayName,
            createTime: store.createTime
        };
    } catch (error) {
        console.error('[FileSearchService] Store not found:', name);
        return null;
    }
}

/**
 * Delete a FileSearchStore
 */
export async function deleteStore(name: string, force: boolean = true): Promise<boolean> {
    try {
        const ai = getClient();
        await ai.fileSearchStores.delete({ name, config: { force } });
        return true;
    } catch (error) {
        console.error('[FileSearchService] Failed to delete store:', error);
        return false;
    }
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * Upload a file directly to a FileSearchStore
 */
export async function uploadDocument(
    storeName: string,
    filePath: string,
    displayName?: string
): Promise<{ success: boolean; documentName?: string; error?: string }> {
    try {
        const ai = getClient();
        const fileName = displayName || path.basename(filePath);

        // Read file content
        const fileBuffer = fs.readFileSync(filePath);

        // Upload to store
        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
            file: filePath,
            fileSearchStoreName: storeName,
            config: {
                displayName: fileName
            }
        });

        // Wait for indexing to complete
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (!operation.done && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.get({ operation: operation });
            attempts++;
        }

        if (!operation.done) {
            return { success: false, error: 'Indexing timed out' };
        }

        return { success: true, documentName: fileName };
    } catch (error: any) {
        console.error('[FileSearchService] Upload failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * List all documents in a FileSearchStore
 */
export async function listDocuments(storeName: string): Promise<FileSearchDocument[]> {
    const ai = getClient();
    const documents: FileSearchDocument[] = [];

    try {
        const result = await ai.fileSearchStores.documents.list({ parent: storeName });
        for await (const doc of result) {
            documents.push({
                name: doc.name || '',
                displayName: doc.displayName,
                createTime: doc.createTime,
                updateTime: doc.updateTime
            });
        }
    } catch (error) {
        console.error('[FileSearchService] Failed to list documents:', error);
    }

    return documents;
}

/**
 * Delete a document from a FileSearchStore
 */
export async function deleteDocument(documentName: string): Promise<boolean> {
    try {
        const ai = getClient();
        await ai.fileSearchStores.documents.delete({ name: documentName });
        return true;
    } catch (error) {
        console.error('[FileSearchService] Failed to delete document:', error);
        return false;
    }
}

// ============================================================================
// AUTO-INDEX
// ============================================================================

/**
 * Auto-index a directory of files into a FileSearchStore
 */
export async function autoIndexDirectory(
    storeName: string,
    dirPath: string,
    pattern: string = '**/*.md'
): Promise<AutoIndexResult> {
    const result: AutoIndexResult = {
        storeName,
        filesProcessed: 0,
        filesSkipped: 0,
        errors: []
    };

    try {
        // Find all matching files
        const fullPattern = path.join(dirPath, pattern);
        const files = await glob(fullPattern, { nodir: true });

        console.log(`[FileSearchService] Found ${files.length} files to index in ${dirPath}`);

        // Index each file
        for (const filePath of files) {
            const relativePath = path.relative(dirPath, filePath);
            console.log(`[FileSearchService] Indexing: ${relativePath}`);

            const uploadResult = await uploadDocument(storeName, filePath, relativePath);

            if (uploadResult.success) {
                result.filesProcessed++;
            } else {
                result.filesSkipped++;
                result.errors.push(`${relativePath}: ${uploadResult.error}`);
            }
        }
    } catch (error: any) {
        console.error('[FileSearchService] Auto-index failed:', error);
        result.errors.push(`Directory error: ${error.message}`);
    }

    return result;
}

/**
 * Auto-index project documentation with priority ordering
 */
export async function autoIndexProjectDocs(storeName: string): Promise<AutoIndexResult> {
    const projectRoot = process.cwd().replace('/server', '');

    // Priority-ordered paths
    const priorityPaths = [
        'docs/UNIFIED_ARCHITECTURE.md',
        'docs/ARCHITECTURE.md',
        'GEMINI.md',
    ];

    // Directory patterns (lower priority)
    const directoryPatterns = [
        { dir: 'docs/guides', pattern: '*.md' },
        { dir: 'docs/reference', pattern: '*.md' },
        { dir: 'docs/plans', pattern: '*.md' },
        { dir: 'skills', pattern: '**/SKILL.md' },
    ];

    const result: AutoIndexResult = {
        storeName,
        filesProcessed: 0,
        filesSkipped: 0,
        errors: []
    };

    // Index priority files first
    for (const relativePath of priorityPaths) {
        const fullPath = path.join(projectRoot, relativePath);
        if (fs.existsSync(fullPath)) {
            console.log(`[FileSearchService] Indexing priority file: ${relativePath}`);
            const uploadResult = await uploadDocument(storeName, fullPath, relativePath);
            if (uploadResult.success) {
                result.filesProcessed++;
            } else {
                result.filesSkipped++;
                result.errors.push(`${relativePath}: ${uploadResult.error}`);
            }
        }
    }

    // Index directory patterns
    for (const { dir, pattern } of directoryPatterns) {
        const fullDir = path.join(projectRoot, dir);
        if (fs.existsSync(fullDir)) {
            const subResult = await autoIndexDirectory(storeName, fullDir, pattern);
            result.filesProcessed += subResult.filesProcessed;
            result.filesSkipped += subResult.filesSkipped;
            result.errors.push(...subResult.errors);
        }
    }

    return result;
}

// ============================================================================
// RAG QUERIES
// ============================================================================

/**
 * Query with RAG using FileSearch tool
 */
export async function queryWithRAG(
    storeName: string,
    prompt: string,
    model: string = DEFAULT_RAG_MODEL,
    systemPrompt?: string
): Promise<RAGQueryResult> {
    const ai = getClient();

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                tools: [{
                    fileSearch: {
                        fileSearchStoreNames: [storeName]
                    }
                }]
            }
        });

        // Extract citations from grounding metadata
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const citations = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            uri: chunk.retrievedContext?.uri,
            title: chunk.retrievedContext?.title,
        })) || [];

        return {
            text: response.text || 'No response',
            citations,
            groundingMetadata
        };
    } catch (error: any) {
        console.error('[FileSearchService] RAG query failed:', error);
        throw error;
    }
}

/**
 * Query multiple stores
 */
export async function queryWithMultipleStores(
    storeNames: string[],
    prompt: string,
    model: string = DEFAULT_RAG_MODEL
): Promise<RAGQueryResult> {
    const ai = getClient();

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{
                    fileSearch: {
                        fileSearchStoreNames: storeNames
                    }
                }]
            }
        });

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const citations = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            uri: chunk.retrievedContext?.uri,
            title: chunk.retrievedContext?.title,
        })) || [];

        return {
            text: response.text || 'No response',
            citations,
            groundingMetadata
        };
    } catch (error: any) {
        console.error('[FileSearchService] Multi-store RAG query failed:', error);
        throw error;
    }
}

// Export the service
export const fileSearchService = {
    createStore,
    listStores,
    getStore,
    deleteStore,
    uploadDocument,
    listDocuments,
    deleteDocument,
    autoIndexDirectory,
    autoIndexProjectDocs,
    queryWithRAG,
    queryWithMultipleStores
};

export default fileSearchService;
