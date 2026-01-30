
import { createA2AClient } from '@jagdagenten/a2a-sdk';

async function main() {
    console.log("Creating client...");
    const client = createA2AClient({
        baseUrl: 'http://localhost:3000',
        enableA2UI: true
    });

    console.log("Client keys:", Object.keys(client));
    console.log("Client prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));

    // Check specific methods
    const methods = ['sendText', 'streamText', 'getCard', 'extractText'];
    for (const m of methods) {
        console.log(`Has ${m}:`, typeof (client as any)[m]);
    }

    try {
        console.log("Attempting to call sendText...");
        // @ts-ignore
        const p = client.sendText('hello');
        console.log("sendText returned promise:", p instanceof Promise);
    } catch (e: any) {
        console.error("Error calling sendText:", e.message);
    }
}

main();
