/**
 * Federated Plugin Registry
 *
 * Main entry point for the plugin registry system.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 */

export * from './types.js';
export * from './store.js';
export * from './validator.js';
export * from './local-plugins.js';
export { createRegistryRoutes, default as createRoutes } from './routes.js';

