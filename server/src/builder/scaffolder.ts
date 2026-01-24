/**
 * App Scaffolder
 *
 * Generates initial file structure for new apps without running through Ralph.
 * Creates manifest, entry component, and optional executor stub.
 *
 * Files are written to `.builder/staging/{appId}/` to avoid triggering Vite
 * page reloads during the build. Call `installStagedApp()` to move them to
 * their final locations in `src/applications/`.
 */

import fs from 'fs';
import path from 'path';
import { getProjectRoot } from './paths.js';
import type { ArchitecturePlan } from './types.js';

function toTitleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s/g, '');
}

/**
 * Generate a functional main component based on the app description.
 * Detects common patterns (counter, timer, todo, notes) and generates
 * working implementations instead of placeholder text.
 */
function generateMainComponent(appId: string, appName: string, plan: ArchitecturePlan, requestDescription?: string): string {
  const desc = (requestDescription || appId).toLowerCase();
  const displayName = toTitleCase(appId).replace(/([A-Z])/g, ' $1').trim();
  const iconName = plan.components[0]?.icon || 'Layout';

  // Counter app pattern
  // Word counter pattern
  if (desc.includes('word') && (desc.includes('count') || desc.includes('counter'))) {
    return [
      `import { useState, useMemo } from 'react';`,
      `import { ${iconName}, Type, Hash, AlignLeft } from 'lucide-react';`,
      '',
      `export function ${appName}App() {`,
      '  const [text, setText] = useState("");',
      '',
      '  const stats = useMemo(() => {',
      '    const trimmed = text.trim();',
      '    const words = trimmed ? trimmed.split(/\\s+/).length : 0;',
      '    const chars = text.length;',
      '    const charsNoSpaces = text.replace(/\\s/g, "").length;',
      '    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0;',
      '    const paragraphs = trimmed ? trimmed.split(/\\n\\s*\\n/).filter(Boolean).length : 0;',
      '    return { words, chars, charsNoSpaces, sentences, paragraphs };',
      '  }, [text]);',
      '',
      '  return (',
      '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
      '      <div className="flex items-center gap-3 mb-4">',
      `        <${iconName} size={20} className="text-accent" />`,
      `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
      '      </div>',
      '      <div className="grid grid-cols-5 gap-3 mb-4">',
      '        {[',
      "          { label: 'Words', value: stats.words, icon: Type },",
      "          { label: 'Characters', value: stats.chars, icon: Hash },",
      "          { label: 'No Spaces', value: stats.charsNoSpaces, icon: Hash },",
      "          { label: 'Sentences', value: stats.sentences, icon: AlignLeft },",
      "          { label: 'Paragraphs', value: stats.paragraphs, icon: AlignLeft },",
      '        ].map(stat => (',
      '          <div key={stat.label} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">',
      '            <div className="text-2xl font-bold text-primary tabular-nums">{stat.value}</div>',
      '            <div className="text-xs text-secondary mt-1">{stat.label}</div>',
      '          </div>',
      '        ))}',
      '      </div>',
      '      <textarea',
      '        value={text}',
      '        onChange={e => setText(e.target.value)}',
      '        placeholder="Start typing or paste text here..."',
      '        className="flex-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-primary text-sm placeholder:text-secondary/50 outline-none focus:border-accent/40 resize-none"',
      '      />',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  // Counter app pattern
  if (desc.includes('counter')) {
    return [
      `import { useState } from 'react';`,
      `import { ${iconName}, Plus, Minus, RotateCcw } from 'lucide-react';`,
      '',
      `export function ${appName}App() {`,
      '  const [count, setCount] = useState(0);',
      '',
      '  return (',
      '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
      '      <div className="flex items-center gap-3 mb-6">',
      `        <${iconName} size={20} className="text-accent" />`,
      `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
      '      </div>',
      '      <div className="flex-1 flex flex-col items-center justify-center gap-8">',
      '        <div className="text-6xl font-bold text-primary tabular-nums">{count}</div>',
      '        <div className="flex items-center gap-3">',
      '          <button',
      '            onClick={() => setCount(c => c - 1)}',
      '            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-primary transition-colors"',
      '          >',
      '            <Minus size={20} />',
      '          </button>',
      '          <button',
      '            onClick={() => setCount(0)}',
      '            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-secondary transition-colors"',
      '          >',
      '            <RotateCcw size={16} />',
      '          </button>',
      '          <button',
      '            onClick={() => setCount(c => c + 1)}',
      '            className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent transition-colors"',
      '          >',
      '            <Plus size={20} />',
      '          </button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  // Timer/stopwatch pattern
  if (desc.includes('timer') || desc.includes('stopwatch')) {
    return [
      `import { useState, useRef } from 'react';`,
      `import { ${iconName}, Play, Pause, RotateCcw } from 'lucide-react';`,
      '',
      `export function ${appName}App() {`,
      '  const [seconds, setSeconds] = useState(0);',
      '  const [running, setRunning] = useState(false);',
      '  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);',
      '',
      '  const toggle = () => {',
      '    if (running) {',
      '      if (intervalRef.current) clearInterval(intervalRef.current);',
      '      setRunning(false);',
      '    } else {',
      '      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);',
      '      setRunning(true);',
      '    }',
      '  };',
      '',
      '  const reset = () => {',
      '    if (intervalRef.current) clearInterval(intervalRef.current);',
      '    setRunning(false);',
      '    setSeconds(0);',
      '  };',
      '',
      '  const mins = Math.floor(seconds / 60);',
      '  const secs = seconds % 60;',
      '',
      '  return (',
      '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
      '      <div className="flex items-center gap-3 mb-6">',
      `        <${iconName} size={20} className="text-accent" />`,
      `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
      '      </div>',
      '      <div className="flex-1 flex flex-col items-center justify-center gap-8">',
      '        <div className="text-5xl font-mono font-bold text-primary">',
      '          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}',
      '        </div>',
      '        <div className="flex items-center gap-3">',
      '          <button onClick={toggle} className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent transition-colors">',
      '            {running ? <Pause size={20} /> : <Play size={20} />}',
      '          </button>',
      '          <button onClick={reset} className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-secondary transition-colors">',
      '            <RotateCcw size={16} />',
      '          </button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  // Todo/task list pattern
  if (desc.includes('todo') || desc.includes('task')) {
    return [
      `import { useState } from 'react';`,
      `import { ${iconName}, Plus, Check, Trash2 } from 'lucide-react';`,
      '',
      `interface TodoItem { id: number; text: string; done: boolean; }`,
      '',
      `export function ${appName}App() {`,
      '  const [todos, setTodos] = useState<TodoItem[]>([]);',
      '  const [input, setInput] = useState("");',
      '',
      '  const addTodo = () => {',
      '    if (!input.trim()) return;',
      '    setTodos(prev => [...prev, { id: Date.now(), text: input.trim(), done: false }]);',
      '    setInput("");',
      '  };',
      '',
      '  const toggleTodo = (id: number) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));',
      '  const removeTodo = (id: number) => setTodos(prev => prev.filter(t => t.id !== id));',
      '',
      '  return (',
      '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
      '      <div className="flex items-center gap-3 mb-4">',
      `        <${iconName} size={20} className="text-accent" />`,
      `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
      '      </div>',
      '      <div className="flex gap-2 mb-4">',
      '        <input',
      '          value={input}',
      '          onChange={e => setInput(e.target.value)}',
      '          onKeyDown={e => e.key === "Enter" && addTodo()}',
      '          placeholder="Add a task..."',
      '          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-primary text-sm placeholder:text-secondary/50 outline-none focus:border-accent/40"',
      '        />',
      '        <button onClick={addTodo} className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent transition-colors">',
      '          <Plus size={16} />',
      '        </button>',
      '      </div>',
      '      <div className="flex-1 overflow-y-auto space-y-1">',
      '        {todos.map(todo => (',
      '          <div key={todo.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group">',
      '            <button onClick={() => toggleTodo(todo.id)} className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${todo.done ? "bg-accent/20 border-accent/40 text-accent" : "border-white/20 text-transparent"}`}>',
      '              <Check size={12} />',
      '            </button>',
      '            <span className={`flex-1 text-sm ${todo.done ? "line-through text-secondary/50" : "text-primary"}`}>{todo.text}</span>',
      '            <button onClick={() => removeTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-secondary hover:text-red-400 transition-opacity">',
      '              <Trash2 size={14} />',
      '            </button>',
      '          </div>',
      '        ))}',
      '        {todos.length === 0 && <div className="text-center text-secondary/50 text-sm py-8">No tasks yet</div>}',
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  // Notes/notepad pattern
  if (desc.includes('note') || desc.includes('notepad')) {
    return [
      `import { useState } from 'react';`,
      `import { ${iconName}, Save } from 'lucide-react';`,
      '',
      `export function ${appName}App() {`,
      '  const [content, setContent] = useState("");',
      '  const [saved, setSaved] = useState(false);',
      '',
      '  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };',
      '',
      '  return (',
      '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
      '      <div className="flex items-center gap-3 mb-4">',
      `        <${iconName} size={20} className="text-accent" />`,
      `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
      '        <div className="flex-1" />',
      '        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent text-xs font-medium transition-colors">',
      '          <Save size={14} />',
      '          {saved ? "Saved" : "Save"}',
      '        </button>',
      '      </div>',
      '      <textarea',
      '        value={content}',
      '        onChange={e => setContent(e.target.value)}',
      '        placeholder="Start typing..."',
      '        className="flex-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-primary text-sm placeholder:text-secondary/50 outline-none focus:border-accent/40 resize-none"',
      '      />',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  // Default: generic app shell with description-aware content
  return [
    `import { ${iconName} } from 'lucide-react';`,
    '',
    `export function ${appName}App() {`,
    '  return (',
    '    <div className="flex flex-col h-full bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">',
    '      <div className="flex items-center gap-3 mb-4">',
    `        <${iconName} size={20} className="text-accent" />`,
    `        <h1 className="text-lg font-semibold text-primary">${displayName}</h1>`,
    '      </div>',
    '      <div className="flex-1 flex items-center justify-center text-secondary text-sm">',
    `        <p>${displayName} is ready. Add your implementation here.</p>`,
    '      </div>',
    '    </div>',
    '  );',
    '}',
    '',
  ].join('\n');
}

/**
 * Copy a directory recursively.
 */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install a staged app by copying files from `.builder/staging/{appId}/`
 * to their final locations (`src/applications/` and optionally `server/src/a2a/executors/`).
 * This triggers a single Vite page reload, which is expected when a new app is ready.
 */
export function installStagedApp(appId: string): string[] {
  const root = getProjectRoot();
  const stagingDir = path.join(root, `.builder/staging/${appId}`);
  const installedFiles: string[] = [];

  if (!fs.existsSync(stagingDir)) {
    return installedFiles;
  }

  // Copy app files to src/applications/
  const appStagingDir = path.join(stagingDir, 'app');
  if (fs.existsSync(appStagingDir)) {
    const appDestDir = path.join(root, `src/applications/${appId}`);
    copyDirSync(appStagingDir, appDestDir);
    // Collect installed file paths
    const collectFiles = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) collectFiles(fullPath);
        else installedFiles.push(fullPath);
      }
    };
    collectFiles(appDestDir);
  }

  // Copy executor file if present
  const executorStagingDir = path.join(stagingDir, 'executor');
  if (fs.existsSync(executorStagingDir)) {
    const executorDestDir = path.join(root, 'server/src/a2a/executors');
    fs.mkdirSync(executorDestDir, { recursive: true });
    for (const file of fs.readdirSync(executorStagingDir)) {
      const src = path.join(executorStagingDir, file);
      const dest = path.join(executorDestDir, file);
      fs.copyFileSync(src, dest);
      installedFiles.push(dest);
    }
  }

  // Clean up staging directory
  fs.rmSync(stagingDir, { recursive: true, force: true });

  return installedFiles;
}

/**
 * Scaffold the initial file structure for a new app.
 * Files are written to `.builder/staging/{appId}/` to avoid Vite page reloads.
 * Call `installStagedApp(appId)` after the build to move them to final locations.
 */
export async function scaffoldApp(appId: string, plan: ArchitecturePlan, requestCategory?: string, requestDescription?: string): Promise<string[]> {
  const root = getProjectRoot();
  const stagingDir = path.join(root, `.builder/staging/${appId}`);
  const appDir = path.join(stagingDir, 'app');
  const createdFiles: string[] = [];

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(`${appDir}/components`, { recursive: true });

  // 1. manifest.json
  // Category must be one of the valid values accepted by appDiscovery validation
  const validCategories = ['productivity', 'communication', 'finance', 'weather', 'travel', 'developer', 'utilities', 'entertainment', 'system'];
  const resolvedCategory = validCategories.includes(requestCategory || '') ? requestCategory! : 'utilities';

  const manifest = {
    id: appId,
    name: toTitleCase(appId),
    version: '1.0.0',
    description: `LiquidOS application: ${appId}`,
    author: 'LiquidOS Builder',
    category: resolvedCategory,
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

  // 3. Main app component — generate a functional component based on the description
  const mainComponent = generateMainComponent(appId, appName, plan, requestDescription);

  const mainPath = path.join(appDir, `${appName}App.tsx`);
  fs.writeFileSync(mainPath, mainComponent);
  createdFiles.push(mainPath);

  // 4. Executor stub (if hasAgent)
  if (plan.executor) {
    const executorDir = path.join(stagingDir, 'executor');
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
