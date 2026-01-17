import type { Meta, StoryObj } from '@storybook/react';
import { GlassInfiniteScroll } from './GlassInfiniteScroll';
import { GlassCard } from './GlassCard';
import { useState } from 'react';

const meta: Meta<typeof GlassInfiniteScroll> = {
    title: 'Data Display/GlassInfiniteScroll',
    component: GlassInfiniteScroll,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassInfiniteScroll>;

export const Default: Story = {
    render: () => {
        const [items, setItems] = useState(Array.from({ length: 20 }, (_, i) => i));
        const loadMore = async () => {
            setTimeout(() => {
                setItems((prev) => [
                    ...prev,
                    ...Array.from({ length: 10 }, (_, i) => prev.length + i),
                ]);
            }, 1000);
        };

        return (
            <div className="h-[400px] overflow-auto border border-glass-border p-4">
                <GlassInfiniteScroll onLoadMore={loadMore} hasMore={items.length < 100}>
                    <div className="flex flex-col gap-2">
                        {items.map((item) => (
                            <GlassCard key={item} className="p-4">
                                Item {item + 1}
                            </GlassCard>
                        ))}
                    </div>
                </GlassInfiniteScroll>
            </div>
        );
    },
};
