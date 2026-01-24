/**
 * Documentation Generator
 *
 * Generates per-app documentation and suggests project-wide doc updates
 * after successful builds.
 */

import fs from 'fs';
import path from 'path';
import type { BuildPlan, DocUpdateSuggestion } from './types.js';

/**
 * Generate documentation files for a built app.
 */
export async function generateAppDocs(appId: string, plan: BuildPlan): Promise<string[]> {
  const docsDir = `src/applications/${appId}/docs`;
  fs.mkdirSync(docsDir, { recursive: true });
  const createdFiles: string[] = [];

  // README.md
  const readme = buildReadme(appId, plan);
  const readmePath = path.join(docsDir, 'README.md');
  fs.writeFileSync(readmePath, readme);
  createdFiles.push(readmePath);

  // ARCHITECTURE.md
  const arch = buildArchitectureDoc(appId, plan);
  const archPath = path.join(docsDir, 'ARCHITECTURE.md');
  fs.writeFileSync(archPath, arch);
  createdFiles.push(archPath);

  // API.md (if app has executor)
  if (plan.architecture.executor) {
    const api = buildApiDoc(appId, plan);
    const apiPath = path.join(docsDir, 'API.md');
    fs.writeFileSync(apiPath, api);
    createdFiles.push(apiPath);
  }

  // CHANGELOG.md
  const changelog = buildChangelog(appId, plan);
  const changelogPath = path.join(docsDir, 'CHANGELOG.md');
  fs.writeFileSync(changelogPath, changelog);
  createdFiles.push(changelogPath);

  return createdFiles;
}

/**
 * Suggest project-wide documentation updates after a build.
 */
export function suggestDocUpdates(appId: string, plan: BuildPlan): DocUpdateSuggestion[] {
  const suggestions: DocUpdateSuggestion[] = [];

  // CLAUDE.md — LiquidMind resources
  if (plan.architecture.resources?.length) {
    suggestions.push({
      filePath: 'CLAUDE.md',
      reason: `New app "${appId}" uses LiquidMind resources`,
      proposedChange: `| \`${appId}\` | ${plan.appName} | ${plan.architecture.resources.map(r => r.type).join(', ')} |`,
      section: 'LiquidMind: AI Resource Management',
      priority: 'recommended',
    });
  }

  // CLAUDE.md — A2A executor
  if (plan.architecture.executor) {
    const skillIds = plan.architecture.executor.skills.map(s => s.id).join(', ');
    suggestions.push({
      filePath: 'CLAUDE.md',
      reason: `New A2A executor "${appId}" registered`,
      proposedChange: `New A2A executor at server/src/a2a/executors/${appId}.ts with skills: ${skillIds}`,
      section: 'Summary',
      priority: 'recommended',
    });
  }

  // System documentation
  suggestions.push({
    filePath: 'docs/SYSTEM_DOCUMENTATION.md',
    reason: `New app "${appId}" added to the system`,
    proposedChange: [
      `## ${plan.appName}`,
      '',
      plan.description,
      '',
      `Files: src/applications/${appId}/`,
      `Executor: ${plan.architecture.executor ? `server/src/a2a/executors/${appId}.ts` : 'None'}`,
    ].join('\n'),
    section: 'Applications',
    priority: 'optional',
  });

  return suggestions;
}

function buildReadme(appId: string, plan: BuildPlan): string {
  const lines: string[] = [
    `# ${plan.appName}`,
    '',
    plan.description,
    '',
    '## Quick Start',
    '',
    'This app loads automatically in LiquidOS when the dock entry is enabled.',
    '',
    '## Architecture',
    '',
    `- **Entry**: \`src/applications/${appId}/App.tsx\``,
    `- **Components**: \`src/applications/${appId}/components/\``,
  ];

  if (plan.architecture.stores?.length) {
    lines.push(`- **State**: ${plan.architecture.stores.map(s => s.name).join(', ')}`);
  }

  if (plan.architecture.executor) {
    lines.push(`- **Executor**: \`server/src/a2a/executors/${appId}.ts\``);
    lines.push(`- **Skills**: ${plan.architecture.executor.skills.map(s => s.name).join(', ')}`);
  }

  if (plan.architecture.resources?.length) {
    lines.push('', '## LiquidMind Resources', '');
    for (const r of plan.architecture.resources) {
      lines.push(`- **${r.name}** (${r.type})`);
    }
  }

  lines.push('', '## Design System', '', 'This app follows the Liquid Glass design system:', '- Semantic tokens only (no hex colors)', '- lucide-react icons exclusively (no emojis)', '- Glass* component primitives', '');

  return lines.join('\n');
}

function buildArchitectureDoc(_appId: string, plan: BuildPlan): string {
  const lines: string[] = [
    `# ${plan.appName} — Architecture`,
    '',
    '## Component Hierarchy',
    '',
    '```',
    `App.tsx`,
    `└── ${plan.appName}App.tsx`,
  ];

  for (const comp of plan.architecture.components) {
    lines.push(`    ├── ${comp.name} (${comp.type})`);
  }

  lines.push('```', '');

  if (plan.architecture.stores?.length) {
    lines.push('## State Management', '');
    for (const store of plan.architecture.stores) {
      lines.push(`### ${store.name}`, '', `Fields: ${store.fields.join(', ')}`, '');
    }
  }

  if (plan.architecture.executor) {
    lines.push('## A2A Executor', '', `The executor handles incoming A2A messages and routes to skills:`, '');
    for (const skill of plan.architecture.executor.skills) {
      lines.push(`- **${skill.name}** — ${skill.description}`);
    }
    lines.push('');
  }

  lines.push('## Data Flow', '', '```', 'User Action → Component → Store → A2A Message → Executor → Response → A2UI Render', '```', '');

  return lines.join('\n');
}

function buildApiDoc(_appId: string, plan: BuildPlan): string {
  if (!plan.architecture.executor) return '';

  const lines: string[] = [
    `# ${plan.appName} — API`,
    '',
    '## Agent Card',
    '',
    `Endpoint: \`/.well-known/agent-card.json\``,
    '',
    '## Skills',
    '',
  ];

  for (const skill of plan.architecture.executor.skills) {
    lines.push(`### ${skill.name}`, '', `- **ID**: \`${skill.id}\``, `- **Description**: ${skill.description}`, `- **Icon**: ${skill.icon}`, '');
  }

  lines.push('## Message Format', '', '```json', '{', '  "role": "user",', '  "parts": [{ "kind": "text", "text": "your message" }]', '}', '```', '');

  return lines.join('\n');
}

function buildChangelog(_appId: string, plan: BuildPlan): string {
  const date = new Date().toISOString().split('T')[0];
  return [
    `# ${plan.appName} — Changelog`,
    '',
    `## ${date} — Initial Build`,
    '',
    `- Created app scaffold (manifest, App.tsx, components)`,
    `- Components: ${plan.architecture.components.map(c => c.name).join(', ')}`,
    plan.architecture.executor ? `- A2A executor with ${plan.architecture.executor.skills.length} skills` : '',
    plan.architecture.resources?.length ? `- LiquidMind resources: ${plan.architecture.resources.map(r => r.name).join(', ')}` : '',
    `- Stories completed: ${plan.prd.userStories.length}`,
    '',
  ].filter(Boolean).join('\n');
}
