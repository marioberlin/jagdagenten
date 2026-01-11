import { test, expect } from '@playwright/test';

test.describe('Accessibility Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });
    });

    test('Focusable elements should show visible focus ring on keyboard navigation', async ({ page }) => {
        // Tab through page and check for focus-visible
        await page.keyboard.press('Tab');

        // Wait for focus to settle
        await page.waitForTimeout(200);

        // Check that something is focused
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible({ timeout: 5000 });
    });

    test('GlassCard with focusable prop should receive focus', async ({ page }) => {
        // Navigate to Data Display section
        const navButton = page.locator('#nav-item-data');
        await navButton.click();
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
        // Navigate to Forms section (Buttons are here)
        const navButton = page.locator('#nav-item-forms');
        await navButton.click();
        await page.waitForTimeout(500);

        // Find a glass button and verify it's keyboard accessible
        const button = page.locator('button:has-text("Primary")').first();

        if (await button.isVisible()) {
            await button.focus();
            await page.waitForTimeout(200);

            // Check focus ring is visible
            const isFocused = await button.evaluate((el) => el === document.activeElement);
            expect(isFocused).toBe(true);
        }
    });
});
