#!/usr/bin/env bun
/**
 * Plugin Registry CLI
 *
 * Command-line interface for interacting with the plugin registry.
 * Supports publishing, installing, and managing plugins.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 *
 * Usage:
 *   bun run scripts/registry_cli.ts login
 *   bun run scripts/registry_cli.ts publish
 *   bun run scripts/registry_cli.ts install <plugin-name>
 *   bun run scripts/registry_cli.ts search <query>
 *   bun run scripts/registry_cli.ts info <plugin-name>
 */

import { existsSync } from 'fs';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { createHash } from 'crypto';
import { parse as parseYaml } from 'yaml';

// Configuration
const CONFIG_DIR = join(process.env.HOME || '~', '.liquid-registry');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEFAULT_REGISTRY = process.env.LIQUID_REGISTRY_URL || 'http://localhost:3000/registry';

interface CLIConfig {
    registry: string;
    token?: string;
    username?: string;
}

interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    capabilities?: string[];
    dependencies?: Record<string, string>;
    hooks?: Record<string, any[]>;
    commands?: any[];
    skills?: any[];
    agents?: any[];
    mcp?: any[];
}

// ============================================================================
// Configuration Management
// ============================================================================

async function loadConfig(): Promise<CLIConfig> {
    try {
        if (existsSync(CONFIG_FILE)) {
            const content = await readFile(CONFIG_FILE, 'utf-8');
            return JSON.parse(content);
        }
    } catch {
        // Ignore errors
    }

    return { registry: DEFAULT_REGISTRY };
}

async function saveConfig(config: CLIConfig): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ============================================================================
// API Client
// ============================================================================

async function apiRequest(
    path: string,
    options: {
        method?: string;
        body?: any;
        token?: string;
    } = {}
): Promise<any> {
    const config = await loadConfig();
    const url = `${config.registry}${path}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (options.token || config.token) {
        headers['Authorization'] = `Bearer ${options.token || config.token}`;
    }

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Login to registry
 */
async function cmdLogin(): Promise<void> {
    const config = await loadConfig();

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║       Liquid Plugin Registry Login        ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log(`Registry: ${config.registry}\n`);

    // Get credentials from stdin
    process.stdout.write('Username: ');
    const username = await readLine();

    process.stdout.write('Email: ');
    const email = await readLine();

    try {
        // Register or get existing user
        const result = await apiRequest('/users', {
            method: 'POST',
            body: { username, email }
        });

        config.token = result.token;
        config.username = result.user.username;
        await saveConfig(config);

        console.log('\n✓ Successfully logged in!');
        console.log(`  User: ${result.user.username}`);
        console.log(`  Token saved to: ${CONFIG_FILE}`);
        console.log('\n⚠️  Keep your token secret! Do not share it.');
    } catch (error) {
        console.error(`\n✗ Login failed: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Logout from registry
 */
async function cmdLogout(): Promise<void> {
    const config = await loadConfig();

    if (!config.token) {
        console.log('Not logged in.');
        return;
    }

    config.token = undefined;
    config.username = undefined;
    await saveConfig(config);

    console.log('✓ Logged out successfully');
}

/**
 * Show current user
 */
async function cmdWhoami(): Promise<void> {
    const config = await loadConfig();

    if (!config.token) {
        console.log('Not logged in. Run: bun run scripts/registry_cli.ts login');
        return;
    }

    try {
        const user = await apiRequest('/users/me');
        console.log(`Logged in as: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Verified: ${user.verified ? 'Yes' : 'No'}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Publish plugin to registry
 */
async function cmdPublish(pluginPath?: string): Promise<void> {
    const config = await loadConfig();

    if (!config.token) {
        console.error('Not logged in. Run: bun run scripts/registry_cli.ts login');
        process.exit(1);
    }

    const dir = resolve(pluginPath || '.');
    const manifestPath = join(dir, 'plugin.json');

    if (!existsSync(manifestPath)) {
        console.error(`No plugin.json found in ${dir}`);
        console.error('Make sure you are in a plugin directory or specify the path.');
        process.exit(1);
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║        Publishing Plugin to Registry      ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    try {
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);

        console.log(`Plugin: ${manifest.name}`);
        console.log(`Version: ${manifest.version}`);
        console.log(`Description: ${manifest.description}`);
        console.log(`Author: ${manifest.author}`);
        console.log(`License: ${manifest.license}`);

        if (manifest.capabilities?.length) {
            console.log(`Capabilities: ${manifest.capabilities.join(', ')}`);
        }

        console.log('\nPublishing...\n');

        const result = await apiRequest('/plugins', {
            method: 'POST',
            body: { manifest }
        });

        console.log('✓ Published successfully!');
        console.log(`  Plugin ID: ${result.pluginId}`);
        console.log(`  Version: ${result.version}`);
        console.log(`  URL: ${result.tarballUrl}`);

        if (result.warnings?.length) {
            console.log('\nWarnings:');
            for (const warning of result.warnings) {
                console.log(`  ⚠ ${warning}`);
            }
        }
    } catch (error) {
        console.error(`\n✗ Publish failed: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Install plugin from registry
 */
async function cmdInstall(pluginName: string, version?: string): Promise<void> {
    console.log(`\nInstalling ${pluginName}${version ? `@${version}` : ''}...\n`);

    try {
        // Get plugin info
        const plugin = await apiRequest(`/plugins/${pluginName}`);

        // Get version
        const versionToInstall = version || plugin.latestVersion;
        const versionInfo = await apiRequest(`/plugins/${pluginName}/${versionToInstall}`);

        console.log(`Plugin: ${plugin.name}`);
        console.log(`Version: ${versionInfo.version}`);
        console.log(`Author: ${plugin.author}`);

        // Check security scan
        if (versionInfo.securityScan) {
            const scan = versionInfo.securityScan;
            const statusColor = scan.status === 'passed' ? '\x1b[32m' : scan.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
            console.log(`Security: ${statusColor}${scan.status}\x1b[0m (score: ${scan.score}/100)`);

            if (scan.findings?.length > 0) {
                console.log('\nSecurity findings:');
                for (const finding of scan.findings.slice(0, 5)) {
                    const color = finding.severity === 'critical' || finding.severity === 'high' ? '\x1b[31m' : '\x1b[33m';
                    console.log(`  ${color}[${finding.severity}]\x1b[0m ${finding.message}`);
                }
            }
        }

        // Create installation directory
        const installDir = join(process.cwd(), 'skills', pluginName);

        console.log(`\nInstalling to: ${installDir}`);

        // In a real implementation, we'd:
        // 1. Download the tarball
        // 2. Verify the SHA-256 hash
        // 3. Extract to the installation directory
        // For now, just create a placeholder

        await mkdir(installDir, { recursive: true });
        await writeFile(
            join(installDir, 'plugin.json'),
            JSON.stringify(versionInfo.manifest, null, 2)
        );

        console.log('\n✓ Installation complete!');
        console.log(`  Run "bun run ${pluginName}" to use the plugin.`);

        // Check for dependencies
        if (versionInfo.manifest.dependencies) {
            const deps = Object.keys(versionInfo.manifest.dependencies);
            if (deps.length > 0) {
                console.log(`\nNote: This plugin has dependencies:`);
                for (const dep of deps) {
                    console.log(`  - ${dep}@${versionInfo.manifest.dependencies[dep]}`);
                }
                console.log('Install them with: bun run scripts/registry_cli.ts install <name>');
            }
        }
    } catch (error) {
        console.error(`\n✗ Installation failed: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Uninstall plugin
 */
async function cmdUninstall(pluginName: string): Promise<void> {
    const installDir = join(process.cwd(), 'skills', pluginName);

    if (!existsSync(installDir)) {
        console.error(`Plugin ${pluginName} is not installed.`);
        process.exit(1);
    }

    console.log(`Uninstalling ${pluginName}...`);

    await rm(installDir, { recursive: true, force: true });

    console.log(`✓ ${pluginName} has been uninstalled.`);
}

/**
 * Search for plugins
 */
async function cmdSearch(query: string): Promise<void> {
    console.log(`\nSearching for "${query}"...\n`);

    try {
        const result = await apiRequest(`/search?q=${encodeURIComponent(query)}`);

        if (result.plugins.length === 0) {
            console.log('No plugins found.');
            return;
        }

        console.log(`Found ${result.total} plugins:\n`);

        for (const plugin of result.plugins) {
            console.log(`  ${plugin.name} (${plugin.latestVersion})`);
            console.log(`    ${plugin.description}`);
            console.log(`    Downloads: ${plugin.downloads} | Stars: ${plugin.stars}`);
            console.log('');
        }

        if (result.hasMore) {
            console.log(
                `Showing ${result.plugins.length} of ${result.total}. Use --page to see more.`
            );
        }
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Show plugin info
 */
async function cmdInfo(pluginName: string): Promise<void> {
    try {
        const plugin = await apiRequest(`/plugins/${pluginName}`);
        const versions = await apiRequest(`/plugins/${pluginName}/versions`);

        console.log(`\n╔═══════════════════════════════════════════╗`);
        console.log(`║  ${plugin.name.padEnd(39)}║`);
        console.log(`╚═══════════════════════════════════════════╝\n`);

        console.log(`Description: ${plugin.description}`);
        console.log(`Author: ${plugin.author}`);
        console.log(`License: ${plugin.license}`);
        console.log(`Latest: ${plugin.latestVersion}`);
        console.log(`Downloads: ${plugin.downloads}`);
        console.log(`Stars: ${plugin.stars}`);

        if (plugin.homepage) {
            console.log(`Homepage: ${plugin.homepage}`);
        }

        if (plugin.repository) {
            console.log(`Repository: ${plugin.repository}`);
        }

        if (plugin.keywords?.length) {
            console.log(`Keywords: ${plugin.keywords.join(', ')}`);
        }

        if (plugin.deprecated) {
            console.log(`\n⚠️  This plugin is deprecated: ${plugin.deprecationMessage || 'No reason given'}`);
        }

        console.log(`\nVersions (${versions.versions.length}):`);
        for (const ver of versions.versions.slice(0, 10)) {
            const status = ver.status === 'yanked' ? ' [YANKED]' : '';
            console.log(`  ${ver.version}${status} - ${new Date(ver.publishedAt).toLocaleDateString()}`);
        }

        if (versions.versions.length > 10) {
            console.log(`  ... and ${versions.versions.length - 10} more`);
        }
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Show registry stats
 */
async function cmdStats(): Promise<void> {
    try {
        const stats = await apiRequest('/stats');

        console.log(`\n╔═══════════════════════════════════════════╗`);
        console.log(`║       Liquid Plugin Registry Stats        ║`);
        console.log(`╚═══════════════════════════════════════════╝\n`);

        console.log(`Total Plugins: ${stats.totalPlugins}`);
        console.log(`Total Versions: ${stats.totalVersions}`);
        console.log(`Total Downloads: ${stats.totalDownloads}`);
        console.log(`Total Users: ${stats.totalUsers}`);

        if (stats.topPlugins?.length) {
            console.log(`\nTop Plugins:`);
            for (const plugin of stats.topPlugins.slice(0, 5)) {
                console.log(`  ${plugin.name} - ${plugin.downloads} downloads`);
            }
        }

        if (stats.recentPublishes?.length) {
            console.log(`\nRecent Publishes:`);
            for (const ver of stats.recentPublishes.slice(0, 5)) {
                const date = new Date(ver.publishedAt).toLocaleDateString();
                console.log(`  ${ver.manifest.name}@${ver.version} by ${ver.publishedBy} (${date})`);
            }
        }
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

/**
 * Configure registry URL
 */
async function cmdConfig(key: string, value?: string): Promise<void> {
    const config = await loadConfig();

    if (!value) {
        // Get value
        console.log(`${key}: ${(config as any)[key] || '(not set)'}`);
        return;
    }

    // Set value
    if (key === 'registry') {
        config.registry = value;
    } else {
        console.error(`Unknown config key: ${key}`);
        process.exit(1);
    }

    await saveConfig(config);
    console.log(`✓ Set ${key} to ${value}`);
}

/**
 * Deprecate a plugin
 */
async function cmdDeprecate(pluginName: string, message?: string): Promise<void> {
    const config = await loadConfig();

    if (!config.token) {
        console.error('Not logged in. Run: bun run scripts/registry_cli.ts login');
        process.exit(1);
    }

    try {
        await apiRequest(`/plugins/${pluginName}/deprecate`, {
            method: 'POST',
            body: { message }
        });

        console.log(`✓ ${pluginName} has been deprecated.`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

// ============================================================================
// Utilities
// ============================================================================

async function readLine(): Promise<string> {
    return new Promise(resolve => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => {
            data += chunk;
            if (data.includes('\n')) {
                process.stdin.pause();
                resolve(data.trim());
            }
        });
        process.stdin.resume();
    });
}

function printUsage(): void {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║             Liquid Plugin Registry CLI                        ║
╚═══════════════════════════════════════════════════════════════╝

Usage: bun run scripts/registry_cli.ts <command> [options]

Commands:
  login                 Login to the registry
  logout                Logout from the registry
  whoami                Show current user
  publish [path]        Publish plugin to registry
  install <name>        Install a plugin
  uninstall <name>      Uninstall a plugin
  search <query>        Search for plugins
  info <name>           Show plugin details
  stats                 Show registry statistics
  config <key> [value]  Get/set configuration
  deprecate <name>      Deprecate a plugin

Examples:
  bun run scripts/registry_cli.ts login
  bun run scripts/registry_cli.ts publish ./my-plugin
  bun run scripts/registry_cli.ts install my-plugin
  bun run scripts/registry_cli.ts search "ui components"
  bun run scripts/registry_cli.ts config registry https://registry.example.com

Environment Variables:
  LIQUID_REGISTRY_URL   Override default registry URL
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'login':
            await cmdLogin();
            break;

        case 'logout':
            await cmdLogout();
            break;

        case 'whoami':
            await cmdWhoami();
            break;

        case 'publish':
            await cmdPublish(args[1]);
            break;

        case 'install':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts install <plugin-name> [version]');
                process.exit(1);
            }
            await cmdInstall(args[1], args[2]);
            break;

        case 'uninstall':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts uninstall <plugin-name>');
                process.exit(1);
            }
            await cmdUninstall(args[1]);
            break;

        case 'search':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts search <query>');
                process.exit(1);
            }
            await cmdSearch(args.slice(1).join(' '));
            break;

        case 'info':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts info <plugin-name>');
                process.exit(1);
            }
            await cmdInfo(args[1]);
            break;

        case 'stats':
            await cmdStats();
            break;

        case 'config':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts config <key> [value]');
                process.exit(1);
            }
            await cmdConfig(args[1], args[2]);
            break;

        case 'deprecate':
            if (!args[1]) {
                console.error('Usage: registry_cli.ts deprecate <plugin-name> [message]');
                process.exit(1);
            }
            await cmdDeprecate(args[1], args.slice(2).join(' ') || undefined);
            break;

        case 'help':
        case '--help':
        case '-h':
        case undefined:
            printUsage();
            break;

        default:
            console.error(`Unknown command: ${command}`);
            printUsage();
            process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
