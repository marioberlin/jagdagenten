import type { Meta, StoryObj } from '@storybook/react';
import { GlassWeather } from './GlassWeather';

const meta: Meta<typeof GlassWeather> = {
    title: 'Data Display/GlassWeather',
    component: GlassWeather,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassWeather>;

export const Default: Story = {
    args: {
        location: 'San Francisco',
        temperature: 72,



        humidity: 45,

    },
};
