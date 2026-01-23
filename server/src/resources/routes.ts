/**
 * AI Resources REST API Routes
 *
 * Elysia plugin for the unified resource management system.
 * Mounts at /api/resources
 */

import { Elysia } from 'elysia';
import { PostgresResourceStore } from './postgres-store.js';
import { ContextCompiler } from './context-compiler.js';
import type { ResourceType, OwnerType, SharePermission, ResourceFilters } from './types.js';

const store = new PostgresResourceStore();

export const registerResourceRoutes = new Elysia({ prefix: '/api/resources' })

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  // List resources with filters
  .get('/', async ({ query: q }: any) => {
    const filters: ResourceFilters = {};
    if (q.type) filters.resourceType = q.type as ResourceType;
    if (q.ownerType) filters.ownerType = q.ownerType as OwnerType;
    if (q.ownerId) filters.ownerId = q.ownerId;
    if (q.active !== undefined) filters.isActive = q.active === 'true';
    if (q.pinned !== undefined) filters.isPinned = q.pinned === 'true';
    if (q.tags) filters.tags = q.tags.split(',');
    if (q.limit) filters.limit = parseInt(q.limit, 10);
    if (q.offset) filters.offset = parseInt(q.offset, 10);
    if (q.orderBy) filters.orderBy = q.orderBy;
    if (q.orderDir) filters.orderDir = q.orderDir;
    if (q.search) filters.search = q.search;

    const resources = await store.list(filters);
    return { resources, count: resources.length };
  })

  // Get single resource
  .get('/:id', async ({ params }: any) => {
    const resource = await store.get(params.id);
    if (!resource) return new Response('Not found', { status: 404 });
    await store.trackAccess(params.id);
    return resource;
  })

  // Create resource
  .post('/', async ({ body }: any) => {
    const resource = await store.create({
      resourceType: body.resourceType,
      ownerType: body.ownerType || 'system',
      ownerId: body.ownerId,
      name: body.name,
      description: body.description,
      content: body.content,
      parts: body.parts || [],
      typeMetadata: body.typeMetadata || {},
      version: 1,
      isActive: true,
      isPinned: body.isPinned || false,
      tags: body.tags || [],
      provenance: body.provenance || 'user_input',
      usageFrequency: 0,
      syncToFile: body.syncToFile || false,
    });
    return resource;
  })

  // Update resource (auto-versions)
  .patch('/:id', async ({ params, body }: any) => {
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.content !== undefined) updates.content = body.content;
    if (body.parts !== undefined) updates.parts = body.parts;
    if (body.typeMetadata !== undefined) updates.typeMetadata = body.typeMetadata;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.isPinned !== undefined) updates.isPinned = body.isPinned;
    if (body.syncToFile !== undefined) updates.syncToFile = body.syncToFile;

    const resource = await store.update(params.id, updates);
    return resource;
  })

  // Soft delete resource
  .delete('/:id', async ({ params }: any) => {
    await store.softDelete(params.id);
    return { success: true };
  })

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  .get('/search', async ({ query: q }: any) => {
    if (!q.q) return { results: [] };
    const results = await store.search(q.q, {
      resourceType: q.type as ResourceType | undefined,
      ownerType: q.ownerType as OwnerType | undefined,
      ownerId: q.ownerId,
      limit: q.limit ? parseInt(q.limit, 10) : 50,
    });
    return { results };
  })

  // --------------------------------------------------------------------------
  // By Target
  // --------------------------------------------------------------------------

  .get('/by-target/:ownerType/:ownerId', async ({ params, query: q }: any) => {
    const resources = await store.getResourcesForTarget(
      params.ownerType as OwnerType,
      params.ownerId
    );
    if (q.type) {
      return { resources: resources.filter((r: any) => r.resourceType === q.type) };
    }
    return { resources };
  })

  // --------------------------------------------------------------------------
  // Sharing
  // --------------------------------------------------------------------------

  .post('/:id/share', async ({ params, body }: any) => {
    const share = await store.share(
      params.id,
      body.targetType as OwnerType,
      body.targetId,
      (body.permission || 'read') as SharePermission,
      body.sharedBy
    );
    return share;
  })

  .delete('/:id/share/:targetType/:targetId', async ({ params }: any) => {
    await store.unshare(params.id, params.targetType as OwnerType, params.targetId);
    return { success: true };
  })

  .get('/:id/shares', async ({ params }: any) => {
    const shares = await store.getShares(params.id);
    return { shares };
  })

  // --------------------------------------------------------------------------
  // Versioning
  // --------------------------------------------------------------------------

  .get('/:id/versions', async ({ params }: any) => {
    const versions = await store.getVersions(params.id);
    return { versions };
  })

  .post('/:id/revert/:version', async ({ params }: any) => {
    const resource = await store.revertToVersion(params.id, parseInt(params.version, 10));
    return resource;
  })

  // --------------------------------------------------------------------------
  // Dependencies
  // --------------------------------------------------------------------------

  .get('/:id/dependencies', async ({ params }: any) => {
    const deps = await store.getDependencies(params.id);
    return { dependencies: deps };
  })

  .post('/:id/dependencies', async ({ params, body }: any) => {
    const dep = await store.addDependency(params.id, body.dependsOnId, body.type || 'requires');
    return dep;
  })

  // --------------------------------------------------------------------------
  // Context Compilation
  // --------------------------------------------------------------------------

  .post('/compile/:ownerType/:ownerId', async ({ params, body }: any) => {
    const compiler = new ContextCompiler(store);
    const compiled = await compiler.compile(
      params.ownerType as OwnerType,
      params.ownerId,
      {
        tokenBudget: body?.tokenBudget,
        currentQuery: body?.currentQuery,
        strategy: body?.strategy,
        focusId: body?.focusId,
        includeMarkdown: body?.includeMarkdown,
      }
    );
    return compiled;
  })

  // --------------------------------------------------------------------------
  // Migration from localStorage
  // --------------------------------------------------------------------------

  .post('/migrate-localStorage', async ({ body }: any) => {
    const items = body.items || [];
    const migrated = await store.migrateFromLocalStorage(items);
    return { migrated, total: items.length };
  })

  // --------------------------------------------------------------------------
  // Stats
  // --------------------------------------------------------------------------

  .get('/stats', async () => {
    const total = await store.count();
    const active = await store.count({ isActive: true });
    const pinned = await store.count({ isPinned: true });

    const types: Record<string, number> = {};
    for (const type of ['prompt', 'memory', 'context', 'knowledge', 'artifact', 'skill', 'mcp'] as ResourceType[]) {
      types[type] = await store.count({ resourceType: type, isActive: true });
    }

    return { total, active, pinned, byType: types };
  });

export { store as resourceStore };
