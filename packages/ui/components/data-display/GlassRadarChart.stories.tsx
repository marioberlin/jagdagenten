import type { Meta, StoryObj } from '@storybook/react';
import { GlassRadarChart } from './GlassRadarChart';

const meta: Meta<typeof GlassRadarChart> = {
    title: 'Data Display/GlassRadarChart',
    component: GlassRadarChart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassRadarChart>;

const data = [
    { subject: 'Math', A: 120, B: 110, fullMark: 150 },
    { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
    { subject: 'English', A: 86, B: 130, fullMark: 150 },
    { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
    { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
    { subject: 'History', A: 65, B: 85, fullMark: 150 },
];

export const Default: Story = {
    args: {
        data,
    },
};
