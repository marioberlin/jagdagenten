import type { Meta, StoryObj } from '@storybook/react';
import { GlassCandlestickChart } from './GlassCandlestickChart';

const meta: Meta<typeof GlassCandlestickChart> = {
    title: 'Data Display/GlassCandlestickChart',
    component: GlassCandlestickChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCandlestickChart>;

const data = Array.from({ length: 30 }, (_, i) => {
    const base = 100 + Math.random() * 20;
    return {
        timestamp: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        open: base,
        high: base + Math.random() * 10,
        low: base - Math.random() * 10,
        close: base + (Math.random() - 0.5) * 15,
    };
});

export const Default: Story = {
    args: {
        data,
        height: 400,
    },
};
