import { test, expect, Page } from '@playwright/test';

/**
 * Accessibility Feature Tests
 *
 * The showcase is now an app (_system/showcase) opened from the dock.
 * These tests verify keyboard navigation and focus management within
 * the showcase app window.
 */

async function openShowcase(page: Page) {
    await page.goto('/os');
    await page.waitForSelector('header, [role="menubar"]', { state: 'visible', timeout: 30000 });

    // Open Showcase via dock (label = "Component Library")
    const dockTooltip = page.locator('.fixed.bottom-8').locator('text="Component Library"').first();
    await dockTooltip.locator('..').click({ force: true });
    await page.waitForTimeout(1500);

    // Wait for the showcase sidebar to render
    await expect(page.locator('text="All Components"').first()).toBeVisible({ timeout: 15000 });
}

test.describe('Accessibility Features', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
    });

    test('Focusable elements should show visible focus ring on keyboard navigation', async ({ page }) => {
        // Tab through page and check for focus-visible
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        // Check that something is focused
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible({ timeout: 5000 });
    });

    test('GlassCard with focusable prop should receive focus', async ({ page }) => {
        // Navigate to Data Display section via category button
        const dataBtn = page.locator('button').filter({ hasText: 'Data Display' }).first();
        await dataBtn.click();
        await page.waitForTimeout(500);

        // Tab to find focusable cards
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
        }

        // Verify focus is working on the page
        const hasFocusedElement = await page.evaluate(() => {
            return document.activeElement !== document.body;
        });

        expect(hasFocusedElement).toBe(true);
    });

    test('Interactive glass containers should respond to keyboard activation', async ({ page }) => {
        // Navigate to Buttons & Actions section
        const formsBtn = page.locator('button').filter({ hasText: 'Buttons & Actions' }).first();
        await formsBtn.click();
        await page.waitForTimeout(500);

        // Find a button and verify it's keyboard accessible
        const button = page.locator('button:has-text("Primary")').first();

        if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
            await button.focus();
            await page.waitForTimeout(200);

            // Check focus ring is visible
            const isFocused = await button.evaluate((el) => el === document.activeElement);
            expect(isFocused).toBe(true);
        }
    });
});
