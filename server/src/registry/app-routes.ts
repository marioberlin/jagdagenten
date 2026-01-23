/**
 * LiquidOS App Registry Routes
 *
 * REST API for the LiquidOS app marketplace.
 * Uses PostgreSQL via app-store-db.ts when available, falls back to in-memory store.
 */

import { Elysia } from 'elysia';
import type { AppRegistryEntry, AppSearchParams, AppListResponse, PublishAppRequest } from './app-types.js';
import * as db from './app-store-db.js';
import * as bundleStorage from './bundle-storage.js';

// ============================================================================
// In-Memory Fallback Store
// ============================================================================

const memoryStore = new Map<string, AppRegistryEntry>();
let useDatabase = false;

/**
 * Initialize the app store — attempt DB migration, fall back to memory.
 */
async function initAppStore() {
  try {
    await db.migrateAppStoreSchema();
    useDatabase = true;
    console.info('[AppRoutes] Using PostgreSQL for app registry');

    // Seed DB with sample apps if empty
    const { total } = await db.getAllApps({ limit: 1 });
    if (total === 0) {
      for (const app of SAMPLE_REMOTE_APPS) {
        await db.upsertApp(app);
      }
      console.info(`[AppRoutes] Seeded ${SAMPLE_REMOTE_APPS.length} sample apps into DB`);
    }
  } catch {
    useDatabase = false;
    console.info('[AppRoutes] PostgreSQL unavailable, using in-memory store');
    seedMemoryStore();
  }
}

// ============================================================================
// Routes
// ============================================================================

export const appRoutes = new Elysia({ prefix: '/api/v1/apps' })

  // ── List Apps ────────────────────────────────────────────────
  .get('/', async ({ query }) => {
    const { q, category, author, featured, limit = 50, offset = 0 } = query as AppSearchParams;

    if (useDatabase) {
      const result = await db.getAllApps({
        q: q ?? undefined,
        category: category ?? undefined,
        author: author ?? undefined,
        featured: featured ? true : undefined,
        limit: Number(limit),
        offset: Number(offset),
      });
      const response: AppListResponse = {
        apps: result.apps,
        total: result.total,
        limit: Number(limit),
        offset: Number(offset),
      };
      return response;
    }

    // In-memory fallback
    let results = Array.from(memoryStore.values());

    if (q) {
      const searchLower = q.toLowerCase();
      results = results.filter(app =>
        app.manifest.name.toLowerCase().includes(searchLower) ||
        app.manifest.description.toLowerCase().includes(searchLower) ||
        app.manifest.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }
    if (category) {
      results = results.filter(app => app.manifest.category === category);
    }
    if (author) {
      results = results.filter(app => app.manifest.author === author);
    }
    if (featured) {
      results = results.filter(app => app.featured);
    }

    const total = results.length;
    const paginatedResults = results.slice(Number(offset), Number(offset) + Number(limit));

    const response: AppListResponse = {
      apps: paginatedResults,
      total,
      limit: Number(limit),
      offset: Number(offset),
    };
    return response;
  })

  // ── Get Single App ───────────────────────────────────────────
  .get('/:id', async ({ params: { id } }) => {
    if (useDatabase) {
      const app = await db.getApp(id);
      if (!app) {
        return new Response(JSON.stringify({ error: 'App not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return app;
    }

    const app = memoryStore.get(id);
    if (!app) {
      return new Response(JSON.stringify({ error: 'App not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return app;
  })

  // ── Search Apps ──────────────────────────────────────────────
  .get('/search', async ({ query }) => {
    const { q = '', limit = 20 } = query as { q?: string; limit?: number };

    if (useDatabase) {
      const result = await db.getAllApps({ q, limit: Number(limit) });
      return { apps: result.apps, total: result.total };
    }

    const searchLower = q.toLowerCase();
    const results = Array.from(memoryStore.values())
      .filter(app =>
        app.manifest.name.toLowerCase().includes(searchLower) ||
        app.manifest.description.toLowerCase().includes(searchLower) ||
        app.manifest.keywords.some(k => k.toLowerCase().includes(searchLower))
      )
      .slice(0, Number(limit));

    return { apps: results, total: results.length };
  })

  // ── Featured Apps ────────────────────────────────────────────
  .get('/featured', async () => {
    if (useDatabase) {
      const apps = await db.getFeaturedApps();
      return { apps };
    }
    const featured = Array.from(memoryStore.values()).filter(app => app.featured);
    return { apps: featured };
  })

  // ── Get App Categories ───────────────────────────────────────
  .get('/categories', async () => {
    if (useDatabase) {
      return await db.getCategoryCounts();
    }
    const categories = new Map<string, number>();
    for (const app of memoryStore.values()) {
      const cat = app.manifest.category;
      categories.set(cat, (categories.get(cat) ?? 0) + 1);
    }
    return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
  })

  // ── Publish App ──────────────────────────────────────────────
  .post('/', async ({ body }) => {
    const { manifest, bundleData } = body as PublishAppRequest;

    if (!manifest?.id || !manifest?.name || !manifest?.version) {
      return new Response(JSON.stringify({ error: 'Invalid manifest: missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Store bundle if provided
    let bundleHash: string | undefined;
    let bundleSize: number | undefined;
    if (bundleData) {
      try {
        const stored = await bundleStorage.storeBundle(manifest.id, manifest.version, bundleData);
        bundleHash = stored.hash;
        bundleSize = stored.size;
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to store bundle' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (useDatabase) {
      const existing = await db.getApp(manifest.id);
      const entry: AppRegistryEntry = {
        id: manifest.id,
        manifest,
        publishedAt: existing?.publishedAt ?? now,
        updatedAt: now,
        publishedBy: 'local',
        downloads: existing?.downloads ?? 0,
        rating: existing?.rating ?? 0,
        reviewCount: existing?.reviewCount ?? 0,
        featured: existing?.featured ?? false,
        verified: false,
        bundleUrl: bundleData ? `/api/v1/apps/${manifest.id}/bundle` : undefined,
        bundleHash,
        bundleSize,
      };
      const saved = await db.upsertApp(entry);
      return { success: true, app: saved };
    }

    // In-memory fallback
    const existing = memoryStore.get(manifest.id);
    const entry: AppRegistryEntry = {
      id: manifest.id,
      manifest,
      publishedAt: existing?.publishedAt ?? now,
      updatedAt: now,
      publishedBy: 'local',
      downloads: existing?.downloads ?? 0,
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      featured: existing?.featured ?? false,
      verified: false,
      bundleUrl: bundleData ? `/api/v1/apps/${manifest.id}/bundle` : undefined,
      bundleHash,
      bundleSize,
    };
    memoryStore.set(manifest.id, entry);
    return { success: true, app: entry };
  })

  // ── Download Bundle ──────────────────────────────────────────
  .get('/:id/bundle', async ({ params: { id } }) => {
    const app = useDatabase ? await db.getApp(id) : memoryStore.get(id);

    if (!app || !app.bundleUrl) {
      return new Response(JSON.stringify({ error: 'Bundle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Try to serve from storage
    const bundle = await bundleStorage.getBundle(id, app.manifest.version, app.bundleHash);
    if (!bundle) {
      return new Response(JSON.stringify({ error: 'Bundle file not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Increment download counter
    if (useDatabase) {
      await db.incrementDownloads(id);
    } else {
      app.downloads += 1;
    }

    return new Response(new Uint8Array(bundle.content), {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Content-Length': String(bundle.metadata.size),
        'X-Bundle-Hash': bundle.metadata.hash,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  })

  // ── Delete App ──────────────────────────────────────────────
  .delete('/:id', async ({ params: { id } }) => {
    if (useDatabase) {
      const deleted = await db.deleteApp(id);
      if (!deleted) {
        return new Response(JSON.stringify({ error: 'App not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return { success: true };
    }

    if (!memoryStore.has(id)) {
      return new Response(JSON.stringify({ error: 'App not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    memoryStore.delete(id);
    return { success: true };
  })

  // ── App Stats ────────────────────────────────────────────────
  .get('/stats', async () => {
    if (useDatabase) {
      return await db.getStats();
    }
    return {
      totalApps: memoryStore.size,
      totalDownloads: Array.from(memoryStore.values()).reduce((sum, a) => sum + a.downloads, 0),
      categories: new Set(Array.from(memoryStore.values()).map(a => a.manifest.category)).size,
      featuredCount: Array.from(memoryStore.values()).filter(a => a.featured).length,
    };
  });

// ============================================================================
// Seed Data (Development)
// ============================================================================

const SAMPLE_REMOTE_APPS: AppRegistryEntry[] = [
  {
    id: 'pomodoro-timer',
    manifest: {
      id: 'pomodoro-timer',
      name: 'Pomodoro Timer',
      version: '1.2.0',
      description: 'Focus timer with work/break intervals and session tracking',
      longDescription: 'Stay productive with customizable Pomodoro sessions. Track your focus streaks, set goals, and review productivity analytics. Supports 25/5 and 50/10 intervals.',
      author: 'Liquid Labs',
      category: 'productivity',
      keywords: ['timer', 'focus', 'pomodoro', 'productivity'],
      icon: 'Timer',
      window: { mode: 'floating', title: 'Pomodoro Timer', defaultSize: { width: 400, height: 500 }, resizable: true },
      integrations: { dock: { enabled: true } },
      capabilities: ['notification:push', 'storage:local'],
    },
    publishedAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-12-15T00:00:00Z',
    publishedBy: 'liquid-labs',
    downloads: 1240,
    rating: 4.7,
    reviewCount: 89,
    featured: true,
    verified: true,
    bundleUrl: '/api/v1/apps/pomodoro-timer/bundle',
    bundleHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    bundleSize: 45000,
  },
  {
    id: 'markdown-editor',
    manifest: {
      id: 'markdown-editor',
      name: 'Glass Editor Pro',
      version: '2.0.1',
      description: 'Advanced markdown editor with live preview and AI assistance',
      author: 'Liquid Labs',
      category: 'developer',
      keywords: ['markdown', 'editor', 'writing', 'notes'],
      icon: 'FileText',
      window: { mode: 'panel', title: 'Glass Editor', defaultSize: { width: 1000, height: 700 }, resizable: true },
      integrations: { dock: { enabled: true }, commandPalette: { commands: [{ id: 'new-doc', label: 'New Document', shortcut: 'Cmd+N' }] } },
      capabilities: ['storage:indexeddb', 'ai:llm', 'system:clipboard'],
    },
    publishedAt: '2025-10-15T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
    publishedBy: 'liquid-labs',
    downloads: 3420,
    rating: 4.9,
    reviewCount: 201,
    featured: true,
    verified: true,
    bundleUrl: '/api/v1/apps/markdown-editor/bundle',
    bundleHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    bundleSize: 120000,
  },
  {
    id: 'habit-tracker',
    manifest: {
      id: 'habit-tracker',
      name: 'Habit Flow',
      version: '1.0.3',
      description: 'Build and track daily habits with streaks and insights',
      author: 'Community',
      category: 'productivity',
      keywords: ['habits', 'tracker', 'goals', 'streaks'],
      icon: 'Target',
      window: { mode: 'floating', title: 'Habit Flow', defaultSize: { width: 500, height: 600 }, resizable: true },
      integrations: { dock: { enabled: true } },
      capabilities: ['storage:local', 'notification:toast'],
    },
    publishedAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
    publishedBy: 'community-dev',
    downloads: 890,
    rating: 4.5,
    reviewCount: 45,
    featured: false,
    verified: true,
    bundleUrl: '/api/v1/apps/habit-tracker/bundle',
    bundleHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    bundleSize: 68000,
  },
  {
    id: 'crypto-charts',
    manifest: {
      id: 'crypto-charts',
      name: 'Crypto Charts Live',
      version: '3.1.0',
      description: 'Real-time cryptocurrency charts with technical analysis tools',
      author: 'ChartWorks',
      category: 'finance',
      keywords: ['crypto', 'charts', 'trading', 'technical-analysis', 'bitcoin'],
      icon: 'LineChart',
      window: { mode: 'panel', title: 'Crypto Charts', defaultSize: { width: 1100, height: 700 }, resizable: true },
      integrations: { dock: { enabled: true } },
      capabilities: ['network:websocket', 'network:http', 'storage:indexeddb'],
    },
    publishedAt: '2025-09-20T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
    publishedBy: 'chartworks',
    downloads: 5600,
    rating: 4.8,
    reviewCount: 312,
    featured: true,
    verified: true,
    bundleUrl: '/api/v1/apps/crypto-charts/bundle',
    bundleHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    bundleSize: 250000,
  },
  {
    id: 'white-noise',
    manifest: {
      id: 'white-noise',
      name: 'Ambient Sounds',
      version: '1.1.0',
      description: 'Relaxing ambient soundscapes for focus and relaxation',
      author: 'SoundSpace',
      category: 'entertainment',
      keywords: ['sounds', 'ambient', 'noise', 'focus', 'relaxation', 'music'],
      icon: 'Volume2',
      window: { mode: 'floating', title: 'Ambient Sounds', defaultSize: { width: 350, height: 450 }, resizable: false },
      integrations: { dock: { enabled: false } },
      capabilities: ['storage:local'],
    },
    publishedAt: '2025-11-10T00:00:00Z',
    updatedAt: '2025-12-20T00:00:00Z',
    publishedBy: 'soundspace',
    downloads: 2100,
    rating: 4.6,
    reviewCount: 67,
    featured: false,
    verified: true,
    bundleUrl: '/api/v1/apps/white-noise/bundle',
    bundleHash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    bundleSize: 35000,
  },
  {
    id: 'git-dashboard',
    manifest: {
      id: 'git-dashboard',
      name: 'Git Dashboard',
      version: '1.3.2',
      description: 'Monitor GitHub repos, PRs, and CI status in one view',
      author: 'DevToolsCo',
      category: 'developer',
      keywords: ['git', 'github', 'ci', 'pull-requests', 'developer'],
      icon: 'GitBranch',
      window: { mode: 'panel', title: 'Git Dashboard', defaultSize: { width: 900, height: 650 }, resizable: true },
      integrations: { dock: { enabled: true }, aiContext: { systemPrompt: 'You help with Git and GitHub operations.' } },
      capabilities: ['network:http', 'storage:local', 'notification:push'],
    },
    publishedAt: '2025-10-05T00:00:00Z',
    updatedAt: '2026-01-12T00:00:00Z',
    publishedBy: 'devtoolsco',
    downloads: 4200,
    rating: 4.7,
    reviewCount: 178,
    featured: true,
    verified: true,
    bundleUrl: '/api/v1/apps/git-dashboard/bundle',
    bundleHash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    bundleSize: 180000,
  },
];

/**
 * Seed the in-memory store with sample apps.
 */
function seedMemoryStore() {
  for (const app of SAMPLE_REMOTE_APPS) {
    if (!memoryStore.has(app.id)) {
      memoryStore.set(app.id, app);
    }
  }
}

// Initialize on module load (non-blocking)
initAppStore().catch(() => {
  // Already handled inside initAppStore
});
