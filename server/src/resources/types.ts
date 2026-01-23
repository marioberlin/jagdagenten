/**
 * Unified AI Resource Management System - Types
 *
 * Core type definitions for the resource system that consolidates
 * prompts, memory, context, knowledge, artifacts, skills, and MCP tools.
 *
 * Inspired by MemOS MemCube architecture: each resource is a self-contained
 * unit carrying content, metadata, provenance, and lifecycle state.
 */

// ============================================================================
// Core Enums & Unions
// ============================================================================

export type ResourceType = 'prompt' | 'memory' | 'context' | 'knowledge' | 'artifact' | 'skill' | 'mcp';
export type OwnerType = 'app' | 'agent' | 'system' | 'user';
export type SharePermission = 'read' | 'write' | 'copy';
export type Provenance = 'user_input' | 'agent_generated' | 'extracted' | 'consolidated' | 'imported';
export type DependencyType = 'requires' | 'extends' | 'overrides' | 'consolidated_from';

// ============================================================================
// Core Resource Interface
// ============================================================================

export interface AIResource {
  id: string;
  resourceType: ResourceType;
  ownerType: OwnerType;
  ownerId?: string;
  name: string;
  description?: string;
  content?: string;
  parts: ResourcePart[];
  typeMetadata: TypeMetadata;
  version: number;
  parentId?: string;
  isActive: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  provenance: Provenance;
  usageFrequency: number;
  syncToFile: boolean;
}

export type ResourcePart =
  | { type: 'text'; text: string }
  | { type: 'file'; file: { uri?: string; bytes?: string; mimeType?: string; name?: string } }
  | { type: 'data'; data: Record<string, unknown> };

// ============================================================================
// Type-Discriminated Metadata
// ============================================================================

export type TypeMetadata =
  | PromptMetadata
  | MemoryMetadata
  | ContextMetadata
  | KnowledgeMetadata
  | ArtifactMetadata
  | SkillMetadata
  | MCPMetadata;

export interface PromptMetadata {
  type: 'prompt';
  template: string;
  variables: string[];
  currentVersion?: string;
  analytics?: {
    usageCount: number;
    avgResponseTime: number;
    lastUsed?: string;
  };
}

export interface MemoryMetadata {
  type: 'memory';
  layer: 'working' | 'short_term' | 'long_term';
  importance: number; // 0.0 - 1.0
  expiresAt?: string;
  sourceSessionId?: string;
  consolidatedFrom?: string[]; // IDs of memories this was fused from
  entityRelations?: Array<{ entity: string; relation: string; target: string }>;
}

export interface ContextMetadata {
  type: 'context';
  strategy: 'flat' | 'tree';
  priority: number; // Higher = more important
  parentContextId?: string;
  contextType: 'global' | 'page' | 'component' | 'user';
  valueType: 'string' | 'json' | 'computed';
}

export interface KnowledgeMetadata {
  type: 'knowledge';
  sourceType: 'file' | 'url' | 'input' | 'rag';
  mimeType?: string;
  ragStoreId?: string;
  fileSize?: number;
  indexedAt?: string;
  parsedAt?: string;
  transformedAt?: string;
  summary?: string;
  entities?: Array<{ name: string; type: string }>;
  qaSnippets?: Array<{ question: string; answer: string }>;
  topics?: string[];
  citations?: Array<{ uri?: string; title?: string }>;
}

export interface ArtifactMetadata {
  type: 'artifact';
  category: string;
  taskId?: string;
  contextId?: string;
  artifactId?: string; // Reference to existing a2a_artifacts
  extensions?: string[];
  isStreaming?: boolean;
  isComplete?: boolean;
}

export interface SkillMetadata {
  type: 'skill';
  triggers: string[];
  toolNames: string[];
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
}

export interface MCPMetadata {
  type: 'mcp';
  serverUrl: string;
  transport: 'sse' | 'stdio' | 'http';
  capabilities: string[];
  isConnected?: boolean;
}

// ============================================================================
// Sharing
// ============================================================================

export interface ResourceShare {
  id: string;
  resourceId: string;
  targetType: OwnerType;
  targetId: string;
  permission: SharePermission;
  sharedBy?: string;
  sharedAt: Date;
}

// ============================================================================
// Versioning
// ============================================================================

export interface ResourceVersion {
  id: string;
  resourceId: string;
  version: number;
  content?: string;
  parts?: ResourcePart[];
  typeMetadata?: TypeMetadata;
  changeDescription?: string;
  createdAt: Date;
}

// ============================================================================
// Dependencies
// ============================================================================

export interface ResourceDependency {
  id: string;
  resourceId: string;
  dependsOnId: string;
  dependencyType: DependencyType;
  createdAt: Date;
}

// ============================================================================
// Filters & Query Types
// ============================================================================

export interface ResourceFilters {
  resourceType?: ResourceType | ResourceType[];
  ownerType?: OwnerType;
  ownerId?: string;
  isActive?: boolean;
  isPinned?: boolean;
  tags?: string[];
  provenance?: Provenance;
  createdAfter?: Date;
  createdBefore?: Date;
  accessedAfter?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'accessed_at' | 'name' | 'importance' | 'usage_frequency';
  orderDir?: 'asc' | 'desc';
}

export interface ResourceSearchResult {
  resource: AIResource;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
    content?: string;
  };
}

// ============================================================================
// Context Compilation
// ============================================================================

export interface CompileOptions {
  tokenBudget?: number;       // Default: 8000
  currentQuery?: string;      // For task-fit scoring
  strategy?: 'flat' | 'tree';
  focusId?: string;           // For tree strategy pruning
  includeMarkdown?: boolean;  // Whether to read .ai/ files (default: true)
}

export interface CompiledContext {
  systemPrompt: string;
  tools: ToolDeclaration[];
  ragStoreIds: string[];
  workingMemory: string;
  markdownFiles: string[];
  tokenCount: number;
  budgetRemaining: number;
  deferredResources: string[];
  schedulingScores: Record<string, number>;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Memory Scheduling (MemOS-inspired)
// ============================================================================

export interface ScoredResource {
  resource: AIResource;
  score: number;
  tokenEstimate: number;
  dependencies: string[];
}

export interface SchedulingPolicy {
  importanceWeight: number;   // Default: 0.3
  taskFitWeight: number;      // Default: 0.4
  recencyWeight: number;      // Default: 0.15
  frequencyWeight: number;    // Default: 0.15
}

// ============================================================================
// Knowledge Pipeline (PTI)
// ============================================================================

export interface TransformedKnowledge {
  summary: string;
  entities: Array<{ name: string; type: string }>;
  qaSnippets: Array<{ question: string; answer: string }>;
  topics: string[];
}

export interface OwnerTarget {
  ownerType: OwnerType;
  ownerId: string;
}

// ============================================================================
// Store Interface
// ============================================================================

export interface ResourceStore {
  // CRUD
  create(resource: Omit<AIResource, 'id' | 'createdAt' | 'updatedAt' | 'accessedAt'>): Promise<AIResource>;
  get(id: string): Promise<AIResource | null>;
  update(id: string, updates: Partial<Pick<AIResource, 'name' | 'description' | 'content' | 'parts' | 'typeMetadata' | 'tags' | 'isPinned' | 'syncToFile'>>): Promise<AIResource>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Query
  list(filters?: ResourceFilters): Promise<AIResource[]>;
  search(query: string, filters?: ResourceFilters): Promise<ResourceSearchResult[]>;
  getByTarget(ownerType: OwnerType, ownerId: string, resourceType?: ResourceType): Promise<AIResource[]>;
  getResourcesForTarget(ownerType: OwnerType, ownerId: string): Promise<AIResource[]>;

  // Sharing
  share(resourceId: string, targetType: OwnerType, targetId: string, permission: SharePermission, sharedBy?: string): Promise<ResourceShare>;
  unshare(resourceId: string, targetType: OwnerType, targetId: string): Promise<void>;
  getShares(resourceId: string): Promise<ResourceShare[]>;
  getSharedWith(targetType: OwnerType, targetId: string): Promise<AIResource[]>;

  // Versioning
  getVersions(resourceId: string): Promise<ResourceVersion[]>;
  revertToVersion(resourceId: string, version: number): Promise<AIResource>;

  // Dependencies
  addDependency(resourceId: string, dependsOnId: string, type: DependencyType): Promise<ResourceDependency>;
  getDependencies(resourceId: string): Promise<ResourceDependency[]>;
  getDependents(resourceId: string): Promise<ResourceDependency[]>;

  // Lifecycle
  trackAccess(resourceId: string): Promise<void>;
  incrementUsageFrequency(resourceId: string): Promise<void>;

  // Stats
  count(filters?: ResourceFilters): Promise<number>;
}

// ============================================================================
// Events
// ============================================================================

export type ResourceEvent =
  | { type: 'created'; resource: AIResource }
  | { type: 'updated'; resource: AIResource; previousVersion: number }
  | { type: 'deleted'; id: string }
  | { type: 'shared'; resourceId: string; targetType: OwnerType; targetId: string }
  | { type: 'unshared'; resourceId: string; targetType: OwnerType; targetId: string }
  | { type: 'accessed'; id: string }
  | { type: 'consolidated'; newId: string; sourceIds: string[] }
  | { type: 'decayed'; id: string; newImportance: number }
  | { type: 'archived'; id: string };

export type ResourceEventListener = (event: ResourceEvent) => void;
