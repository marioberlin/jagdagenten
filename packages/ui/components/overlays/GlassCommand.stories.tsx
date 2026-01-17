import type { Meta, StoryObj } from '@storybook/react';
import { GlassCommand } from './GlassCommand';

const meta: Meta<typeof GlassCommand> = {
    title: 'Overlays/GlassCommand',
    component: GlassCommand,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCommand>;

export const Default: Story = {
    render: () => <GlassCommand />,
};
