
import { createA2AClient } from '../a2a/client';

async function testConnection() {
    console.log('Testing A2A Connection...');
    const url = 'http://localhost:3000/agents/restaurant';
    console.log(`Connecting to: ${url}`);

    try {
        const client = createA2AClient(url, {
            enableA2UI: true
        });

        console.log('Fetching Agent Card...');
        const card = await client.getAgentCard();
        console.log('Success! Agent Card:', card);

        console.log('\nSending Hello message...');
        const response = await client.sendText('Hello world');
        console.log('Response:', response);
    } catch (error) {
        console.error('Connection Failed:', error);
        if (error instanceof Error && 'cause' in error) {
            console.error('Cause:', (error as any).cause);
        }
    }
}

testConnection();
