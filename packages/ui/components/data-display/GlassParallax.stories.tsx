import type { Meta, StoryObj } from '@storybook/react';
import { GlassParallax } from './GlassParallax';

const meta: Meta<typeof GlassParallax> = {
    title: 'Data Display/GlassParallax',
    component: GlassParallax,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassParallax>;

export const Default: Story = {
    args: {

        height: 400,
    },
    render: (args) => (
        <div className="h-[600px] overflow-y-auto">
            <div className="h-[200px] flex items-center justify-center bg-glass-surface">Scroll Down</div>
            <GlassParallax {...args}>
                <div className="flex items-center justify-center h-full">
                    <h2 className="text-4xl font-bold text-white drop-shadow-md">Parallax Effect</h2>
                </div>
            </GlassParallax>
            <div className="h-[800px] bg-glass-background">Content below...</div>
        </div>
    )
};
