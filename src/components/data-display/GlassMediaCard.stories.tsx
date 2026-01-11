import type { Meta, StoryObj } from '@storybook/react';
import { GlassMediaCard } from './GlassMediaCard';


const meta: Meta<typeof GlassMediaCard> = {
    title: 'Data Display/GlassMediaCard',
    component: GlassMediaCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMediaCard>;

export const Default: Story = {
    args: {
        title: "Cyberpunk City",

        aspectRatio: "video",
        image: "https://images.unsplash.com/photo-1620641788421-7f1c338e620a?q=80&w=2940&auto=format&fit=crop",

    },
};

export const Square: Story = {
    args: {
        title: "Album Art",

        aspectRatio: "square",
        image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2940&auto=format&fit=crop",

    }
}
