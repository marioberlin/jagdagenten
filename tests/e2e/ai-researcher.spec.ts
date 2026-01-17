import { test, expect } from '@playwright/test';

test.describe('AI Researcher Agent', () => {
    test('should perform a real web search and display results', async ({ page }) => {
        test.setTimeout(60000);
        // 1. Navigate to the demo page
        await page.goto('/os/demos/ai-researcher');

        // 2. Wait for the chat interface to load (look for sidebar input)
        const input = page.getByPlaceholder('Type a command...');
        await expect(input).toBeVisible({ timeout: 15000 });

        // 3. Send a search query
        const query = 'Liquid';
        await input.click(); // Ensure focus
        await input.fill(query);
        await input.press('Enter');

        // 4. Verification: Wait for results to appear
        // We look for a result title (h3). 
        // Note: Even if search fails due to rate-limiting, the agent should respond.
        // But we want to verify real results if possible.
        await expect(page.locator('h3').first()).toBeVisible({ timeout: 60000 });

        // 5. Ask to extract facts
        await input.fill('Extract key facts from these results');
        await input.press('Enter');

        // 6. Verify facts appear
        // Wait for "Key Facts" header and content
        await expect(page.getByText('Key Facts', { exact: true })).toBeVisible({ timeout: 30000 });
        // Check for confidence badge which is unique to fact items
        await expect(page.getByText('Confidence', { exact: false }).first()).toBeVisible({ timeout: 30000 });
    });
});
