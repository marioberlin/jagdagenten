import type { Meta, StoryObj } from '@storybook/react';
import { GlassTerminal } from './GlassTerminal';

const meta: Meta<typeof GlassTerminal> = {
    title: 'Features/GlassTerminal',
    component: GlassTerminal,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTerminal>;

export const Default: Story = {
    args: {
        welcomeMessage: 'Welcome to Liquid Glass Terminal v1.0.0',
    },
};
