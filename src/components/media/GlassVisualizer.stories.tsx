import type { Meta, StoryObj } from '@storybook/react';
import { GlassVisualizer } from './GlassVisualizer';

const meta: Meta<typeof GlassVisualizer> = {
    title: 'Media/GlassVisualizer',
    component: GlassVisualizer,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassVisualizer>;

// Mock audio data for visualization


export const Default: Story = {
    args: {
        count: 32,
    },
    render: (args) => {
        // Small wrapper to simulate changing data
        return (
            <div className="h-[200px] w-full bg-black/20 rounded-lg p-4 flex items-center justify-center">
                <GlassVisualizer {...args} />
            </div>
        )
    }
};

export const Wave: Story = {
    args: {
        count: 64,
    },
    render: (args) => (
        <div className="h-[200px] w-full bg-black/20 rounded-lg p-4 flex items-center justify-center">
            <GlassVisualizer {...args} />
        </div>
    )
}
