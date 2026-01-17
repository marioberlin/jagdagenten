import type { Meta, StoryObj } from '@storybook/react';
import { GlassLabel } from './GlassLabel';

const meta: Meta<typeof GlassLabel> = {
    title: 'Primitives/GlassLabel',
    component: GlassLabel,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassLabel>;

export const Default: Story = {
    args: {
        children: 'Email Address',
        htmlFor: 'email',
    },
};

export const Required: Story = {
    args: {
        children: 'Username',
        required: true,
    },
};

export const Optional: Story = {
    args: {
        children: 'Phone Number',
    },
};

export const WithDescription: Story = {
    render: () => (
        <div className="space-y-1">
            <GlassLabel>API Key</GlassLabel>
            <p className="text-xs text-secondary">Your secret key for accessing the trading API.</p>
        </div>
    ),
};
