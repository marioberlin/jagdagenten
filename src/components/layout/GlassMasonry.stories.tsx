import type { Meta, StoryObj } from '@storybook/react';
import { GlassMasonry } from './GlassMasonry';
import { GlassCard } from '../data-display/GlassCard';

const meta: Meta<typeof GlassMasonry> = {
    title: 'Layout/GlassMasonry',
    component: GlassMasonry,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMasonry>;

const items = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 200) + 100
}));

export const Default: Story = {
    render: () => (
        <GlassMasonry columns={{ default: 3 }} gap={16}>
            {items.map((item) => (
                <GlassCard key={item.id} style={{ height: item.height }} className="p-4 flex items-center justify-center">
                    Item {item.id + 1}
                </GlassCard>
            ))}
        </GlassMasonry>
    ),
};
