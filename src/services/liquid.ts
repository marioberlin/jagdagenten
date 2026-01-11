import { LiquidClient } from '../liquid-engine/client';

/**
 * Legacy singleton instance of the Liquid Engine Client
 *
 * @deprecated This singleton is deprecated and will be removed in v2.0.0.
 * Use LiquidSessionProvider and useLiquidClient() hook instead for session-scoped access.
 *
 * Migration:
 * ```tsx
 * // Before (deprecated)
 * import { liquidClient } from '../services/liquid';
 * liquidClient.registerReadable({ ... });
 *
 * // After (recommended)
 * import { useLiquidClient } from '../liquid-engine/react';
 * const client = useLiquidClient();
 * client.registerReadable({ ... });
 * ```
 *
 * @see ADR-005: Session-Scoped LiquidClient
 */
let _deprecationWarned = false;

const _legacySingletonClient = new LiquidClient();

export const liquidClient = new Proxy(_legacySingletonClient, {
    get(target, prop) {
        if (!_deprecationWarned && typeof window !== 'undefined') {
            _deprecationWarned = true;
            console.warn(
                '[DEPRECATED] Direct liquidClient import from services/liquid is deprecated.\n' +
                'Use LiquidSessionProvider and useLiquidClient() hook instead.\n' +
                'This singleton will be removed in v2.0.0.\n' +
                'See: docs/adr/ADR-005-session-scoped-liquid-client.md'
            );
        }
        const value = target[prop as keyof LiquidClient];
        if (typeof value === 'function') {
            return value.bind(target);
        }
        return value;
    }
});
