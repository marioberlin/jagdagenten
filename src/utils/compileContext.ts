/**
 * Client-Side Context Compiler
 *
 * Lightweight compilation from Zustand cache for instant UI responsiveness.
 * Uses simplified scoring (importance + recency only, no semantic task_fit).
 * Does NOT read markdown files (those are server-only).
 */

import type { AIResource, ResourceType } from '@/stores/resourceStore';

// ============================================================================
// Types
// ============================================================================

export interface ClientCompiledContext {
  systemPrompt: string;
  tools: ToolDeclaration[];
  ragStoreIds: string[];
  workingMemory: string;
  tokenCount: number;
  budgetRemaining: number;
  deferredResources: string[];
  includedResources: string[];
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CompileOptions {
  tokenBudget?: number;
  includeTypes?: ResourceType[];
  decayThreshold?: number;
}

// ============================================================================
// Token Estimation
// ============================================================================

function estimateTokens(text: string): number {
  // Rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Scoring (simplified client-side version)
// ============================================================================

function scoreResource(resource: AIResource): number {
  const now = Date.now();

  // Importance (from memory metadata)
  const importance = (resource.typeMetadata as any)?.importance ?? 0.5;

  // Recency: hours since last access, normalized to 0-1
  const accessedAt = new Date(resource.accessedAt).getTime();
  const hoursSinceAccess = (now - accessedAt) / (1000 * 60 * 60);
  const recency = Math.max(0, 1 - hoursSinceAccess / (24 * 7)); // Decays over 7 days

  // Frequency: normalized usage
  const frequency = Math.min(1, resource.usageFrequency / 100);

  // Pinned items get maximum priority
  if (resource.isPinned) return 1.0;

  // Weighted score (simplified: no task_fit on client)
  return importance * 0.4 + recency * 0.35 + frequency * 0.25;
}

// ============================================================================
// Layer Budget Allocation
// ============================================================================

interface LayerBudget {
  prompt: number;
  context: number;
  memory: number;
  knowledge: number;
  skills: number;
}

function allocateBudget(totalBudget: number): LayerBudget {
  return {
    prompt: Math.floor(totalBudget * 0.25),
    context: Math.floor(totalBudget * 0.125),
    memory: Math.floor(totalBudget * 0.25),
    knowledge: Math.floor(totalBudget * 0.25),
    skills: Math.floor(totalBudget * 0.125),
  };
}

// ============================================================================
// Main Compiler
// ============================================================================

/**
 * Compile resources into a context payload for the active target.
 * This is the lightweight client-side version for instant UI.
 */
export function compileContext(
  resources: AIResource[],
  options: CompileOptions = {}
): ClientCompiledContext {
  const {
    tokenBudget = 8000,
    includeTypes,
    decayThreshold = 0.2,
  } = options;

  const budget = allocateBudget(tokenBudget);
  const sections: string[] = [];
  const tools: ToolDeclaration[] = [];
  const ragStoreIds: string[] = [];
  const included: string[] = [];
  const deferred: string[] = [];
  let workingMemory = '';
  let totalTokens = 0;

  // Filter active resources
  let active = resources.filter((r) => r.isActive);
  if (includeTypes) {
    active = active.filter((r) => includeTypes.includes(r.resourceType));
  }

  // Filter out decayed memories
  active = active.filter((r) => {
    if (r.resourceType !== 'memory') return true;
    const importance = (r.typeMetadata as any)?.importance ?? 0.5;
    return importance >= decayThreshold || r.isPinned;
  });

  // Score and sort
  const scored = active
    .map((r) => ({ resource: r, score: scoreResource(r) }))
    .sort((a, b) => b.score - a.score);

  // Group by type
  const byType: Record<ResourceType, typeof scored> = {
    prompt: [],
    memory: [],
    context: [],
    knowledge: [],
    artifact: [],
    skill: [],
    mcp: [],
  };
  for (const item of scored) {
    byType[item.resource.resourceType].push(item);
  }

  // --- Layer 1: Prompts ---
  let promptTokens = 0;
  for (const { resource } of byType.prompt) {
    const content = resource.content || '';
    const tokens = estimateTokens(content);
    if (promptTokens + tokens <= budget.prompt) {
      sections.push(`## System Prompt: ${resource.name}\n${content}`);
      promptTokens += tokens;
      included.push(resource.id);
    } else {
      deferred.push(resource.id);
    }
  }

  // --- Layer 2: Context ---
  let contextTokens = 0;
  for (const { resource } of byType.context) {
    const content = resource.content || '';
    const tokens = estimateTokens(content);
    if (contextTokens + tokens <= budget.context) {
      sections.push(`## Context: ${resource.name}\n${content}`);
      contextTokens += tokens;
      included.push(resource.id);
    } else {
      deferred.push(resource.id);
    }
  }

  // --- Layer 3: Memory ---
  let memoryTokens = 0;
  const workingMemories: string[] = [];
  for (const { resource } of byType.memory) {
    const content = resource.content || '';
    const tokens = estimateTokens(content);
    const layer = (resource.typeMetadata as any)?.layer;

    if (layer === 'working') {
      workingMemories.push(content);
      included.push(resource.id);
      continue;
    }

    if (memoryTokens + tokens <= budget.memory) {
      sections.push(`## Memory: ${resource.name}\n${content}`);
      memoryTokens += tokens;
      included.push(resource.id);
    } else {
      deferred.push(resource.id);
    }
  }
  workingMemory = workingMemories.join('\n');

  // --- Layer 4: Knowledge ---
  let knowledgeTokens = 0;
  for (const { resource } of byType.knowledge) {
    // If knowledge has a RAG store, just pass the ID
    const ragId = (resource.typeMetadata as any)?.ragStoreId;
    if (ragId) {
      ragStoreIds.push(ragId);
      included.push(resource.id);
      continue;
    }

    const content = resource.content || '';
    const tokens = estimateTokens(content);
    if (knowledgeTokens + tokens <= budget.knowledge) {
      sections.push(`## Knowledge: ${resource.name}\n${content}`);
      knowledgeTokens += tokens;
      included.push(resource.id);
    } else {
      deferred.push(resource.id);
    }
  }

  // --- Layer 5: Skills → Tool Declarations ---
  for (const { resource } of byType.skill) {
    const meta = resource.typeMetadata as any;
    if (meta?.toolNames?.length) {
      tools.push({
        name: resource.name,
        description: resource.description || '',
        parameters: meta.parameters || {},
      });
      included.push(resource.id);
    }
  }

  // --- MCP: Add tool declarations ---
  for (const { resource } of byType.mcp) {
    const meta = resource.typeMetadata as any;
    if (meta?.capabilities?.length) {
      for (const cap of meta.capabilities) {
        tools.push({
          name: `${resource.name}/${cap}`,
          description: `MCP tool from ${resource.name}`,
          parameters: {},
        });
      }
      included.push(resource.id);
    }
  }

  // Compile final prompt
  const systemPrompt = sections.join('\n\n---\n\n');
  totalTokens = estimateTokens(systemPrompt) + estimateTokens(workingMemory);

  return {
    systemPrompt,
    tools,
    ragStoreIds,
    workingMemory,
    tokenCount: totalTokens,
    budgetRemaining: tokenBudget - totalTokens,
    deferredResources: deferred,
    includedResources: included,
  };
}
