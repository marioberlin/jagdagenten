import { test, expect, Page } from '@playwright/test';

/**
 * Visual Regression: Glass Effects Tests
 *
 * The showcase is now an app (_system/showcase) opened from the dock.
 * These tests take screenshots of showcase sections for visual regression.
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

test.describe('Visual Regression: Glass Effects', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
    });

    test('Buttons section renders correctly', async ({ page }) => {
        // Navigate to Buttons & Actions category
        const navButton = page.locator('button').filter({ hasText: 'Buttons & Actions' }).first();
        await navButton.click();
        await page.waitForTimeout(500);

        // Take screenshot of the main content area
        const contentArea = page.locator('section, [class*="grid"]').first();
        await expect(contentArea).toHaveScreenshot('buttons-section.png', {
            maxDiffPixels: 100,
        });
    });

    test('Forms section renders correctly in dark mode', async ({ page }) => {
        // Navigate to Forms & Inputs category
        const navButton = page.locator('button').filter({ hasText: 'Forms & Inputs' }).first();
        await navButton.click();
        await page.waitForTimeout(500);

        // Take screenshot
        const contentArea = page.locator('section, [class*="grid"]').first();
        await expect(contentArea).toHaveScreenshot('forms-section-dark.png', {
            maxDiffPixels: 100,
        });
    });

    test('GlassContainer materials render with correct blur levels', async ({ page }) => {
        // Navigate to Buttons & Actions to get glass containers
        const navButton = page.locator('button').filter({ hasText: 'Buttons & Actions' }).first();
        await navButton.click();
        await page.waitForTimeout(500);

        // Take a full-page screenshot to capture glass effects
        await expect(page).toHaveScreenshot('showcase-glass-effects.png', {
            fullPage: false,
            maxDiffPixels: 200,
        });
    });
});
