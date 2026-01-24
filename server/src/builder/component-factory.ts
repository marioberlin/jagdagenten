/**
 * Component Factory
 *
 * Creates new Glass, A2UI, and SmartGlass components with Storybook stories.
 * All generated components use lucide-react icons (never emojis) and
 * semantic design tokens (never hex colors).
 */

import fs from 'fs';
import path from 'path';
import type { NewComponentSpec } from './types.js';

/**
 * Factory for generating Glass/A2UI/SmartGlass components with stories.
 */
export class ComponentFactory {
  /**
   * Create a component with its Storybook story and register in appropriate catalogs.
   */
  async createComponent(spec: NewComponentSpec): Promise<string[]> {
    const dir = `${spec.location}/${spec.subdir}`;
    fs.mkdirSync(dir, { recursive: true });
    const createdFiles: string[] = [];

    // 1. Component file
    const componentPath = path.join(dir, `${spec.name}.tsx`);
    fs.writeFileSync(componentPath, this.generateComponent(spec));
    createdFiles.push(componentPath);

    // 2. Storybook story
    const storyPath = path.join(dir, `${spec.name}.stories.tsx`);
    fs.writeFileSync(storyPath, this.generateStory(spec));
    createdFiles.push(storyPath);

    return createdFiles;
  }

  /**
   * Generate component TSX source.
   */
  private generateComponent(spec: NewComponentSpec): string {
    const propsInterface = this.buildPropsInterface(spec);
    const iconImport = spec.icon || 'Layout';

    if (spec.category === 'smartglass') {
      return this.generateSmartGlassComponent(spec, propsInterface, iconImport);
    }

    return [
      `/**`,
      ` * ${spec.name}`,
      ` *`,
      ` * ${spec.description}`,
      ` */`,
      '',
      `import { ${iconImport} } from 'lucide-react';`,
      '',
      propsInterface,
      '',
      `export function ${spec.name}({ ${spec.props.map(p => p.name).join(', ')} }: ${spec.name}Props) {`,
      '  return (',
      '    <div className="bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">',
      '      <div className="flex items-center gap-2 mb-3">',
      `        <${iconImport} size={18} className="text-accent" />`,
      `        <span className="text-sm font-semibold text-primary">${spec.name.replace(/([A-Z])/g, ' $1').trim()}</span>`,
      '      </div>',
      '      <div className="text-sm text-secondary">',
      `        {${spec.props[0]?.name || '"Content"'}}`,
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  /**
   * Generate SmartGlass component with AI enhancement capability.
   */
  private generateSmartGlassComponent(
    spec: NewComponentSpec,
    propsInterface: string,
    iconImport: string
  ): string {
    return [
      `/**`,
      ` * ${spec.name}`,
      ` *`,
      ` * ${spec.description}`,
      ` * SmartGlass enhancement: ${spec.smartEnhancement || 'insights'}`,
      ` */`,
      '',
      `import { useState } from 'react';`,
      `import { ${iconImport}, Sparkles, Loader2 } from 'lucide-react';`,
      '',
      propsInterface,
      '',
      `export function ${spec.name}({ ${spec.props.map(p => p.name).join(', ')} }: ${spec.name}Props) {`,
      '  const [enhancing, setEnhancing] = useState(false);',
      '  const [enhanced, setEnhanced] = useState<string | null>(null);',
      '',
      '  const handleEnhance = async () => {',
      '    setEnhancing(true);',
      '    // SmartGlass enhancement will be connected to AI backend',
      '    setTimeout(() => {',
      '      setEnhanced("AI-enhanced content");',
      '      setEnhancing(false);',
      '    }, 1000);',
      '  };',
      '',
      '  return (',
      '    <div className="relative bg-glass-surface/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">',
      '      <div className="flex items-center justify-between mb-3">',
      '        <div className="flex items-center gap-2">',
      `          <${iconImport} size={18} className="text-accent" />`,
      `          <span className="text-sm font-semibold text-primary">${spec.name.replace(/([A-Z])/g, ' $1').trim()}</span>`,
      '        </div>',
      '        <button',
      '          onClick={handleEnhance}',
      '          disabled={enhancing}',
      '          className="p-1.5 rounded-lg hover:bg-white/10 text-accent transition-colors disabled:opacity-50"',
      '        >',
      '          {enhancing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}',
      '        </button>',
      '      </div>',
      '      <div className="text-sm text-secondary">',
      `        {enhanced || ${spec.props[0]?.name || '"Content"'}}`,
      '      </div>',
      '    </div>',
      '  );',
      '}',
      '',
    ].join('\n');
  }

  /**
   * Generate Storybook story for the component.
   */
  private generateStory(spec: NewComponentSpec): string {
    const category = spec.category === 'glass' ? 'Glass' :
      spec.category === 'a2ui' ? 'A2UI' : 'SmartGlass';

    const defaultArgs = spec.props
      .filter(p => p.required)
      .map(p => `    ${p.name}: ${this.getDefaultValue(p.type)},`)
      .join('\n');

    return [
      `import type { Meta, StoryObj } from '@storybook/react';`,
      `import { ${spec.name} } from './${spec.name}';`,
      '',
      `const meta: Meta<typeof ${spec.name}> = {`,
      `  title: '${category}/${spec.name}',`,
      `  component: ${spec.name},`,
      `  tags: ['autodocs'],`,
      `  parameters: {`,
      `    docs: { description: { component: '${spec.description.replace(/'/g, "\\'")}' } },`,
      `  },`,
      `};`,
      `export default meta;`,
      '',
      `type Story = StoryObj<typeof ${spec.name}>;`,
      '',
      `export const Default: Story = {`,
      `  args: {`,
      defaultArgs,
      `  },`,
      `};`,
      '',
      `export const WithProps: Story = {`,
      `  args: {`,
      defaultArgs,
      `  },`,
      `};`,
      '',
      `export const Interactive: Story = {`,
      `  render: () => (`,
      `    <div className="p-4 space-y-4">`,
      `      <${spec.name} ${spec.props.filter(p => p.required).map(p => `${p.name}={${this.getDefaultValue(p.type)}}`).join(' ')} />`,
      `    </div>`,
      `  ),`,
      `};`,
      '',
    ].join('\n');
  }

  /**
   * Build the props interface declaration.
   */
  private buildPropsInterface(spec: NewComponentSpec): string {
    const lines = [`export interface ${spec.name}Props {`];
    for (const prop of spec.props) {
      lines.push(`  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Get a default value for a prop type (for story args).
   */
  private getDefaultValue(type: string): string {
    if (type === 'string') return "'Example'";
    if (type === 'number') return '42';
    if (type === 'boolean') return 'true';
    if (type.includes('[]')) return '[]';
    if (type.includes('ReactNode')) return "'Content'";
    return "''";
  }
}
