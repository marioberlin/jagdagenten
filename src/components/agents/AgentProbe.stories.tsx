import type { Meta, StoryObj } from '@storybook/react';
import { AgentProbe } from './AgentProbe';

const meta: Meta<typeof AgentProbe> = {
    title: 'Agents/AgentProbe',
    component: AgentProbe,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'dark',
            values: [{ name: 'dark', value: '#0a0a0a' }],
        },
    },
};

export default meta;
type Story = StoryObj<typeof AgentProbe>;

export const Default: Story = {
    render: () => (
        <div className="w-[600px] p-8">
            <AgentProbe
                onAgentDiscovered={(url, card) => {
                    console.log('Discovered agent:', url, card);
                }}
            />
        </div>
    ),
};

export const WithCustomWidth: Story = {
    render: () => (
        <div className="w-[800px] p-8">
            <AgentProbe
                className="max-w-full"
                onAgentDiscovered={(url, card) => {
                    console.log('Discovered agent:', url, card);
                }}
            />
        </div>
    ),
};

export const InContext: Story = {
    render: () => (
        <div className="w-[800px] p-8 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Discover A2A Agents</h2>
                <p className="text-white/50">
                    Enter any A2A-compatible agent URL to discover and connect
                </p>
            </div>
            <AgentProbe
                onAgentDiscovered={(url, card) => {
                    console.log('Discovered agent:', url, card);
                }}
            />
        </div>
    ),
};
