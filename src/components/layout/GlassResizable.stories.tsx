import type { Meta, StoryObj } from '@storybook/react';
import { GlassResizable } from './GlassResizable';

const meta: Meta<typeof GlassResizable> = {
    title: 'Layout/GlassResizable',
    component: GlassResizable,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassResizable>;

export const Default: Story = {
    render: () => (
        <GlassResizable
            direction="horizontal"
            className="max-w-md h-[200px] border border-glass-border"
            defaultSplit={50}
        >
            <div className="flex h-full items-center justify-center p-6 bg-glass-surface/10">
                <span className="font-semibold">One</span>
            </div>
            <GlassResizable
                direction="vertical"
                defaultSplit={25}
                className="h-full"
            >
                <div className="flex h-full items-center justify-center p-6 bg-glass-surface/20">
                    <span className="font-semibold">Two</span>
                </div>
                <div className="flex h-full items-center justify-center p-6 bg-glass-surface/30">
                    <span className="font-semibold">Three</span>
                </div>
            </GlassResizable>
        </GlassResizable>
    ),
};
