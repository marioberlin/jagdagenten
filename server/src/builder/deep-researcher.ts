/**
 * Deep Researcher
 *
 * Performs extensive web research before finalizing a build plan.
 * Generates targeted queries across 8 categories, executes them,
 * and synthesizes findings into actionable recommendations.
 */

import type {
  BuildRequest,
  ResearchQuery,
  ResearchFinding,
  ResearchReport,
  SynthesizedRecommendation,
  LibraryRecommendation,
  ArchitecturePattern,
} from './types.js';

/**
 * Deep Research agent that gathers best practices, prior art,
 * and state-of-the-art approaches before planning.
 */
export class DeepResearcher {
  /**
   * Generate research queries based on the app description.
   * Produces 15-30 queries across 8 categories.
   */
  generateQueries(request: BuildRequest): ResearchQuery[] {
    const desc = request.description.toLowerCase();
    const queries: ResearchQuery[] = [];
    let priority = 10;

    // Best practices (always high priority)
    queries.push({
      query: `${request.description} React TypeScript best practices 2026`,
      category: 'best-practices',
      priority: priority--,
    });
    queries.push({
      query: `modern ${request.category || 'web'} app architecture patterns 2026`,
      category: 'best-practices',
      priority: priority--,
    });

    // Architecture patterns
    queries.push({
      query: `${request.description} component architecture React`,
      category: 'architecture',
      priority: priority--,
    });
    queries.push({
      query: `state management patterns for ${request.category || 'productivity'} apps`,
      category: 'architecture',
      priority: priority--,
    });

    // Libraries
    queries.push({
      query: `best React TypeScript libraries for ${request.description} 2026`,
      category: 'libraries',
      priority: priority--,
    });
    queries.push({
      query: `zustand vs jotai vs redux toolkit comparison 2026`,
      category: 'libraries',
      priority: priority--,
    });

    // Performance
    queries.push({
      query: `React performance optimization ${request.category || 'web'} app`,
      category: 'performance',
      priority: priority--,
    });

    // Accessibility
    queries.push({
      query: `WCAG accessibility ${request.category || 'web'} dashboard React`,
      category: 'accessibility',
      priority: priority--,
    });

    // Security
    if (request.hasAgent || desc.includes('api') || desc.includes('auth')) {
      queries.push({
        query: `security best practices ${request.description} web app`,
        category: 'security',
        priority: priority--,
      });
    }

    // Prior art
    queries.push({
      query: `open source ${request.description} React implementation`,
      category: 'prior-art',
      priority: priority--,
    });

    // Pitfalls
    queries.push({
      query: `common mistakes building ${request.category || 'web'} app React`,
      category: 'pitfalls',
      priority: priority--,
    });

    // Domain-specific queries
    if (desc.includes('real-time') || desc.includes('websocket') || desc.includes('live')) {
      queries.push(
        { query: 'WebSocket reconnection patterns React 2026', category: 'architecture', priority: 8 },
        { query: 'real-time data visualization performance React', category: 'performance', priority: 7 },
      );
    }

    if (desc.includes('chart') || desc.includes('dashboard') || desc.includes('visualization')) {
      queries.push(
        { query: 'React charting library comparison recharts visx nivo 2026', category: 'libraries', priority: 8 },
        { query: 'dashboard layout patterns responsive grid React', category: 'architecture', priority: 7 },
      );
    }

    if (desc.includes('crypto') || desc.includes('trading') || desc.includes('finance')) {
      queries.push(
        { query: 'financial data display patterns React precision numbers', category: 'best-practices', priority: 8 },
        { query: 'real-time price ticker WebSocket implementation', category: 'architecture', priority: 7 },
      );
    }

    if (desc.includes('chat') || desc.includes('ai') || desc.includes('agent')) {
      queries.push(
        { query: 'AI chat interface UX patterns streaming responses', category: 'best-practices', priority: 8 },
        { query: 'agent-to-agent protocol implementation patterns', category: 'architecture', priority: 7 },
      );
    }

    return queries.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute research and return a full report.
   * In the current implementation, this prepares the query structure
   * for ClaudeRunner to execute with web search tools.
   */
  async executeResearch(request: BuildRequest): Promise<ResearchReport> {
    const startTime = Date.now();
    const queries = this.generateQueries(request);

    // Placeholder findings — will be populated by ClaudeRunner with WebSearch
    const findings: ResearchFinding[] = [];
    const recommendations: SynthesizedRecommendation[] = [];
    const libraryRecs: LibraryRecommendation[] = [];
    const patterns: ArchitecturePattern[] = [];

    // Default recommendations based on the request
    recommendations.push({
      area: 'State Management',
      recommendation: 'Use Zustand for UI state, with separate stores per feature',
      rationale: 'Lightweight, TypeScript-first, minimal boilerplate',
      sources: [],
      confidence: 'medium',
    });

    recommendations.push({
      area: 'Component Architecture',
      recommendation: 'Compose with Glass* primitives, use semantic tokens exclusively',
      rationale: 'Consistent with LiquidOS design system, no hex colors',
      sources: [],
      confidence: 'high',
    });

    if (request.hasAgent) {
      recommendations.push({
        area: 'A2A Integration',
        recommendation: 'Implement executor with skill-based routing, use A2UI for rich responses',
        rationale: 'Standard LiquidOS pattern for agent-enabled apps',
        sources: [],
        confidence: 'high',
      });
    }

    // Default library recommendations
    libraryRecs.push({
      name: 'zustand',
      purpose: 'Client state management',
      version: '5.x',
      alternatives: ['jotai', '@tanstack/store'],
      reasoning: 'Used throughout LiquidOS, minimal API surface',
    });

    libraryRecs.push({
      name: 'lucide-react',
      purpose: 'Icon library (mandatory)',
      version: '0.400+',
      alternatives: [],
      reasoning: 'LiquidOS standard — no emojis allowed',
    });

    return {
      appDescription: request.description,
      queries,
      findings,
      synthesizedRecommendations: recommendations,
      libraryRecommendations: libraryRecs,
      architecturePatterns: patterns,
      pitfalls: [
        'Never use hex colors — use semantic tokens only',
        'Never use emojis — use lucide-react icons exclusively',
        'Always include typecheck in acceptance criteria',
        'Avoid over-fetching — paginate or virtualize large lists',
      ],
      totalSources: findings.length,
      researchDuration: Date.now() - startTime,
    };
  }

  /**
   * Build the research prompt for ClaudeRunner to execute with web tools.
   */
  buildResearchPrompt(request: BuildRequest): string {
    const queries = this.generateQueries(request);
    const queryList = queries
      .slice(0, 20)
      .map((q, i) => `${i + 1}. [${q.category}] ${q.query}`)
      .join('\n');

    return [
      `You are a research agent gathering best practices for building: "${request.description}"`,
      '',
      'Execute these web searches and synthesize the findings:',
      queryList,
      '',
      'For each finding, extract:',
      '- Source URL and title',
      '- 2-3 sentence summary',
      '- Actionable insights for implementation',
      '- Relevance score (0-1)',
      '',
      'Then synthesize into:',
      '1. Recommendations grouped by area (State Management, Data Fetching, UI, etc.)',
      '2. Library recommendations with versions and alternatives',
      '3. Architecture patterns with tradeoffs',
      '4. Common pitfalls to avoid',
      '',
      'Output valid JSON matching the ResearchReport schema.',
    ].join('\n');
  }
}
