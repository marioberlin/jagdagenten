import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { GlassSmartList } from './GlassSmartList';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassSmartList> = {
    title: 'Generative/GlassSmartList',
    component: GlassSmartList,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSmartList>;

const Simulator = ({ data }: { data: any }) => {
    const [client] = useState(() => new LiquidClient());
    const [isRunning, setIsRunning] = useState(false);

    const runSimulation = () => {
        if (isRunning) return;
        setIsRunning(true);

        const id = `call-${Date.now()}`;
        const toolName = 'generate_list';

        client.ingest({ type: 'tool_start', id, name: toolName } as any);

        const fullContent = JSON.stringify(data);
        let currentIndex = 0;
        const chunkSize = 10;

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
                <GlassSmartList />
                <GlassButton onClick={runSimulation} disabled={isRunning} size="sm">
                    {isRunning ? 'Streaming...' : 'Re-Generate List'}
                </GlassButton>
            </div>
        </LiquidProvider>
    );
};

export const TodoList: Story = {
    render: () => (
        <Simulator
            data={{
                title: "Trading Setup Checklist",
                items: [
                    "Review daily timeframe trend",
                    "Check identified resistance levels",
                    "Verify RSI divergence",
                    "Calculate position size based on risk",
                    "Set stop-loss order"
                ]
            }}
        />
    )
};

export const AssetList: Story = {
    render: () => (
        <Simulator
            data={{
                title: "Top Performers (24h)",
                items: [
                    "SOL +12.5%",
                    "AVAX +8.2%",
                    "LINK +5.4%",
                    "DOT +3.1%"
                ]
            }}
        />
    )
};
