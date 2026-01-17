import type { Meta, StoryObj } from '@storybook/react';
import { GlassProductCard } from './GlassProductCard';

const meta: Meta<typeof GlassProductCard> = {
    title: 'Data Display/GlassProductCard',
    component: GlassProductCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassProductCard>;

export const Default: Story = {
    args: {
        title: 'Wireless Headphones',
        price: '$299.99',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2940&auto=format&fit=crop',
        rating: 4.5,
        description: 'High-fidelity audio with active noise cancellation.',
        onAddToCart: () => alert('Added to cart'),
    },
};
