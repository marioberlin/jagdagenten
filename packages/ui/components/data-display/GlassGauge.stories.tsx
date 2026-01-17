import type { Meta, StoryObj } from '@storybook/react';
import { GlassGauge } from './GlassGauge';

const meta: Meta<typeof GlassGauge> = {
    title: 'Data Display/GlassGauge',
    component: GlassGauge,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassGauge>;

export const Default: Story = {
    args: {
        value: 75,
        max: 100,

        units: '%',
    },
};
