import { useState, useEffect } from 'react';
import { useLiquidClient } from './react';
import { ToolCallState } from './types';

export interface RenderToolConfig<TArgs = any, TResult = any> {
    /**
     * The tool name to listen for.
     * This must match the name of the action registered via useLiquidAction.
     */
    name: string;
    /**
     * Render function called when the tool is active.
     */
    render: (props: {
        status: 'running' | 'completed' | 'error';
        args: TArgs;
        result?: TResult;
    }) => React.ReactNode;
}

/**
 * Generative UI Hook
 * 
 * Registers a component to be the visual representation of a specific tool call.
 * When the LiquidClient receives a tool call with matching `name`, this hook
 * will return the rendered UI.
 * 
 * @example
 * ```tsx
 * const ui = useRenderToolCall({
 *   name: 'show_weather',
 *   render: ({ args, status }) => (
 *     <WeatherCard location={args.location} loading={status === 'running'} />
 *   )
 * });
 * return ui;
 * ```
 */
export function useRenderToolCall(config: RenderToolConfig): React.ReactNode {
    const client = useLiquidClient();
    const [activeTool, setActiveTool] = useState<ToolCallState | null>(null);

    useEffect(() => {
        // Subscribe to client state changes
        const unsubscribe = client.subscribe((allStates) => {
            // Find the most recent tool call with matching name
            // (In a real chat, we might filter by "current message context", but global is fine for V1)
            const matching = Object.values(allStates)
                .reverse() // prefer newest
                .find(state => state.name === config.name);

            if (matching) {
                setActiveTool(matching);
            }
        });
        return unsubscribe;
    }, [client, config.name]);

    if (!activeTool) return null;

    // Render the user's component with live state
    return config.render({
        status: activeTool.status,
        args: activeTool.args,
        result: activeTool.result
    });
}
