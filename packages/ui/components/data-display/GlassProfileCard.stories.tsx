import type { Meta, StoryObj } from '@storybook/react';
import { GlassProfileCard } from './GlassProfileCard';

const meta: Meta<typeof GlassProfileCard> = {
    title: 'Data Display/GlassProfileCard',
    component: GlassProfileCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassProfileCard>;

export const Default: Story = {
    args: {
        name: 'Sarah Connor',
        role: 'Product Designer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',



    },
};
