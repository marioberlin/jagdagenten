import type { AITarget } from './types';

export interface MiscComponent extends AITarget {
  type: 'misc';
  description: string;
  sourceFile: string;
}

export const MISC_COMPONENTS: MiscComponent[] = [
  { type: 'misc', id: 'guard-dog', name: 'GuardDog', icon: 'Shield', description: 'Security classifier', sourceFile: 'src/liquid-engine/security/GuardDogPrompt.ts' },
  { type: 'misc', id: 'decontextualizer', name: 'Decontextualizer', icon: 'Replace', description: 'Pronoun resolution', sourceFile: 'src/liquid-engine/nlweb/Decontextualizer.ts' },
  { type: 'misc', id: 'healer', name: 'Healer', icon: 'HeartPulse', description: 'Self-healing error analyzer', sourceFile: 'server/src/healer/prompts.ts' },
  { type: 'misc', id: 'project-assistant', name: 'Project Assistant', icon: 'FolderSearch', description: 'RAG + architecture', sourceFile: 'server/src/agents/project-assistant.ts' },
  { type: 'misc', id: 'orchestrator-specialists', name: 'Orchestrator Specialists', icon: 'Network', description: 'UI/API/Security/Test', sourceFile: 'server/src/orchestrator/specialists.ts' },
  { type: 'misc', id: 'smart-enhance', name: 'Smart Enhancement', icon: 'Sparkles', description: 'Card/table/chart/text', sourceFile: 'server/src/services/smart.ts' },
  { type: 'misc', id: 'trading-prompts', name: 'Trading Prompts', icon: 'TrendingUp', description: 'Versioned trading prompts', sourceFile: 'src/prompts/versions.ts' },
  { type: 'misc', id: 'nlweb', name: 'NLWeb', icon: 'MessageCircle', description: 'Conversation memory', sourceFile: 'src/liquid-engine/nlweb/NLWebOrchestrator.ts' },
  { type: 'misc', id: 'llm-router', name: 'LLM Router', icon: 'GitFork', description: 'Capability routing', sourceFile: 'src/services/LLMServiceRouter.ts' },
  { type: 'misc', id: 'file-search-rag', name: 'FileSearch RAG', icon: 'FileSearch', description: 'File-based RAG', sourceFile: 'server/src/services/fileSearchService.ts' },
  { type: 'misc', id: 'context-engine', name: 'Context Engine', icon: 'Layers', description: 'Readables context', sourceFile: 'src/liquid-engine/client.ts' },
  { type: 'misc', id: 'cowork-planner', name: 'Cowork Planner', icon: 'CalendarCheck', description: 'Multi-agent planning', sourceFile: 'server/src/cowork/planner.ts' },
];
