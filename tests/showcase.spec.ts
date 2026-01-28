import { test, expect, Page } from '@playwright/test';

/**
 * Showcase (Component Library) Tests
 *
 * The showcase is now an app (_system/showcase) opened from the dock.
 * It renders as a floating GlassWindow containing GlassShowcaseApp,
 * which has a sidebar with category buttons (no more #nav-item-* IDs).
 * Categories are clicked by their label text.
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

async function clickCategory(page: Page, label: string) {
    const btn = page.locator('button').filter({ hasText: label }).first();
    await btn.click();
    await page.waitForTimeout(500);
}

test.describe('Showcase Component Library', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
    });

    test('Forms & Inputs Section', async ({ page }) => {
        await clickCategory(page, 'Forms & Inputs');

        // Verify form components are visible in the content area
        await expect(page.locator('text="Text Inputs"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Data Display Section', async ({ page }) => {
        await clickCategory(page, 'Data Display');

        await expect(page.locator('text="Metrics"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Layout & Grids Section', async ({ page }) => {
        await clickCategory(page, 'Layout & Grids');

        await expect(page.locator('text="Grids"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Overlays & Popovers Section', async ({ page }) => {
        await clickCategory(page, 'Overlays & Popovers');

        await expect(page.locator('text="Modals"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Media & Visuals Section', async ({ page }) => {
        await clickCategory(page, 'Media & Visuals');

        await expect(page.locator('text="Audio"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Complex Composites Section', async ({ page }) => {
        await clickCategory(page, 'Complex Composites');

        await expect(page.locator('text="Cards"').first()).toBeVisible({ timeout: 10000 });
    });

    test('Buttons & Actions Section', async ({ page }) => {
        await clickCategory(page, 'Buttons & Actions');

        await expect(page.locator('text="Basic"').first()).toBeVisible({ timeout: 10000 });
    });
});
