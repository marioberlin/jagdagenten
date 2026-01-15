/**
 * Artifact API Routes
 *
 * REST endpoints for artifact management.
 */

import { Elysia } from 'elysia';
import type { ArtifactRegistry, ArtifactFilters, ArtifactCategory } from './types.js';
import { createArtifactStoreFromEnv, TRADING_TEMPLATES } from './index.js';

// Initialize artifact store (will be null if DATABASE_URL not set)
let artifactStore: ArtifactRegistry | null = null;

/**
 * Get or create artifact store instance
 */
function getStore(): ArtifactRegistry {
  if (!artifactStore) {
    artifactStore = createArtifactStoreFromEnv();
    if (!artifactStore) {
      throw new Error('Artifact store not available. Set DATABASE_URL environment variable.');
    }
  }
  return artifactStore;
}

/**
 * Create Artifact API routes
 */
export function createArtifactRoutes() {
  return new Elysia({ prefix: '/api/artifacts' })
    // Health check
    .get('/health', async () => {
      try {
        const store = getStore();
        const stats = await store.getStats();
        return {
          status: 'healthy',
          stats,
        };
      } catch (error) {
        return {
          status: 'unavailable',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })

    // List artifacts with filters
    .get('/', async ({ query }) => {
      const store = getStore();

      const filters: ArtifactFilters = {
        taskId: query.taskId as string | undefined,
        contextId: query.contextId as string | undefined,
        name: query.name as string | undefined,
        isComplete: query.isComplete === 'true' ? true : query.isComplete === 'false' ? false : undefined,
        isStreaming: query.isStreaming === 'true' ? true : query.isStreaming === 'false' ? false : undefined,
        category: query.category as ArtifactCategory | undefined,
        limit: query.limit ? parseInt(query.limit as string, 10) : 50,
        offset: query.offset ? parseInt(query.offset as string, 10) : 0,
        orderBy: (query.orderBy as ArtifactFilters['orderBy']) ?? 'createdAt',
        orderDir: (query.orderDir as ArtifactFilters['orderDir']) ?? 'desc',
      };

      if (query.createdAfter) {
        filters.createdAfter = new Date(query.createdAfter as string);
      }
      if (query.createdBefore) {
        filters.createdBefore = new Date(query.createdBefore as string);
      }
      if (query.extensions) {
        filters.extensions = (query.extensions as string).split(',');
      }

      const artifacts = await store.list(filters);
      return { artifacts, count: artifacts.length };
    })

    // Get recent artifacts
    .get('/recent', async ({ query }) => {
      const store = getStore();
      const limit = query.limit ? parseInt(query.limit as string, 10) : 20;
      const artifacts = await store.getRecent(limit);
      return { artifacts };
    })

    // Search artifacts
    .get('/search', async ({ query }) => {
      const store = getStore();
      const q = query.q as string;

      if (!q) {
        return { error: 'Query parameter "q" is required', results: [] };
      }

      const filters: ArtifactFilters = {
        taskId: query.taskId as string | undefined,
        contextId: query.contextId as string | undefined,
        isComplete: query.isComplete === 'true' ? true : undefined,
        limit: query.limit ? parseInt(query.limit as string, 10) : 50,
      };

      const results = await store.search(q, filters);
      return { results, count: results.length };
    })

    // Get artifact by ID
    .get('/:id', async ({ params, set }) => {
      const store = getStore();
      const artifact = await store.get(params.id);

      if (!artifact) {
        set.status = 404;
        return { error: 'Artifact not found' };
      }

      return { artifact };
    })

    // Create artifact
    .post('/', async ({ body, set }) => {
      const store = getStore();

      const { artifact, taskId, contextId } = body as {
        artifact: {
          artifactId: string;
          name?: string;
          description?: string;
          parts: unknown[];
          metadata?: Record<string, unknown>;
          extensions?: string[];
        };
        taskId: string;
        contextId: string;
      };

      if (!artifact || !taskId || !contextId) {
        set.status = 400;
        return { error: 'Missing required fields: artifact, taskId, contextId' };
      }

      try {
        const stored = await store.create(
          {
            artifactId: artifact.artifactId,
            name: artifact.name,
            description: artifact.description,
            parts: artifact.parts as import('@liquidcrypto/a2a-sdk').v1.Part[],
            metadata: artifact.metadata as Record<string, import('@liquidcrypto/a2a-sdk').v1.JSONValue> | undefined,
            extensions: artifact.extensions,
          },
          taskId,
          contextId
        );

        set.status = 201;
        return { artifact: stored };
      } catch (error) {
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to create artifact' };
      }
    })

    // Update artifact
    .patch('/:id', async ({ params, body, set }) => {
      const store = getStore();

      const updates = body as {
        parts?: unknown[];
        name?: string;
        description?: string;
        metadata?: Record<string, unknown>;
      };

      try {
        const artifact = await store.update(params.id, {
          parts: updates.parts as import('@liquidcrypto/a2a-sdk').v1.Part[] | undefined,
          name: updates.name,
          description: updates.description,
          metadata: updates.metadata as Record<string, import('@liquidcrypto/a2a-sdk').v1.JSONValue> | undefined,
        });

        return { artifact };
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          set.status = 404;
          return { error: 'Artifact not found' };
        }
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to update artifact' };
      }
    })

    // Delete artifact
    .delete('/:id', async ({ params, set }) => {
      const store = getStore();

      const artifact = await store.get(params.id);
      if (!artifact) {
        set.status = 404;
        return { error: 'Artifact not found' };
      }

      await store.delete(params.id);
      return { success: true };
    })

    // Get version history
    .get('/:id/versions', async ({ params, set }) => {
      const store = getStore();

      const artifact = await store.get(params.id);
      if (!artifact) {
        set.status = 404;
        return { error: 'Artifact not found' };
      }

      const versions = await store.getHistory(params.id);
      return { versions };
    })

    // Revert to version
    .post('/:id/versions/:version/revert', async ({ params, set }) => {
      const store = getStore();

      try {
        const artifact = await store.revertToVersion(params.id, parseInt(params.version, 10));
        return { artifact };
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          set.status = 404;
          return { error: (error as Error).message };
        }
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to revert version' };
      }
    })

    // Get references
    .get('/:id/references', async ({ params, set }) => {
      const store = getStore();

      const artifact = await store.get(params.id);
      if (!artifact) {
        set.status = 404;
        return { error: 'Artifact not found' };
      }

      const [references, referencedBy] = await Promise.all([
        store.getReferences(params.id),
        store.getReferencedBy(params.id),
      ]);

      return { references, referencedBy };
    })

    // Add reference
    .post('/:id/references', async ({ params, body, set }) => {
      const store = getStore();

      const { sourceTaskId, referenceType } = body as {
        sourceTaskId: string;
        referenceType: 'input' | 'derived' | 'related';
      };

      if (!sourceTaskId || !referenceType) {
        set.status = 400;
        return { error: 'Missing required fields: sourceTaskId, referenceType' };
      }

      try {
        const reference = await store.addReference(sourceTaskId, params.id, referenceType);
        return { reference };
      } catch (error) {
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to add reference' };
      }
    })

    // List templates
    .get('/templates', async ({ query }) => {
      const store = getStore();
      const category = query.category as ArtifactCategory | undefined;

      try {
        const templates = await store.listTemplates(category);
        // Merge database templates with built-in trading templates
        const builtInTemplates = category
          ? TRADING_TEMPLATES.filter(t => t.category === category)
          : TRADING_TEMPLATES;

        return {
          templates: [...templates, ...builtInTemplates],
        };
      } catch {
        // If DB not available, just return built-in templates
        return {
          templates: category
            ? TRADING_TEMPLATES.filter(t => t.category === category)
            : TRADING_TEMPLATES,
        };
      }
    })

    // Get template by ID
    .get('/templates/:id', async ({ params, set }) => {
      // Check built-in templates first
      const builtIn = TRADING_TEMPLATES.find(t => t.id === params.id);
      if (builtIn) {
        return { template: builtIn };
      }

      const store = getStore();
      const template = await store.getTemplate(params.id);

      if (!template) {
        set.status = 404;
        return { error: 'Template not found' };
      }

      return { template };
    })

    // Create artifact from template
    .post('/templates/:id/create', async ({ params, body, set }) => {
      const store = getStore();

      const { data, taskId, contextId } = body as {
        data: Record<string, unknown>;
        taskId: string;
        contextId: string;
      };

      if (!data || !taskId || !contextId) {
        set.status = 400;
        return { error: 'Missing required fields: data, taskId, contextId' };
      }

      try {
        const artifact = await store.createFromTemplate(params.id, data, taskId, contextId);
        set.status = 201;
        return { artifact };
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          set.status = 404;
          return { error: 'Template not found' };
        }
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to create from template' };
      }
    })

    // Get statistics
    .get('/stats', async () => {
      const store = getStore();
      const stats = await store.getStats();
      return { stats };
    })

    // List artifacts by task
    .get('/by-task/:taskId', async ({ params }) => {
      const store = getStore();
      const artifacts = await store.listByTask(params.taskId);
      return { artifacts, count: artifacts.length };
    })

    // List artifacts by context
    .get('/by-context/:contextId', async ({ params, query }) => {
      const store = getStore();
      const limit = query.limit ? parseInt(query.limit as string, 10) : 50;
      const artifacts = await store.listByContext(params.contextId, limit);
      return { artifacts, count: artifacts.length };
    })

    // Streaming endpoints
    .post('/stream/start', async ({ body, set }) => {
      const store = getStore();

      const { artifact, taskId, contextId } = body as {
        artifact: {
          artifactId: string;
          name?: string;
          description?: string;
          parts?: unknown[];
          metadata?: Record<string, unknown>;
        };
        taskId: string;
        contextId: string;
      };

      if (!artifact || !taskId || !contextId) {
        set.status = 400;
        return { error: 'Missing required fields: artifact, taskId, contextId' };
      }

      const id = await store.startStream(
        {
          artifactId: artifact.artifactId,
          name: artifact.name,
          description: artifact.description,
          parts: (artifact.parts ?? []) as import('@liquidcrypto/a2a-sdk').v1.Part[],
          metadata: artifact.metadata as Record<string, import('@liquidcrypto/a2a-sdk').v1.JSONValue> | undefined,
        },
        taskId,
        contextId
      );

      set.status = 201;
      return { id };
    })

    .post('/stream/:id/chunk', async ({ params, body, set }) => {
      const store = getStore();

      const { parts, isLast } = body as {
        parts: unknown[];
        isLast?: boolean;
      };

      if (!parts || !Array.isArray(parts)) {
        set.status = 400;
        return { error: 'Missing required field: parts (array)' };
      }

      try {
        await store.appendChunk(
          params.id,
          parts as import('@liquidcrypto/a2a-sdk').v1.Part[],
          isLast ?? false
        );
        return { success: true };
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          set.status = 404;
          return { error: 'Streaming artifact not found' };
        }
        if ((error as Error).message.includes('limit exceeded')) {
          set.status = 400;
          return { error: (error as Error).message };
        }
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to append chunk' };
      }
    })

    .post('/stream/:id/finalize', async ({ params, set }) => {
      const store = getStore();

      try {
        const artifact = await store.finalizeStream(params.id);
        return { artifact };
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          set.status = 404;
          return { error: 'Streaming artifact not found' };
        }
        set.status = 500;
        return { error: error instanceof Error ? error.message : 'Failed to finalize stream' };
      }
    });
}
