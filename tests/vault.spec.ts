import { test, expect, Page } from '@playwright/test';

/**
 * Vault Settings Interface Tests
 *
 * The vault is now a tab within the Settings app (_system/settings).
 * To reach it: navigate to /os → open Settings app via dock → click Vault tab.
 * The Settings app renders as a floating GlassWindow.
 */

async function openSettingsVault(page: Page) {
    await page.goto('/os');
    await page.waitForSelector('header, [role="menubar"]', { state: 'visible', timeout: 30000 });

    // Open Settings app by clicking its dock icon (label = "System Preferences")
    const dockTooltip = page.locator('.fixed.bottom-8').locator('text="System Preferences"').first();
    await dockTooltip.locator('..').click({ force: true });
    await page.waitForTimeout(1000);

    // Wait for the Settings window to render
    await expect(page.locator('text="Settings"').first()).toBeVisible({ timeout: 15000 });

    // Click the "Vault" tab in the settings sidebar
    const vaultTab = page.locator('button').filter({ hasText: 'Vault' }).first();
    await vaultTab.click();
    await page.waitForTimeout(500);
}

test.describe('Vault Settings Interface', () => {
    test.beforeEach(async ({ page }) => {
        await openSettingsVault(page);
    });

    test('should display vault navigation tabs', async ({ page }) => {
        // Check main sub-tabs exist within the vault panel
        await expect(page.getByRole('button', { name: 'Entities' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Personal' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Roles' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Autofill' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Security' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Audit' })).toBeVisible();
    });

    test('should allow switching between tabs', async ({ page }) => {
        // Switch to Personal tab
        await page.getByRole('button', { name: 'Personal' }).click();
        const personalHeading = page.getByRole('heading', { name: /Personal|No personal profile/ });
        await expect(personalHeading).toBeVisible({ timeout: 5000 });

        // Switch to Security tab
        await page.getByRole('button', { name: 'Security' }).click();
        await expect(page.getByText('Locked Compartments')).toBeVisible({ timeout: 5000 });
    });

    test('should have search functionality in Entities tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Entities' }).click();
        const searchInput = page.getByPlaceholder('Search entities...');
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        await searchInput.fill('ShowHeroes');
        await expect(searchInput).toHaveValue('ShowHeroes');
    });

    test('should show security compartments', async ({ page }) => {
        await page.getByRole('button', { name: 'Security' }).click();
        await expect(page.getByText('Banking')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Documents')).toBeVisible();
        await expect(page.getByText('Locked', { exact: true }).first()).toBeVisible();
    });

    test('should display agent bar in Entities tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Entities' }).click();
        await expect(page.getByPlaceholder('Paste company details')).toBeVisible({ timeout: 5000 });
    });
});
