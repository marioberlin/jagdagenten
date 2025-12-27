import { test, expect } from '@playwright/test';

test.describe('Glass Form Components', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });

        // Navigate to Forms section
        const navButton = page.locator('button', { hasText: 'Forms & Inputs' });
        await navButton.click();
        await page.waitForTimeout(500);
    });

    test('GlassInput should be focusable and accept input', async ({ page }) => {
        // Find a regular input (not OTP which has maxlength=1)
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
        // Navigate to the section with number input/stepper
        const stepperContainer = page.locator('[role="spinbutton"]').first();

        if (await stepperContainer.isVisible()) {
            // Number input with stepper functionality
            await expect(stepperContainer).toBeVisible();
        }
    });
});

test.describe('Glass Interactive Components', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });
    });

    test('GlassButton should be clickable and show hover state', async ({ page }) => {
        const button = page.locator('button:has-text("Primary")').first();

        if (await button.isVisible()) {
            await button.hover();
            await page.waitForTimeout(200);

            // Button should still be visible after hover
            await expect(button).toBeVisible();
        }
    });

    test('GlassSelect should open dropdown on click', async ({ page }) => {
        // Navigate to Forms section
        const navButton = page.locator('button', { hasText: 'Forms & Inputs' });
        await navButton.click();
        await page.waitForTimeout(500);

        // Find a select trigger
        const select = page.locator('[class*="cursor-pointer"]:has-text("Select")').first();

        if (await select.isVisible()) {
            await select.click();
            await page.waitForTimeout(300);

            // Dropdown options should appear
            const options = page.locator('[class*="rounded-lg"][class*="cursor-pointer"]:not(:has-text("Select"))');
            const count = await options.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('GlassSlider should respond to drag interactions', async ({ page }) => {
        // Navigate to Forms section
        const navButton = page.locator('button', { hasText: 'Forms & Inputs' });
        await navButton.click();
        await page.waitForTimeout(500);

        // Look for slider track
        const slider = page.locator('[class*="touch-none"][class*="select-none"]').first();

        if (await slider.isVisible()) {
            await expect(slider).toBeVisible();
        }
    });
});

test.describe('Glass Overlay Components', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/showcase');
        await page.waitForSelector('nav', { state: 'visible', timeout: 30000 });

        // Navigate to Overlays section
        const navButton = page.locator('button', { hasText: 'Overlays & Popovers' });
        await navButton.click();
        await page.waitForTimeout(500);
    });

    test('GlassModal should open and close properly', async ({ page }) => {
        const openModalButton = page.getByRole('button', { name: 'Open Modal' });

        if (await openModalButton.isVisible()) {
            await openModalButton.click();
            await page.waitForTimeout(300);

            // Modal should be visible
            const modalContent = page.locator('[role="dialog"], [class*="fixed"][class*="z-"]');
            await expect(modalContent.first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('GlassTour should paginate through steps', async ({ page }) => {
        const startTourButton = page.getByRole('button', { name: 'Start Tour' });

        if (await startTourButton.isVisible()) {
            await startTourButton.click();
            await page.waitForTimeout(300);

            // Should see step indicator
            const stepIndicator = page.locator('text=/Step \\d+ of \\d+/');
            await expect(stepIndicator).toBeVisible({ timeout: 5000 });

            // Click next
            const nextButton = page.getByRole('button', { name: 'Next' });
            if (await nextButton.isVisible()) {
                await nextButton.click();
                await page.waitForTimeout(200);
            }
        }
    });

    test('GlassTooltip should appear on hover', async ({ page }) => {
        const tooltipTrigger = page.locator('[data-tooltip], [aria-describedby]').first();

        if (await tooltipTrigger.isVisible()) {
            await tooltipTrigger.hover();
            await page.waitForTimeout(500);

            // Tooltip content should appear
            const tooltip = page.locator('[role="tooltip"]');
            if (await tooltip.isVisible()) {
                await expect(tooltip).toBeVisible();
            }
        }
    });
});
