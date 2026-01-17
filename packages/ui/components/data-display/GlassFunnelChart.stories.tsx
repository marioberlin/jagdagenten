import type { Meta, StoryObj } from '@storybook/react';
import { GlassFunnelChart } from './GlassFunnelChart';

const meta: Meta<typeof GlassFunnelChart> = {
    title: 'Data Display/GlassFunnelChart',
    component: GlassFunnelChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFunnelChart>;

const data = [
    { label: 'Impressions', value: 10000, fill: '#8884d8' },
    { label: 'Clicks', value: 5000, fill: '#83a6ed' },
    { label: 'Visits', value: 2500, fill: '#8dd1e1' },
    { label: 'Signups', value: 500, fill: '#82ca9d' },
    { label: 'Purchases', value: 100, fill: '#a4de6c' },
];

export const Default: Story = {
    args: {
        data,
    },
};
