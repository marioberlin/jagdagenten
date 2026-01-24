/**
 * Builder API Routes
 *
 * REST endpoints for build lifecycle, RAG management, and context files.
 */

import { Elysia, t } from 'elysia';
import fs from 'fs';
import path from 'path';
import { BuilderOrchestrator } from './orchestrator.js';
import { BuilderRAGManager } from './rag-manager.js';
import { suggestDocUpdates } from './doc-generator.js';
import type { BuildRequest } from './types.js';

const ragManager = new BuilderRAGManager();

const orchestrator = new BuilderOrchestrator();

export const builderRoutes = new Elysia({ prefix: '/api/builder' })
  // === Build Lifecycle ===

  .post('/builds/create', async ({ body }) => {
    const record = await orchestrator.createBuild(body as BuildRequest);
    return record;
  }, {
    body: t.Object({
      description: t.String(),
      appId: t.Optional(t.String()),
      category: t.Optional(t.String()),
      hasAgent: t.Optional(t.Boolean()),
      hasResources: t.Optional(t.Boolean()),
      hasCustomComponents: t.Optional(t.Boolean()),
      windowMode: t.Optional(t.String()),
      executionMode: t.Optional(t.String()),
      researchMode: t.Optional(t.String()),
      buildMode: t.Optional(t.String()),
    }),
  })

  .post('/builds/:id/execute', ({ params }) => {
    const record = orchestrator.getStatus(params.id);
    if (!record) return { error: 'Build not found' };

    // Run build in background (don't await) — client polls via /status
    orchestrator.executeBuild(params.id).catch((err) => {
      console.error(`[Builder] Build ${params.id} failed:`, err);
    });

    return { ...record, phase: 'thinking' };
  })

  .get('/builds/:id/status', ({ params }) => {
    const record = orchestrator.getStatus(params.id);
    if (!record) return { error: 'Build not found' };
    return { ...record, description: record.request?.description || record.appId };
  })

  .post('/builds/:id/approve', ({ params }) => {
    const record = orchestrator.getStatus(params.id);
    if (!record) return { error: 'Build not found' };
    if (record.phase !== 'awaiting-review') return { error: 'Build is not awaiting review' };

    // Resume build in background
    orchestrator.resumeBuild(params.id).catch((err) => {
      console.error(`[Builder] Build ${params.id} resume failed:`, err);
    });

    return { ...record, phase: 'scaffolding' };
  })

  .post('/builds/:id/cancel', async ({ params }) => {
    await orchestrator.cancelBuild(params.id);
    return { success: true };
  })

  .post('/builds/:id/resume', async ({ params }) => {
    const record = await orchestrator.resumeInterruptedBuild(params.id);
    if (!record) return { error: 'Build not found or not resumable' };
    return { ...record, phase: record.phase };
  })

  .delete('/builds/:id', async ({ params }) => {
    await orchestrator.deleteBuild(params.id);
    return { success: true };
  })

  .post('/builds/:id/install', ({ params }) => {
    const result = orchestrator.installBuild(params.id);
    if (result.error) return { success: false, error: result.error };
    return { success: true, installed: result.installed.length };
  })

  .get('/builds/history', async () => {
    const builds = await orchestrator.listBuilds();
    // Add top-level description for frontend compatibility
    return builds.map(b => ({ ...b, description: b.request?.description || b.appId }));
  })

  // === Context / Drop Folder ===

  .get('/context/:id', ({ params }) => {
    const dir = `.builder/context/${params.id}`;
    if (!fs.existsSync(dir)) return { files: [] };

    const files = fs.readdirSync(dir)
      .filter((f: string) => f !== 'README.md' && f !== '.gitkeep')
      .map((f: string) => {
        const stat = fs.statSync(path.join(dir, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      });

    return { files };
  })

  .post('/context/:id/upload', async ({ params, body }: { params: { id: string }; body: unknown }) => {
    const dir = `.builder/context/${params.id}`;
    fs.mkdirSync(dir, { recursive: true });

    const { fileName, content } = body as { fileName: string; content: string };
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, content);

    return { success: true, path: filePath };
  }, {
    body: t.Object({
      fileName: t.String(),
      content: t.String(),
    }),
  })

  .delete('/context/:id/:file', ({ params }) => {
    const filePath = `.builder/context/${params.id}/${params.file}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  })

  .get('/context/shared', () => {
    const dir = '.builder/context/shared';
    if (!fs.existsSync(dir)) return { files: [] };

    const files = fs.readdirSync(dir)
      .filter((f: string) => f !== '.gitkeep')
      .map((f: string) => {
        const stat = fs.statSync(path.join(dir, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      });

    return { files };
  })

  // === Build Artifacts (generated docs) ===

  .get('/builds/:id/docs', ({ params }) => {
    // Find the build to get appId
    const record = orchestrator.getStatus(params.id);
    const appId = record?.appId || params.id;
    const docsDir = `.builder/staging/${appId}/app/docs`;
    if (!fs.existsSync(docsDir)) return { docs: [] };

    const docs = fs.readdirSync(docsDir)
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => {
        const content = fs.readFileSync(path.join(docsDir, f), 'utf8');
        return { name: f, content };
      });

    return { docs };
  })

  .get('/apps/:id/docs', ({ params }) => {
    const docsDir = `.builder/staging/${params.id}/app/docs`;
    if (!fs.existsSync(docsDir)) return { docs: [] };

    const docs = fs.readdirSync(docsDir)
      .filter((f: string) => f.endsWith('.md'))
      .map((f: string) => {
        const content = fs.readFileSync(path.join(docsDir, f), 'utf8');
        return { name: f, content };
      });

    return { docs };
  })

  // === Edit Mode ===

  .post('/apps/:id/edit', async ({ params, body }) => {
    const { description } = body as { description: string };
    const record = await orchestrator.createBuild({
      description: `Edit: ${description}`,
      appId: params.id,
      researchMode: 'standard',
    });
    return record;
  }, {
    body: t.Object({
      description: t.String(),
    }),
  })

  // === RAG Management ===

  .get('/apps/:id/rag/documents', async ({ params }) => {
    const storeName = `builder-${params.id}`;
    try {
      const documents = await ragManager.listDocuments(storeName);
      return { documents };
    } catch {
      return { documents: [] };
    }
  })

  .post('/apps/:id/rag/query', async ({ params, body }) => {
    const { query } = body as { query: string };
    const storeName = `builder-${params.id}`;
    try {
      const result = await ragManager.queryAppHistory(storeName, query);
      return { result };
    } catch {
      return { result: null, error: 'Query failed' };
    }
  }, {
    body: t.Object({
      query: t.String(),
    }),
  })

  .delete('/apps/:id/rag/documents/:file', async ({ params }) => {
    try {
      const success = await ragManager.deleteDocumentByName(params.file);
      return { success };
    } catch {
      return { success: false };
    }
  })

  .post('/apps/:id/rag/prune', async ({ params, body }) => {
    const storeName = `builder-${params.id}`;
    const options = (body || {}) as { keepPinned?: boolean; maxIterations?: number; maxAge?: string };
    try {
      const result = await ragManager.pruneCorpus(storeName, options);
      return result;
    } catch {
      return { deleted: 0, kept: 0, deletedNames: [] };
    }
  })

  .delete('/apps/:id/rag', async ({ params }) => {
    const storeName = `builder-${params.id}`;
    try {
      const success = await ragManager.deleteCorpus(storeName);
      return { success };
    } catch {
      return { success: false };
    }
  })

  // === Documentation ===

  .get('/apps/:id/docs/suggestions', async ({ params }) => {
    const builds = await orchestrator.listBuilds();
    const build = builds.find(b => b.appId === params.id && b.plan);
    if (!build?.plan) return { suggestions: [] };
    return { suggestions: suggestDocUpdates(params.id, build.plan) };
  });
