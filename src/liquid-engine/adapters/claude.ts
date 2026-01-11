import { LiquidProtocolEvent } from '../types';

/**
 * Claude Adapter
 * 
 * Transforms Anthropic SDK stream events into Liquid Protocol events.
 * Claude uses specific event types like `tool_use` and `input_json_delta`.
 */

export class LiquidClaudeAdapter {
    /**
     * Ingest a chunk from Anthropic SDK stream
     * @param event The raw event from Anthropic SDK
     */
    public transform(event: any): LiquidProtocolEvent[] {
        const events: LiquidProtocolEvent[] = [];

        switch (event.type) {
            case 'content_block_start':
                if (event.content_block?.type === 'tool_use') {
                    events.push({
                        type: 'tool_start',
                        id: event.content_block.id,
                        name: event.content_block.name
                    });
                }
                break;

            case 'content_block_delta':
                if (event.delta?.type === 'input_json_delta') {
                    // Claude sends partial JSON strings. Perfect for our engine.
                    // We need the ID from the context. Unlike Gemini, Claude events 
                    // usually happen in a block context, but the delta event itself 
                    // doesn't have the ID. We rely on the index or state.
                    // *However*, in the React/Client context, we might mapping 
                    // this differently. For this adapter, we assume the `transform` 
                    // is called within a context that knows the current active ID, 
                    // OR we pass the ID if available. 

                    // Note: The raw Anthropic event structure for `content_block_delta`
                    // includes `index`. We arguably need a stateful adapter.
                }
                break;

            case 'content_block_stop':
                // Tool use block finished
                break;

            case 'text_delta':
                events.push({
                    type: 'agent_message',
                    id: `msg_${Date.now()}`,
                    role: 'assistant',
                    content: event.delta.text
                });
                break;
        }

        return events;
    }
}

/**
 * Stateful Wrapper for Claude
 * Because Claude streams by index, we need to track which tool is at which index.
 */
export class StatefulClaudeAdapter {
    private activeTools = new Map<number, string>(); // index -> tool_id

    public transform(event: any): LiquidProtocolEvent[] {
        const events: LiquidProtocolEvent[] = [];

        if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
            const id = event.content_block.id;
            this.activeTools.set(event.index, id);
            events.push({
                type: 'tool_start',
                id: id,
                name: event.content_block.name
            });
        }
        else if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
            const id = this.activeTools.get(event.index);
            if (id) {
                events.push({
                    type: 'tool_delta',
                    id: id,
                    delta: event.delta.partial_json
                });
            }
        }
        else if (event.type === 'content_block_stop') {
            const id = this.activeTools.get(event.index);
            if (id) {
                events.push({
                    type: 'tool_complete',
                    id: id,
                    result: undefined
                });
                this.activeTools.delete(event.index);
            }
        }
        else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            events.push({
                type: 'agent_message',
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: event.delta.text
            });
        }

        return events;
    }
}
