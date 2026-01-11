import type { Meta, StoryObj } from '@storybook/react';
import { HIGTooltip as GlassHIGTooltip } from './GlassHIGTooltip';


const meta: Meta<typeof GlassHIGTooltip> = {
    title: 'Overlays/GlassHIGTooltip',
    component: GlassHIGTooltip,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassHIGTooltip>;

export const Default: Story = {
    args: {
        topic: 'general',

    },
};
