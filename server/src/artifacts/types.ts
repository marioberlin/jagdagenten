/**
 * Artifact Management Types
 *
 * Type definitions for the Artifact system which provides persistent storage,
 * versioning, search, and rich metadata for AI-generated outputs.
 */

import { v1 } from '@jagdagenten/a2a-sdk';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Stored artifact with database metadata
 */
export interface StoredArtifact extends v1.Artifact {
  /** Database primary key */
  id: string;
  /** Originating task ID */
  taskId: string;
  /** Context (conversation) ID */
  contextId: string;
  /** Artifact version number */
  version: number;
  /** Whether artifact is still receiving streamed parts */
  isStreaming: boolean;
  /** Whether artifact is complete */
  isComplete: boolean;
  /** Parent artifact ID for versioned copies */
  parentId?: string;
  /** Database timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Artifact reference for cross-task linking
 */
export interface ArtifactReference {
  id: string;
  sourceTaskId: string;
  targetArtifactId: string;
  referenceType: ReferenceType;
  createdAt: Date;
}

export type ReferenceType = 'input' | 'derived' | 'related';

/**
 * Artifact version history entry
 */
export interface ArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  parts: v1.Part[];
  createdAt: Date;
  changeDescription?: string;
}

/**
 * Artifact template for creating standardized artifacts
 */
export interface ArtifactTemplate {
  id: string;
  name: string;
  description?: string;
  category: ArtifactCategory;
  template: {
    parts: TemplatePart[];
    metadata?: Record<string, v1.JSONValue>;
  };
  schema?: Record<string, unknown>;
  createdAt: Date;
}

export type ArtifactCategory =
  | 'trading'
  | 'analysis'
  | 'report'
  | 'chart'
  | 'portfolio'
  | 'alert'
  | 'custom';

/**
 * Template part with placeholder support
 */
export type TemplatePart =
  | { type: 'text'; text: string }
  | { type: 'data'; data: Record<string, string> }
  | { type: 'a2ui'; a2ui: v1.Part[] }
  | { type: 'file'; fileTemplate: { name: string; mimeType: string } };

// ============================================================================
// Filter & Query Types
// ============================================================================

/**
 * Filters for artifact queries
 */
export interface ArtifactFilters {
  /** Filter by task ID */
  taskId?: string;
  /** Filter by context ID */
  contextId?: string;
  /** Filter by artifact name (partial match) */
  name?: string;
  /** Filter by A2A extensions */
  extensions?: string[];
  /** Filter by completion status */
  isComplete?: boolean;
  /** Filter by streaming status */
  isStreaming?: boolean;
  /** Created after date */
  createdAfter?: Date;
  /** Created before date */
  createdBefore?: Date;
  /** Filter by category (from metadata) */
  category?: ArtifactCategory;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  orderBy?: 'createdAt' | 'updatedAt' | 'name';
  /** Sort direction */
  orderDir?: 'asc' | 'desc';
}

/**
 * Search result with relevance score
 */
export interface ArtifactSearchResult {
  artifact: StoredArtifact;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
  };
}

// ============================================================================
// Registry Interface
// ============================================================================

/**
 * Artifact Registry interface for storage and retrieval
 */
export interface ArtifactRegistry {
  // CRUD Operations
  create(artifact: v1.Artifact, taskId: string, contextId: string): Promise<StoredArtifact>;
  get(id: string): Promise<StoredArtifact | null>;
  getByArtifactId(taskId: string, artifactId: string): Promise<StoredArtifact | null>;
  update(id: string, updates: Partial<Pick<v1.Artifact, 'parts' | 'name' | 'description' | 'metadata'>>): Promise<StoredArtifact>;
  delete(id: string): Promise<void>;

  // Streaming Support
  startStream(artifact: v1.Artifact, taskId: string, contextId: string): Promise<string>;
  appendChunk(id: string, parts: v1.Part[], isLast: boolean): Promise<void>;
  finalizeStream(id: string): Promise<StoredArtifact>;

  // Search & Query
  search(query: string, filters?: ArtifactFilters): Promise<ArtifactSearchResult[]>;
  list(filters?: ArtifactFilters): Promise<StoredArtifact[]>;
  listByTask(taskId: string): Promise<StoredArtifact[]>;
  listByContext(contextId: string, limit?: number): Promise<StoredArtifact[]>;
  getRecent(limit?: number): Promise<StoredArtifact[]>;

  // Versioning
  getHistory(id: string): Promise<ArtifactVersion[]>;
  createVersion(parentId: string, artifact: v1.Artifact): Promise<StoredArtifact>;
  revertToVersion(id: string, version: number): Promise<StoredArtifact>;

  // References
  addReference(sourceTaskId: string, targetArtifactId: string, type: ReferenceType): Promise<ArtifactReference>;
  getReferences(artifactId: string): Promise<ArtifactReference[]>;
  getReferencedBy(artifactId: string): Promise<ArtifactReference[]>;

  // Templates
  createFromTemplate(templateId: string, data: Record<string, unknown>, taskId: string, contextId: string): Promise<StoredArtifact>;
  listTemplates(category?: ArtifactCategory): Promise<ArtifactTemplate[]>;
  getTemplate(id: string): Promise<ArtifactTemplate | null>;

  // Cleanup
  deleteByTask(taskId: string): Promise<number>;
  deleteByContext(contextId: string): Promise<number>;

  // Statistics
  getStats(): Promise<ArtifactStats>;
}

/**
 * Artifact system statistics
 */
export interface ArtifactStats {
  totalCount: number;
  completeCount: number;
  streamingCount: number;
  byCategory: Record<ArtifactCategory, number>;
  oldestAt?: Date;
  newestAt?: Date;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Events emitted by the artifact system
 */
export type ArtifactEvent =
  | { type: 'created'; artifact: StoredArtifact }
  | { type: 'updated'; artifact: StoredArtifact }
  | { type: 'deleted'; id: string }
  | { type: 'stream_started'; id: string }
  | { type: 'stream_chunk'; id: string; chunkIndex: number }
  | { type: 'stream_completed'; artifact: StoredArtifact };

/**
 * Artifact event listener
 */
export type ArtifactEventListener = (event: ArtifactEvent) => void;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Artifact registry configuration
 */
export interface ArtifactRegistryConfig {
  /** PostgreSQL connection string */
  connectionString: string;
  /** Table name prefix (default: 'artifacts') */
  tablePrefix?: string;
  /** Enable full-text search (default: true) */
  enableSearch?: boolean;
  /** Maximum parts per artifact (default: 1000) */
  maxPartsPerArtifact?: number;
  /** Enable versioning (default: true) */
  enableVersioning?: boolean;
  /** Maximum versions to keep per artifact (default: 50) */
  maxVersions?: number;
}
