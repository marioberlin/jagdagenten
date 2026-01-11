import type { Meta, StoryObj } from '@storybook/react';
import { GlassMediaList } from './GlassMediaList';

const meta: Meta<typeof GlassMediaList> = {
    title: 'Data Display/GlassMediaList',
    component: GlassMediaList,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMediaList>;

const items = [
    {
        id: '1',
        title: 'Cyberpunk City',
        image: 'https://images.unsplash.com/photo-1620641788421-7f1c338e620a?q=80&w=2940&auto=format&fit=crop',
        subtitle: 'Digital Art',
    },
    {
        id: '2',
        title: 'Neon Lights',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
        subtitle: 'Photography',
    },
    {
        id: '3',
        title: 'Abstract Shapes',
        image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2940&auto=format&fit=crop',
        subtitle: '3D Render',
    },
];

export const Default: Story = {
    args: {
        items,
        title: 'Featured Collection',
    },
};
