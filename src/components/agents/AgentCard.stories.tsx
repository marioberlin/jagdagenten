import type { Meta, StoryObj } from '@storybook/react';
import { AgentCard, AgentCardCompact } from './AgentCard';
import { CURATED_AGENTS, getCuratedAgents } from '@/services/agents/registry';

const meta: Meta<typeof AgentCard> = {
    title: 'Agents/AgentCard',
    component: AgentCard,
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
type Story = StoryObj<typeof AgentCard>;

const sampleAgent = CURATED_AGENTS[0]; // Restaurant Finder

export const Default: Story = {
    args: {
        agent: sampleAgent,
        size: 'md',
    },
};

export const Small: Story = {
    args: {
        agent: sampleAgent,
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        agent: sampleAgent,
        size: 'lg',
    },
};

export const WithClick: Story = {
    args: {
        agent: sampleAgent,
        size: 'md',
        onClick: () => alert(`Clicked: ${sampleAgent.name}`),
    },
};

export const GridOfAgents: Story = {
    render: () => (
        <div className="grid grid-cols-3 gap-6 p-8">
            {getCuratedAgents().slice(0, 6).map((agent) => (
                <AgentCard
                    key={agent.id}
                    agent={agent}
                    size="md"
                    onClick={() => console.log('Clicked:', agent.name)}
                />
            ))}
        </div>
    ),
};

export const CompactVariant: Story = {
    render: () => (
        <div className="w-[500px] space-y-3">
            {getCuratedAgents().slice(0, 4).map((agent) => (
                <AgentCardCompact
                    key={agent.id}
                    agent={agent}
                    onClick={() => console.log('Clicked:', agent.name)}
                />
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-start gap-8 p-8">
            <AgentCard agent={sampleAgent} size="sm" />
            <AgentCard agent={sampleAgent} size="md" />
            <AgentCard agent={sampleAgent} size="lg" />
        </div>
    ),
};

export const DifferentCategories: Story = {
    render: () => {
        const agents = getCuratedAgents();
        return (
            <div className="grid grid-cols-4 gap-4 p-8">
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        size="md"
                    />
                ))}
            </div>
        );
    },
};
