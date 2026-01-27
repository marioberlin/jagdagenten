# Browser Testing Guide

Complete guide to browser testing with Playwright in LiquidCrypto.

## Quick Start

```bash
# Test auto-login
bun run test:browser

# Test Aurora app
bun run test:aurora

# Run all browser tests
bun run test:browser-all
```

## Overview

LiquidCrypto uses [Playwright](https://playwright.dev/) for browser automation and testing. This provides:

- ✅ Real browser testing (Chrome, Firefox, Safari)
- 📋 Console log capture
- 📸 Screenshot and video recording
- 🌐 Network traffic monitoring
- 🎯 Reliable element selectors
- 🚀 Fast execution

## Available Test Scripts

| Command | Description | File |
|---------|-------------|------|
| `bun run test:browser` | Auto-login verification | [test-auto-login.ts](file:///Users/mario/projects/LiquidCrypto/scripts/test-auto-login.ts) |
| `bun run test:aurora` | Aurora Weather app test | [test-aurora.ts](file:///Users/mario/projects/LiquidCrypto/scripts/test-aurora.ts) |
| `bun run test:browser-all` | All browser tests | - |

## Writing Tests

### Basic Test Structure

```typescript
#!/usr/bin/env bun
import { chromium } from 'playwright';

async function testMyFeature() {
  const browser = await chromium.launch({ 
    headless: false // Shows browser window
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', (msg) => {
    console.log('📋 Console:', msg.text());
  });

  try {
    // Navigate
    await page.goto('http://localhost:5174/os');
    
    // Wait for element
    await page.waitForSelector('text=LiquidOS');
    
    // Click elements
    await page.click('button:has-text("Settings")');
    
    // Type into inputs
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/test.png' });
    
    console.log('✅ Test passed!');
  } finally {
    await browser.close();
  }
}

testMyFeature().catch(console.error);
```

### Make Script Executable

```bash
chmod +x scripts/my-test.ts
```

## Common Patterns

### Navigation

```typescript
// Navigate and wait for network idle
await page.goto('http://localhost:5174/os', { 
  waitUntil: 'networkidle' 
});

// Navigate and wait for specific element
await page.goto('http://localhost:5174/os');
await page.waitForSelector('text=Welcome');
```

### Finding Elements

```typescript
// By text
await page.locator('text=Sign in').click();

// By role
await page.locator('button').click();

// By data-testid
await page.locator('[data-testid="submit"]').click();

// By CSS selector
await page.locator('.email-input').fill('user@example.com');

// Chaining
await page.locator('form').locator('button[type="submit"]').click();
```

### User Interactions

```typescript
// Click
await page.click('button');

// Type
await page.fill('input[type="email"]', 'test@example.com');
await page.type('input', 'slow typing', { delay: 100 });

// Press keys
await page.press('input', 'Enter');

// Hover
await page.hover('button');

// Select dropdown
await page.selectOption('select#country', 'US');
```

### Assertions

```typescript
// Check visibility
const visible = await page.locator('text=Welcome').isVisible();
console.assert(visible, 'Welcome message should be visible');

// Check text content
const text = await page.locator('h1').textContent();
console.assert(text === 'LiquidOS', 'Page title should be LiquidOS');

// Check count
const count = await page.locator('button').count();
console.assert(count > 0, 'Should have at least one button');
```

### Screenshots

```typescript
// Full page screenshot
await page.screenshot({ 
  path: '/tmp/screenshot.png',
  fullPage: true 
});

// Element screenshot
await page.locator('.email-form').screenshot({ 
  path: '/tmp/form.png' 
});

// Screenshot with quality
await page.screenshot({ 
  path: '/tmp/screenshot.jpg',
  type: 'jpeg',
  quality: 80
});
```

### Console Logs

```typescript
// Capture all console messages
const logs: string[] = [];
page.on('console', (msg) => {
  logs.push(msg.text());
  console.log('📋 Console:', msg.text());
});

// Filter specific logs
page.on('console', (msg) => {
  if (msg.text().includes('[AutoLogin]')) {
    console.log('🔐', msg.text());
  }
});
```

### Network Monitoring

```typescript
// Monitor all requests
page.on('request', (request) => {
  console.log('→', request.method(), request.url());
});

// Monitor responses
page.on('response', (response) => {
  console.log('←', response.status(), response.url());
});

// Wait for specific request
await page.waitForRequest('**/api/auth/email/login');

// Wait for specific response
await page.waitForResponse(
  response => response.url().includes('/api/auth') && response.status() === 200
);
```

## Testing Auto-Login

The auto-login test ([test-auto-login.ts](file:///Users/mario/projects/LiquidCrypto/scripts/test-auto-login.ts)) demonstrates best practices:

```typescript
#!/usr/bin/env bun
import { chromium } from 'playwright';

async function testAutoLogin() {
  console.log('🔐 Testing Auto-Login Feature\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const logs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[AutoLogin]')) {
      console.log(`📋 Console: ${text}`);
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:5174/os\n');
    await page.goto('http://localhost:5174/os', { waitUntil: 'networkidle' });

    // Wait for auto-login
    console.log('⏳  Waiting 8 seconds for auto-login...\n');
    await page.waitForTimeout(8000);

    // Check if lock screen is visible
    const lockScreenVisible = await page
      .locator('text=LiquidOS is Locked')
      .isVisible()
      .catch(() => false);
    
    console.log(`🔒 Lock Screen Visible: ${lockScreenVisible}\n`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/auto-login-test.png' });
    console.log('📸 Screenshot saved to /tmp/auto-login-test.png\n');

    // Print AutoLogin logs
    const autoLoginLogs = logs.filter(l => l.includes('[AutoLogin]'));
    if (autoLoginLogs.length > 0) {
      console.log('📝 AutoLogin Logs:');
      autoLoginLogs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('⚠️  No [AutoLogin] logs found');
    }

  } finally {
    await browser.close();
  }
}

testAutoLogin().catch(console.error);
```

## Debugging

### View Browser

Set `headless: false` to see the browser:

```typescript
const browser = await chromium.launch({ 
  headless: false,
  slowMo: 100 // Slow down by 100ms per action
});
```

### Debug Mode

```typescript
// Pause and open inspector
await page.pause();

// Step through with debugger
debugger;
```

### Verbose Logging

```typescript
// Enable debug logs
process.env.DEBUG = 'pw:api';

// Or use Playwright's debug logger
const browser = await chromium.launch({
  logger: {
    isEnabled: (name) => true,
    log: (name, severity, message) => console.log(`[${name}] ${message}`)
  }
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Install Playwright browsers
        run: bunx playwright install chromium
      
      - name: Start servers
        run: |
          bun run dev &
          cd server && bun run dev &
          sleep 10
      
      - name: Run browser tests
        run: bun run test:browser-all
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: /tmp/*.png
```

## Best Practices

1. **Always close browsers**
   ```typescript
   try {
     // test code
   } finally {
     await browser.close();
   }
   ```

2. **Use meaningful selectors**
   ```typescript
   // ❌ Bad
   await page.click('.btn-123');
   
   // ✅ Good
   await page.click('button:has-text("Sign in")');
   await page.click('[data-testid="login-button"]');
   ```

3. **Wait for elements properly**
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(5000);
   
   // ✅ Good
   await page.waitForSelector('text=Welcome');
   await page.waitForLoadState('networkidle');
   ```

4. **Capture evidence**
   ```typescript
   // Always save screenshots and logs
   await page.screenshot({ path: '/tmp/test-result.png' });
   console.log('Test completed at:', new Date().toISOString());
   ```

5. **Clean up resources**
   ```typescript
   // Close context and browser
   await context.close();
   await browser.close();
   ```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5174
lsof -ti:5174

# Kill process
kill -9 $(lsof -ti:5174)
```

### Browser Not Launching

```bash
# Install Playwright browsers
bunx playwright install chromium

# Or install all browsers
bunx playwright install
```

### Tests Timing Out

```typescript
// Increase timeout
await page.waitForSelector('text=Welcome', { timeout: 30000 });

// Or set global timeout
page.setDefaultTimeout(30000);
```

### Network Issues

```bash
# Make sure servers are running
bun run dev           # Frontend on 5174
cd server && bun run dev  # Backend on 3000
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Related Documentation

- [Email Authentication](file:///Users/mario/projects/LiquidCrypto/docs/authentication/email-password.md)
- [Browser Tool Investigation](file:///Users/mario/projects/LiquidCrypto/docs/testing/browser-tool-investigation.md)
