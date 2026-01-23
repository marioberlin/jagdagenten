/**
 * migrateLegacy.ts
 *
 * Migrates AI resources from localStorage to the PostgreSQL-backed API.
 * Reads all `liquid_*` localStorage keys, converts them to AIResource format,
 * POSTs to /api/resources/migrate-localStorage, and cleans up on success.
 */

const LEGACY_KEYS = [
  'liquid_prompts',
  'liquid_memory',
  'liquid_context',
  'liquid_knowledge',
  'liquid_artifacts',
  'liquid_skills',
  'liquid_mcp',
] as const;

interface LegacyItem {
  id?: string;
  content?: string;
  name?: string;
  target?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  tags?: string[];
}

interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: string[];
}

function keyToResourceType(key: string): string {
  const typeMap: Record<string, string> = {
    'liquid_prompts': 'prompt',
    'liquid_memory': 'memory',
    'liquid_context': 'context',
    'liquid_knowledge': 'knowledge',
    'liquid_artifacts': 'artifact',
    'liquid_skills': 'skill',
    'liquid_mcp': 'mcp',
  };
  return typeMap[key] || 'context';
}

function buildTypeMetadata(type: string, item: LegacyItem): Record<string, unknown> {
  switch (type) {
    case 'prompt':
      return { type: 'prompt', template: item.content || '', variables: [] };
    case 'memory':
      return { type: 'memory', layer: 'long_term', importance: 0.7 };
    case 'context':
      return { type: 'context', contextType: 'global', valueType: 'string', priority: 5 };
    case 'knowledge':
      return { type: 'knowledge', sourceType: 'input' };
    case 'skill':
      return { type: 'skill', triggers: [], toolNames: [] };
    case 'mcp':
      return { type: 'mcp', transport: 'stdio' };
    default:
      return { type };
  }
}

export async function migrateLegacyResources(): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, skipped: 0, errors: [] };
  const resourcesToMigrate: Array<Record<string, unknown>> = [];

  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const items: LegacyItem[] = Array.isArray(parsed) ? parsed : [parsed];
      const resourceType = keyToResourceType(key);

      for (const item of items) {
        if (!item.content && !item.name) {
          result.skipped++;
          continue;
        }

        resourcesToMigrate.push({
          resourceType,
          ownerType: item.targetType || 'app',
          ownerId: item.target || 'global',
          name: item.name || `Migrated ${resourceType}`,
          content: item.content || '',
          typeMetadata: { ...buildTypeMetadata(resourceType, item), ...(item.metadata || {}) },
          tags: item.tags || ['migrated'],
          provenance: 'user_input',
        });
      }
    } catch (err) {
      result.errors.push(`Failed to parse ${key}: ${err}`);
    }
  }

  if (resourcesToMigrate.length === 0) {
    return result;
  }

  // Bulk migrate via API
  try {
    const response = await fetch('/api/resources/migrate-localStorage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resources: resourcesToMigrate }),
    });

    if (response.ok) {
      const data = await response.json();
      result.migrated = data.migrated || resourcesToMigrate.length;

      // Clean up localStorage on success
      for (const key of LEGACY_KEYS) {
        localStorage.removeItem(key);
      }
      // Mark migration as complete
      localStorage.setItem('liquid_resources_migrated', new Date().toISOString());
    } else {
      const errText = await response.text();
      result.errors.push(`Migration API failed: ${errText}`);
    }
  } catch (err) {
    result.errors.push(`Network error during migration: ${err}`);
  }

  return result;
}

/** Check if migration has already been run */
export function isMigrationComplete(): boolean {
  return localStorage.getItem('liquid_resources_migrated') !== null;
}

/** Check if there's legacy data to migrate */
export function hasLegacyData(): boolean {
  return LEGACY_KEYS.some(key => localStorage.getItem(key) !== null);
}
