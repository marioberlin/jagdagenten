import type { Meta, StoryObj } from '@storybook/react';
import { GlassKanban } from './GlassKanban';


const meta: Meta<typeof GlassKanban> = {
    title: 'Features/GlassKanban',
    component: GlassKanban,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassKanban>;

export const Default: Story = {
    render: () => (
        <div className="h-[500px]">
            <GlassKanban />
        </div>
    )
};
