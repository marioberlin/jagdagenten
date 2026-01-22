/**
 * FileSearch API Routes
 * 
 * REST endpoints for managing FileSearchStores and documents.
 */

import { Elysia, t } from 'elysia';
import {
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
} from '../services/fileSearchService.js';

export const fileSearchRoutes = new Elysia({ prefix: '/api/file-search' })
    // =========================================================================
    // STORE MANAGEMENT
    // =========================================================================

    // List all stores
    .get('/stores', async () => {
        try {
            const stores = await listStores();
            return { stores };
        } catch (error: any) {
            return { error: error.message, stores: [] };
        }
    })

    // Create a new store
    .post('/stores', async ({ body, set }) => {
        const { displayName } = body as { displayName: string };

        if (!displayName) {
            set.status = 400;
            return { error: 'displayName is required' };
        }

        try {
            const store = await createStore(displayName);
            return { success: true, store };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // Get a specific store
    .get('/stores/:name', async ({ params, set }) => {
        const storeName = `fileSearchStores/${params.name}`;

        try {
            const store = await getStore(storeName);
            if (!store) {
                set.status = 404;
                return { error: 'Store not found' };
            }
            return { store };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // Delete a store
    .delete('/stores/:name', async ({ params, set }) => {
        const storeName = `fileSearchStores/${params.name}`;

        try {
            const success = await deleteStore(storeName);
            if (!success) {
                set.status = 500;
                return { error: 'Failed to delete store' };
            }
            return { success: true };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // =========================================================================
    // DOCUMENT MANAGEMENT
    // =========================================================================

    // List documents in a store
    .get('/stores/:name/documents', async ({ params, set }) => {
        const storeName = `fileSearchStores/${params.name}`;

        try {
            const documents = await listDocuments(storeName);
            return { documents };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message, documents: [] };
        }
    })

    // Upload a file to a store (from server filesystem)
    .post('/stores/:name/upload', async ({ params, body, set }) => {
        const storeName = `fileSearchStores/${params.name}`;
        const { filePath, displayName } = body as { filePath: string; displayName?: string };

        if (!filePath) {
            set.status = 400;
            return { error: 'filePath is required' };
        }

        try {
            const result = await uploadDocument(storeName, filePath, displayName);
            if (!result.success) {
                set.status = 500;
                return { error: result.error };
            }
            return { success: true, documentName: result.documentName };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // Upload a file from browser (multipart form)
    .post('/stores/:name/upload-file', async ({ params, body, set }) => {
        const storeName = `fileSearchStores/${params.name}`;

        try {
            // Handle multipart form data
            const formData = body as { file?: File; displayName?: string };
            const file = formData.file;

            if (!file || !(file instanceof File)) {
                set.status = 400;
                return { error: 'file is required' };
            }

            // Save file temporarily
            const tmpDir = '/tmp/file-search-uploads';
            const fs = await import('fs');
            const path = await import('path');

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const fileName = file.name || 'uploaded-file.txt';
            const tmpPath = path.join(tmpDir, `${Date.now()}-${fileName}`);

            // Write file buffer to temp location
            const arrayBuffer = await file.arrayBuffer();
            fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer));

            // Upload to FileSearch store
            const displayName = formData.displayName || fileName;
            const result = await uploadDocument(storeName, tmpPath, displayName);

            // Clean up temp file
            try { fs.unlinkSync(tmpPath); } catch { }

            if (!result.success) {
                set.status = 500;
                return { error: result.error };
            }

            return { success: true, documentName: result.documentName };
        } catch (error: any) {
            console.error('[FileSearch] Browser upload error:', error);
            set.status = 500;
            return { error: error.message };
        }
    })

    // Delete a document
    .delete('/documents/:storeName/:docName', async ({ params, set }) => {
        const documentName = `fileSearchStores/${params.storeName}/documents/${params.docName}`;

        try {
            const success = await deleteDocument(documentName);
            if (!success) {
                set.status = 500;
                return { error: 'Failed to delete document' };
            }
            return { success: true };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // =========================================================================
    // AUTO-INDEX
    // =========================================================================

    // Auto-index a directory
    .post('/stores/:name/auto-index', async ({ params, body, set }) => {
        const storeName = `fileSearchStores/${params.name}`;
        const { directory, pattern } = body as { directory?: string; pattern?: string };

        try {
            // Default to docs directory if not specified
            const dir = directory || 'docs';
            const pat = pattern || '**/*.md';

            const result = await autoIndexDirectory(storeName, dir, pat);
            return { success: true, result };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // Auto-index project documentation (priority-ordered)
    .post('/stores/:name/auto-index-project', async ({ params, set }) => {
        const storeName = `fileSearchStores/${params.name}`;

        try {
            const result = await autoIndexProjectDocs(storeName);
            return { success: true, result };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // =========================================================================
    // RAG QUERIES
    // =========================================================================

    // Query with RAG (single store)
    .post('/query', async ({ body, set }) => {
        const { storeName, prompt, model, systemPrompt } = body as {
            storeName: string;
            prompt: string;
            model?: string;
            systemPrompt?: string;
        };

        if (!storeName || !prompt) {
            set.status = 400;
            return { error: 'storeName and prompt are required' };
        }

        try {
            const result = await queryWithRAG(storeName, prompt, model, systemPrompt);
            return { success: true, ...result };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    })

    // Query with RAG (multiple stores)
    .post('/query-multi', async ({ body, set }) => {
        const { storeNames, prompt, model } = body as {
            storeNames: string[];
            prompt: string;
            model?: string;
        };

        if (!storeNames || !storeNames.length || !prompt) {
            set.status = 400;
            return { error: 'storeNames array and prompt are required' };
        }

        try {
            const result = await queryWithMultipleStores(storeNames, prompt, model);
            return { success: true, ...result };
        } catch (error: any) {
            set.status = 500;
            return { error: error.message };
        }
    });

export default fileSearchRoutes;
