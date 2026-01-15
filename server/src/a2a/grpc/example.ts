/**
 * gRPC Server Example
 *
 * Demonstrates how to run the A2A gRPC server alongside the HTTP server.
 *
 * Usage:
 *   bun run server/src/a2a/grpc/example.ts
 *
 * This starts:
 *   - HTTP server on port 3000
 *   - gRPC server on port 50051
 */

import { createA2AGrpcServer } from './index.js';

async function main() {
  console.log('Starting A2A gRPC Server...');
  console.log('');

  // Create gRPC server with default configuration
  const grpcServer = createA2AGrpcServer({
    port: 50051,
    host: '0.0.0.0',
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    enableTelemetry: process.env.OTEL_ENABLED === 'true',
  });

  // Start the gRPC server
  await grpcServer.start();

  console.log('');
  console.log('gRPC server is ready!');
  console.log('');
  console.log('Available methods:');
  console.log('  - SendMessage          (unary)');
  console.log('  - SendStreamingMessage (server streaming)');
  console.log('  - GetTask              (unary)');
  console.log('  - CancelTask           (unary)');
  console.log('  - TaskSubscription     (server streaming)');
  console.log('  - GetAgentCard         (unary)');
  console.log('  - GetTaskPushNotificationConfig  (unary)');
  console.log('  - CreateTaskPushNotificationConfig (unary)');
  console.log('');
  console.log('Proto file: packages/a2a-sdk/proto/a2a.proto');
  console.log('');
  console.log('Example with grpcurl:');
  console.log('  grpcurl -plaintext localhost:50051 a2a.v1.A2AService/GetAgentCard');
  console.log('');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gRPC server...');
    await grpcServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gRPC server...');
    await grpcServer.stop();
    process.exit(0);
  });
}

main().catch(console.error);
