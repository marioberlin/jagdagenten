import type { Meta, StoryObj } from '@storybook/react';
import { GlassScatterChart } from './GlassScatterChart';

const meta: Meta<typeof GlassScatterChart> = {
    title: 'Data Display/GlassScatterChart',
    component: GlassScatterChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassScatterChart>;

const data = Array.from({ length: 50 }, () => ({
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
    z: Math.floor(Math.random() * 1000),
}));

export const Default: Story = {
    args: {
        data,


    },
};
