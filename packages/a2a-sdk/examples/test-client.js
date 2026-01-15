/**
 * Debug Client Example
 */

const http = require('http');

const data = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'agent/card'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/a2a/v1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Full Response:', responseData);
    const parsed = JSON.parse(responseData);
    console.log('Parsed:', JSON.stringify(parsed, null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
