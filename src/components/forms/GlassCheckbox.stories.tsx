import type { Meta, StoryObj } from '@storybook/react';
import { GlassCheckbox } from './GlassCheckbox';

const meta: Meta<typeof GlassCheckbox> = {
    title: 'Forms/GlassCheckbox',
    component: GlassCheckbox,
    tags: ['autodocs'],
    argTypes: {
        checked: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassCheckbox>;

export const Default: Story = {
    args: {
        checked: false,
    },
};

export const Checked: Story = {
    args: {
        checked: true,
    },
};

export const Labeled: Story = {
    args: {
        children: 'Accept terms and conditions',
    },
};

export const CheckedLabeled: Story = {
    args: {
        checked: true,
        children: 'Enable notifications',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        children: 'Disabled checkbox',
    },
};
