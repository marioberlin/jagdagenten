import { test, expect } from '@playwright/test';

test.describe('Visual Regression: Glass Effects', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });
    });

    test('Buttons section renders correctly', async ({ page }) => {
        // Navigate to Buttons section
        const navButton = page.locator('button', { hasText: 'Buttons & Interactive' });
        await navButton.click();
        await page.waitForTimeout(500);

        // Take screenshot of buttons section
        const buttonsSection = page.locator('section').first();
        await expect(buttonsSection).toHaveScreenshot('buttons-section.png', {
            maxDiffPixels: 100,
        });
    });

    test('Forms section renders correctly in dark mode', async ({ page }) => {
        // Navigate to Forms section
        const navButton = page.locator('button', { hasText: 'Forms & Inputs' });
        await navButton.click();
        await page.waitForTimeout(500);

        // Take screenshot
        const formsSection = page.locator('section').first();
        await expect(formsSection).toHaveScreenshot('forms-section-dark.png', {
            maxDiffPixels: 100,
        });
    });

    test('GlassContainer materials render with correct blur levels', async ({ page }) => {
        // Navigate to a section with visible glass containers
        const navButton = page.locator('button', { hasText: 'Buttons & Interactive' });
        await navButton.click();
        await page.waitForTimeout(500);

        // Take a full-page screenshot to capture glass effects
        await expect(page).toHaveScreenshot('showcase-glass-effects.png', {
            fullPage: false,
            maxDiffPixels: 200,
        });
    });
});
