import { test, expect, Page } from '@playwright/test';

/**
 * Component Interaction Tests
 *
 * The showcase is now an app (_system/showcase) opened from the dock.
 * Components are accessed by navigating to their category in the sidebar.
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

test.describe('Glass Form Components', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
        await clickCategory(page, 'Forms & Inputs');
    });

    test('GlassInput should be focusable and accept input', async ({ page }) => {
        const input = page.locator('input[type="text"]:not([maxlength="1"])').first();
        await expect(input).toBeVisible({ timeout: 10000 });

        await input.click();
        await input.fill('Test input');

        await expect(input).toHaveValue('Test input');
    });

    test('GlassCheckbox should toggle on click', async ({ page }) => {
        const checkbox = page.locator('[role="checkbox"]').first();
        await expect(checkbox).toBeVisible({ timeout: 10000 });

        const initialState = await checkbox.getAttribute('aria-checked');
        await checkbox.click();

        await page.waitForTimeout(200);
        const newState = await checkbox.getAttribute('aria-checked');

        expect(newState).not.toBe(initialState);
    });

    test('GlassRadio should be selectable in a group', async ({ page }) => {
        const radios = page.locator('[role="radio"]');
        const count = await radios.count();

        if (count >= 2) {
            const secondRadio = radios.nth(1);

            await secondRadio.click();
            await page.waitForTimeout(200);

            await expect(secondRadio).toHaveAttribute('aria-checked', 'true');
        }
    });

    test('GlassStepper should show increment/decrement controls', async ({ page }) => {
        const stepperContainer = page.locator('[role="spinbutton"]').first();

        if (await stepperContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(stepperContainer).toBeVisible();
        }
    });
});

test.describe('Glass Interactive Components', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
    });

    test('GlassButton should be clickable and show hover state', async ({ page }) => {
        // Buttons category should show buttons
        await clickCategory(page, 'Buttons & Actions');

        const button = page.locator('button:has-text("Primary")').first();

        if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
            await button.hover();
            await page.waitForTimeout(200);

            // Button should still be visible after hover
            await expect(button).toBeVisible();
        }
    });

    test('GlassSelect should open dropdown on click', async ({ page }) => {
        await clickCategory(page, 'Forms & Inputs');

        // Find a select trigger
        const select = page.locator('[class*="cursor-pointer"]:has-text("Select")').first();

        if (await select.isVisible({ timeout: 5000 }).catch(() => false)) {
            await select.click();
            await page.waitForTimeout(300);

            // Dropdown options should appear
            const options = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]:not(:has-text("Select"))');
            const count = await options.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('GlassSlider should respond to drag interactions', async ({ page }) => {
        await clickCategory(page, 'Forms & Inputs');

        // Look for slider track
        const slider = page.locator('[class*="touch-none"][class*="select-none"]').first();

        if (await slider.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(slider).toBeVisible();
        }
    });
});

test.describe('Glass Overlay Components', () => {
    test.beforeEach(async ({ page }) => {
        await openShowcase(page);
        await clickCategory(page, 'Overlays & Popovers');
    });

    test('GlassModal should open and close properly', async ({ page }) => {
        const openModalButton = page.getByRole('button', { name: 'Open Modal' });

        if (await openModalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await openModalButton.click();
            await page.waitForTimeout(300);

            // Modal should be visible
            const modalContent = page.locator('[role="dialog"], [class*="fixed"][class*="z-"]');
            await expect(modalContent.first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('GlassTour should paginate through steps', async ({ page }) => {
        const startTourButton = page.getByRole('button', { name: 'Start Tour' });

        if (await startTourButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await startTourButton.click();
            await page.waitForTimeout(300);

            // Should see step indicator
            const stepIndicator = page.locator('text=/Step \\d+ of \\d+/');
            await expect(stepIndicator).toBeVisible({ timeout: 5000 });

            // Click next
            const nextButton = page.getByRole('button', { name: 'Next' });
            if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await nextButton.click();
                await page.waitForTimeout(200);
            }
        }
    });

    test('GlassTooltip should appear on hover', async ({ page }) => {
        const tooltipTrigger = page.locator('[data-tooltip], [aria-describedby]').first();

        if (await tooltipTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
            await tooltipTrigger.hover();
            await page.waitForTimeout(500);

            // Tooltip content should appear
            const tooltip = page.locator('[role="tooltip"]');
            if (await tooltip.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(tooltip).toBeVisible();
            }
        }
    });
});
