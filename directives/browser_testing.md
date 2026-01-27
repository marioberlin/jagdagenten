# Browser Testing Directive

## Goal
Automated browser testing of GlassApps and A2A agents using Vercel's agent-browser CLI. This directive defines the workflow for validating UI rendering, interactive element functionality, and visual regression testing.

## Inputs
- **App URL**: The target application URL (typically `http://localhost:5173` for dev)
- **Test Scenario**: Description of user flow to test (e.g., "Launch Aurora Weather app")
- **Expected Elements**: List of key UI elements that should be present

## Tools
- **agent-browser CLI**: Headless browser automation with AI-optimized snapshot+ref workflow
- **Gemini Agent**: For parsing accessibility snapshots and generating test assertions
- **Screenshot Storage**: Store visual outputs in `docs/test-results/`

## Workflow

### 1. Navigate to Target
```bash
agent-browser open <url>
```

### 2. Capture Accessibility Snapshot
```bash
agent-browser snapshot -i --json > snapshot.json
```

This generates:
- **Accessibility Tree**: Semantic structure of interactive elements
- **Refs**: Deterministic element references (@e1, @e2, etc.)
- **Roles**: ARIA roles (button, textbox, heading, link, etc.)

### 3. AI Analysis (Gemini)
Feed `snapshot.json` to Gemini to:
- Verify expected elements are present
- Identify element refs for interaction
- Generate test assertions

### 4. Execute Interactions
```bash
# Click using ref from snapshot
agent-browser click @e2

# Fill form fields
agent-browser fill @e3 "test input"

# Wait for state changes
agent-browser wait --text "Success"
```

### 5. Visual Validation
```bash
# Capture screenshot
agent-browser screenshot docs/test-results/test-name.png

# Full page screenshot
agent-browser screenshot --full docs/test-results/test-name-full.png
```

### 6. Cleanup
```bash
agent-browser close
```

## Outputs
- **Test Pass/Fail**: Boolean result from assertions
- **Screenshots**: PNG files in `docs/test-results/`
- **Accessibility Snapshot**: JSON file with element refs and roles
- **Error Logs**: If test fails, capture console errors via `agent-browser eval "console.log"`

## Edge Cases

### Network Timeouts
```bash
# Increase wait timeout
agent-browser wait --load networkidle
agent-browser wait 5000  # Wait 5s
```

### Authentication Failures
- Use persistent profiles to save login state:
```bash
agent-browser --user-data-dir ./test-profiles/auth open <url>
```

### Dynamic Content
- Wait for specific elements before interacting:
```bash
agent-browser wait ".glass-app-container"
agent-browser snapshot -i --json
```

### Responsive Testing
```bash
# Test mobile viewport
agent-browser set viewport 375 667
agent-browser set device "iPhone 14"
```

## Integration with Ralph Autonomous Loop

For self-healing tests, use Ralph pattern:
1. Run test via `agent-browser`
2. If test fails, feed error to Gemini
3. Gemini analyzes failure reason
4. Update test script accordingly
5. Re-run test

## Example Script Structure

```typescript
// scripts/test-browser-automation.ts
async function testGlassApp(appUrl: string, testName: string) {
  // 1. Navigate
  await exec('agent-browser', ['open', appUrl]);
  
  // 2. Snapshot
  const { stdout } = await exec('agent-browser', ['snapshot', '-i', '--json']);
  const { refs, tree } = JSON.parse(stdout).data;
  
  // 3. AI validates (Gemini)
  const validation = await gemini.validate(tree, refs);
  
  // 4. Interact
  if (validation.appLauncherRef) {
    await exec('agent-browser', ['click', `@${validation.appLauncherRef}`]);
  }
  
  // 5. Screenshot
  await exec('agent-browser', ['screenshot', `docs/test-results/${testName}.png`]);
  
  // 6. Cleanup
  await exec('agent-browser', ['close']);
}
```

## Best Practices

1. **Always use refs over CSS selectors** - More stable, AI-friendly
2. **Capture snapshots after page changes** - Keep ref map fresh
3. **Store persistent profiles** - Avoid repeated auth flows
4. **Use --json flag** - Enable machine parsing
5. **Wait for state** - Don't assume instant page loads
6. **Full-page screenshots for documentation** - Use `--full` flag

## CI/CD Integration

For GitHub Actions:
```yaml
- name: Install agent-browser
  run: |
    npm install -g agent-browser
    agent-browser install
    
- name: Run browser tests
  run: bun run scripts/test-browser-automation.ts
```

## Notes
- **Daemon Architecture**: agent-browser daemon persists between commands for speed
- **Chromium Required**: Ensure browser binary is installed via `agent-browser install`
- **Linux Dependencies**: On Linux, run `agent-browser install --with-deps`
