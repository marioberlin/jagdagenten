#!/usr/bin/env bun
/**
 * Quick Apps CLI
 *
 * Command-line tool for creating, testing, and publishing LiquidOS Quick Apps.
 *
 * Usage:
 *   quick-app new <name>     - Create a new Quick App from template
 *   quick-app dev            - Start development server with hot reload
 *   quick-app build          - Compile and validate the Quick App
 *   quick-app preview        - Preview the app in a local server
 *   quick-app export         - Export to full app structure
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createApp } from './commands/create.js';
import { devServer } from './commands/dev.js';
import { buildApp } from './commands/build.js';
import { previewApp } from './commands/preview.js';
import { exportApp } from './commands/export.js';

const program = new Command();

program
  .name('quick-app')
  .description('CLI tool for LiquidOS Quick Apps development')
  .version('0.1.0');

// Create new Quick App
program
  .command('new <name>')
  .description('Create a new Quick App from template')
  .option('-t, --template <template>', 'Template to use (basic, with-store, with-settings)', 'basic')
  .option('-c, --category <category>', 'App category', 'utilities')
  .option('-d, --directory <dir>', 'Output directory', '.')
  .action(async (name, options) => {
    console.log(chalk.cyan('🚀 Creating new Quick App:'), chalk.bold(name));
    await createApp(name, options);
  });

// Development server with hot reload
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run on', '5050')
  .option('-f, --file <file>', 'Quick App file to watch', 'app.md')
  .action(async (options) => {
    console.log(chalk.cyan('👀 Starting development server...'));
    await devServer(options);
  });

// Build/validate Quick App
program
  .command('build')
  .description('Compile and validate the Quick App')
  .option('-f, --file <file>', 'Quick App file to build', 'app.md')
  .option('-o, --output <output>', 'Output directory for compiled files')
  .action(async (options) => {
    console.log(chalk.cyan('🔨 Building Quick App...'));
    await buildApp(options);
  });

// Preview Quick App
program
  .command('preview')
  .description('Preview the app in a local server')
  .option('-f, --file <file>', 'Quick App file to preview', 'app.md')
  .option('-p, --port <port>', 'Port to run preview on', '5051')
  .action(async (options) => {
    console.log(chalk.cyan('👁️ Starting preview server...'));
    await previewApp(options);
  });

// Export to full app
program
  .command('export')
  .description('Export Quick App to full application structure')
  .option('-f, --file <file>', 'Quick App file to export', 'app.md')
  .option('-o, --output <output>', 'Output directory', './exported-app')
  .option('-z, --zip', 'Create a ZIP file instead of directory')
  .action(async (options) => {
    console.log(chalk.cyan('📦 Exporting Quick App...'));
    await exportApp(options);
  });

program.parse();
