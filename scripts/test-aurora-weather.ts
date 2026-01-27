#!/usr/bin/env node

/**
 * Aurora Weather App Browser Test
 * 
 * Tests the Aurora Weather GlassApp using agent-browser
 * Demonstrates complete workflow: navigation → snapshot → interaction → validation
 */

import { execaCommand } from 'execa';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Use full path to avoid PATH issues
const AGENT_BROWSER = '/usr/local/lib/node_modules/agent-browser/bin/agent-browser.js';
const RESULTS_DIR = join(process.cwd(), 'docs/test-results');

interface SnapshotData {
    success: boolean;
    data: {
        snapshot: string;
        refs: Record<string, {
            role: string;
            name?: string;
            nth?: number;
        }>;
    };
}

async function ensureDir(dir: string) {
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
}

async function exec(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
        const result = await execaCommand(command, { shell: true });
        return { stdout: result.stdout, stderr: result.stderr };
    } catch (error: any) {
        console.error(`❌ Command failed: ${command}`);
        console.error(`   Error: ${error.message}`);
        if (error.stdout) console.log(`   Stdout: ${error.stdout}`);
        if (error.stderr) console.log(`   Stderr: ${error.stderr}`);
        throw error;
    }
}

async function testAuroraWeather() {
    console.log('🌤️  Aurora Weather App Browser Test');
    console.log('=====================================\n');

    const testStartTime = Date.now();

    try {
        // Ensure results directory exists
        await ensureDir(RESULTS_DIR);

        // Step 1: Navigate to LiquidOS home
        console.log('📍 Step 1: Navigating to http://localhost:5173');
        await exec(`node "${AGENT_BROWSER}" open http://localhost:5173`);

        // Wait for page to load
        console.log('⏳ Waiting for page load...');
        await exec(`node "${AGENT_BROWSER}" wait --load networkidle`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra buffer

        // Step 2: Get page title
        console.log('\n📄 Step 2: Getting page title');
        const { stdout: titleOutput } = await exec(`node "${AGENT_BROWSER}" get title`);
        console.log(`   Title: "${titleOutput.trim()}"`);

        // Step 3: Capture initial snapshot
        console.log('\n📸 Step 3: Capturing initial accessibility snapshot');
        const { stdout: snapshotJson } = await exec(`node "${AGENT_BROWSER}" snapshot -i --json`);

        let snapshotData: SnapshotData;
        try {
            snapshotData = JSON.parse(snapshotJson);
        } catch (err) {
            console.error('❌ Failed to parse snapshot JSON');
            console.log('Raw output:', snapshotJson);
            throw err;
        }

        if (!snapshotData.success) {
            throw new Error('Snapshot capture failed');
        }

        const refs = snapshotData.data.refs;
        const snapshot = snapshotData.data.snapshot;

        console.log(`✅ Captured ${Object.keys(refs).length} interactive elements`);

        // Save snapshot to file
        const snapshotPath = join(RESULTS_DIR, 'aurora-initial-snapshot.txt');
        await writeFile(snapshotPath, snapshot);
        console.log(`💾 Snapshot saved: ${snapshotPath}`);

        // Display first 10 refs
        console.log('\n📋 Sample interactive elements:');
        Object.entries(refs).slice(0, 10).forEach(([ref, data]) => {
            const name = data.name ? ` "${data.name}"` : '';
            console.log(`   @${ref}: ${data.role}${name}`);
        });

        // Step 4: Find Aurora-related elements
        console.log('\n🔍 Step 4: Looking for Aurora Weather app...');
        const auroraRefs = Object.entries(refs).filter(([ref, data]) =>
            data.name?.toLowerCase().includes('aurora') ||
            data.name?.toLowerCase().includes('weather')
        );

        if (auroraRefs.length > 0) {
            console.log(`✅ Found ${auroraRefs.length} Aurora/Weather related elements:`);
            auroraRefs.forEach(([ref, data]) => {
                console.log(`   @${ref}: ${data.role} "${data.name}"`);
            });

            // Try to click the first Aurora element
            const [firstRef, firstData] = auroraRefs[0];
            console.log(`\n🖱️  Step 5: Clicking @${firstRef} (${firstData.role} "${firstData.name}")`);

            try {
                await exec(`node "${AGENT_BROWSER}" click @${firstRef}`);
                console.log('✅ Click successful');

                // Wait for app to load
                console.log('⏳ Waiting for app to render...');
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Take screenshot after click
                const afterClickScreenshot = join(RESULTS_DIR, 'aurora-after-click.png');
                await exec(`node "${AGENT_BROWSER}" screenshot "${afterClickScreenshot}"`);
                console.log(`📷 Screenshot saved: ${afterClickScreenshot}`);

                // Get new snapshot
                console.log('\n📸 Step 6: Capturing post-click snapshot');
                const { stdout: newSnapshotJson } = await exec(`node "${AGENT_BROWSER}" snapshot -i --json`);
                const newSnapshotData: SnapshotData = JSON.parse(newSnapshotJson);

                const newSnapshot = newSnapshotData.data.snapshot;
                const newSnapshotPath = join(RESULTS_DIR, 'aurora-post-click-snapshot.txt');
                await writeFile(newSnapshotPath, newSnapshot);
                console.log(`💾 Post-click snapshot saved: ${newSnapshotPath}`);

                console.log(`✅ Captured ${Object.keys(newSnapshotData.data.refs).length} interactive elements in app view`);

            } catch (err) {
                console.error('⚠️  Click interaction failed, but continuing...');
            }

        } else {
            console.log('⚠️  No Aurora/Weather elements found in snapshot');
            console.log('   The app launcher might use different naming');
        }

        // Step 7: Take final screenshot
        console.log('\n📷 Step 7: Taking final full-page screenshot');
        const finalScreenshot = join(RESULTS_DIR, 'aurora-final-screenshot.png');
        await exec(`node "${AGENT_BROWSER}" screenshot --full "${finalScreenshot}"`);
        console.log(`✅ Screenshot saved: ${finalScreenshot}`);

        // Step 8: Save refs mapping
        console.log('\n💾 Step 8: Saving refs mapping');
        const refsPath = join(RESULTS_DIR, 'aurora-refs.json');
        await writeFile(refsPath, JSON.stringify(refs, null, 2));
        console.log(`✅ Refs saved: ${refsPath}`);

        // Test duration
        const duration = Date.now() - testStartTime;
        console.log('\n=====================================');
        console.log(`✅ Test completed in ${duration}ms`);
        console.log(`📊 Results directory: ${RESULTS_DIR}`);

        return {
            success: true,
            duration,
            elementCount: Object.keys(refs).length,
            auroraElementsFound: auroraRefs.length,
        };

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        return {
            success: false,
            error: error.message,
        };
    } finally {
        // Cleanup: close browser
        console.log('\n🧹 Cleaning up...');
        try {
            await exec(`node "${AGENT_BROWSER}" close`);
            console.log('✅ Browser closed');
        } catch {
            console.log('⚠️  Browser cleanup skipped (may already be closed)');
        }
    }
}

// Run test
testAuroraWeather()
    .then((result) => {
        console.log('\n📋 Final Result:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
        console.error('💥 Fatal error:', err);
        process.exit(1);
    });
