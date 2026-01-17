import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { GlassSmartWeather } from './GlassSmartWeather';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassSmartWeather> = {
    title: 'Generative/GlassSmartWeather',
    component: GlassSmartWeather,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSmartWeather>;

const Simulator = ({ data }: { data: any }) => {
    const [client] = useState(() => new LiquidClient());
    const [isRunning, setIsRunning] = useState(false);

    const runSimulation = () => {
        if (isRunning) return;
        setIsRunning(true);

        const id = `call-${Date.now()}`;
        const toolName = 'get_weather';

        client.ingest({ type: 'tool_start', id, name: toolName } as any);

        const fullContent = JSON.stringify(data);
        let currentIndex = 0;
        const chunkSize = 8;

        const interval = setInterval(() => {
            if (currentIndex >= fullContent.length) {
                clearInterval(interval);
                client.ingest({ type: 'tool_complete', id, name: toolName } as any);
                setIsRunning(false);
                return;
            }

            const delta = fullContent.slice(currentIndex, currentIndex + chunkSize);
            client.ingest({ type: 'tool_delta', id, name: toolName, delta } as any);

            currentIndex += chunkSize;
        }, 50);
    };

    useEffect(() => {
        setTimeout(runSimulation, 500);
    }, []);

    return (
        <LiquidProvider client={client}>
            <div className="flex flex-col gap-8 items-start">
                <GlassSmartWeather />
                <GlassButton onClick={runSimulation} disabled={isRunning} size="sm">
                    {isRunning ? 'Streaming...' : 'Update Weather'}
                </GlassButton>
            </div>
        </LiquidProvider>
    );
};

export const SunnyDay: Story = {
    render: () => (
        <Simulator
            data={{
                location: "Dubai, UAE",
                temperature: 32,
                condition: "sunny",
                forecast: ["Tue", "Wed", "Thu"]
            }}
        />
    )
};

export const RainyLondon: Story = {
    render: () => (
        <Simulator
            data={{
                location: "London, UK",
                temperature: 14,
                condition: "rainy",
                forecast: ["Fri (Rain)", "Sat (Cloud)", "Sun (Rain)"]
            }}
        />
    )
};
