/**
 * Memory Lifecycle Services
 *
 * Three MemOS-inspired operators managing the full memory lifecycle:
 * 1. Decay: Importance-based aging
 * 2. Consolidation: Fusing related memories into abstractions
 * 3. Scheduling: Policy-aware selection for context compilation
 */

import type {
  AIResource,
  OwnerType,
  MemoryMetadata,
  ScoredResource,
  SchedulingPolicy,
  ResourceStore,
} from './types.js';
import type { PostgresResourceStore } from './postgres-store.js';

// ============================================================================
// 1. Memory Decay Service
// ============================================================================

export class MemoryDecayService {
  private store: PostgresResourceStore;
  private decayRate: number;       // Importance loss per hour
  private archiveThreshold: number; // Below this → auto-archive
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(store: PostgresResourceStore, options?: { decayRate?: number; archiveThreshold?: number }) {
    this.store = store;
    this.decayRate = options?.decayRate ?? 0.01;
    this.archiveThreshold = options?.archiveThreshold ?? 0.2;
  }

  /** Start the hourly decay job */
  start(intervalMs: number = 60 * 60 * 1000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.applyDecay().catch(err => {
        console.error('[MemoryDecay] Error:', err);
      });
    }, intervalMs);
    console.log('[MemoryDecay] Started hourly decay job');
  }

  /** Stop the decay job */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Apply decay to all eligible memories */
  async applyDecay(): Promise<{ archived: number; decayed: number }> {
    const memories = await this.store.getMemoriesForDecay();
    let archived = 0;
    let decayed = 0;

    const now = Date.now();

    for (const memory of memories) {
      const meta = memory.typeMetadata as MemoryMetadata;
      const hoursSinceAccess = (now - memory.accessedAt.getTime()) / (1000 * 60 * 60);
      const decay = this.decayRate * hoursSinceAccess;
      const newImportance = Math.max(0, (meta.importance || 0.5) - decay);

      if (newImportance < this.archiveThreshold) {
        await this.store.softDelete(memory.id);
        archived++;
      } else if (newImportance !== meta.importance) {
        await this.store.updateImportance(memory.id, newImportance);
        decayed++;
      }
    }

    if (archived > 0 || decayed > 0) {
      console.log(`[MemoryDecay] Decayed: ${decayed}, Archived: ${archived}`);
    }

    return { archived, decayed };
  }

  /** Boost importance when a memory is accessed */
  async onAccess(resourceId: string, boost: number = 0.1): Promise<void> {
    const resource = await this.store.get(resourceId);
    if (!resource || resource.resourceType !== 'memory') return;

    const meta = resource.typeMetadata as MemoryMetadata;
    const newImportance = Math.min(1.0, (meta.importance || 0.5) + boost);
    await this.store.updateImportance(resourceId, newImportance);
    await this.store.trackAccess(resourceId);
  }
}

// ============================================================================
// 2. Memory Consolidation Service
// ============================================================================

export class MemoryConsolidationService {
  private store: PostgresResourceStore;
  private consolidationThreshold: number; // Trigger when memory count exceeds this

  constructor(store: PostgresResourceStore, options?: { threshold?: number }) {
    this.store = store;
    this.consolidationThreshold = options?.threshold ?? 50;
  }

  /** Check if a target needs consolidation and perform it */
  async consolidateForTarget(ownerType: OwnerType, ownerId: string): Promise<{ consolidated: number }> {
    const count = await this.store.getMemoryCountForTarget(ownerType, ownerId);
    if (count < this.consolidationThreshold) {
      return { consolidated: 0 };
    }

    // Get long-term memories sorted by importance (lowest first)
    const memories = await this.store.getMemoriesForConsolidation(ownerType, ownerId);
    if (memories.length < 5) return { consolidated: 0 };

    // Group memories by similarity (simple: group by common words in name/content)
    const groups = this.groupBySimilarity(memories);
    let consolidated = 0;

    for (const group of groups) {
      if (group.length < 3) continue; // Only consolidate groups of 3+

      const fused = await this.fuseMemories(group, ownerType, ownerId);
      if (fused) {
        // Archive original memories
        for (const mem of group) {
          await this.store.softDelete(mem.id);
          // Track the consolidation dependency
          await this.store.addDependency(fused.id, mem.id, 'consolidated_from');
        }
        consolidated++;
      }
    }

    if (consolidated > 0) {
      console.log(`[MemoryConsolidation] Consolidated ${consolidated} groups for ${ownerType}/${ownerId}`);
    }

    return { consolidated };
  }

  /** Fuse multiple memories into a single consolidated resource */
  async fuseMemories(memories: AIResource[], ownerType: OwnerType, ownerId: string): Promise<AIResource | null> {
    if (memories.length === 0) return null;

    // Combine content
    const combinedContent = memories
      .map(m => m.content || m.name)
      .join('\n- ');

    // Average importance (with a slight boost for consolidation)
    const avgImportance = Math.min(1.0,
      memories.reduce((sum, m) => sum + ((m.typeMetadata as MemoryMetadata).importance || 0.5), 0) / memories.length + 0.1
    );

    const consolidated = await this.store.create({
      resourceType: 'memory',
      ownerType,
      ownerId,
      name: `Consolidated: ${memories[0].name.slice(0, 50)}... (+${memories.length - 1})`,
      description: `Consolidated from ${memories.length} memories`,
      content: `Summary of related memories:\n- ${combinedContent}`,
      parts: [],
      typeMetadata: {
        type: 'memory',
        layer: 'long_term',
        importance: avgImportance,
        consolidatedFrom: memories.map(m => m.id),
      } as MemoryMetadata,
      version: 1,
      isActive: true,
      isPinned: false,
      tags: ['consolidated'],
      provenance: 'consolidated',
      usageFrequency: 0,
      syncToFile: false,
    });

    return consolidated;
  }

  /** Expand a consolidated memory back to its constituents */
  async expandConsolidation(consolidatedId: string): Promise<AIResource[]> {
    const deps = await this.store.getDependencies(consolidatedId);
    const consolidated = deps.filter(d => d.dependencyType === 'consolidated_from');
    const originals: AIResource[] = [];

    for (const dep of consolidated) {
      const resource = await this.store.get(dep.dependsOnId);
      if (resource) {
        // Reactivate the original
        await this.store.update(dep.dependsOnId, {}); // triggers version bump
        originals.push(resource);
      }
    }

    return originals;
  }

  /** Simple grouping by word overlap (production: use embeddings) */
  private groupBySimilarity(memories: AIResource[]): AIResource[][] {
    const groups: AIResource[][] = [];
    const assigned = new Set<string>();

    for (const mem of memories) {
      if (assigned.has(mem.id)) continue;

      const group = [mem];
      assigned.add(mem.id);
      const words = new Set((mem.content || mem.name).toLowerCase().split(/\s+/).filter(w => w.length > 3));

      for (const other of memories) {
        if (assigned.has(other.id)) continue;
        const otherWords = (other.content || other.name).toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const overlap = otherWords.filter(w => words.has(w)).length;
        if (overlap >= 2) { // At least 2 common meaningful words
          group.push(other);
          assigned.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}

// ============================================================================
// 3. Memory Scheduler
// ============================================================================

export class MemoryScheduler {
  private policy: SchedulingPolicy;

  constructor(policy?: Partial<SchedulingPolicy>) {
    this.policy = {
      importanceWeight: 0.3,
      taskFitWeight: 0.4,
      recencyWeight: 0.15,
      frequencyWeight: 0.15,
      ...policy,
    };
  }

  /** Score resources for context inclusion */
  scoreForInclusion(resources: AIResource[], currentQuery?: string): ScoredResource[] {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    return resources
      .map(resource => {
        let importance = 0.5;
        if (resource.resourceType === 'memory') {
          importance = (resource.typeMetadata as MemoryMetadata).importance || 0.5;
        } else if (resource.isPinned) {
          importance = 1.0;
        }

        const age = now - resource.accessedAt.getTime();
        const recency = Math.max(0, 1 - (age / maxAge));
        const frequency = Math.min(1, Math.log2(resource.usageFrequency + 1) / 10);

        let taskFit = 0.5;
        if (currentQuery && resource.content) {
          const queryWords = new Set(currentQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2));
          const contentWords = (resource.content + ' ' + resource.name).toLowerCase().split(/\s+/);
          const overlap = contentWords.filter(w => queryWords.has(w)).length;
          taskFit = Math.min(1, overlap / Math.max(1, queryWords.size));
        }

        const score =
          (importance * this.policy.importanceWeight) +
          (taskFit * this.policy.taskFitWeight) +
          (recency * this.policy.recencyWeight) +
          (frequency * this.policy.frequencyWeight);

        return {
          resource,
          score,
          tokenEstimate: Math.ceil((resource.content || resource.name).length / 4),
          dependencies: [],
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /** Select resources within a token budget */
  selectForContext(
    scored: ScoredResource[],
    budget: number
  ): { included: AIResource[]; deferred: string[] } {
    const included: AIResource[] = [];
    const deferred: string[] = [];
    let usedTokens = 0;

    for (const item of scored) {
      if (usedTokens + item.tokenEstimate <= budget) {
        included.push(item.resource);
        usedTokens += item.tokenEstimate;
      } else {
        deferred.push(item.resource.id);
      }
    }

    return { included, deferred };
  }
}
