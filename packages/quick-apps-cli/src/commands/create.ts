/**
 * Create Command
 *
 * Creates a new Quick App from a template.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

interface CreateOptions {
  template: 'basic' | 'with-store' | 'with-settings';
  category: string;
  directory: string;
}

const TEMPLATES = {
  basic: generateBasicTemplate,
  'with-store': generateStoreTemplate,
  'with-settings': generateSettingsTemplate,
};

export async function createApp(name: string, options: CreateOptions) {
  const { template, category, directory } = options;

  // Validate name
  const kebabName = name.toLowerCase().replace(/\s+/g, '-');

  // Prompt for additional info if not provided
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Brief description of your app:',
      default: `A ${category} Quick App`,
    },
    {
      type: 'list',
      name: 'icon',
      message: 'Choose an icon (Lucide icon name):',
      choices: [
        { name: '⚡ Zap (default)', value: 'Zap' },
        { name: '⏱️ Timer', value: 'Timer' },
        { name: '📝 FileText', value: 'FileText' },
        { name: '📊 BarChart', value: 'BarChart' },
        { name: '🔧 Settings', value: 'Settings' },
        { name: '📱 Smartphone', value: 'Smartphone' },
        { name: '💰 DollarSign', value: 'DollarSign' },
        { name: '🔔 Bell', value: 'Bell' },
        { name: 'Other (enter manually)', value: 'other' },
      ],
    },
    {
      type: 'input',
      name: 'customIcon',
      message: 'Enter Lucide icon name:',
      when: (answers) => answers.icon === 'other',
    },
  ]);

  const icon = answers.customIcon || answers.icon;
  const description = answers.description;

  // Generate template
  const templateFn = TEMPLATES[template] || TEMPLATES.basic;
  const content = templateFn({
    name,
    kebabName,
    icon,
    category,
    description,
  });

  // Create output directory if needed
  const outputDir = directory === '.' ? process.cwd() : join(process.cwd(), directory);
  await mkdir(outputDir, { recursive: true });

  // Write file
  const filePath = join(outputDir, `${kebabName}.app.md`);
  await writeFile(filePath, content);

  console.log(chalk.green('\n✅ Quick App created successfully!'));
  console.log(chalk.gray(`   File: ${filePath}`));
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.gray(`   1. Edit ${kebabName}.app.md to add your app code`));
  console.log(chalk.gray('   2. Run `quick-app dev` to start development server'));
  console.log(chalk.gray('   3. Drag the file into LiquidOS App Store to install'));
}

// ============================================================
// Template Generators
// ============================================================

interface TemplateParams {
  name: string;
  kebabName: string;
  icon: string;
  category: string;
  description: string;
}

function generateBasicTemplate(params: TemplateParams): string {
  return `---
name: ${params.name}
icon: ${params.icon}
category: ${params.category}
tags: []
window: floating
size: [400, 300]
---

# ${params.name}

${params.description}

## UI

\`\`\`tsx App
import { ${params.icon} } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
        <${params.icon} size={32} className="text-blue-400" />
      </div>

      <h1 className="text-xl font-bold text-white">${params.name}</h1>

      <p className="text-sm text-white/60 text-center">
        ${params.description}
      </p>

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setCount(c => c - 1)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          -
        </button>
        <span className="text-2xl font-bold text-white tabular-nums">{count}</span>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
\`\`\`
`;
}

function generateStoreTemplate(params: TemplateParams): string {
  return `---
name: ${params.name}
icon: ${params.icon}
category: ${params.category}
tags: []
window: floating
size: [400, 400]
---

# ${params.name}

${params.description}

## UI

\`\`\`tsx App
import { ${params.icon}, Plus, Trash2 } from 'lucide-react';

export default function App() {
  const [items, setItems] = useStorage<string[]>('items', []);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (input.trim()) {
      setItems([...items, input.trim()]);
      setInput('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <${params.icon} size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">${params.name}</h1>
          <p className="text-xs text-white/50">{items.length} items</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add new item..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          onClick={addItem}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group"
          >
            <span className="flex-1 text-sm text-white">{item}</span>
            <button
              onClick={() => removeItem(index)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-white/30 py-8">No items yet</p>
        )}
      </div>
    </div>
  );
}
\`\`\`
`;
}

function generateSettingsTemplate(params: TemplateParams): string {
  return `---
name: ${params.name}
icon: ${params.icon}
category: ${params.category}
tags: []
window: floating
size: [450, 500]
---

# ${params.name}

${params.description}

## UI

\`\`\`tsx App
import { ${params.icon}, Settings } from 'lucide-react';

export default function App() {
  const [data, setData] = useStorage('data', { count: 0 });
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <${params.icon} size={20} className="text-blue-400" />
          </div>
          <h1 className="text-lg font-bold text-white">${params.name}</h1>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <span className="text-5xl font-bold text-white">{data.count}</span>
        <button
          onClick={() => setData({ ...data, count: data.count + 1 })}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
\`\`\`

\`\`\`tsx settings
import { X, RotateCcw, Palette } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
}

function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useStorage('settings', {
    theme: 'dark',
    notifications: true,
  });
  const [, setData] = useStorage('data', { count: 0 });

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Settings Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Palette size={16} className="text-purple-400" />
            <span className="text-sm text-white">Theme</span>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="px-3 py-1 bg-white/10 border border-white/10 rounded text-sm text-white"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span className="text-sm text-white">Notifications</span>
          <button
            onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
            className={\`w-10 h-6 rounded-full transition-colors \${
              settings.notifications ? 'bg-blue-500' : 'bg-white/20'
            }\`}
          >
            <div
              className={\`w-4 h-4 bg-white rounded-full transition-transform m-1 \${
                settings.notifications ? 'translate-x-4' : 'translate-x-0'
              }\`}
            />
          </button>
        </div>

        <button
          onClick={() => setData({ count: 0 })}
          className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Reset Data
        </button>
      </div>
    </div>
  );
}
\`\`\`
`;
}
