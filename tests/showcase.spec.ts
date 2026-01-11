import { test, expect } from '@playwright/test';

test.describe('Showcase Expansion Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        // Wait for the navigation to be present to ensure hydration
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });
    });

    test('Forms & Inputs Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-forms');
        await navButton.click();

        // Wait for section verification
        await expect(page.locator('h3:has-text("Rich & Specialized Inputs")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('div[data-placeholder="Type some markdown here..."]')).toBeVisible();
        await expect(page.locator('text=Payment Form')).toBeVisible();
    });

    test('Data & Charts Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-data');
        await navButton.click();

        await expect(page.locator('h3:has-text("Metrics & Processes")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Total Revenue')).toBeVisible();

        // New Components
        await expect(page.locator('text=Traffic Sources')).toBeVisible();
        await expect(page.locator('text=Sales Overview')).toBeVisible();
        await expect(page.locator('text=System Status')).toBeVisible();
        await expect(page.getByText('Online', { exact: true }).first()).toBeVisible(); // GlassStatus verification

        await expect(page.locator('text=Timeline')).toBeVisible();
    });

    test('Layout & Grids Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-layout');
        await navButton.click();

        await expect(page.locator('h3:has-text("Grid Systems")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Bento Grid')).toBeVisible();
        await expect(page.locator('text=Masonry Layout')).toBeVisible();

        // New Layout Component
        await expect(page.locator('text=Application Header')).toBeVisible();
        // The Navbar in Showcase layout might display current time or status, check for existence
        await expect(page.locator('header').first()).toBeVisible();
    });

    test('Overlays & Popovers Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-overlays');
        await navButton.click();

        await expect(page.locator('button:has-text("Start Tour")')).toBeVisible({ timeout: 10000 });
    });

    test('Media & Visuals Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-media');
        await navButton.click();
        await page.waitForTimeout(1000);

        const heading = page.locator('h3:has-text("Media & Visuals")');
        await expect(heading.first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Audio Player').first()).toBeVisible();
    });

    test('Complex Composites Section', async ({ page }) => {
        const navButton = page.locator('#nav-item-complex');
        await navButton.click();

        await expect(page.locator('h3:has-text("Complex Composites")')).toBeVisible({ timeout: 10000 });
        // Updated placeholder for GlassCollaborativeChatInput
        await expect(page.getByPlaceholder('Message the team...')).toBeVisible();

        // New Calculator Component
        await expect(page.locator('text=Functional Calculator')).toBeVisible();
        await expect(page.getByRole('button', { name: 'AC', exact: true })).toBeVisible();
    });
});
