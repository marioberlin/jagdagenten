/**
 * Browser Testing Proof-of-Concept
 * 
 * Tests LiquidCrypto GlassApps using agent-browser CLI
 * Demonstrates snapshot-based element selection and AI-friendly workflow
 */

import { execaCommand } from 'execa';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface AgentBrowserSnapshot {
    success: boolean;
    data: {
        snapshot: string;
        refs: Record<string, {
            role: string;
            name?: string;
            nth?: number;
        }>;
    };
}

interface TestResult {
    testName: string;
    passed: boolean;
    duration: number;
    screenshot?: string;
    errors: string[];
    snapshot?: string;
}

export class BrowserTestRunner {
    private resultsDir = join(process.cwd(), 'docs/test-results');

    constructor() {
        this.ensureResultsDir();
    }

    private async ensureResultsDir() {
        try {
            await mkdir(this.resultsDir, { recursive: true });
        } catch (err) {
            // Directory already exists
        }
    }

    /**
     * Execute agent-browser command and parse JSON output
     */
    private async execAgentBrowser(args: string[]): Promise<any> {
        try {
            const { stdout } = await execaCommand(`agent-browser ${args.join(' ')}`);

            // Check if output is JSON
            if (args.includes('--json')) {
                return JSON.parse(stdout);
            }

            return { success: true, output: stdout };
        } catch (error: any) {
            console.error(`❌ agent-browser command failed:`, error.message);
            throw error;
        }
    }

    /**
     * Test a GlassApp by URL
     */
    async testGlassApp(options: {
        url: string;
        testName: string;
        expectedElements?: string[];
        interactions?: Array<{
            action: 'click' | 'fill' | 'wait';
            ref?: string;
            value?: string;
            waitFor?: string;
        }>;
    }): Promise<TestResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        let screenshotPath: string | undefined;
        let snapshot: string | undefined;

        try {
            console.log(`\n🧪 Testing: ${options.testName}`);
            console.log(`🌐 URL: ${options.url}`);

            // 1. Navigate to URL
            console.log('📍 Navigating to page...');
            await this.execAgentBrowser(['open', options.url]);

            // Wait for page load
            await this.execAgentBrowser(['wait', '--load', 'networkidle']);

            // 2. Capture snapshot with refs
            console.log('📸 Capturing accessibility snapshot...');
            const snapshotResult: AgentBrowserSnapshot = await this.execAgentBrowser([
                'snapshot',
                '-i',
                '--json',
            ]);

            if (!snapshotResult.success) {
                errors.push('Failed to capture snapshot');
                return this.createResult(options.testName, false, startTime, errors);
            }

            snapshot = snapshotResult.data.snapshot;
            const refs = snapshotResult.data.refs;

            console.log(`✅ Snapshot captured with ${Object.keys(refs).length} interactive elements`);

            // Display some refs for debugging
            const refEntries = Object.entries(refs).slice(0, 5);
            console.log('📋 Sample refs:');
            refEntries.forEach(([ref, data]) => {
                console.log(`  @${ref}: ${data.role}${data.name ? ` "${data.name}"` : ''}`);
            });

            // 3. Validate expected elements
            if (options.expectedElements) {
                console.log('🔍 Validating expected elements...');
                for (const expected of options.expectedElements) {
                    const found = Object.values(refs).some(
                        (ref) => ref.name?.toLowerCase().includes(expected.toLowerCase())
                    );

                    if (!found) {
                        errors.push(`Expected element not found: ${expected}`);
                    } else {
                        console.log(`  ✓ Found: ${expected}`);
                    }
                }
            }

            // 4. Execute interactions
            if (options.interactions) {
                console.log('🖱️  Executing interactions...');
                for (const interaction of options.interactions) {
                    try {
                        if (interaction.action === 'click' && interaction.ref) {
                            console.log(`  → Click @${interaction.ref}`);
                            await this.execAgentBrowser(['click', `@${interaction.ref}`]);
                        } else if (interaction.action === 'fill' && interaction.ref && interaction.value) {
                            console.log(`  → Fill @${interaction.ref} with "${interaction.value}"`);
                            await this.execAgentBrowser(['fill', `@${interaction.ref}`, interaction.value]);
                        } else if (interaction.action === 'wait' && interaction.waitFor) {
                            console.log(`  → Wait for "${interaction.waitFor}"`);
                            await this.execAgentBrowser(['wait', '--text', interaction.waitFor]);
                        }
                    } catch (err: any) {
                        errors.push(`Interaction failed: ${err.message}`);
                    }
                }
            }

            // 5. Capture screenshot
            screenshotPath = join(this.resultsDir, `${options.testName}.png`);
            console.log('📷 Capturing screenshot...');
            await this.execAgentBrowser(['screenshot', '--full', screenshotPath]);

            // 6. Save snapshot to file
            const snapshotPath = join(this.resultsDir, `${options.testName}-snapshot.txt`);
            await writeFile(snapshotPath, snapshot);
            console.log(`💾 Snapshot saved to: ${snapshotPath}`);

            const duration = Date.now() - startTime;
            const passed = errors.length === 0;

            console.log(passed ? '✅ Test PASSED' : '❌ Test FAILED');
            console.log(`⏱️  Duration: ${duration}ms`);

            return this.createResult(
                options.testName,
                passed,
                startTime,
                errors,
                screenshotPath,
                snapshot
            );

        } catch (error: any) {
            errors.push(`Unexpected error: ${error.message}`);
            return this.createResult(options.testName, false, startTime, errors);
        } finally {
            // Cleanup: close browser
            try {
                await this.execAgentBrowser(['close']);
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    private createResult(
        testName: string,
        passed: boolean,
        startTime: number,
        errors: string[],
        screenshot?: string,
        snapshot?: string
    ): TestResult {
        return {
            testName,
            passed,
            duration: Date.now() - startTime,
            errors,
            screenshot,
            snapshot,
        };
    }

    /**
     * Generate test report
     */
    async generateReport(results: TestResult[]) {
        const reportPath = join(this.resultsDir, 'test-report.md');

        const totalTests = results.length;
        const passedTests = results.filter((r) => r.passed).length;
        const failedTests = totalTests - passedTests;

        let report = `# Browser Test Report\n\n`;
        report += `**Generated:** ${new Date().toISOString()}\n\n`;
        report += `**Summary:** ${passedTests}/${totalTests} tests passed\n\n`;
        report += `---\n\n`;

        for (const result of results) {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            report += `## ${status} - ${result.testName}\n\n`;
            report += `- **Duration:** ${result.duration}ms\n`;

            if (result.screenshot) {
                report += `- **Screenshot:** [${result.testName}.png](${result.screenshot})\n`;
            }

            if (result.errors.length > 0) {
                report += `\n**Errors:**\n`;
                result.errors.forEach((err) => {
                    report += `- ${err}\n`;
                });
            }

            report += `\n---\n\n`;
        }

        await writeFile(reportPath, report);
        console.log(`\n📊 Test report generated: ${reportPath}`);
    }
}

// Example test execution
async function main() {
    console.log('🚀 Starting Browser Test Proof-of-Concept\n');

    const runner = new BrowserTestRunner();
    const results: TestResult[] = [];

    // Test 1: LiquidOS Home Page Load
    const homeTest = await runner.testGlassApp({
        url: 'http://localhost:5173',
        testName: 'liquidos-home-load',
        expectedElements: ['Menu', 'Settings'],
    });
    results.push(homeTest);

    // Test 2: Aurora Weather App (if you want to test specific app)
    // Uncomment when ready to test specific apps
    /*
    const auroraTest = await runner.testGlassApp({
      url: 'http://localhost:5173',
      testName: 'aurora-weather-app',
      expectedElements: ['Weather', 'Aurora'],
      interactions: [
        // Click on Aurora app launcher (need to determine ref from snapshot)
        // { action: 'click', ref: 'e5' },
      ],
    });
    results.push(auroraTest);
    */

    // Generate report
    await runner.generateReport(results);

    // Exit with appropriate code
    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((err) => {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    });
}

export { main };
