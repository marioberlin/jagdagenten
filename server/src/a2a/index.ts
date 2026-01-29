/**
 * A2A Protocol Module
 *
 * Exports A2A protocol types, handlers, and SDK adapter for the LiquidCrypto server.
 */

// Legacy types and handlers
export * from './types.js';
export * from './handler.js';

// SDK Adapter
export * from './adapter/index.js';

// Executors
export * from './executors/index.js';

// Elysia Plugin
export { createA2APlugin, type A2APluginConfig } from './elysia-plugin.js';

// Voice WebSocket
export { createVoiceWebSocketPlugin, voiceManager } from './voice-ws.js';

// gRPC Transport
export { A2AGrpcServer, createA2AGrpcServer, type GrpcServerConfig } from './grpc/index.js';

