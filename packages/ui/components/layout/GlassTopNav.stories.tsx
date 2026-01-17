import type { Meta, StoryObj } from '@storybook/react';
import { GlassTopNav } from './GlassTopNav';

const meta: Meta<typeof GlassTopNav> = {
    title: 'Layout/GlassTopNav',
    component: GlassTopNav,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTopNav>;

export const Default: Story = {
    render: () => (
        <div className="relative h-[300px] w-full bg-glass-background">
            <GlassTopNav />
            <div className="p-8">Page Content</div>
        </div>
    )
};
