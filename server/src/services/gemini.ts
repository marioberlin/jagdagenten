import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handleGeminiChat = async (req: Request, res: Response) => {
    const { prompt, model = 'gemini-3-flash-preview', context, tools } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('Server missing GEMINI_API_KEY');
    }

    const aiModel = genAI.getGenerativeModel({
        model: model,
        // Convert Liquid Tools -> Gemini Tools
        tools: tools ? [{ functionDeclarations: tools[0].functionDeclarations }] : undefined
    });

    const chat = aiModel.startChat({
        history: [
            { role: 'user', parts: [{ text: context || '' }] },
            { role: 'model', parts: [{ text: 'Ok.' }] } // Priming
        ]
    });

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();

        // 1. Text Delta
        if (chunkText) {
            res.write(`event: chunk\ndata: ${JSON.stringify({ delta: chunkText })}\n\n`);
        }

        // 2. Tool Calls
        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
            for (const call of calls) {
                // Determine type (start, delta, complete)
                // Gemini usually gives complete calls in one chunk unlike GPT-4 streaming
                // So we synthesize specific start/complete events for Liquid Engine

                const toolId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Tool Start
                res.write(`event: tool_call\ndata: ${JSON.stringify({
                    type: 'tool_start',
                    id: toolId,
                    name: call.name
                })}\n\n`);

                // Tool Args (Simulate streaming for engine compatibility)
                const argsString = JSON.stringify(call.args);
                res.write(`event: tool_call\ndata: ${JSON.stringify({
                    type: 'tool_delta',
                    id: toolId,
                    delta: argsString
                })}\n\n`);

                // Tool Complete
                res.write(`event: tool_call\ndata: ${JSON.stringify({
                    type: 'tool_complete',
                    id: toolId,
                    result: null // Client executes, server doesn't know result yet
                })}\n\n`);
            }
        }
    }

    res.end();
};
