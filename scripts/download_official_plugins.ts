
import { spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const MARKETPLACE_URL = 'https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json';
const TMP_DIR = join(process.cwd(), 'tmp_plugins');
const OFFICIAL_REPO_URL = 'https://github.com/anthropics/claude-plugins-official.git';
const OFFICIAL_REPO_DIR = join(TMP_DIR, 'official-repo');

interface PluginSource {
    source: string | { source: 'url', url: string };
    name: string;
}

interface Marketplace {
    plugins: PluginSource[];
}

async function runCommand(command: string, args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: 'inherit', cwd: cwd || process.cwd() });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
        });
    });
}

function ensureDir(dir: string) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

async function main() {
    console.log('🚀 Starting Official Claude Plugins Download...');

    // 1. Prepare .tmp/plugins directory
    console.log(`\n📂 Preparing Directory: ${TMP_DIR}`);
    if (existsSync(TMP_DIR)) {
        rmSync(TMP_DIR, { recursive: true, force: true });
    }
    ensureDir(TMP_DIR);

    // 2. Fetch Marketplace Data
    console.log(`\n📥 Fetching marketplace data from ${MARKETPLACE_URL}...`);
    const response = await fetch(MARKETPLACE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch marketplace data: ${response.statusText}`);
    }
    const data = await response.json() as Marketplace;
    console.log(`✅ Found ${data.plugins.length} plugins.`);

    // 3. Clone Official Repository
    console.log(`\n📦 Cloning Official Repository...`);
    await runCommand('git', ['clone', '--depth', '1', OFFICIAL_REPO_URL, OFFICIAL_REPO_DIR]);
    console.log(`✅ Cloned official repo to ${OFFICIAL_REPO_DIR}`);

    // 4. Process External Plugins
    const externalPlugins = data.plugins.filter(p => typeof p.source === 'object' && p.source.source === 'url');
    console.log(`\n🌐 Found ${externalPlugins.length} external plugins to download.`);

    for (const plugin of externalPlugins) {
        if (typeof plugin.source === 'object' && plugin.source.source === 'url') {
            const pluginDir = join(TMP_DIR, 'external', plugin.name);
            ensureDir(join(TMP_DIR, 'external'));

            console.log(`\n⬇️  Downloading ${plugin.name} from ${plugin.source.url}...`);
            try {
                // Ensure URL ends with .git for cloning (GitHub convention usually safe, but good to handle)
                // Note: git clone works fine usually without .git suffix too
                await runCommand('git', ['clone', '--depth', '1', plugin.source.url, pluginDir]);
            } catch (error) {
                console.error(`❌ Failed to download ${plugin.name}:`, error);
            }
        }
    }

    console.log(`\n🎉 Download Complete! All plugins are in ${TMP_DIR}`);
}

main().catch((err) => {
    console.error('\n❌ Fatal Error:', err);
    process.exit(1);
});
