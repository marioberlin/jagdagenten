import { LiquidProtocolEvent } from '../types';

/**
 * Gemini Adapter
 * 
 * Transforms Google Generative AI SDK stream chunks into Liquid Protocol events.
 * 
 * Note: Gemini's streaming format often sends the full FunctionCall in one chunk
 * or accumulates it differently than other models. This adapter normalizes it.
 */

export class LiquidGeminiAdapter {
    private processingId: string | null = null;

    /**
     * Ingest a chunk from `result.stream`
     * @param chunk The raw chunk from Gemini SDK
     */
    public transform(chunk: any): LiquidProtocolEvent[] {
        const events: LiquidProtocolEvent[] = [];

        // Check for function calls in the candidates
        const candidate = chunk.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (part?.functionCall) {
            console.log("[LiquidGeminiAdapter] Function Call detected:", part.functionCall);
            const fc = part.functionCall;
            const callId = `call_${Date.now()}`; // Gemini doesn't always provide stable IDs in stream? 
            // Actually, for a single stream response, we can generate a stable ID or use index.
            // For now, we assume one function call per turn for simplicity or generate a consistent ID if possible.
            // Real implementation might need state to track if we've already started this call ID.

            // In many Gemini stream implementations, the function call comes as a complete object
            // at the end, or built up. If it's the *first* time we see it:
            if (!this.processingId) {
                this.processingId = callId;
                events.push({
                    type: 'tool_start',
                    id: this.processingId,
                    name: fc.name
                });
            }

            // If args are present, send them as a delta/complete
            // Gemini often sends the WHOLE args object at once in the final chunk.
            // We can treat it as a single big delta.
            if (fc.args) {
                events.push({
                    type: 'tool_delta',
                    id: this.processingId!,
                    delta: JSON.stringify(fc.args)
                });

                // And immediately complete it because Gemini usually gives it all
                events.push({
                    type: 'tool_complete',
                    id: this.processingId!,
                    result: undefined
                });
                this.processingId = null;
            }
        }

        // Check for regular text
        if (part?.text) {
            events.push({
                type: 'agent_message',
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: part.text
            });
        }

        return events;
    }
}
