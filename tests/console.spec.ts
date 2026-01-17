import { test, expect } from '@playwright/test';

test.describe('Admin Console E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Assume frontend is running at localhost:5173
        await page.goto('/os/console');
        // Wait for hydration and main layout
        await page.waitForSelector('h1', { state: 'visible', timeout: 30000 });
    });

    test('Navigation and Tab Active States', async ({ page }) => {
        const tabs = ['Dashboard', 'Tasks', 'Contexts', 'Security'];

        for (const tab of tabs) {
            const tabButton = page.getByRole('button', { name: tab, exact: true });
            await tabButton.click();
            // Verify active state (assuming active tab has specific styling like bg-white/10)
            await expect(tabButton).toHaveClass(/bg-white\/10/);
        }
    });

    test('Dashboard Metrics and Activity', async ({ page }) => {
        await page.getByRole('button', { name: 'Dashboard', exact: true }).click();

        // Check for stat cards
        const stats = ['Total Tasks', 'Active', 'Completed', 'Failed'];
        for (const stat of stats) {
            // Find the p with the label, then its sibling with the value
            const label = page.getByText(stat, { exact: true });
            const value = label.locator('xpath=..').locator('p.font-bold');
            await expect(value).toBeVisible();
            await expect(value).not.toHaveText('');
        }

        // Check Recent Activity
        await expect(page.locator('h3:has-text("Recent Activity")')).toBeVisible();
        // Target activity items within the container following the header
        const activityItems = page.locator('div:has(h3:has-text("Recent Activity")) + div > div');
        // Expect at least one item (mock data should be present)
        await expect(activityItems.first()).toBeVisible();
    });

    test('Tasks Hub: Filtering and Search', async ({ page }) => {
        await page.getByRole('button', { name: 'Tasks', exact: true }).click();

        // Verify table headers (ID, Status, Agent, Context, Created, Duration, Artifacts, Actions)
        const headers = ['ID', 'Status', 'Agent', 'Context', 'Created'];
        for (const header of headers) {
            await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
        }

        // Test state filters (matching TaskFilters.tsx)
        const filters = ['All', 'working', 'completed', 'failed'];
        for (const filter of filters) {
            const filterBtn = page.getByRole('button', { name: filter, exact: true });
            await filterBtn.click();
            await expect(filterBtn).toHaveClass(/bg-white\/10/);
            // Give a small time for filter to apply
            await page.waitForTimeout(500);
        }

        // Test search
        const searchInput = page.getByPlaceholder('Search tasks...');
        await searchInput.fill('task-003');
        // Mock should filter to show task-003
        await expect(page.locator('tbody tr:has-text("task-003")')).toBeVisible();
    });

    test('Tasks Hub: Detail Sheet actions', async ({ page }) => {
        await page.getByRole('button', { name: 'Tasks', exact: true }).click();

        // Click first task row
        const firstRow = page.locator('tbody tr').first();
        await firstRow.click();

        // Detail sheet should open
        await expect(page.locator('h2:has-text("Task Detail")')).toBeVisible();

        // Verify tabs in detail sheet
        await expect(page.getByRole('button', { name: 'Overview', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Messages', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Logs', exact: true })).toBeVisible();

        // Test Retry action (if available/visible on a failed task)
        const retryBtn = page.getByRole('button', { name: 'Retry', exact: true });
        if (await retryBtn.isVisible()) {
            await retryBtn.click();
            // Check for toast
            await expect(page.locator('text=retry')).toBeVisible();
        }

        await page.getByRole('button', { name: 'Close', exact: true }).click();
    });

    test('Context Browser: Search and View Toggles', async ({ page }) => {
        await page.getByRole('button', { name: 'Contexts', exact: true }).click();

        // Search bar
        const searchInput = page.getByPlaceholder('Search contexts or agents...');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Crypto');

        // Grid/List toggle (use Icons)
        const gridButton = page.locator('button >> .lucide-grid-3x3').locator('..');
        const listButton = page.locator('button >> .lucide-layout-list').locator('..');

        await listButton.click();
        await expect(listButton).toHaveClass(/bg-white\/10/);

        await gridButton.click();
        await expect(gridButton).toHaveClass(/bg-white\/10/);

        // Open timeline - using text found in mock data/UI
        const contextCard = page.locator('div:has-text("Crypto Advisor")').first();
        if (await contextCard.isVisible()) {
            await contextCard.click();
            await expect(page.locator('h3:has-text("Task Timeline")')).toBeVisible();
        }
    });

    test('Security & API Settings functionality', async ({ page }) => {
        await page.getByRole('button', { name: 'Security', exact: true }).click();

        // Section headers
        await expect(page.locator('h3:has-text("API Tokens")')).toBeVisible();
        await expect(page.locator('h3:has-text("Remote Agents")')).toBeVisible();

        // Test Token Generation flow
        await page.getByRole('button', { name: 'Generate Token', exact: true }).click();
        await expect(page.locator('h2:has-text("Generate API Token")')).toBeVisible();

        // Fill form
        await page.locator('input[placeholder="e.g. CI/CD Pipeline"]').fill('E2E Test Token');
        await page.getByRole('button', { name: 'Generate', exact: true }).click();

        // Success display - check for "api_" prefix as implemented in hooks
        await expect(page.locator('text=api_')).toBeVisible();
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(page.locator('h2:has-text("Generate API Token")')).not.toBeVisible();
        // Revoke token
        const revokeBtn = page.getByRole('button', { name: 'Revoke', exact: true }).first();
        if (await revokeBtn.isVisible()) {
            await revokeBtn.click();
            await expect(page.locator('text=Token revoked')).toBeVisible();
        }
    });
});

