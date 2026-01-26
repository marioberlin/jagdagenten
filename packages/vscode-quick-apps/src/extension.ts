import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('LiquidOS Quick Apps extension is now active!');

  // Register the "New Quick App" command
  const newAppCommand = vscode.commands.registerCommand('quickApps.newApp', async () => {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter Quick App name',
      placeHolder: 'My App',
    });

    if (!name) return;

    const template = await vscode.window.showQuickPick(
      [
        { label: 'Basic', description: 'Simple counter app', value: 'basic' },
        { label: 'With Storage', description: 'App with persistent storage', value: 'with-storage' },
        { label: 'With Settings', description: 'App with settings panel', value: 'with-settings' },
      ],
      { placeHolder: 'Select a template' }
    );

    if (!template) return;

    // Generate the template content
    const content = generateTemplate(name, template.value);

    // Create a new document
    const doc = await vscode.workspace.openTextDocument({
      language: 'quick-app',
      content,
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(`Created Quick App: ${name}`);
  });

  // Register the preview command
  const previewCommand = vscode.commands.registerCommand('quickApps.preview', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const document = editor.document;
    if (document.languageId !== 'quick-app' && !document.fileName.endsWith('.app.md')) {
      vscode.window.showErrorMessage('Not a Quick App file');
      return;
    }

    // Create webview panel for preview
    const panel = vscode.window.createWebviewPanel(
      'quickAppPreview',
      `Preview: ${document.fileName.split('/').pop()}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
      }
    );

    const content = document.getText();
    panel.webview.html = generatePreviewHtml(content);

    // Update preview when document changes
    const changeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === document) {
        panel.webview.html = generatePreviewHtml(e.document.getText());
      }
    });

    panel.onDidDispose(() => {
      changeDisposable.dispose();
    });
  });

  context.subscriptions.push(newAppCommand, previewCommand);
}

export function deactivate() {}

function generateTemplate(name: string, template: string): string {
  const kebabName = name.toLowerCase().replace(/\s+/g, '-');

  switch (template) {
    case 'with-storage':
      return `---
name: ${name}
icon: Database
category: utilities
tags: []
window: floating
size: [400, 400]
---

# ${name}

A Quick App with persistent storage.

## UI

\`\`\`tsx App
import { Database, Plus, Trash2 } from 'lucide-react';

export default function App() {
  const [items, setItems] = useStorage<string[]>('${kebabName}-items', []);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (input.trim()) {
      setItems([...items, input.trim()]);
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3">
        <Database size={20} className="text-blue-400" />
        <h1 className="font-bold text-white">${name}</h1>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          onClick={addItem}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group">
            <span className="flex-1 text-white">{item}</span>
            <button
              onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`
`;

    case 'with-settings':
      return `---
name: ${name}
icon: Settings
category: utilities
tags: []
window: floating
size: [400, 450]
---

# ${name}

A Quick App with a settings panel.

## UI

\`\`\`tsx App
import { Settings, Zap } from 'lucide-react';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useStorage('${kebabName}-data', { count: 0 });

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-white">${name}</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Zap size={48} className="text-yellow-400" />
        <span className="text-4xl font-bold text-white">{data.count}</span>
        <button
          onClick={() => setData({ ...data, count: data.count + 1 })}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
\`\`\`

\`\`\`tsx settings
import { X, RotateCcw } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [, setData] = useStorage('${kebabName}-data', { count: 0 });

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-white">Settings</h2>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <button
        onClick={() => setData({ count: 0 })}
        className="flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-lg"
      >
        <RotateCcw size={16} />
        Reset Data
      </button>
    </div>
  );
}
\`\`\`
`;

    default:
      return `---
name: ${name}
icon: Zap
category: utilities
tags: []
window: floating
size: [400, 300]
---

# ${name}

A simple Quick App.

## UI

\`\`\`tsx App
import { Zap } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
      <Zap size={32} className="text-yellow-400" />
      <h1 className="text-xl font-bold text-white">${name}</h1>
      <span className="text-2xl font-bold text-white">{count}</span>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium"
      >
        Increment
      </button>
    </div>
  );
}
\`\`\`
`;
  }
}

function generatePreviewHtml(content: string): string {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const nameMatch = frontmatterMatch?.[1].match(/name:\s*(.+)/);
  const appName = nameMatch?.[1] || 'Quick App';

  // Extract app code
  const appCodeMatch = content.match(/```tsx App\n([\s\S]*?)\n```/);
  const appCode = appCodeMatch?.[1] || '// No app code found';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
    }
    .icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, rgba(250,204,21,0.2), rgba(251,146,60,0.2));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { font-size: 18px; margin: 0; }
    .code-container {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 16px;
      overflow-x: auto;
    }
    pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .note {
      margin-top: 16px;
      padding: 12px;
      background: rgba(250,204,21,0.1);
      border: 1px solid rgba(250,204,21,0.2);
      border-radius: 8px;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">⚡</div>
      <h1>${appName}</h1>
    </div>
    <div class="code-container">
      <pre>${escapeHtml(appCode)}</pre>
    </div>
    <div class="note">
      💡 This is a code preview. To see the app running, drag the .app.md file into LiquidOS App Store.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
