import type { Meta, StoryObj } from '@storybook/react';
import { GlassSticky } from './GlassSticky';

const meta: Meta<typeof GlassSticky> = {
    title: 'Layout/GlassSticky',
    component: GlassSticky,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSticky>;

export const Default: Story = {
    render: () => (
        <div className="h-[400px] overflow-y-auto border border-glass-border rounded-lg relative">
            <div className="h-[200px] bg-red-500/10 p-4">Scroll down...</div>
            <GlassSticky className="p-4 bg-glass-surface border-y border-glass-border">
                I am sticky!
            </GlassSticky>
            <div className="h-[800px] bg-blue-500/10 p-4">Lots of content...</div>
        </div>
    ),
};
