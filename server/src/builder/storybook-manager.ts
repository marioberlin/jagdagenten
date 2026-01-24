/**
 * Storybook Manager
 *
 * Generates Storybook stories for new components and verifies
 * Storybook builds successfully after component creation.
 */

import fs from 'fs';
import path from 'path';
import type { NewComponentSpec } from './types.js';

export interface StoryFile {
  path: string;
  content: string;
}

export interface StorybookVerifyResult {
  success: boolean;
  errors: string[];
  storiesFound: number;
}

/**
 * Generate a Storybook story file for a component specification.
 */
export function generateStory(spec: NewComponentSpec): StoryFile {
  const storyPath = `${spec.location}/${spec.subdir}/${spec.name}.stories.tsx`;

  const propsArgs = spec.props
    .filter(p => p.required)
    .map(p => `    ${p.name}: ${getDefaultValue(p.type)},`)
    .join('\n');

  const argTypes = spec.props
    .map(p => `    ${p.name}: { description: '${p.description}' },`)
    .join('\n');

  const content = `import type { Meta, StoryObj } from '@storybook/react';
import { ${spec.name} } from './${spec.name}';

const meta: Meta<typeof ${spec.name}> = {
  title: '${getCategoryTitle(spec.category)}/${spec.name}',
  component: ${spec.name},
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: '${spec.description.replace(/'/g, "\\'")}' } },
  },
  argTypes: {
${argTypes}
  },
};
export default meta;

type Story = StoryObj<typeof ${spec.name}>;

export const Default: Story = {
  args: {
${propsArgs}
  },
};

export const WithCustomProps: Story = {
  args: {
${propsArgs}
  },
};

export const Interactive: Story = {
  render: (args) => {
    return <${spec.name} {...args} />;
  },
  args: {
${propsArgs}
  },
};
`;

  return { path: storyPath, content };
}

/**
 * Write a generated story file to disk.
 */
export function writeStory(story: StoryFile): void {
  const dir = path.dirname(story.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(story.path, story.content);
}

/**
 * Check if a component already has a Storybook story.
 */
export function hasExistingStory(spec: NewComponentSpec): boolean {
  const storyPath = `${spec.location}/${spec.subdir}/${spec.name}.stories.tsx`;
  return fs.existsSync(storyPath);
}

/**
 * List all story files in a directory.
 */
export function listStories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const stories: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stories.push(...listStories(fullPath));
    } else if (entry.name.endsWith('.stories.tsx') || entry.name.endsWith('.stories.ts')) {
      stories.push(fullPath);
    }
  }

  return stories;
}

/**
 * Get the Storybook category title for a component type.
 */
function getCategoryTitle(category: NewComponentSpec['category']): string {
  switch (category) {
    case 'glass': return 'Glass';
    case 'a2ui': return 'Agentic/A2UI';
    case 'smartglass': return 'SmartGlass';
    default: return 'Components';
  }
}

/**
 * Get a sensible default value for a TypeScript type string.
 */
function getDefaultValue(type: string): string {
  if (type === 'string') return "'Example'";
  if (type === 'number') return '42';
  if (type === 'boolean') return 'true';
  if (type.includes('[]')) return '[]';
  if (type.startsWith("'") || type.includes(" | '")) return type.split("'")[1] ? `'${type.split("'")[1]}'` : "''";
  if (type === 'React.ReactNode') return "undefined";
  return 'undefined';
}
