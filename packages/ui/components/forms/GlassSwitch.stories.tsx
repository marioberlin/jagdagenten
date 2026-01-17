import type { Meta, StoryObj } from '@storybook/react';
import { GlassSwitch } from './GlassSwitch';

const meta: Meta<typeof GlassSwitch> = {
    title: 'Forms/GlassSwitch',
    component: GlassSwitch,
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
type Story = StoryObj<typeof GlassSwitch>;

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

export const Disabled: Story = {
    args: {
        disabled: true,
        checked: false,
    },
};

export const DisabledChecked: Story = {
    args: {
        disabled: true,
        checked: true,
    },
};
