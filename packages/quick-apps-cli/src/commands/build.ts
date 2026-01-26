/**
 * Build Command
 *
 * Compiles and validates a Quick App.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import chalk from 'chalk';
import * as esbuild from 'esbuild';

interface BuildOptions {
  file: string;
  output?: string;
}

interface ParsedFrontmatter {
  name: string;
  icon: string;
  category?: string;
  [key: string]: unknown;
}

export async function buildApp(options: BuildOptions) {
  const { file, output } = options;

  try {
    // Read the Quick App file
    const content = await readFile(file, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No frontmatter found in APP.md file');
    }

    // Parse YAML frontmatter (simple parser)
    const frontmatter = parseSimpleYaml(frontmatterMatch[1]);

    // Validate required fields
    if (!frontmatter.name) {
      throw new Error('Missing required field: name');
    }
    if (!frontmatter.icon) {
      throw new Error('Missing required field: icon');
    }

    console.log(chalk.gray(`   Name:     ${frontmatter.name}`));
    console.log(chalk.gray(`   Icon:     ${frontmatter.icon}`));
    console.log(chalk.gray(`   Category: ${frontmatter.category || 'utilities'}`));

    // Extract code blocks
    const appCodeMatch = content.match(/```tsx App\n([\s\S]*?)\n```/);
    if (!appCodeMatch) {
      throw new Error('No App code block found (```tsx App)');
    }

    const appCode = appCodeMatch[1];

    // Compile TypeScript/JSX using esbuild
    console.log(chalk.gray('\n   Compiling TypeScript/JSX...'));

    const result = await esbuild.transform(appCode, {
      loader: 'tsx',
      target: 'es2020',
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'react',
    });

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n   Warnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`     - ${warning.text}`));
      }
    }

    console.log(chalk.green(`\n✅ Build successful!`));
    console.log(chalk.gray(`   Compiled code size: ${result.code.length} bytes`));

    // Write output if specified
    if (output) {
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, result.code);
      console.log(chalk.gray(`   Output written to: ${output}`));
    }

    return { success: true, code: result.code };
  } catch (err) {
    console.error(chalk.red('\n❌ Build failed:'));
    console.error(chalk.red(`   ${err instanceof Error ? err.message : String(err)}`));
    return { success: false, error: err };
  }
}

// Simple YAML parser (for basic frontmatter)
function parseSimpleYaml(yaml: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = { name: '', icon: '' };
  const lines = yaml.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Handle arrays like [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = value.slice(1, -1).split(',').map(s => s.trim());
      } else {
        result[key] = value.trim();
      }
    }
  }

  return result;
}
