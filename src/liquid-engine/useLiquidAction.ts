import { useEffect, useCallback } from 'react';
import { useLiquidClient } from './react';
import { ActionParameter } from './client';

export interface UseLiquidActionOptions<TArgs = any, TResult = any> {
    /**
     * Unique name for this action (used by AI to invoke it)
     */
    name: string;
    /**
     * Description of what this action does (shown to AI)
     */
    description: string;
    /**
     * Parameter definitions for the action
     */
    parameters: ActionParameter[];
    /**
     * Handler function called when AI invokes this action
     */
    handler: (args: TArgs) => Promise<TResult> | TResult;
    /**
     * Optional render function for displaying action status
     */
    render?: (props: {
        status: 'running' | 'completed' | 'error';
        args: TArgs;
        result?: TResult;
    }) => React.ReactNode;
}

/**
 * useLiquidAction Hook
 * 
 * Registers an action that the AI can invoke to affect application state.
 * Similar to CopilotKit's `useCopilotAction`.
 * 
 * @example
 * ```tsx
 * useLiquidAction({
 *   name: "updateProfile",
 *   description: "Update the user's profile information",
 *   parameters: [
 *     { name: "name", type: "string", description: "User's name", required: true },
 *     { name: "email", type: "string", description: "User's email", required: false }
 *   ],
 *   handler: async ({ name, email }) => {
 *     await updateUser({ name, email });
 *     return { success: true };
 *   }
 * });
 * ```
 */
export function useLiquidAction<TArgs = any, TResult = any>(
    options: UseLiquidActionOptions<TArgs, TResult>
): void {
    const client = useLiquidClient();

    // Stable handler reference
    const stableHandler = useCallback(options.handler, [options.handler]);

    useEffect(() => {
        // Register this action
        const unregister = client.registerAction({
            name: options.name,
            description: options.description,
            parameters: options.parameters,
            handler: stableHandler as any,
            render: options.render as any
        });

        return unregister;
    }, [client, options.name, options.description, options.parameters, stableHandler, options.render]);
}

/**
 * Re-export parameter type for convenience
 */
export type { ActionParameter };
