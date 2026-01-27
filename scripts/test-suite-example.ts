#!/usr/bin/env node

/**
 * Example Test Suite Using Browser Test Utilities
 * 
 * Demonstrates how to use the reusable browser-test-utils module
 */

import {
    open,
    close,
    waitForLoad,
    wait,
    snapshot,
    click,
    screenshot,
    getTitle,
    findRefsByName,
    printRefs,
    runTest,
    type TestResult,
} from './lib/browser-test-utils.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const RESULTS_DIR = join(process.cwd(), 'docs/test-results');

async function ensureDir() {
    if (!existsSync(RESULTS_DIR)) {
        await mkdir(RESULTS_DIR, { recursive: true });
    }
}

/**
 * Test 1: LiquidOS Home Page Load
 */
async function testHomePageLoad(): Promise<void> {
    // Navigate
    await open('http://localhost:5174');
    await waitForLoad('networkidle');
    await wait(1000);

    // Get title
    const title = await getTitle();
    console.log(`   Page title: "${title}"`);

    // Capture snapshot
    const snap = await snapshot({ interactive: true });

    if (!snap.success) {
        throw new Error('Failed to capture snapshot');
    }

    printRefs(snap.data.refs, 15);

    // Save snapshot
    const snapshotPath = join(RESULTS_DIR, 'home-page-snapshot.txt');
    await writeFile(snapshotPath, snap.data.snapshot);
    console.log(`\n   💾 Snapshot saved: ${snapshotPath}`);

    // Take screenshot
    const screenshotPath = join(RESULTS_DIR, 'home-page.png');
    await screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📷 Screenshot saved: ${screenshotPath}`);
}

/**
 * Test 2: Find and Interact with App Launchers
 */
async function testAppLaunchers(): Promise<void> {
    // Navigate
    await open('http://localhost:5174');
    await waitForLoad('networkidle');
    await wait(1000);

    // Capture snapshot
    const snap = await snapshot({ interactive: true });

    if (!snap.success) {
        throw new Error('Failed to capture snapshot');
    }

    const refs = snap.data.refs;

    // Find button elements (likely app launchers)
    const buttons = Object.entries(refs).filter(([_, data]) =>
        data.role === 'button'
    );

    console.log(`\n   Found ${buttons.length} buttons:`);
    buttons.slice(0, 10).forEach(([ref, data]) => {
        console.log(`      @${ref}: "${data.name || '(unnamed)'}"`);
    });

    // Find Aurora-related elements
    const auroraElements = findRefsByName(refs, 'aurora|weather');

    if (auroraElements.length > 0) {
        console.log(`\n   ✨ Found Aurora/Weather elements:`);
        auroraElements.forEach(([ref, data]) => {
            console.log(`      @${ref}: ${data.role} "${data.name}"`);
        });

        // Try clicking the first one
        const [firstRef, firstData] = auroraElements[0];
        console.log(`\n   🖱️  Clicking: @${firstRef} (${firstData.role} "${firstData.name}")`);

        await click(`@${firstRef}`);
        await wait(2000);

        // Capture post-click state
        const postSnap = await snapshot({ interactive: true });
        if (postSnap.success) {
            console.log(`   ✅ Post-click: ${Object.keys(postSnap.data.refs).length} elements`);

            // Save post-click screenshot
            const postScreenshot = join(RESULTS_DIR, 'after-aurora-click.png');
            await screenshot({ path: postScreenshot, fullPage: true });
            console.log(`   📷 Post-click screenshot: ${postScreenshot}`);
        }
    } else {
        console.log(`\n   ⚠️  No Aurora/Weather elements found`);
    }
}

/**
 * Test 3: Responsive Layout Test
 */
async function testResponsiveLayout(): Promise<void> {
    await open('http://localhost:5174');
    await waitForLoad();

    // Test different viewports
    const viewports = [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
        console.log(`\n   📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

        // Note: setViewport is async in the utils
        // await setViewport(viewport.width, viewport.height);
        await wait(1000);

        const screenshotPath = join(RESULTS_DIR, `layout-${viewport.name}.png`);
        await screenshot({ path: screenshotPath, fullPage: true });
        console.log(`      📷 Screenshot: ${screenshotPath}`);
    }
}

/**
 * Main test runner
 */
async function main() {
    await ensureDir();

    console.log('🚀 Browser Test Suite');
    console.log('=====================\n');

    const results: TestResult[] = [];

    // Run tests
    results.push(await runTest('Home Page Load', testHomePageLoad));
    results.push(await runTest('App Launchers Interaction', testAppLaunchers));
    // results.push(await runTest('Responsive Layout', testResponsiveLayout));

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Test Summary');
    console.log('═'.repeat(50));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n   Total: ${results.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);

    results.forEach((result, i) => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} Test ${i + 1}: ${result.duration}ms${result.error ? ` - ${result.error}` : ''}`);
    });

    console.log('\n   📁 Results directory: ' + RESULTS_DIR);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
