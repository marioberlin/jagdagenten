export type ResourceType = 'prompts' | 'memory' | 'context' | 'knowledge' | 'artifacts' | 'skills' | 'mcp';
export type TargetType = 'app' | 'agent' | 'misc';

export interface AITarget {
  type: TargetType;
  id: string;
  name: string;
  icon?: string;
}

export interface ResourceItem {
  id: string;
  content: string;
  addedAt: number;
  metadata?: Record<string, any>;
}

export interface ResourceConfig {
  id: ResourceType;
  label: string;
  icon: string;
}

export const RESOURCE_TYPES: ResourceConfig[] = [
  { id: 'prompts', label: 'Prompts', icon: 'MessageSquare' },
  { id: 'memory', label: 'Memory', icon: 'Brain' },
  { id: 'context', label: 'Context', icon: 'BrainCircuit' },
  { id: 'knowledge', label: 'Knowledge', icon: 'BookOpen' },
  { id: 'artifacts', label: 'Artifacts', icon: 'Package' },
  { id: 'skills', label: 'Skills', icon: 'Zap' },
  { id: 'mcp', label: 'MCP Tools', icon: 'Wrench' },
];

export function getStorageKey(resource: ResourceType, target: AITarget): string {
  return `liquid_${resource}_${target.type}_${target.id}`;
}

export function getStoredItems(resource: ResourceType, target: AITarget): ResourceItem[] {
  const key = getStorageKey(resource, target);
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export function setStoredItems(resource: ResourceType, target: AITarget, items: ResourceItem[]): void {
  const key = getStorageKey(resource, target);
  localStorage.setItem(key, JSON.stringify(items));
}
