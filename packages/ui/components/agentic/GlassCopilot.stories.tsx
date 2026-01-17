import type { Meta, StoryObj } from '@storybook/react';
import { GlassCopilot } from './GlassCopilot';

const meta: Meta<typeof GlassCopilot> = {
    title: 'Agentic/GlassCopilot',
    component: GlassCopilot,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCopilot>;

export const Default: Story = {
    args: {
        context: 'Editing App.tsx',
    },
    render: (args) => (
        <div className="relative h-[500px] border border-glass-border">
            <div>Editor Content...</div>
            <GlassCopilot {...args} />
        </div>
    )
};
