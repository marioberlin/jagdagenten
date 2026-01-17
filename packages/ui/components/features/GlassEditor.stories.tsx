import type { Meta, StoryObj } from '@storybook/react';

import { GlassEditor } from './GlassEditor';

const meta: Meta<typeof GlassEditor> = {
    title: 'Features/GlassEditor',
    component: GlassEditor,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="w-full max-w-4xl p-12 bg-app-dark">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassEditor>;

export const Default: Story = {
    args: {
        placeholder: 'Write your strategy notes here...',
    },
};

export const WithInitialValue: Story = {
    args: {
        initialValue: '<h1>Alpha Strategy</h1><p>Focus on high-volume <b>BTC/USDT</b> breaks above 50k...</p>',
    },
};

export const InteractiveSelection: Story = {
    render: (args) => (
        <div className="space-y-4">
            <p className="text-secondary text-sm">Select text inside the editor to see the floating glass toolbar.</p>
            <GlassEditor {...args} initialValue="Select me to format!" />
        </div>
    ),
};
