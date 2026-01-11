import { LiquidClient } from './client';

// Simple mock test to run in node/console
const client = new LiquidClient();

console.log("--- Starting Liquid Engine Test ---");

client.subscribe((state) => {
    // Just log one tool for clarity
    const tool = Object.values(state)[0];
    if (tool) {
        console.log(`[UI UPDATE] Status: ${tool.status} | Args: ${JSON.stringify(tool.args)}`);
    }
});

// Simulate a stream
const events = [
    { type: 'tool_start', id: 'call_1', name: 'weather_widget' },
    { type: 'tool_delta', id: 'call_1', delta: '{"loc": ' },
    { type: 'tool_delta', id: 'call_1', delta: '"New ' },
    { type: 'tool_delta', id: 'call_1', delta: 'York", "temp": ' },
    { type: 'tool_delta', id: 'call_1', delta: '72}' },
    { type: 'tool_complete', id: 'call_1', result: { weather: 'sunny' } }
] as const;

events.forEach((evt, i) => {
    setTimeout(() => {
        console.log(`\nEvent ${i}: ${evt.type}`);
        client.ingest(evt);
    }, i * 100);
});
