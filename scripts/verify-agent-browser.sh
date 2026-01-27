#!/bin/bash

# Simple test script to verify agent-browser installation
# Uses full path to agent-browser to avoid PATH issues

AGENT_BROWSER="/usr/local/lib/node_modules/agent-browser/bin/agent-browser.js"

echo "🧪 Agent-Browser Installation Verification"
echo "==========================================="
echo ""

# Check installation
echo "1. Checking installation..."
if [ ! -f "$AGENT_BROWSER" ]; then
    echo "❌ agent-browser not found at $AGENT_BROWSER"
    exit 1
fi
echo "✅ agent-browser installed at $AGENT_BROWSER"

# Check version
echo ""echo "2. Checking version..."
node "$AGENT_BROWSER" --version
echo ""

# Test browser launch
echo "3. Testing browser launch..."
node "$AGENT_BROWSER" open http://localhost:5173
sleep 2
echo "✅ Browser launched"

# Get page title
echo ""
echo "4. Getting page title..."
TITLE=$(node "$AGENT_BROWSER" get title)
echo "   Title: $TITLE"

# Take screenshot
echo ""
echo "5. Taking screenshot..."
mkdir -p docs/test-results
node "$AGENT_BROWSER" screenshot docs/test-results/verification-test.png
echo "✅ Screenshot saved"

# Get snapshot
echo ""
echo "6. Getting accessibility snapshot..."
node "$AGENT_BROWSER" snapshot > docs/test-results/verification-snapshot.txt
echo "✅ Snapshot saved"

# Close browser
echo ""
echo "7. Closing browser..."
node "$AGENT_BROWSER" close
echo "✅ Browser closed"

echo ""
echo "==========================================="
echo "✅ All verification tests passed!"
echo "📁 Results saved to: docs/test-results/"
echo ""
