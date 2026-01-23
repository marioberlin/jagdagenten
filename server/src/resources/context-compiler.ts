/**
 * Context Compiler (Server-side, Budget-Aware)
 *
 * Assembles AI resources into a compiled context for LLM inference.
 * Uses MemOS-inspired scheduling to prioritize resources within token budgets.
 */

import type {
  AIResource,
  OwnerType,
  CompileOptions,
  CompiledContext,
  ScoredResource,
  SchedulingPolicy,
  MemoryMetadata,
  ContextMetadata,
  KnowledgeMetadata,
  SkillMetadata,
  ToolDeclaration,
  ResourceStore,
} from './types.js';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_TOKEN_BUDGET = 8000;
const DEFAULT_POLICY: SchedulingPolicy = {
  importanceWeight: 0.3,
  taskFitWeight: 0.4,
  recencyWeight: 0.15,
  frequencyWeight: 0.15,
};

// Layer budget allocation (fractions of total)
const LAYER_BUDGETS = {
  prompt: 0.25,      // 2000 tokens
  context: 0.125,    // 1000 tokens
  memory: 0.25,      // 2000 tokens
  knowledge: 0.25,   // 2000 tokens
  learnings: 0.125,  // 1000 tokens
};

// Rough token estimate: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Context Compiler
// ============================================================================

export class ContextCompiler {
  private store: ResourceStore;
  private policy: SchedulingPolicy;

  constructor(store: ResourceStore, policy?: Partial<SchedulingPolicy>) {
    this.store = store;
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  async compile(
    ownerType: OwnerType,
    ownerId: string,
    options: CompileOptions = {}
  ): Promise<CompiledContext> {
    const tokenBudget = options.tokenBudget || DEFAULT_TOKEN_BUDGET;
    const strategy = options.strategy || 'flat';

    // 1. Fetch all resources for this target (owned + shared)
    const allResources = await this.store.getResourcesForTarget(ownerType, ownerId);

    // 2. Separate by type
    const prompts = allResources.filter(r => r.resourceType === 'prompt');
    const contexts = allResources.filter(r => r.resourceType === 'context');
    const memories = allResources.filter(r => r.resourceType === 'memory');
    const knowledge = allResources.filter(r => r.resourceType === 'knowledge');
    const skills = allResources.filter(r => r.resourceType === 'skill');

    // 3. Score all resources
    const scored = this.scoreResources(allResources, options.currentQuery);
    const schedulingScores: Record<string, number> = {};
    for (const s of scored) {
      schedulingScores[s.resource.id] = s.score;
    }

    // 4. Build each layer within budget
    const sections: string[] = [];
    const deferredResources: string[] = [];
    let totalTokens = 0;

    // Layer 1: System Prompt
    const promptBudget = Math.floor(tokenBudget * LAYER_BUDGETS.prompt);
    const promptSection = this.buildPromptSection(prompts, promptBudget);
    if (promptSection) {
      sections.push(promptSection.text);
      totalTokens += promptSection.tokens;
    }

    // Layer 2: Context
    const contextBudget = Math.floor(tokenBudget * LAYER_BUDGETS.context);
    const contextSection = this.buildContextSection(contexts, strategy, options.focusId, contextBudget);
    if (contextSection) {
      sections.push(contextSection.text);
      totalTokens += contextSection.tokens;
    }

    // Layer 3: Memory (scheduled by importance/recency/frequency)
    const memoryBudget = Math.floor(tokenBudget * LAYER_BUDGETS.memory);
    const memorySection = this.buildMemorySection(memories, memoryBudget, deferredResources);
    if (memorySection) {
      sections.push(memorySection.text);
      totalTokens += memorySection.tokens;
    }

    // Layer 4: Knowledge
    const knowledgeBudget = Math.floor(tokenBudget * LAYER_BUDGETS.knowledge);
    const knowledgeSection = this.buildKnowledgeSection(knowledge, knowledgeBudget, deferredResources);
    if (knowledgeSection) {
      sections.push(knowledgeSection.text);
      totalTokens += knowledgeSection.tokens;
    }

    // Layer 5: RAG store IDs
    const ragStoreIds = knowledge
      .filter(k => (k.typeMetadata as KnowledgeMetadata).ragStoreId)
      .map(k => (k.typeMetadata as KnowledgeMetadata).ragStoreId!);

    // Layer 6: Skills → Tools
    const tools = this.buildTools(skills);

    // Layer 7: Working memory (separate field)
    const workingMemory = memories
      .filter(m => (m.typeMetadata as MemoryMetadata).layer === 'working')
      .map(m => m.content || '')
      .join('\n');

    // Increment usage frequency for included resources
    const includedIds = allResources
      .filter(r => !deferredResources.includes(r.id))
      .map(r => r.id);
    for (const id of includedIds) {
      this.store.incrementUsageFrequency(id).catch(() => {});
    }

    // Compile markdown file paths (if enabled)
    const markdownFiles: string[] = [];
    if (options.includeMarkdown !== false) {
      markdownFiles.push(
        `.ai/${ownerId}/prompts.md`,
        `.ai/${ownerId}/knowledge.md`,
        `.ai/${ownerId}/learnings.md`,
        `.ai/shared/conventions.md`,
        `.ai/shared/preferences.md`
      );
    }

    return {
      systemPrompt: sections.join('\n\n---\n\n'),
      tools,
      ragStoreIds,
      workingMemory,
      markdownFiles,
      tokenCount: totalTokens,
      budgetRemaining: tokenBudget - totalTokens,
      deferredResources,
      schedulingScores,
    };
  }

  // --------------------------------------------------------------------------
  // Scoring (MemOS-inspired scheduling)
  // --------------------------------------------------------------------------

  private scoreResources(resources: AIResource[], currentQuery?: string): ScoredResource[] {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    return resources.map(resource => {
      // Importance (from metadata or default 0.5)
      let importance = 0.5;
      if (resource.resourceType === 'memory') {
        importance = (resource.typeMetadata as MemoryMetadata).importance || 0.5;
      } else if (resource.isPinned) {
        importance = 1.0;
      }

      // Recency (normalized 0-1, newer = higher)
      const age = now - resource.accessedAt.getTime();
      const recency = Math.max(0, 1 - (age / maxAge));

      // Frequency (normalized, log scale)
      const frequency = Math.min(1, Math.log2(resource.usageFrequency + 1) / 10);

      // Task fit (simplified: keyword overlap with current query)
      let taskFit = 0.5; // default neutral
      if (currentQuery && resource.content) {
        const queryWords = new Set(currentQuery.toLowerCase().split(/\s+/));
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
        tokenEstimate: estimateTokens(resource.content || resource.name),
        dependencies: [], // TODO: resolve from ai_resource_dependencies
      };
    }).sort((a, b) => b.score - a.score);
  }

  // --------------------------------------------------------------------------
  // Layer Builders
  // --------------------------------------------------------------------------

  private buildPromptSection(prompts: AIResource[], budget: number): { text: string; tokens: number } | null {
    if (prompts.length === 0) return null;

    // Use pinned prompt first, then highest priority
    const primary = prompts.find(p => p.isPinned) || prompts[0];
    const text = `## System Prompt\n${primary.content || primary.name}`;
    const tokens = estimateTokens(text);

    if (tokens > budget) {
      // Truncate to budget
      const truncated = text.slice(0, budget * 4);
      return { text: truncated, tokens: budget };
    }

    return { text, tokens };
  }

  private buildContextSection(
    contexts: AIResource[],
    strategy: 'flat' | 'tree',
    focusId: string | undefined,
    budget: number
  ): { text: string; tokens: number } | null {
    if (contexts.length === 0) return null;

    let filtered = contexts;

    if (strategy === 'tree' && focusId) {
      // Tree: only include global, user, and contexts on the path to focusId
      filtered = contexts.filter(c => {
        const meta = c.typeMetadata as ContextMetadata;
        return meta.contextType === 'global' || meta.contextType === 'user' || c.id === focusId;
      });
    }

    // Sort by priority
    filtered.sort((a, b) => {
      const aPriority = (a.typeMetadata as ContextMetadata).priority || 0;
      const bPriority = (b.typeMetadata as ContextMetadata).priority || 0;
      return bPriority - aPriority;
    });

    const lines: string[] = ['## Active Context'];
    let tokens = estimateTokens('## Active Context\n');

    for (const ctx of filtered) {
      const line = `- ${ctx.name}: ${ctx.content || ''}`;
      const lineTokens = estimateTokens(line);
      if (tokens + lineTokens > budget) break;
      lines.push(line);
      tokens += lineTokens;
    }

    if (lines.length <= 1) return null;
    return { text: lines.join('\n'), tokens };
  }

  private buildMemorySection(
    memories: AIResource[],
    budget: number,
    deferred: string[]
  ): { text: string; tokens: number } | null {
    // Filter out working memory (that goes in a separate field)
    const nonWorking = memories.filter(m =>
      (m.typeMetadata as MemoryMetadata).layer !== 'working'
    );

    if (nonWorking.length === 0) return null;

    // Sort by layer priority then importance
    const layerOrder: Record<string, number> = { short_term: 0, long_term: 1 };
    nonWorking.sort((a, b) => {
      const aLayer = (a.typeMetadata as MemoryMetadata).layer;
      const bLayer = (b.typeMetadata as MemoryMetadata).layer;
      const aOrder = layerOrder[aLayer] ?? 2;
      const bOrder = layerOrder[bLayer] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aImp = (a.typeMetadata as MemoryMetadata).importance || 0;
      const bImp = (b.typeMetadata as MemoryMetadata).importance || 0;
      return bImp - aImp;
    });

    const lines: string[] = ['## Memory'];
    let tokens = estimateTokens('## Memory\n');

    for (const mem of nonWorking) {
      const meta = mem.typeMetadata as MemoryMetadata;
      const line = `[${meta.layer}/${meta.importance?.toFixed(1) || '0.5'}] ${mem.content || mem.name}`;
      const lineTokens = estimateTokens(line);
      if (tokens + lineTokens > budget) {
        deferred.push(mem.id);
        continue;
      }
      lines.push(line);
      tokens += lineTokens;
    }

    if (lines.length <= 1) return null;
    return { text: lines.join('\n'), tokens };
  }

  private buildKnowledgeSection(
    knowledge: AIResource[],
    budget: number,
    deferred: string[]
  ): { text: string; tokens: number } | null {
    // Only include inline knowledge (not RAG-only items)
    const inline = knowledge.filter(k =>
      (k.typeMetadata as KnowledgeMetadata).sourceType !== 'rag' && k.content
    );

    if (inline.length === 0) return null;

    const lines: string[] = ['## Knowledge'];
    let tokens = estimateTokens('## Knowledge\n');

    for (const k of inline) {
      const section = `### ${k.name}\n${k.content}`;
      const sectionTokens = estimateTokens(section);
      if (tokens + sectionTokens > budget) {
        deferred.push(k.id);
        continue;
      }
      lines.push(section);
      tokens += sectionTokens;
    }

    if (lines.length <= 1) return null;
    return { text: lines.join('\n\n'), tokens };
  }

  private buildTools(skills: AIResource[]): ToolDeclaration[] {
    return skills.flatMap(skill => {
      const meta = skill.typeMetadata as SkillMetadata;
      return meta.toolNames.map(toolName => ({
        name: toolName,
        description: skill.description || skill.name,
        parameters: (meta.parameters || []).reduce((acc, p) => {
          acc[p.name] = { type: p.type, description: p.description };
          return acc;
        }, {} as Record<string, unknown>),
      }));
    });
  }
}
