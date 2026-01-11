import type { Meta, StoryObj } from '@storybook/react';

import { GlassMetric } from './GlassMetric';
import { Wallet, TrendingUp, Users, Activity } from 'lucide-react';

const meta: Meta<typeof GlassMetric> = {
    title: 'Data Display/GlassMetric',
    component: GlassMetric,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMetric>;

export const Default: Story = {
    args: {
        title: 'Total Balance',
        value: 45280,
        prefix: '$',
        icon: <Wallet size={16} />,
    },
};

export const PositiveTrend: Story = {
    args: {
        title: 'Daily Profit',
        value: 1240.50,
        prefix: '$',
        trend: 'up',
        trendValue: '+12.5%',
        icon: <TrendingUp size={16} />,
        data: [10, 20, 15, 30, 45, 40, 55, 60],
    },
};

export const NegativeTrend: Story = {
    args: {
        title: 'Active Positions',
        value: 12,
        trend: 'down',
        trendValue: '-2 active',
        icon: <Activity size={16} />,
        data: [60, 55, 58, 45, 40, 42, 35, 30],
    },
};

export const LargeNumericValue: Story = {
    args: {
        title: 'Market Cap',
        value: '1.2T',
        prefix: '$',
        trend: { value: 0.5, label: 'Stable', isPositive: true },
        icon: <Users size={16} />,
    },
};

export const CustomTrend: Story = {
    args: {
        title: 'Network Hashrate',
        value: 485,
        suffix: ' EH/s',
        trend: { value: 15, label: 'Mining difficulty increased', isPositive: true },
        trendValue: '+15%',
    },
};
