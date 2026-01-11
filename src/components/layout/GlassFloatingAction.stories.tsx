import type { Meta, StoryObj } from '@storybook/react';
import { GlassFloatingAction } from './GlassFloatingAction';
import { Plus } from 'lucide-react';

const meta: Meta<typeof GlassFloatingAction> = {
    title: 'Layout/GlassFloatingAction',
    component: GlassFloatingAction,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFloatingAction>;

export const Default: Story = {
    args: {
        icon: <Plus />,
        onClick: () => alert('FAB Clicked'),
    },
    render: (args) => (
        <div className="relative w-full h-[200px] bg-glass-surface border border-glass-border rounded-lg">
            <GlassFloatingAction {...args} />
        </div>
    )
};
