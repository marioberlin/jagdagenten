import type { Meta, StoryObj } from '@storybook/react';
import { GlassStatsBar } from './GlassStatsBar';
import { Users, DollarSign, Activity } from 'lucide-react';

const meta: Meta<typeof GlassStatsBar> = {
    title: 'Data Display/GlassStatsBar',
    component: GlassStatsBar,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassStatsBar>;

const stats = [
    { label: 'Total Users', value: '10.5K', icon: <Users className="h-4 w-4" />, change: '+12%' },
    { label: 'Revenue', value: '$45,231', icon: <DollarSign className="h-4 w-4" />, change: '+5.4%' },
    { label: 'Active Sessions', value: '1,234', icon: <Activity className="h-4 w-4" />, change: '-2.1%' }
];

export const Default: Story = {
    args: {
        stats,
    },
};
