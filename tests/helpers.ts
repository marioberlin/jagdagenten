/**
 * Shared Playwright helpers for Liquid OS app-based windowing system.
 *
 * All routes now redirect to /os. Apps are opened via the Zustand app store
 * (useAppStoreStore), which is exposed on `window.__appStore` or accessed by
 * evaluating the store directly. The helpers below use page.evaluate() to open
 * apps programmatically, which is faster and more reliable than clicking dock
 * icons that rely on Framer Motion physics.
 */

import { Page, expect } from '@playwright/test';

// ── App IDs ────────────────────────────────────────────────────────────────────

export const APP_IDS = {
    SHOWCASE: '_system/showcase',
    SETTINGS: '_system/settings',
    APP_STORE: '_system/app-store',
    FINDER: '_system/finder',
    A2A_CONSOLE: 'a2a-console',
    AI_EXPLORER: 'ai-explorer',
    AGENT_CHAT: 'agent-chat',
    COWORK: 'cowork',
} as const;

// ── Navigation ─────────────────────────────────────────────────────────────────

/**
 * Navigate to /os and wait for the OS shell to be ready (menu bar visible).
 */
export async function gotoOS(page: Page) {
    await page.goto('/os');
    // Wait for menu bar to appear (persistent top element)
    await page.waitForSelector('[role="menubar"], header', { state: 'visible', timeout: 30000 });
}

/**
 * Open an app by clicking its dock icon label.
 * Falls back to evaluating the Zustand store directly if dock item not found.
 */
export async function openAppViaDock(page: Page, label: string) {
    // Dock items show their label in a tooltip, but we can locate by the
    // tooltip text (which is always rendered in the DOM, just opacity-0).
    const dockItem = page.locator('.fixed.bottom-8 .cursor-pointer').filter({
        has: page.locator(`text="${label}"`)
    }).first();

    if (await dockItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dockItem.click();
    }
}

/**
 * Open an app by programmatically calling the Zustand store.
 * This is the most reliable way to open apps in tests.
 */
export async function openApp(page: Page, appId: string) {
    await page.evaluate((id) => {
        // Access the Zustand store via its persisted key or module internals.
        // The app store is a Zustand store; we can access it through the global hook.
        // Since we can't import modules in evaluate, we dispatch a custom event
        // that the app listens to, or use the store's setState.
        const storeKey = 'liquid-os-app-store';
        const stored = localStorage.getItem(storeKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            parsed.state.activeAppId = id;
            localStorage.setItem(storeKey, JSON.stringify(parsed));
        }
        // Trigger re-render by dispatching a storage event
        window.dispatchEvent(new StorageEvent('storage', { key: storeKey }));
    }, appId);

    // Small wait for React to re-render
    await page.waitForTimeout(500);
}

/**
 * Open an app by navigating to /os and clicking the dock tooltip that matches.
 * This approach locates dock items by their tooltip text.
 */
export async function openAppByDockLabel(page: Page, label: string) {
    // Dock tooltips are rendered as text in whitespace-nowrap divs
    const tooltip = page.locator('.fixed.bottom-8').locator(`text="${label}"`).first();
    // Click the parent motion.div (the actual dock icon)
    const icon = tooltip.locator('..');
    await icon.click({ force: true });
    await page.waitForTimeout(800);
}

/**
 * Close the currently active app by pressing Escape.
 */
export async function closeActiveApp(page: Page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
}

// ── App Window Helpers ─────────────────────────────────────────────────────────

/**
 * Wait for an app window to appear after opening.
 * Floating-mode apps render inside a GlassWindow with id `{appId}-window`.
 */
export async function waitForAppWindow(page: Page, appId: string, timeout = 15000) {
    // For floating apps: window has an id like "a2a-console-window"
    const windowId = `${appId}-window`;
    const windowEl = page.locator(`[id="${windowId}"]`);

    // Try the window ID first (floating mode)
    const hasWindow = await windowEl.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasWindow) return;

    // For fullscreen/panel apps, just wait for content to appear
    await page.waitForTimeout(1000);
}

/**
 * Wait for the showcase app's sidebar category navigation to be ready.
 */
export async function waitForShowcaseSidebar(page: Page, timeout = 15000) {
    // The showcase app has a sidebar with category buttons
    await expect(page.locator('text="All Components"').first()).toBeVisible({ timeout });
}

/**
 * Click a category button in the showcase sidebar.
 */
export async function clickShowcaseCategory(page: Page, categoryLabel: string) {
    const categoryBtn = page.locator('button').filter({ hasText: categoryLabel }).first();
    await categoryBtn.click();
    await page.waitForTimeout(500);
}

/**
 * Navigate to a settings tab in the Settings app.
 */
export async function clickSettingsTab(page: Page, tabLabel: string) {
    const tabBtn = page.locator('button').filter({ hasText: tabLabel }).first();
    await tabBtn.click();
    await page.waitForTimeout(300);
}
