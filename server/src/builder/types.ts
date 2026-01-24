/**
 * Builder Types
 *
 * All type definitions for the LiquidOS Builder system.
 */

export interface BuildRequest {
  description: string;
  appId?: string;
  category?: 'developer' | 'productivity' | 'finance' | 'media' | 'demo';
  hasAgent?: boolean;
  hasResources?: boolean;
  hasCustomComponents?: boolean;
  windowMode?: 'floating' | 'panel' | 'fullscreen';
  executionMode?: 'sdk' | 'container';
  researchMode?: 'standard' | 'deep';
  buildMode?: 'automatic' | 'review';
}

export interface BuildPlan {
  appId: string;
  appName: string;
  description: string;
  architecture: ArchitecturePlan;
  prd: RalphPRD;
  ragStoreName: string;
}

export interface ArchitecturePlan {
  components: ComponentSpec[];
  executor?: ExecutorSpec;
  resources?: ResourceSpec[];
  stores?: StoreSpec[];
  newComponents?: NewComponentSpec[];
}

export interface ComponentSpec {
  name: string;
  type: 'existing' | 'new-glass' | 'new-a2ui' | 'new-smartglass';
  props?: string[];
  icon?: string;
}

export interface ExecutorSpec {
  skills: SkillSpec[];
}

export interface SkillSpec {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ResourceSpec {
  type: string;
  name: string;
  content: string;
}

export interface StoreSpec {
  name: string;
  fields: string[];
}

export interface NewComponentSpec {
  name: string;
  category: 'glass' | 'a2ui' | 'smartglass';
  location: 'packages/ui/components' | 'src/components';
  subdir: string;
  props: PropSpec[];
  icon: string;
  description: string;
  hasStory: boolean;
  smartEnhancement?: 'summarize' | 'patterns' | 'anomalies' | 'insights';
}

export interface PropSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface RalphPRD {
  project: string;
  branchName: string;
  userStories: RalphStory[];
}

export interface RalphStory {
  id: string;
  title: string;
  description: string;
  priority: number;
  passes: boolean;
  acceptanceCriteria: string[];
}

export type BuildPhase =
  | 'staging'
  | 'deep-research'
  | 'thinking'
  | 'researching'
  | 'planning'
  | 'awaiting-review'
  | 'scaffolding'
  | 'implementing'
  | 'components'
  | 'storybook'
  | 'verifying'
  | 'documenting'
  | 'complete'
  | 'failed';

export interface BuildRecord {
  id: string;
  appId: string;
  request: BuildRequest;
  plan?: BuildPlan;
  phase: BuildPhase;
  progress: BuildProgress;
  ragStoreName?: string;
  sessionId?: string;
  researchReport?: ResearchReport;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface BuildProgress {
  completed: number;
  total: number;
  currentStory?: string;
}

// Research types
export interface ResearchQuery {
  query: string;
  category: ResearchCategory;
  priority: number;
}

export type ResearchCategory =
  | 'best-practices'
  | 'architecture'
  | 'libraries'
  | 'performance'
  | 'accessibility'
  | 'security'
  | 'prior-art'
  | 'pitfalls';

export interface ResearchFinding {
  source: string;
  title: string;
  category: ResearchCategory;
  summary: string;
  relevance: number;
  actionableInsights: string[];
  datePublished?: string;
}

export interface ResearchReport {
  appDescription: string;
  queries: ResearchQuery[];
  findings: ResearchFinding[];
  synthesizedRecommendations: SynthesizedRecommendation[];
  libraryRecommendations: LibraryRecommendation[];
  architecturePatterns: ArchitecturePattern[];
  pitfalls: string[];
  totalSources: number;
  researchDuration: number;
}

export interface SynthesizedRecommendation {
  area: string;
  recommendation: string;
  rationale: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface LibraryRecommendation {
  name: string;
  purpose: string;
  version: string;
  npmWeeklyDownloads?: number;
  lastUpdated?: string;
  alternatives: string[];
  reasoning: string;
}

export interface ArchitecturePattern {
  name: string;
  description: string;
  applicability: string;
  tradeoffs: string;
  example?: string;
}

// Verification types
export interface VerifyResult {
  pass: boolean;
  criteria: CriterionResult[];
  errors: string[];
}

export interface CriterionResult {
  criterion: string;
  pass: boolean;
  detail?: string;
}

// RAG management types
export interface PruneOptions {
  keepPinned?: boolean;
  maxIterations?: number;
  maxAge?: string;
  keepErrors?: boolean;
}

export interface PruneResult {
  deleted: number;
  kept: number;
  deletedNames: string[];
}

// Documentation types
export interface DocUpdateSuggestion {
  filePath: string;
  reason: string;
  proposedChange: string;
  section?: string;
  priority: 'required' | 'recommended' | 'optional';
}
