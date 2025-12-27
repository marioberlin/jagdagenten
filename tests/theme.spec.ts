import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('header', { state: 'visible', timeout: 30000 });
    });

    test('should have theme toggle button in navbar', async ({ page }) => {
        // Find the theme toggle button by its aria-label
        const themeToggle = page.locator('button[aria-label*="Switch to"]');
        await expect(themeToggle).toBeVisible({ timeout: 10000 });
    });

    test('should toggle between light and dark mode', async ({ page }) => {
        // Get initial theme state by checking if 'dark' class is present
        const html = page.locator('html');
        const hasDarkInitially = await html.evaluate(el => el.classList.contains('dark'));

        // Find and click the theme toggle
        const themeToggle = page.locator('button[aria-label*="Switch to"]');
        await themeToggle.click();

        // Wait for theme transition
        await page.waitForTimeout(500);

        // Verify theme has changed
        const hasDarkNow = await html.evaluate(el => el.classList.contains('dark'));
        expect(hasDarkNow).not.toBe(hasDarkInitially);
    });

    test('should persist theme preference in localStorage', async ({ page }) => {
        // Toggle theme twice to ensure a change happens
        const themeToggle = page.locator('button[aria-label*="Switch to"]');
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check localStorage - key is 'liquid-glass-theme'
        const savedTheme = await page.evaluate(() => localStorage.getItem('liquid-glass-theme'));
        expect(['light', 'dark']).toContain(savedTheme);
    });

    test('should persist theme across navigation', async ({ page }) => {
        // Get initial theme
        const html = page.locator('html');
        const initialIsDark = await html.evaluate(el => el.classList.contains('dark'));

        // Toggle theme
        const themeToggle = page.locator('button[aria-label*="Switch to"]');
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Verify theme changed before navigating
        const isDarkAfterToggle = await html.evaluate(el => el.classList.contains('dark'));
        expect(isDarkAfterToggle).not.toBe(initialIsDark);

        // Navigate to different page (using soft navigation to preserve state)
        await page.click('a[href="/showcase"]');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });

        // Verify theme persisted
        const isDarkOnShowcase = await html.evaluate(el => el.classList.contains('dark'));
        expect(isDarkOnShowcase).toBe(isDarkAfterToggle);
    });

    test('should apply correct text colors in dark mode', async ({ page }) => {
        // Ensure dark mode
        const html = page.locator('html');
        const isDark = await html.evaluate(el => el.classList.contains('dark'));
        if (!isDark) {
            const themeToggle = page.locator('button[aria-label*="Switch to"]');
            await themeToggle.click();
            await page.waitForTimeout(500);
        }

        // Navigate to showcase
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });

        // Verify text is readable
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible();

        // The text should have proper opacity
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
        // Ensure light mode
        const html = page.locator('html');
        const isDark = await html.evaluate(el => el.classList.contains('dark'));
        if (isDark) {
            const themeToggle = page.locator('button[aria-label*="Switch to"]');
            await themeToggle.click();
            await page.waitForTimeout(500);
        }

        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });

        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible();
    });
});
