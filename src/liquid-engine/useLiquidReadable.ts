import { useEffect, useId } from 'react';
import { useLiquidClient } from './react';

export interface UseLiquidReadableOptions {
    /**
     * Description of what this data represents (shown to AI)
     */
    description: string;
    /**
     * The current value to expose to the AI
     */
    value: unknown;
}

/**
 * useLiquidReadable Hook
 * 
 * Makes application state available to the AI assistant.
 * Similar to CopilotKit's `useCopilotReadable`.
 * 
 * @example
 * ```tsx
 * useLiquidReadable({
 *   description: "Current user profile",
 *   value: { name: "Mario", role: "developer" }
 * });
 * ```
 */
export function useLiquidReadable(options: UseLiquidReadableOptions): void {
    const client = useLiquidClient();
    const id = useId();

    useEffect(() => {
        // Register this readable context
        const unregister = client.registerReadable({
            id,
            description: options.description,
            value: options.value
        });

        return unregister;
    }, [client, id, options.description]);

    // Update value when it changes
    useEffect(() => {
        client.updateReadable(id, options.value);
    }, [client, id, options.value]);
}
