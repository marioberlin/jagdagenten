import type { Meta, StoryObj } from '@storybook/react';
import { GlassPolarAreaChart } from './GlassPolarAreaChart';

const meta: Meta<typeof GlassPolarAreaChart> = {
    title: 'Data Display/GlassPolarAreaChart',
    component: GlassPolarAreaChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPolarAreaChart>;



export const Default: Story = {
    args: {

    },
};
