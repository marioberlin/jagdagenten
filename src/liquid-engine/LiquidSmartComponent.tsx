
import { useRenderToolCall, RenderToolConfig } from './useRenderToolCall';

export interface LiquidSmartComponentProps<TArgs = any, TResult = any> extends RenderToolConfig<TArgs, TResult> {
    // No additional props needed, extending config directly
}

/**
 * Declarative wrapper for Generative UI.
 * 
 * Renders the provided content ONLY when the specified tool is invoked by the AI.
 * 
 * @example
 * ```tsx
 * <LiquidSmartComponent
 *   name="generate_chart"
 *   render={({ args }) => <Chart data={args.data} />}
 * />
 * ```
 */
export function LiquidSmartComponent<TArgs = any, TResult = any>(
    props: LiquidSmartComponentProps<TArgs, TResult>
) {
    const content = useRenderToolCall({
        name: props.name,
        render: props.render
    });

    return <>{content}</>;
}
