/**
 * Export Command
 *
 * Exports a Quick App to a full application structure.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import chalk from 'chalk';

interface ExportOptions {
  file: string;
  output: string;
  zip?: boolean;
}

interface ParsedFrontmatter {
  name: string;
  icon: string;
  category?: string;
  version?: string;
  author?: string;
  license?: string;
  [key: string]: unknown;
}

export async function exportApp(options: ExportOptions) {
  const { file, output, zip } = options;

  try {
    // Read the Quick App file
    const content = await readFile(file, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No frontmatter found in APP.md file');
    }

    const frontmatter = parseSimpleYaml(frontmatterMatch[1]);
    const kebabName = frontmatter.name.toLowerCase().replace(/\s+/g, '-');

    // Extract description (first paragraph after frontmatter)
    const descriptionMatch = content.match(/---\n\n#[^\n]+\n\n([^\n]+)/);
    const description = descriptionMatch?.[1] || 'A Quick App';

    // Extract code blocks
    const appCodeMatch = content.match(/```tsx App\n([\s\S]*?)\n```/);
    const helpersMatch = content.match(/```tsx helpers\n([\s\S]*?)\n```/);
    const storeMatch = content.match(/```tsx store\n([\s\S]*?)\n```/);
    const settingsMatch = content.match(/```tsx settings\n([\s\S]*?)\n```/);
    const stylesMatch = content.match(/```css\n([\s\S]*?)\n```/);

    console.log(chalk.gray(`   Exporting: ${frontmatter.name}`));
    console.log(chalk.gray(`   Output:    ${output}`));

    // Create output directory
    const outputDir = output || `./${kebabName}`;
    await mkdir(outputDir, { recursive: true });
    await mkdir(join(outputDir, 'src'), { recursive: true });

    // Generate files
    const files: { path: string; content: string }[] = [];

    // manifest.json
    files.push({
      path: 'manifest.json',
      content: JSON.stringify({
        id: kebabName,
        name: frontmatter.name,
        version: frontmatter.version || '0.1.0',
        description,
        author: frontmatter.author || 'Quick App User',
        category: frontmatter.category || 'utilities',
        icon: frontmatter.icon,
        entry: 'src/index.ts',
        keywords: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        window: {
          mode: frontmatter.window || 'floating',
          title: frontmatter.name,
          defaultSize: Array.isArray(frontmatter.size)
            ? { width: frontmatter.size[0], height: frontmatter.size[1] }
            : { width: 400, height: 300 },
          resizable: frontmatter.resizable !== false,
        },
        integrations: {},
        capabilities: [],
      }, null, 2),
    });

    // src/App.tsx
    if (appCodeMatch) {
      files.push({
        path: 'src/App.tsx',
        content: generateAppFile(appCodeMatch[1], frontmatter, description),
      });
    }

    // src/helpers.ts
    if (helpersMatch) {
      files.push({
        path: 'src/helpers.ts',
        content: `/**\n * Helper functions\n */\n\n${helpersMatch[1]}`,
      });
    }

    // src/store.ts
    if (storeMatch) {
      files.push({
        path: 'src/store.ts',
        content: `/**\n * Zustand Store\n */\n\nimport { create } from 'zustand';\nimport { persist } from 'zustand/middleware';\n\n${storeMatch[1]}`,
      });
    }

    // src/Settings.tsx
    if (settingsMatch) {
      files.push({
        path: 'src/Settings.tsx',
        content: `/**\n * Settings Component\n */\n\nimport React from 'react';\n\n${settingsMatch[1]}`,
      });
    }

    // src/styles.css
    if (stylesMatch) {
      files.push({
        path: 'src/styles.css',
        content: stylesMatch[1],
      });
    }

    // src/index.ts
    files.push({
      path: 'src/index.ts',
      content: generateIndexFile(!!settingsMatch, !!storeMatch),
    });

    // package.json
    files.push({
      path: 'package.json',
      content: JSON.stringify({
        name: kebabName,
        version: frontmatter.version || '0.1.0',
        description,
        main: 'src/index.ts',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.263.1',
          zustand: '^4.4.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0',
        },
      }, null, 2),
    });

    // README.md
    files.push({
      path: 'README.md',
      content: `# ${frontmatter.name}\n\n${description}\n\n## Installation\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## About\n\n- **Category:** ${frontmatter.category || 'utilities'}\n- **Version:** ${frontmatter.version || '0.1.0'}\n- **Author:** ${frontmatter.author || 'Quick App User'}\n\n---\n\n*Exported from LiquidOS Quick App format*\n`,
    });

    // tsconfig.json
    files.push({
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          paths: { '@/*': ['./src/*'] },
        },
        include: ['src'],
      }, null, 2),
    });

    // Write all files
    for (const { path, content: fileContent } of files) {
      const fullPath = join(outputDir, path);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, fileContent);
      console.log(chalk.gray(`   Created: ${path}`));
    }

    console.log(chalk.green(`\n✅ Export complete!`));
    console.log(chalk.gray(`   ${files.length} files created in ${outputDir}`));
    console.log('');
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`   cd ${outputDir}`));
    console.log(chalk.gray('   npm install'));
    console.log(chalk.gray('   npm run dev'));

    if (zip) {
      console.log(chalk.yellow('\nNote: ZIP export not yet implemented in CLI'));
    }

  } catch (err) {
    console.error(chalk.red('\n❌ Export failed:'));
    console.error(chalk.red(`   ${err instanceof Error ? err.message : String(err)}`));
  }
}

function parseSimpleYaml(yaml: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = { name: '', icon: '' };
  const lines = yaml.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = value.slice(1, -1).split(',').map(s => s.trim());
      } else {
        result[key] = value.trim();
      }
    }
  }

  return result;
}

function generateAppFile(appCode: string, frontmatter: ParsedFrontmatter, description: string): string {
  const imports = [
    "import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';",
  ];

  // Add hook imports based on usage
  if (appCode.includes('useStorage')) {
    imports.push("import { useStorage } from '@/hooks/useStorage';");
  }
  if (appCode.includes('useNotification')) {
    imports.push("import { useNotification } from '@/hooks/useNotification';");
  }

  // Extract lucide imports
  const iconMatch = appCode.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
  if (iconMatch) {
    imports.push(`import { ${iconMatch[1]} } from 'lucide-react';`);
  }

  // Clean app code
  const cleanedCode = appCode
    .replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"];?\n?/g, '')
    .trim();

  return `/**
 * ${frontmatter.name}
 *
 * ${description}
 */

${imports.join('\n')}

${cleanedCode}
`;
}

function generateIndexFile(hasSettings: boolean, hasStore: boolean): string {
  const exports = ["export { default as App } from './App';"];

  if (hasSettings) {
    exports.push("export { default as Settings } from './Settings';");
  }
  if (hasStore) {
    exports.push("export { useStore } from './store';");
  }

  return `/**
 * Application Entry Point
 */

${exports.join('\n')}
`;
}
