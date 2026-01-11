import { LiquidClient } from '../liquid-engine/client';

// Singleton instance of the Liquid Engine Client
// This ensures that contexts registered from different parts of the app (Router, Pages)
// all feed into the same engine state.
export const liquidClient = new LiquidClient();
