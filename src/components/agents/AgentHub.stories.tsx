import type { Meta, StoryObj } from '@storybook/react';
import { AgentHub } from '@/pages/agents/AgentHub';

const meta: Meta<typeof AgentHub> = {
    title: 'Agents/AgentHub',
    component: AgentHub,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        backgrounds: {
            default: 'dark',
            values: [{ name: 'dark', value: '#0a0a0a' }],
        },
    },
};

export default meta;
type Story = StoryObj<typeof AgentHub>;

export const Default: Story = {
    render: () => (
        <div className="h-screen overflow-hidden bg-black">
            <AgentHub />
        </div>
    ),
};

export const WithBackdrop: Story = {
    render: () => (
        <div
            className="h-screen overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%)',
            }}
        >
            <AgentHub />
        </div>
    ),
};
