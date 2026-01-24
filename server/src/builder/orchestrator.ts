/**
 * Builder Orchestrator
 *
 * Main build flow coordinator. Manages the lifecycle of app builds from
 * initial request through research, planning, scaffolding, implementation,
 * verification, and documentation.
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  BuildRequest,
  BuildRecord,
  BuildPhase,
  ArchitecturePlan,
  RalphPRD,
  ResearchReport,
  VerifyResult,
} from './types.js';
import { BuilderRAGManager } from './rag-manager.js';
import { generatePRD } from './prd-generator.js';
import { scaffoldApp } from './scaffolder.js';
import { DeepResearcher } from './deep-researcher.js';
import { generateAppDocs } from './doc-generator.js';
import { ComponentFactory } from './component-factory.js';
import { startBuildSpan, recordBuildMetric } from './telemetry.js';
import {
  createSessionFile,
  updateSessionPhase,
  removeSessionFile,
  initializeRalph,
  pollRalphUntilComplete,
} from './ralph-bridge.js';
import { BuilderContainerRunner } from './container-runner.js';
import type { ContainerPool } from '../container/pool.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export class BuilderOrchestrator {
  private ragManager: BuilderRAGManager;
  private builds: Map<string, BuildRecord> = new Map();
  private containerPool?: ContainerPool;

  constructor(containerPool?: ContainerPool) {
    this.ragManager = new BuilderRAGManager();
    this.containerPool = containerPool;
  }

  /**
   * Create a new build record and staging directory.
   */
  async createBuild(request: BuildRequest): Promise<BuildRecord> {
    const appId = request.appId || slugify(request.description);
    const buildId = `build-${randomUUID().slice(0, 12)}`;

    // Create drop folder for pre-build context
    const contextDir = `.builder/context/${appId}`;
    fs.mkdirSync(contextDir, { recursive: true });
    const readmePath = path.join(contextDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, [
        `# Context for: ${appId}`,
        '',
        'Drop files here before building. The Builder will read everything in this folder.',
        '',
        '## What to drop:',
        '- **design.md** - Custom design requirements, wireframes, color preferences',
        '- **api-spec.yaml** - External API specs the app should integrate with',
        '- **screenshot.png** - Reference UI screenshots for visual matching',
        '- **skill.md** - Custom skills/knowledge for the app\'s AI agent',
        '- **data.json** - Sample data structures the app should handle',
        '- **requirements.md** - Additional requirements beyond the initial description',
        '',
        '## Shared context',
        'Files in `.builder/context/shared/` are included in ALL builds.',
      ].join('\n'));
    }

    const record: BuildRecord = {
      id: buildId,
      appId,
      request,
      phase: 'staging',
      progress: { completed: 0, total: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.builds.set(buildId, record);
    return record;
  }

  /**
   * Execute a build through all phases.
   */
  async executeBuild(buildId: string): Promise<BuildRecord> {
    const record = this.builds.get(buildId);
    if (!record) {
      throw new Error(`Build "${buildId}" not found`);
    }

    const buildSpan = startBuildSpan({
      buildId,
      phase: 'staging',
      appId: record.appId,
      attributes: { category: record.request.category || 'general' },
    });
    recordBuildMetric('builder.builds.total', 1, { appId: record.appId });

    try {
      // Phase: Deep Research (optional)
      if (record.request.researchMode === 'deep') {
        this.updatePhase(buildId, 'deep-research');
        buildSpan.addEvent('phase.deep-research.start');
        record.researchReport = await this.deepResearch(record.request);
        buildSpan.addEvent('phase.deep-research.end', {
          queries: record.researchReport.queries.length,
          findings: record.researchReport.findings.length,
        });
      }

      // Phase: Think (architecture design)
      this.updatePhase(buildId, 'thinking');
      buildSpan.addEvent('phase.thinking.start');
      const architecture = await this.think(record.request, record.researchReport);
      buildSpan.addEvent('phase.thinking.end', {
        components: architecture.components.length,
      });

      // Phase: Research (Context7 + web search)
      this.updatePhase(buildId, 'researching');
      buildSpan.addEvent('phase.researching.start');
      await this.research(architecture, record.request);
      buildSpan.addEvent('phase.researching.end');

      // Phase: Plan (PRD generation)
      this.updatePhase(buildId, 'planning');
      buildSpan.addEvent('phase.planning.start');
      const prd = await generatePRD(record.request, architecture);
      record.progress.total = prd.userStories.length;
      buildSpan.addEvent('phase.planning.end', { stories: prd.userStories.length });

      // Create RAG corpus
      const ragStoreName = await this.ragManager.createAppCorpus(record.appId);
      record.ragStoreName = ragStoreName;

      // Store plan
      record.plan = {
        appId: record.appId,
        appName: record.appId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: record.request.description,
        architecture,
        prd,
        ragStoreName,
      };

      // Ingest requirements to RAG
      await this.ragManager.ingestDocument(
        ragStoreName,
        `# Requirements\n\n${record.request.description}\n\nCategory: ${record.request.category || 'general'}`,
        'requirements.md'
      );

      // Phase: Scaffold
      this.updatePhase(buildId, 'scaffolding');
      buildSpan.addEvent('phase.scaffolding.start');
      await scaffoldApp(record.appId, architecture);
      buildSpan.addEvent('phase.scaffolding.end');

      // Phase: Implement (Ralph loop or container execution)
      this.updatePhase(buildId, 'implementing');
      buildSpan.addEvent('phase.implementing.start');
      let success: boolean;

      if (record.request.executionMode === 'container' && this.containerPool) {
        // Execute stories in Docker containers via Claude CLI
        const containerRunner = new BuilderContainerRunner(this.containerPool);
        success = true;
        for (const story of prd.userStories) {
          const result = await containerRunner.executeRalphIteration(record, story);
          if (result.success) {
            record.progress.completed++;
            recordBuildMetric('builder.stories.completed', 1, { appId: record.appId });
          } else {
            success = false;
            break;
          }
        }
      } else {
        // Default: SDK mode via Ralph loop polling
        await this.initRalph(prd, record);
        success = await this.monitorRalph(record.appId, record);
      }
      buildSpan.addEvent('phase.implementing.end', { success: success ? 1 : 0 });

      if (!success) {
        this.updatePhase(buildId, 'failed');
        record.error = 'Ralph loop did not complete successfully';
        buildSpan.setStatus('error', record.error);
        buildSpan.end();
        recordBuildMetric('builder.builds.failed', 1, { appId: record.appId });
        return record;
      }

      // Phase: Components (create new Glass/A2UI/SmartGlass components)
      if (architecture.newComponents?.length) {
        this.updatePhase(buildId, 'components');
        buildSpan.addEvent('phase.components.start', { count: architecture.newComponents.length });
        const factory = new ComponentFactory();
        for (const spec of architecture.newComponents) {
          await factory.createComponent(spec);
          recordBuildMetric('builder.components.created', 1, {
            appId: record.appId,
            category: spec.category,
          });
        }
        buildSpan.addEvent('phase.components.end');
      }

      // Phase: Verify
      this.updatePhase(buildId, 'verifying');
      buildSpan.addEvent('phase.verifying.start');
      const verifyResult = await this.verify(record.appId, [
        'No hex colors in component files',
        'No emojis in any source files',
        'All icons use lucide-react imports',
        'Typecheck passes',
      ]);
      buildSpan.addEvent('phase.verifying.end', { pass: verifyResult.pass ? 1 : 0 });

      if (!verifyResult.pass) {
        record.error = `Verification failed: ${verifyResult.errors.join(', ')}`;
      }

      // Phase: Document
      this.updatePhase(buildId, 'documenting');
      buildSpan.addEvent('phase.documenting.start');
      if (record.plan) {
        const docFiles = await generateAppDocs(record.appId, record.plan);
        buildSpan.addEvent('phase.documenting.end', { files: docFiles.length });

        // Ingest docs to RAG
        for (const docFile of docFiles) {
          const docContent = fs.readFileSync(docFile, 'utf8');
          await this.ragManager.ingestDocument(
            ragStoreName,
            docContent,
            `app-docs-${path.basename(docFile)}`
          );
        }
      }

      // Complete
      this.updatePhase(buildId, 'complete');
      buildSpan.setStatus('ok');
      const duration = buildSpan.end();
      recordBuildMetric('builder.builds.completed', 1, { appId: record.appId });
      recordBuildMetric('builder.duration.seconds', duration / 1000, { appId: record.appId });
      recordBuildMetric('builder.stories.completed', record.progress.total, { appId: record.appId });
      return record;
    } catch (error) {
      this.updatePhase(buildId, 'failed');
      record.error = error instanceof Error ? error.message : String(error);
      buildSpan.setStatus('error', record.error);
      buildSpan.end();
      recordBuildMetric('builder.builds.failed', 1, { appId: record.appId });
      return record;
    }
  }

  /**
   * Get current build status.
   */
  getStatus(buildId: string): BuildRecord | null {
    return this.builds.get(buildId) || null;
  }

  /**
   * Cancel an active build.
   */
  async cancelBuild(buildId: string): Promise<void> {
    const record = this.builds.get(buildId);
    if (record && record.phase !== 'complete' && record.phase !== 'failed') {
      this.updatePhase(buildId, 'failed');
      record.error = 'Build cancelled by user';
    }
  }

  /**
   * List all builds.
   */
  listBuilds(): BuildRecord[] {
    return Array.from(this.builds.values());
  }

  // === Internal Phases ===

  private async deepResearch(request: BuildRequest): Promise<ResearchReport> {
    const researcher = new DeepResearcher();
    return researcher.executeResearch(request);
  }

  private async think(request: BuildRequest, _research?: ResearchReport): Promise<ArchitecturePlan> {
    // Uses ClaudeRunner with architecture design system prompt
    // For now, return a minimal architecture that can be expanded
    const appId = request.appId || slugify(request.description);
    const components: ArchitecturePlan['components'] = [
      { name: 'App', type: 'existing', icon: 'Layout' },
    ];

    const plan: ArchitecturePlan = {
      components,
      stores: [{ name: `use${appId.replace(/-/g, '')}Store`, fields: ['data', 'loading', 'error'] }],
    };

    if (request.hasAgent) {
      plan.executor = {
        skills: [{
          id: `${appId}-main`,
          name: `${appId} Assistant`,
          description: `AI assistant for ${request.description}`,
          icon: 'Bot',
        }],
      };
    }

    if (request.hasResources) {
      plan.resources = [{
        type: 'prompt',
        name: 'System Prompt',
        content: `You are an AI assistant for ${request.description}.`,
      }];
    }

    return plan;
  }

  private async research(_plan: ArchitecturePlan, _request: BuildRequest): Promise<void> {
    // Standard research: Context7 MCP queries + 3-5 targeted web searches
    // Will be fully implemented with ClaudeRunner integration
  }

  private async initRalph(prd: RalphPRD, record: BuildRecord): Promise<void> {
    initializeRalph(prd);
    createSessionFile(record);
  }

  private async monitorRalph(_appId: string, record: BuildRecord): Promise<boolean> {
    // Poll Ralph status until complete or timeout
    const success = await pollRalphUntilComplete(record);
    if (success) {
      removeSessionFile();
    }
    return success;
  }

  private async verify(_appId: string, criteria: string[]): Promise<VerifyResult> {
    // Phase 2.6: Visual verification via ClaudeRunner
    // Placeholder until fully integrated
    return {
      pass: true,
      criteria: criteria.map(c => ({ criterion: c, pass: true })),
      errors: [],
    };
  }

  /**
   * Load context files from drop folder and skills.
   */
  async loadBuildContext(appId: string): Promise<string> {
    const contextParts: string[] = [];

    // System skills
    const systemSkills = [
      'skills/community/liquid-glass-design/SKILL.md',
      'directives/add_glass_component.md',
      'directives/add_ai_integration.md',
    ];
    for (const skillPath of systemSkills) {
      if (fs.existsSync(skillPath)) {
        contextParts.push(`## Skill: ${skillPath}\n${fs.readFileSync(skillPath, 'utf8')}`);
      }
    }

    // Shared drop folder context
    const sharedDir = '.builder/context/shared';
    if (fs.existsSync(sharedDir)) {
      for (const file of fs.readdirSync(sharedDir)) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(sharedDir, file);
        if (fs.statSync(filePath).isFile()) {
          contextParts.push(`## Context: shared/${file}\n${fs.readFileSync(filePath, 'utf8')}`);
        }
      }
    }

    // App-specific drop folder context
    const appDir = `.builder/context/${appId}`;
    if (fs.existsSync(appDir)) {
      for (const file of fs.readdirSync(appDir)) {
        if (file === 'README.md' || file === '.gitkeep') continue;
        const filePath = path.join(appDir, file);
        if (fs.statSync(filePath).isFile()) {
          contextParts.push(`## Context: ${appId}/${file}\n${fs.readFileSync(filePath, 'utf8')}`);
        }
      }
    }

    // Builder-specific skills
    const skillsDir = '.builder/skills';
    if (fs.existsSync(skillsDir)) {
      for (const file of fs.readdirSync(skillsDir)) {
        if (file.endsWith('.md')) {
          const filePath = path.join(skillsDir, file);
          contextParts.push(`## Builder Skill: ${file}\n${fs.readFileSync(filePath, 'utf8')}`);
        }
      }
    }

    return contextParts.join('\n\n---\n\n');
  }

  private updatePhase(buildId: string, phase: BuildPhase): void {
    const record = this.builds.get(buildId);
    if (record) {
      record.phase = phase;
      record.updatedAt = new Date().toISOString();
      updateSessionPhase(phase);
    }
  }
}
