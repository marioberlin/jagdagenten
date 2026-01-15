/**
 * Minimal A2A Server Example
 * Based on official A2A Protocol specification
 */

import { createServer } from 'http';

// Minimal A2A protocol message handler
const agentCard = {
  name: 'Minimal Echo Agent',
  description: 'Simple echo agent demonstrating A2A protocol',
  version: '1.0.0',
  url: 'http://localhost:3000/a2a/v1',
  capabilities: {
    streaming: false,
    push_notifications: false,
    state_transition_history: true,
  },
};

// Simple message handler
function handleMessage(body: any): any {
  const message = body?.params?.message;

  if (!message) {
    return {
      jsonrpc: '2.0',
      id: body?.id,
      error: {
        code: -32600,
        message: 'Invalid Request: message is required',
      },
    };
  }

  // Echo the message back
  const responseMessage = {
    kind: 'message',
    message_id: `resp-${Date.now()}`,
    role: 'agent',
    parts: message.parts || [],
  };

  return {
    jsonrpc: '2.0',
    id: body?.id,
    result: {
      message: responseMessage,
    },
  };
}

// Create HTTP server
const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const requestBody = JSON.parse(body);

      // Handle agent card request
      if (requestBody.method === 'agent/card') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agentCard));
        return;
      }

      // Handle message send
      if (requestBody.method === 'message/send') {
        const response = handleMessage(requestBody);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }

      // Unknown method
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          id: requestBody?.id,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        })
      );
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
          },
        })
      );
    }
  });
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('A2A Minimal Server Running');
  console.log('='.repeat(70));
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Agent Card: http://localhost:${PORT}/a2a/v1 (POST with method: "agent/card")`);
  console.log('');
  console.log('Test with curl:');
  console.log(`curl -X POST http://localhost:${PORT}/a2a/v1 \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"jsonrpc":"2.0","id":1,"method":"message/send","params":{"message":{"kind":"message","message_id":"test-123","role":"user","parts":[{"kind":"text","text":"Hello!"}]}}}\'');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
