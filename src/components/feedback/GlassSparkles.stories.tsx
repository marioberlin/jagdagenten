import type { Meta, StoryObj } from '@storybook/react';
import { GlassSparkles } from './GlassSparkles';


const meta: Meta<typeof GlassSparkles> = {
    title: 'Feedback/GlassSparkles',
    component: GlassSparkles,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSparkles>;

export const Default: Story = {
    render: () => (
        <div className="relative w-[300px] h-[200px] bg-glass-panel rounded-xl flex items-center justify-center border border-glass-border overflow-hidden">
            <GlassSparkles />
            <span className="relative z-10 font-bold text-lg">Magical Content</span>
        </div>
    ),
};

export const CustomColors: Story = {
    render: () => (
        <div className="relative w-[300px] h-[200px] bg-glass-surface rounded-xl flex items-center justify-center border border-glass-border overflow-hidden">
            <GlassSparkles color="#FFD700" />
            <span className="relative z-10 font-bold text-lg text-yellow-400">Gold Tier</span>
        </div>
    )
}
