import type { Meta, StoryObj } from '@storybook/react';
import { GlassChart } from './GlassChart';

const meta: Meta<typeof GlassChart> = {
    title: 'Data Display/GlassChart',
    component: GlassChart,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['line', 'bar'],
        },
        color: { control: 'color' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassChart>;

const lineData = [30, 45, 38, 52, 60, 48, 75, 90, 85, 95];
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

export const LineChart: Story = {
    args: {
        type: 'line',
        data: lineData,
        labels: labels,
        color: '#3b82f6', // blue-500
        ariaLabel: 'Portfolio Performance Chart',
        ariaDescription: 'Shows steady growth over 10 months',
    },
};

export const BarChart: Story = {
    args: {
        type: 'bar',
        data: [65, 40, 80, 55, 90],
        labels: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'],
        color: '#8b5cf6', // violet-500
    },
};

export const MultipleColors: Story = {
    args: {
        type: 'line',
        data: [10, 25, 15, 40, 30, 60],
        color: '#10b981', // emerald-500
    },
};

export const LargeDataset: Story = {
    args: {
        type: 'line',
        data: Array.from({ length: 50 }, () => Math.floor(Math.random() * 100)),
        height: 100,
        color: '#f59e0b', // amber-500
    },
};
