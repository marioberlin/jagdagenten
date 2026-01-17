import type { Meta, StoryObj } from '@storybook/react';
import { GlassHeatmap } from './GlassHeatmap';

const meta: Meta<typeof GlassHeatmap> = {
    title: 'Data Display/GlassHeatmap',
    component: GlassHeatmap,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassHeatmap>;

const data = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
        x: `Hour ${hour}`,
        y: `Day ${day + 1}`,
        value: Math.floor(Math.random() * 100),
    }))
).flat();

export const Default: Story = {
    args: {
        data,
        xLabels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        yLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
};
