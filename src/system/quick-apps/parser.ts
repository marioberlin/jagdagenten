/**
 * Quick App Parser
 *
 * Parses APP.md files into structured Quick App definitions.
 * Extracts YAML frontmatter, description, code blocks, and integrations.
 */

import type {
  QuickAppFrontmatter,
  ParsedQuickApp,
  QuickAppShortcut,
  QuickAppCommand,
} from './types';
import { CAPABILITY_PATTERNS, QUICK_APP_DEFAULTS } from './types';
import type { AppCapability } from '../app-store/types';

// ============================================================
// YAML Frontmatter Parser (Simplified)
// ============================================================

function parseYamlFrontmatter(yaml: string): QuickAppFrontmatter {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentIndent = 0;
  let nestedObject: Record<string, unknown> | null = null;
  let arrayItems: unknown[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);

    // Array item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (arrayItems !== null) {
        arrayItems.push(parseYamlValue(value));
      }
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const valueStr = trimmed.slice(colonIndex + 1).trim();

      // End previous nested object or array
      if (indent <= currentIndent && nestedObject && currentKey) {
        result[currentKey] = nestedObject;
        nestedObject = null;
      }
      if (indent <= currentIndent && arrayItems && currentKey) {
        result[currentKey] = arrayItems;
        arrayItems = null;
      }

      if (valueStr === '') {
        // Start of nested object or array (check next line)
        currentKey = key;
        currentIndent = indent;
        // We'll determine if it's object or array on next iteration
        nestedObject = {};
        arrayItems = [];
      } else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
        // Inline array: [item1, item2]
        const items = valueStr.slice(1, -1).split(',').map(s => parseYamlValue(s.trim()));
        result[key] = items;
      } else {
        // Simple value
        if (nestedObject && indent > currentIndent) {
          nestedObject[key] = parseYamlValue(valueStr);
        } else {
          result[key] = parseYamlValue(valueStr);
          currentKey = key;
          currentIndent = indent;
        }
      }
    }
  }

  // Finalize any pending nested structures
  if (nestedObject && currentKey && Object.keys(nestedObject).length > 0) {
    result[currentKey] = nestedObject;
  } else if (arrayItems && currentKey && arrayItems.length > 0) {
    result[currentKey] = arrayItems;
  }

  return result as unknown as QuickAppFrontmatter;
}

function parseYamlValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// ============================================================
// Markdown Parser
// ============================================================

interface CodeBlock {
  language: string;
  tag?: string; // e.g., "App", "helpers", "store"
  content: string;
}

function extractCodeBlocks(markdown: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w+)(?:\s+(\w+))?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1],
      tag: match[2],
      content: match[3].trim(),
    });
  }

  return blocks;
}

function extractDescription(markdown: string): string {
  // Remove frontmatter
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\n*/, '');

  // Remove code blocks
  const withoutCode = withoutFrontmatter.replace(/```[\s\S]*?```/g, '');

  // Get first paragraph (non-empty lines before first blank line or heading)
  const lines = withoutCode.split('\n');
  const descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (descLines.length > 0) break;
      continue;
    }
    if (trimmed.startsWith('#')) {
      if (descLines.length > 0) break;
      continue;
    }
    if (trimmed.startsWith('|')) continue; // Skip tables
    descLines.push(trimmed);
  }

  return descLines.join(' ').slice(0, 500); // Limit to 500 chars
}

function extractShortcuts(markdown: string): QuickAppShortcut[] {
  // Look for ## Shortcuts section with a table
  const shortcutsMatch = markdown.match(/##\s*Shortcuts[\s\S]*?\n((?:\|[^\n]+\n)+)/i);
  if (!shortcutsMatch) return [];

  const shortcuts: QuickAppShortcut[] = [];
  const tableLines = shortcutsMatch[1].split('\n').filter(l => l.includes('|'));

  // Skip header and separator rows
  for (let i = 2; i < tableLines.length; i++) {
    const cols = tableLines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 2) {
      const key = cols[0].replace(/`/g, '').trim();
      const action = cols[1].trim();
      if (key && action) {
        shortcuts.push({ key, action });
      }
    }
  }

  return shortcuts;
}

function extractCommands(markdown: string): QuickAppCommand[] {
  // Look for ## Commands section with a table
  const commandsMatch = markdown.match(/##\s*Commands[\s\S]*?\n((?:\|[^\n]+\n)+)/i);
  if (!commandsMatch) return [];

  const commands: QuickAppCommand[] = [];
  const tableLines = commandsMatch[1].split('\n').filter(l => l.includes('|'));

  // Skip header and separator rows
  for (let i = 2; i < tableLines.length; i++) {
    const cols = tableLines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 2) {
      commands.push({
        command: cols[0].trim(),
        description: cols[1].trim(),
      });
    }
  }

  return commands;
}

// ============================================================
// Capability Inference
// ============================================================

function inferCapabilities(code: string): AppCapability[] {
  const capabilities = new Set<AppCapability>();

  for (const [capability, patterns] of Object.entries(CAPABILITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        capabilities.add(capability as AppCapability);
        break;
      }
    }
  }

  return Array.from(capabilities);
}

// ============================================================
// ID Generation
// ============================================================

function generateAppId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'quick-app';
}

// ============================================================
// Main Parser
// ============================================================

export function parseQuickApp(markdown: string, sourceUrl?: string): ParsedQuickApp {
  // Extract frontmatter
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    throw new QuickAppParseError('Missing YAML frontmatter. APP.md must start with ---');
  }

  const frontmatter = parseYamlFrontmatter(frontmatterMatch[1]);

  // Validate required fields
  if (!frontmatter.name) {
    throw new QuickAppParseError('Missing required field: name');
  }
  if (!frontmatter.icon) {
    throw new QuickAppParseError('Missing required field: icon');
  }

  // Extract code blocks
  const codeBlocks = extractCodeBlocks(markdown);

  // Find main App component
  const appBlock = codeBlocks.find(b =>
    (b.language === 'tsx' || b.language === 'jsx') &&
    (b.tag === 'App' || b.tag === 'app')
  );

  if (!appBlock) {
    throw new QuickAppParseError(
      'Missing main component. Add a code block with ```tsx App'
    );
  }

  // Find optional code blocks
  const helpersBlock = codeBlocks.find(b =>
    (b.language === 'tsx' || b.language === 'ts') &&
    (b.tag === 'helpers' || b.tag === 'Helpers')
  );

  const storeBlock = codeBlocks.find(b =>
    (b.language === 'tsx' || b.language === 'ts') &&
    (b.tag === 'store' || b.tag === 'Store')
  );

  const settingsBlock = codeBlocks.find(b =>
    (b.language === 'tsx' || b.language === 'jsx') &&
    (b.tag === 'settings' || b.tag === 'Settings')
  );

  const stylesBlock = codeBlocks.find(b => b.language === 'css');

  // Combine all code for capability inference
  const allCode = [
    appBlock.content,
    helpersBlock?.content,
    storeBlock?.content,
    settingsBlock?.content,
  ].filter(Boolean).join('\n');

  // Infer capabilities
  const inferredCapabilities = inferCapabilities(allCode);

  // Extract integrations
  const shortcuts = extractShortcuts(markdown);
  const commands = extractCommands(markdown);

  return {
    id: generateAppId(frontmatter.name),
    frontmatter: {
      ...QUICK_APP_DEFAULTS,
      ...frontmatter,
    },
    description: extractDescription(markdown),
    appCode: appBlock.content,
    helpersCode: helpersBlock?.content,
    storeCode: storeBlock?.content,
    settingsCode: settingsBlock?.content,
    stylesCode: stylesBlock?.content,
    shortcuts: shortcuts.length > 0 ? shortcuts : undefined,
    commands: commands.length > 0 ? commands : undefined,
    inferredCapabilities,
    rawMarkdown: markdown,
    sourceUrl,
  };
}

// ============================================================
// Error Types
// ============================================================

export class QuickAppParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuickAppParseError';
  }
}

// ============================================================
// Validation
// ============================================================

export function validateParsedApp(parsed: ParsedQuickApp): string[] {
  const warnings: string[] = [];

  // Check for default export
  if (!parsed.appCode.includes('export default')) {
    warnings.push('Main component should have a default export');
  }

  // Check for function component
  if (!parsed.appCode.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/)) {
    warnings.push('Main component should be a function component');
  }

  // Check description length
  if (parsed.description.length < 10) {
    warnings.push('Consider adding a longer description for better discoverability');
  }

  // Check for potentially missing capabilities
  if (parsed.appCode.includes('fetch(') && !parsed.inferredCapabilities.includes('network:http')) {
    warnings.push('Detected fetch() but network:http capability was not inferred');
  }

  return warnings;
}
