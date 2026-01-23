/**
 * iCloud Store - Re-export Shim
 *
 * The canonical store now lives at src/applications/icloud/store.ts.
 * This file re-exports everything for backwards compatibility with
 * consumers outside the app bundle (hooks, services, etc.).
 */
export * from '@/applications/icloud/store';
