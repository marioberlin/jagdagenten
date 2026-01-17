import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';
import { GlassCarousel } from './GlassCarousel';

const meta: Meta<typeof GlassCarousel> = {
    title: 'Data Display/GlassCarousel',
    component: GlassCarousel,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCarousel>;

export const Default: Story = {
    args: {
        className: "w-full max-w-xs mx-auto",
        items: Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-1">
                <GlassCard className="flex aspect-square items-center justify-center p-6 bg-glass-panel">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                </GlassCard>
            </div>
        ))
    }
};
