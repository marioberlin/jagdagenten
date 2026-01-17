import type { Meta, StoryObj } from '@storybook/react';
import { GlassButton } from './GlassButton';
import { userEvent, within, expect } from '@storybook/test';

const meta: Meta<typeof GlassButton> = {
    title: 'Primitives/GlassButton',
    component: GlassButton,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'destructive']
        },
        size: {
            control: 'radio',
            options: ['sm', 'md', 'lg', 'icon']
        },
        badge: {
            control: 'text'
        }
    },
};

export default meta;
type Story = StoryObj<typeof GlassButton>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Confirm Transaction',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Cancel',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Read More',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        children: 'Delete Wallet',
    },
};

export const IconOnly: Story = {
    args: {
        size: 'icon',
        children: '🔔',
        badge: '3',
    },
};

export const WithInteractiveBadge: Story = {
    args: {
        children: 'Notifications',
        badge: '3',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button');

        // Simulate user interaction
        await userEvent.hover(button);
        // Add basic assertion to verify interactive feedback
        await expect(button).toBeVisible();
    }
};
