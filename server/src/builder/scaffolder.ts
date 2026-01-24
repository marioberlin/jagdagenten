/**
 * App Scaffolder
 *
 * Generates initial file structure for new apps without running through Ralph.
 * Creates manifest, entry component, and optional executor stub.
 */

import fs from 'fs';
import path from 'path';
import type { ArchitecturePlan } from './types.js';

function toTitleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s/g, '');
}

/**
 * Scaffold the initial file structure for a new app.
 */
export async function scaffoldApp(appId: string, plan: ArchitecturePlan): Promise<string[]> {
  const appDir = `src/applications/${appId}`;
  const createdFiles: string[] = [];

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(`${appDir}/components`, { recursive: true });

  // 1. manifest.json
  const manifest = {
    id: appId,
    name: toTitleCase(appId),
    version: '1.0.0',
    description: `LiquidOS application: ${appId}`,
    author: 'LiquidOS Builder',
    category: 'general',
    keywords: [appId],
    icon: plan.components[0]?.icon || 'Layout',
    entry: './App.tsx',
    window: {
      mode: 'floating',
      title: toTitleCase(appId),
      defaultSize: { width: 900, height: 600 },
      resizable: true,
    },
    integrations: {
      dock: { enabled: true },
      commandPalette: {
        commands: [
          { id: `open-${appId}`, label: `Open ${toTitleCase(appId)}`, category: 'Apps' },
        ],
      },
    },
    capabilities: plan.executor
      ? ['network:http', 'a2a:connect', 'ai:agent']
      : ['network:http'],
  };

  const manifestPath = path.join(appDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  createdFiles.push(manifestPath);

  // 2. App.tsx (entry point)
  const appName = toTitleCase(appId);
  const appTsx = [
    `import { ${appName}App } from './${appName}App';`,
    '',
    `export default ${appName}App;`,
    '',
  ].join('\n');

  const appTsxPath = path.join(appDir, 'App.tsx');
  fs.writeFileSync(appTsxPath, appTsx);
  createdFiles.push(appTsxPath);

  // 3. Main app component shell
  const mainComponent = [
    `import { Layout } from 'lucide-react';`,
    '',
    `export function ${appName}App() {`,
    '  return (',
    '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
    '      <div className="flex items-center gap-3 mb-4">',
    `        <Layout size={20} className="text-accent" />`,
    `        <h1 className="text-lg font-semibold text-primary">${toTitleCase(appId).replace(/([A-Z])/g, ' $1').trim()}</h1>`,
    '      </div>',
    '      <div className="flex-1 flex items-center justify-center text-secondary">',
    '        <p>App scaffold ready. Implementation pending.</p>',
    '      </div>',
    '    </div>',
    '  );',
    '}',
    '',
  ].join('\n');

  const mainPath = path.join(appDir, `${appName}App.tsx`);
  fs.writeFileSync(mainPath, mainComponent);
  createdFiles.push(mainPath);

  // 4. Executor stub (if hasAgent)
  if (plan.executor) {
    const executorDir = 'server/src/a2a/executors';
    fs.mkdirSync(executorDir, { recursive: true });

    const skills = plan.executor.skills;
    const skillsJson = JSON.stringify(
      skills.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        tags: [appId],
        examples: [`Help me with ${s.name.toLowerCase()}`],
      })),
      null,
      2
    );

    const executor = [
      `/**`,
      ` * ${appName} Executor`,
      ` *`,
      ` * A2A executor for the ${appId} application.`,
      ` */`,
      '',
      `import { v1 } from '@liquidcrypto/a2a-sdk';`,
      `import type { AgentExecutor, AgentExecutionContext, AgentExecutionResult } from '../adapter/index.js';`,
      '',
      `export function get${appName}AgentCard(baseUrl: string): v1.AgentCard {`,
      '  return {',
      `    name: '${toTitleCase(appId).replace(/([A-Z])/g, ' $1').trim()}',`,
      `    description: 'AI assistant for ${appId}',`,
      '    supportedInterfaces: [',
      `      { url: \`\${baseUrl}/a2a\`, protocolBinding: 'JSONRPC' },`,
      '    ],',
      `    skills: ${skillsJson.replace(/\n/g, '\n    ')},`,
      '  };',
      '}',
      '',
      `export class ${appName}Executor implements AgentExecutor {`,
      '  async execute(',
      '    message: v1.Message,',
      '    context: AgentExecutionContext',
      '  ): Promise<AgentExecutionResult> {',
      '    const text = this.extractText(message);',
      '',
      '    return {',
      `      status: 'completed' as v1.TaskState,`,
      '      artifacts: [{',
      "        parts: [{ kind: 'text' as const, text: `${appName} received: ${text}` }],",
      '      }],',
      '    };',
      '  }',
      '',
      '  private extractText(message: v1.Message): string {',
      "    if (!message.parts) return '';",
      '    return message.parts',
      "      .filter((part: v1.Part): part is v1.TextPart => part.kind === 'text')",
      '      .map((part: v1.TextPart) => part.text)',
      "      .join(' ');",
      '  }',
      '}',
      '',
    ].join('\n');

    const executorPath = path.join(executorDir, `${appId}.ts`);
    fs.writeFileSync(executorPath, executor);
    createdFiles.push(executorPath);
  }

  return createdFiles;
}
