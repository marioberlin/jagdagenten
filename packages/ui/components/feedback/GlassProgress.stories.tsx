import type { Meta, StoryObj } from '@storybook/react';
import { GlassProgress } from './GlassProgress';

const meta: Meta<typeof GlassProgress> = {
    title: 'Feedback/GlassProgress',
    component: GlassProgress,
    tags: ['autodocs'],
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 100 } },
        size: {
            control: 'radio',
            options: ['sm', 'md', 'lg'],
        },
        color: {
            control: 'select',
            options: ['default', 'blue', 'green', 'purple'],
        }
    },
};

export default meta;
type Story = StoryObj<typeof GlassProgress>;

export const Default: Story = {
    args: {
        value: 60,
    },
};

export const Success: Story = {
    args: {
        value: 100,
        color: 'green',
    },
};

// Warning not supported in color map, using purple as alternate
export const Warning: Story = {
    args: {
        value: 80,
        color: 'purple',
    },
};

// Danger not supported in color map, using blue as alternate
export const Danger: Story = {
    args: {
        value: 95,
        color: 'blue',
    },
};

export const Indeterminate: Story = {
    args: {
        value: undefined,
    },
    render: (args) => (
        <div className="w-full space-y-2">
            <p className="text-sm text-secondary">Loading...</p>
            <GlassProgress {...args} className="animate-pulse" />
        </div>
    )
};

export const Sizes: Story = {
    render: () => (
        <div className="space-y-4 w-full max-w-md">
            <GlassProgress value={30} size="sm" />
            <GlassProgress value={50} size="md" />
            <GlassProgress value={70} size="lg" />
        </div>
    ),
};
