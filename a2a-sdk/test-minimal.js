/**
 * Test script for minimal A2A server
 * Tests the server using HTTP requests
 */

const http = require('http');

const SERVER_URL = 'http://localhost:3001/a2a/v1';

// Helper function to make JSON-RPC requests
function makeRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/a2a/v1',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('='.repeat(70));
  console.log('A2A Minimal Server Test Suite');
  console.log('='.repeat(70));
  console.log('');

  let passed = 0;
  let failed = 0;

  // Test 1: Get Agent Card
  console.log('Test 1: Fetching Agent Card...');
  try {
    const response = await makeRequest('agent/card', {});
    if (response.name && response.description) {
      console.log('   ✓ PASSED - Agent card retrieved');
      console.log(`     Name: ${response.name}`);
      console.log(`     Description: ${response.description}`);
      console.log(`     Version: ${response.version}`);
      passed++;
    } else {
      console.log('   ✗ FAILED - Invalid agent card format');
      failed++;
    }
  } catch (error) {
    console.log(`   ✗ FAILED - ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 2: Send Message
  console.log('Test 2: Sending Message...');
  try {
    const message = {
      kind: 'message',
      message_id: `test-${Date.now()}`,
      role: 'user',
      parts: [
        {
          kind: 'text',
          text: 'Hello from test suite!',
        },
      ],
    };

    const response = await makeRequest('message/send', { message });
    if (response.message && response.message.message_id) {
      console.log('   ✓ PASSED - Message sent and response received');
      console.log(`     Response Message ID: ${response.message.message_id}`);
      console.log(`     Role: ${response.message.role}`);
      console.log(`     Text: ${response.message.parts[0].text}`);
      passed++;
    } else {
      console.log('   ✗ FAILED - Invalid response format');
      failed++;
    }
  } catch (error) {
    console.log(`   ✗ FAILED - ${error.message}`);
    failed++;
  }
  console.log('');

  // Test 3: Send Another Message
  console.log('Test 3: Sending Another Message...');
  try {
    const message = {
      kind: 'message',
      message_id: `test-${Date.now()}`,
      role: 'user',
      parts: [
        {
          kind: 'text',
          text: 'Testing A2A protocol implementation',
        },
      ],
    };

    const response = await makeRequest('message/send', { message });
    if (response.message && response.message.parts[0].text) {
      console.log('   ✓ PASSED - Second message sent successfully');
      console.log(`     Text: ${response.message.parts[0].text}`);
      passed++;
    } else {
      console.log('   ✗ FAILED - Invalid response format');
      failed++;
    }
  } catch (error) {
    console.log(`   ✗ FAILED - ${error.message}`);
    failed++;
  }
  console.log('');

  // Summary
  console.log('='.repeat(70));
  console.log('Test Results');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
