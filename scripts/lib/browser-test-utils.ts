/**
 * Browser Testing Utilities
 * 
 * Reusable functions for agent-browser automation
 * Wraps agent-browser CLI with TypeScript types and error handling
 */

// Full path to agent-browser binary
const AGENT_BROWSER = './node_modules/agent-browser/bin/agent-browser.js';

/**
 * Agent-browser snapshot data structure
 */
export interface Snapshot {
    success: boolean;
    data: {
        snapshot: string;
        refs: RefMap;
    };
}

/**
 * Ref map from snapshot
 */
export interface RefMap {
    [key: string]: {
        role: string;
        name?: string;
        nth?: number;
    };
}

/**
 * Browser test result
 */
export interface TestResult {
    success: boolean;
    duration: number;
    error?: string;
    data?: any;
}

/**
 * Execute agent-browser command
 */
async function execAgentBrowser(args: string[]): Promise<string> {
    try {
        const proc = Bun.spawn(['node', AGENT_BROWSER, ...args], {
            stdout: 'pipe',
            stderr: 'pipe',
        });

        const output = await new Response(proc.stdout).text();
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
            const error = await new Response(proc.stderr).text();
            throw new Error(`Exit code ${exitCode}: ${error}`);
        }

        return output.trim();
    } catch (error: any) {
        throw new Error(`agent-browser command failed: ${error.message}`);
    }
}

/**
 * Navigate to a URL
 */
export async function open(url: string): Promise<void> {
    await execAgentBrowser(['open', url]);
}

/**
 * Close the browser
 */
export async function close(): Promise<void> {
    await execAgentBrowser(['close']);
}

/**
 * Wait for page load state
 */
export async function waitForLoad(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
    await execAgentBrowser(['wait', '--load', state]);
}

/**
 * Wait for specific time in milliseconds
 */
export async function wait(ms: number): Promise<void> {
    await execAgentBrowser(['wait', ms.toString()]);
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(text: string): Promise<void> {
    await execAgentBrowser(['wait', '--text', `"${text}"`]);
}

/**
 * Get page title
 */
export async function getTitle(): Promise<string> {
    return await execAgentBrowser(['get', 'title']);
}

/**
 * Get current URL
 */
export async function getUrl(): Promise<string> {
    return await execAgentBrowser(['get', 'url']);
}

/**
 * Capture accessibility snapshot with refs
 */
export async function snapshot(options: {
    interactive?: boolean;
    compact?: boolean;
} = {}): Promise<Snapshot> {
    const args = ['snapshot'];

    if (options.interactive) args.push('-i');
    if (options.compact) args.push('-c');
    args.push('--json');

    const output = await execAgentBrowser(args);

    try {
        return JSON.parse(output);
    } catch (err) {
        throw new Error(`Failed to parse snapshot JSON: ${err}`);
    }
}

/**
 * Click an element by ref or selector
 */
export async function click(selector: string): Promise<void> {
    await execAgentBrowser(['click', selector]);
}

/**
 * Fill a form field
 */
export async function fill(selector: string, value: string): Promise<void> {
    await execAgentBrowser(['fill', selector, `"${value}"`]);
}

/**
 * Type text into element
 */
export async function type(selector: string, text: string): Promise<void> {
    await execAgentBrowser(['type', selector, `"${text}"`]);
}

/**
 * Take a screenshot
 */
export async function screenshot(options: {
    path: string;
    fullPage?: boolean;
}): Promise<void> {
    const args = ['screenshot'];

    if (options.fullPage) args.push('--full');
    args.push(`"${options.path}"`);

    await execAgentBrowser(args);
}

/**
 * Get text content from element
 */
export async function getText(selector: string): Promise<string> {
    return await execAgentBrowser(['get', 'text', selector]);
}

/**
 * Get element attribute
 */
export async function getAttribute(selector: string, attr: string): Promise<string> {
    return await execAgentBrowser(['get', 'attr', selector, attr]);
}

/**
 * Check if element is visible
 */
export async function isVisible(selector: string): Promise<boolean> {
    const output = await execAgentBrowser(['is', 'visible', selector]);
    return output.toLowerCase().includes('true');
}

/**
 * Set viewport size
 */
export async function setViewport(width: number, height: number): Promise<void> {
    await execAgentBrowser(['set', 'viewport', width.toString(), height.toString()]);
}

/**
 * Emulate device
 */
export async function setDevice(deviceName: string): Promise<void> {
    await execAgentBrowser(['set', 'device', `"${deviceName}"`]);
}

/**
 * Find elements by role and optionally click
 */
export async function findByRole(
    role: string,
    action: 'click' | 'text' | 'fill',
    options: {
        name?: string;
        value?: string;
    } = {}
): Promise<void> {
    const args = ['find', 'role', role, action];

    if (options.name) {
        args.push('--name', `"${options.name}"`);
    }

    if (action === 'fill' && options.value) {
        args.push(`"${options.value}"`);
    }

    await execAgentBrowser(args);
}

/**
 * Find elements by text and click
 */
export async function findByText(text: string): Promise<void> {
    await execAgentBrowser(['find', 'text', `"${text}"`, 'click']);
}

/**
 * Find elements by label
 */
export async function findByLabel(label: string, value: string): Promise<void> {
    await execAgentBrowser(['find', 'label', `"${label}"`, 'fill', `"${value}"`]);
}

/**
 * Run JavaScript in page context
 */
export async function evaluate(script: string): Promise<string> {
    return await execAgentBrowser(['eval', `"${script}"`]);
}

/**
 * Helper: Find refs by name pattern
 */
export function findRefsByName(refs: RefMap, pattern: string): Array<[string, RefMap[string]]> {
    const regex = new RegExp(pattern, 'i');
    return Object.entries(refs).filter(([_, data]) =>
        data.name && regex.test(data.name)
    );
}

/**
 * Helper: Find refs by role
 */
export function findRefsByRole(refs: RefMap, role: string): Array<[string, RefMap[string]]> {
    return Object.entries(refs).filter(([_, data]) =>
        data.role.toLowerCase() === role.toLowerCase()
    );
}

/**
 * Helper: Pretty print refs
 */
export function printRefs(refs: RefMap, limit: number = 10): void {
    const entries = Object.entries(refs).slice(0, limit);

    console.log(`\n📋 Interactive Elements (showing ${entries.length}/${Object.keys(refs).length}):`);
    entries.forEach(([ref, data]) => {
        const name = data.name ? ` "${data.name}"` : '';
        console.log(`   @${ref}: ${data.role}${name}`);
    });

    if (Object.keys(refs).length > limit) {
        console.log(`   ... and ${Object.keys(refs).length - limit} more`);
    }
}

/**
 * Complete test workflow helper
 */
export async function runTest(
    testName: string,
    testFn: () => Promise<void>
): Promise<TestResult> {
    const startTime = Date.now();

    console.log(`\n🧪 Running test: ${testName}`);
    console.log('═'.repeat(50));

    try {
        await testFn();

        const duration = Date.now() - startTime;
        console.log(`\n✅ Test PASSED in ${duration}ms`);

        return {
            success: true,
            duration,
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`\n❌ Test FAILED in ${duration}ms`);
        console.error(`   Error: ${error.message}`);

        return {
            success: false,
            duration,
            error: error.message,
        };
    } finally {
        // Always try to close browser
        try {
            await close();
        } catch {
            // Ignore cleanup errors
        }
    }
}
