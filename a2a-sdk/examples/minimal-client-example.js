/**
 * Minimal A2A Client Example (JavaScript)
 * Simple JSON-RPC client for testing against A2A servers
 */

const http = require('http');

/**
 * Simple A2A Client using Node.js http module
 */
class SimpleA2AClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    const url = new URL(baseUrl);
    this.host = url.hostname;
    this.port = parseInt(url.port) || 80;
    this.path = url.pathname;
  }

  /**
   * Send a JSON-RPC request
   */
  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      });

      const options = {
        hostname: this.host,
        port: this.port,
        path: this.path,
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
            if (response.error) {
              reject(new Error(`RPC Error: ${response.error.message}`));
            } else {
              resolve(response.result);
            }
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

  /**
   * Get agent card
   */
  async getAgentCard() {
    return this.sendRequest('agent/card', {});
  }

  /**
   * Send a message
   */
  async sendMessage(message) {
    return this.sendRequest('message/send', { message });
  }
}

/**
 * Main function to demonstrate client usage
 */
async function main() {
  console.log('='.repeat(70));
  console.log('A2A Client Example');
  console.log('='.repeat(70));
  console.log('');

  const client = new SimpleA2AClient('http://localhost:3001/a2a/v1');

  try {
    // Get agent card
    console.log('1. Fetching Agent Card...');
    const agentCard = await client.getAgentCard();
    console.log('   ✓ Agent Name:', agentCard.name);
    console.log('   ✓ Description:', agentCard.description);
    console.log('   ✓ Version:', agentCard.version);
    console.log('   ✓ Streaming:', agentCard.capabilities.streaming);
    console.log('');

    // Send message
    console.log('2. Sending Message...');
    const message = {
      kind: 'message',
      message_id: `msg-${Date.now()}`,
      role: 'user',
      parts: [
        {
          kind: 'text',
          text: 'Hello from A2A client!',
        },
      ],
    };

    const response = await client.sendMessage(message);
    console.log('   ✓ Received Response:');
    console.log('     - Message ID:', response.message.message_id);
    console.log('     - Role:', response.message.role);
    console.log('     - Text:', response.message.parts[0].text);
    console.log('');

    // Send another message
    console.log('3. Sending Another Message...');
    const message2 = {
      kind: 'message',
      message_id: `msg-${Date.now()}`,
      role: 'user',
      parts: [
        {
          kind: 'text',
          text: 'Testing A2A protocol implementation',
        },
      ],
    };

    const response2 = await client.sendMessage(message2);
    console.log('   ✓ Received Response:');
    console.log('     - Message ID:', response2.message.message_id);
    console.log('     - Text:', response2.message.parts[0].text);
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ All tests passed successfully!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleA2AClient };
