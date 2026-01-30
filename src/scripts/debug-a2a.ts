
import { createA2AClient } from '@jagdagenten/a2a-sdk';

async function testConnection() {
    console.log('Testing A2A Connection...');
    const url = 'http://localhost:3000/agents/restaurant';
    console.log(`Connecting to: ${url}`);

    try {
        const client = createA2AClient({
            baseUrl: url,
            enableA2UI: true
        });

        console.log('Fetching Agent Card...');
        const card = await client.getAgentCard();
        console.log('Success! Agent Card:', card);

        console.log('\nSending Hello message...');
        const task = await client.sendText('Hello world');
        console.log('Response Task:', task);
    } catch (error) {
        console.error('Connection Failed:', error);
        if (error instanceof Error && 'cause' in error) {
            console.error('Cause:', (error as any).cause);
        }
    }
}

testConnection();
