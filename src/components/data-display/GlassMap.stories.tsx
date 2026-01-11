import type { Meta, StoryObj } from '@storybook/react';
import { GlassMap } from './GlassMap';

const meta: Meta<typeof GlassMap> = {
    title: 'Data Display/GlassMap',
    component: GlassMap,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMap>;

export const Default: Story = {
    args: {

        markers: [
            { id: 'ny', lat: 40.7128, lng: -74.0060, label: 'New York' },
            { id: 'ldn', lat: 51.5074, lng: -0.1278, label: 'London' },
            { id: 'tky', lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
        ],
    },
};
