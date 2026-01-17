import type { Meta, StoryObj } from '@storybook/react';
import { GlassAlert } from './GlassAlert';

const meta: Meta<typeof GlassAlert> = {
    title: 'Feedback/GlassAlert',
    component: GlassAlert,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'destructive', 'success', 'warning'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassAlert>;

export const Default: Story = {
    args: {
        title: 'Information',
        children: 'System maintenance scheduled for 2:00 AM UTC.',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        title: 'Success',
        children: 'Your changes have been saved successfully.',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        title: 'Attention Required',
        children: 'Your account balance is below the recommended threshold.',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        title: 'Error',
        children: 'Failed to execute trade. Please check your connection.',
    },
};

export const NoTitle: Story = {
    args: {
        children: 'This is a simple alert without a title.',
    },
};
