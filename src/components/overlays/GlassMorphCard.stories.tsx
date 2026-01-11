import type { Meta, StoryObj } from '@storybook/react';
import { GlassMorphCard } from '../../components/showcase/GlassMorphCard';

const meta: Meta<typeof GlassMorphCard> = {
    title: 'Overlays/GlassMorphCard',
    component: GlassMorphCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMorphCard>;

export const Default: Story = {
    render: () => (
        <div className="h-[400px] flex items-center justify-center">
            <GlassMorphCard />
        </div>
    ),
};
