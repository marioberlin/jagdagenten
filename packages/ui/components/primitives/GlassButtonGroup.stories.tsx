import type { Meta, StoryObj } from '@storybook/react';
import { GlassButtonGroup } from './GlassButtonGroup';
import { GlassButton } from './GlassButton';

const meta: Meta<typeof GlassButtonGroup> = {
    title: 'Primitives/GlassButtonGroup',
    component: GlassButtonGroup,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassButtonGroup>;

export const Default: Story = {
    render: () => (
        <GlassButtonGroup>
            <GlassButton variant="secondary">Year</GlassButton>
            <GlassButton variant="secondary">Month</GlassButton>
            <GlassButton variant="secondary">Week</GlassButton>
            <GlassButton variant="secondary">Day</GlassButton>
        </GlassButtonGroup>
    ),
};

export const Outline: Story = {
    render: () => (
        <GlassButtonGroup>
            <GlassButton variant="outline">Left</GlassButton>
            <GlassButton variant="outline">Center</GlassButton>
            <GlassButton variant="outline">Right</GlassButton>
        </GlassButtonGroup>
    )
}
