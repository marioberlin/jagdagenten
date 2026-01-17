import type { Meta, StoryObj } from '@storybook/react';
import { GlassDonutChart } from './GlassDonutChart';

const meta: Meta<typeof GlassDonutChart> = {
    title: 'Data Display/GlassDonutChart',
    component: GlassDonutChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDonutChart>;

const dataOptions = [
    { name: 'BTC', value: 45, color: '#F7931A' },
    { name: 'ETH', value: 30, color: '#627EEA' },
    { name: 'USDT', value: 15, color: '#26A17B' },
    { name: 'SOL', value: 10, color: '#14F195' },
];

export const Default: Story = {
    args: {
        data: dataOptions.map(d => d.value),
        labels: dataOptions.map(d => d.name),
        colors: dataOptions.map(d => d.color),
    },
};
