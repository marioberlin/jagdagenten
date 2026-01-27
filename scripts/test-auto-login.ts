#!/usr/bin/env bun

/**
 * Simple Auto-Login Test
 * Opens the page and captures console logs to verify auto-login is working
 */

import { chromium } from 'playwright';

async function testAutoLogin() {
    console.log('🔐 Testing Auto-Login Feature\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
        const text = msg.text();
        logs.push(text);
        if (text.includes('[AutoLogin]') || text.includes('auth')) {
            console.log(`📋 Console: ${text}`);
        }
    });

    try {
        console.log('📍 Navigating to http://localhost:5174/os\n');
        await page.goto('http://localhost:5174/os', { waitUntil: 'networkidle' });

        // Wait a bit for auto-login to potentially trigger
        console.log('⏳  Waiting 8 seconds for auto-login...\n');
        await page.waitForTimeout(8000);

        // Check if lock screen is visible
        const lockScreenVisible = await page.locator('text=LiquidOS is Locked').isVisible().catch(() => false);

        console.log(`🔒 Lock Screen Visible: ${lockScreenVisible}\n`);

        // Take a screenshot
        await page.screenshot({ path: '/tmp/auto-login-test.png' });
        console.log('📸 Screenshot saved to /tmp/auto-login-test.png\n');

        // Print all AutoLogin logs
        const autoLoginLogs = logs.filter(l => l.includes('[AutoLogin]'));
        if (autoLoginLogs.length > 0) {
            console.log('📝 AutoLogin Logs:');
            autoLoginLogs.forEach(log => console.log(`   ${log}`));
        } else {
            console.log('⚠️  No [AutoLogin] logs found - hook may not be running!');
        }

    } finally {
        await browser.close();
    }
}

testAutoLogin().catch(console.error);
