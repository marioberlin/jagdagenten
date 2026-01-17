import type { Meta, StoryObj } from '@storybook/react';
import { GlassTooltip } from './GlassTooltip';
import { GlassButton } from '../primitives/GlassButton';
import { Plus } from 'lucide-react';

const meta: Meta<typeof GlassTooltip> = {
    title: 'Overlays/GlassTooltip',
    component: GlassTooltip,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="p-12 flex justify-center">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassTooltip>;

export const Default: Story = {
    render: () => (
        <GlassTooltip content={<p>Add new item</p>}>
            <GlassButton variant="outline" size="icon">
                <Plus size={20} />
            </GlassButton>
        </GlassTooltip>
    ),
};

export const Locations: Story = {
    render: () => (
        <div className="flex gap-4">
            <GlassTooltip content={<p>Tooltip on top</p>} side="top">
                <GlassButton variant="ghost">Top</GlassButton>
            </GlassTooltip>

            <GlassTooltip content={<p>Tooltip on bottom</p>} side="bottom">
                <GlassButton variant="ghost">Bottom</GlassButton>
            </GlassTooltip>

            <GlassTooltip content={<p>Tooltip on left</p>} side="left">
                <GlassButton variant="ghost">Left</GlassButton>
            </GlassTooltip>

            <GlassTooltip content={<p>Tooltip on right</p>} side="right">
                <GlassButton variant="ghost">Right</GlassButton>
            </GlassTooltip>
        </div>
    ),
};
