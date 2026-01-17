import type { Meta, StoryObj } from '@storybook/react';
import { GlassBadge } from './GlassBadge';

const meta: Meta<typeof GlassBadge> = {
    title: 'Data Display/GlassBadge',
    component: GlassBadge,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'secondary', 'destructive', 'outline', 'glass'],
        },
        size: {
            control: 'radio',
            options: ['sm', 'md'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassBadge>;

export const Default: Story = {
    args: {
        children: 'Default Badge',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary',
    },
};

export const Destructive: Story = {
    args: {
        variant: 'destructive',
        children: 'Critical',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        children: 'Outline',
    },
};

export const Glass: Story = {
    args: {
        variant: 'glass',
        children: 'Glass Effect',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        children: 'Compact',
    },
};
