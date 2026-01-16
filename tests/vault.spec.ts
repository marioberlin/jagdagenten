import { test, expect } from '@playwright/test';

test.describe('Vault Settings Interface', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to settings with vault tab active
        await page.goto('/os/settings/vault');
        // Verify we are on the right URL
        await expect(page).toHaveURL(/.*\/os\/settings\/vault/, { timeout: 10000 });
        // Wait for the Settings header to be visible before checking tabs
        await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({ timeout: 10000 });
    });

    test('should display vault navigation tabs', async ({ page }) => {
        // Check main sub-tabs exist
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
        // Check if personal content or empty state is shown
        // Note: Assuming empty state or loaded state, we look for key elements
        const personalHeading = page.getByRole('heading', { name: /Personal|No personal profile/ });
        await expect(personalHeading).toBeVisible();

        // Switch to Security tab
        await page.getByRole('button', { name: 'Security' }).click();
        await expect(page.getByText('Locked Compartments')).toBeVisible();
    });

    test('should have search functionality in Entities tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Entities' }).click();
        const searchInput = page.getByPlaceholder('Search entities...');
        await expect(searchInput).toBeVisible();

        // Type in search
        await searchInput.fill('ShowHeroes');
        // We assume data is loaded or at least the input accepts text
        await expect(searchInput).toHaveValue('ShowHeroes');
    });

    test('should show security compartments', async ({ page }) => {
        await page.getByRole('button', { name: 'Security' }).click();
        // Check for Banking and Documents sections
        await expect(page.getByText('Banking')).toBeVisible();
        await expect(page.getByText('Documents')).toBeVisible();

        // Check locked status indicators
        await expect(page.getByText('Locked', { exact: true }).first()).toBeVisible();
    });

    test('should display agent bar in Entities tab', async ({ page }) => {
        await page.getByRole('button', { name: 'Entities' }).click();
        await expect(page.getByPlaceholder('Paste company details')).toBeVisible();
    });
});
