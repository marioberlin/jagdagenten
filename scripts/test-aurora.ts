#!/usr/bin/env node

/**
 * Aurora Weather App Direct Access Test
 * 
 * Tests Aurora by navigating directly to /os route
 * which should show the desktop with app icons
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
} from './lib/browser-test-utils.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const RESULTS_DIR = join(process.cwd(), 'docs/test-results/aurora');
const BASE_URL = 'http://localhost:5174';

async function ensureDir() {
    if (!existsSync(RESULTS_DIR)) {
        await mkdir(RESULTS_DIR, { recursive: true });
    }
}

async function testAuroraWeather(): Promise<void> {
    console.log('🌤️  Aurora Weather App Test');
    console.log('══════════════════════════════════════════════════\n');

    await ensureDir();

    // Try /os route directly (may bypass login)
    console.log('📍 Step 1: Navigating to /os...');
    await open(`${BASE_URL}/os`);
    await waitForLoad('networkidle');
    await wait(2000);

    const title = await getTitle();
    console.log(`   ✅ Page: "${title}"\n`);

    // Capture snapshot
    console.log('📸 Step 2: Capturing page snapshot...');
    const snap = await snapshot({ interactive: true });

    if (!snap.success) {
        throw new Error('Failed to capture snapshot');
    }

    const refs = snap.data.refs;
    console.log(`   ✅ Found ${Object.keys(refs).length} interactive elements\n`);

    // Print ALL elements to see what's available
    console.log('📋 All interactive elements:');
    Object.entries(refs).forEach(([ref, data]) => {
        const name = data.name ? `"${data.name}"` : '(unnamed)';
        console.log(`   @${ref}: ${data.role.padEnd(12)} ${name}`);
    });

    // Save snapshot
    await writeFile(join(RESULTS_DIR, 'os-page-snapshot.txt'), snap.data.snapshot);
    await writeFile(join(RESULTS_DIR, 'os-page-refs.json'), JSON.stringify(refs, null, 2));

    // Take screenshot  
    await screenshot({
        path: join(RESULTS_DIR, 'os-page.png'),
        fullPage: true,
    });

    console.log(`\n📁 Results saved to: ${RESULTS_DIR}`);
    console.log('\n═'.repeat(50));

    // Look for Aurora
    console.log('\n🔍 Searching for Aurora/Weather/Travel elements...\n');

    const auroraRefs = findRefsByName(refs, 'aurora');
    const weatherRefs = findRefsByName(refs, 'weather');
    const travelRefs = findRefsByName(refs, 'travel');
    const appRefs = findRefsByName(refs, 'app');

    console.log(`   Aurora matches: ${auroraRefs.length}`);
    console.log(`   Weather matches: ${weatherRefs.length}`);
    console.log(`   Travel matches: ${travelRefs.length}`);
    console.log(`   Generic "app" matches: ${appRefs.length}\n`);

    if (auroraRefs.length > 0) {
        console.log('   ✅ Found Aurora references:');
        auroraRefs.forEach(([ref, data]) => {
            console.log(`      @${ref}: ${data.role} "${data.name}"`);
        });

        // Click the first one
        const [launcherRef] = auroraRefs[0];
        console.log(`\n🖱️  Clicking @${launcherRef}...`);
        await click(`@${launcherRef}`);
        await wait(3000);

        // Capture app state
        const appSnap = await snapshot({ interactive: true });
        console.log(`\n   ✅ App loaded with ${Object.keys(appSnap.data.refs).length} elements`);

        await screenshot({
            path: join(RESULTS_DIR, 'aurora-app.png'),
            fullPage: true,
        });

        await writeFile(join(RESULTS_DIR, 'aurora-app-snapshot.txt'), appSnap.data.snapshot);

        console.log('   ✅ Aurora app screenshots saved!');
    } else {
        console.log('   ⚠️  No Aurora app found on /os page');
        console.log('   💡 The app may require authentication or be in a different location');
    }
}

runTest('Aurora Weather (Direct Access)', testAuroraWeather)
    .then((result) => {
        process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
