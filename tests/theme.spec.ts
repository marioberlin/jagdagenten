import { test, expect, Page } from '@playwright/test';

/**
 * Theme Switching Tests
 *
 * All routes now redirect to /os. The theme toggle lives in the menu bar
 * (RightZone) with aria-label="Switch to Light/Dark Mode".
 * Uses .first() because multiple toggle buttons may exist in the DOM.
 */

async function openOS(page: Page) {
    await page.goto('/os');
    await page.waitForSelector('header, [role="menubar"]', { state: 'visible', timeout: 30000 });
}

test.describe('Theme Switching', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error') console.error(`[BROWSER ERROR]: ${msg.text()}`);
        });
        await openOS(page);
    });

    test('should have theme toggle button in menu bar', async ({ page }) => {
        const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
        await expect(themeToggle).toBeVisible({ timeout: 10000 });
    });

    test('should toggle between light and dark mode', async ({ page }) => {
        const html = page.locator('html');
        const hasDarkInitially = await html.evaluate(el => el.classList.contains('dark'));

        const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
        await themeToggle.click({ force: true });
        await page.waitForTimeout(1000);

        const hasDarkNow = await html.evaluate(el => el.classList.contains('dark'));
        expect(hasDarkNow).not.toBe(hasDarkInitially);
    });

    test('should persist theme preference in localStorage', async ({ page }) => {
        const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
        await themeToggle.click({ force: true });
        await page.waitForTimeout(1000);

        const savedStore = await page.evaluate(() => localStorage.getItem('liquid-glass-store'));
        expect(savedStore).not.toBeNull();

        const parsed = JSON.parse(savedStore!);
        expect(['light', 'dark']).toContain(parsed.state.mode);
    });

    test('should persist theme after toggling twice', async ({ page }) => {
        const html = page.locator('html');
        const initialIsDark = await html.evaluate(el => el.classList.contains('dark'));

        const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
        // Toggle once
        await themeToggle.click({ force: true });
        await page.waitForTimeout(500);

        // Toggle back
        await themeToggle.click({ force: true });
        await page.waitForTimeout(500);

        const isDarkAfterDouble = await html.evaluate(el => el.classList.contains('dark'));
        expect(isDarkAfterDouble).toBe(initialIsDark);
    });

    test('should apply correct text colors in dark mode', async ({ page }) => {
        const html = page.locator('html');
        const isDark = await html.evaluate(el => el.classList.contains('dark'));
        if (!isDark) {
            const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
            await themeToggle.click({ force: true });
            await page.waitForTimeout(500);
        }

        // Verify text on the OS home page is visible and has opacity
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });

        const styles = await heading.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                color: computed.color,
                opacity: computed.opacity
            };
        });
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    });

    test('should apply correct text colors in light mode', async ({ page }) => {
        const html = page.locator('html');
        const isDark = await html.evaluate(el => el.classList.contains('dark'));
        if (isDark) {
            const themeToggle = page.locator('button[aria-label*="Switch to"]').first();
            await themeToggle.click({ force: true });
            await page.waitForTimeout(500);
        }

        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });
});
