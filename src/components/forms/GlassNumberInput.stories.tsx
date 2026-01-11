import type { Meta, StoryObj } from '@storybook/react';
import { GlassNumberInput } from './GlassNumberInput';

const meta: Meta<typeof GlassNumberInput> = {
    title: 'Forms/GlassNumberInput',
    component: GlassNumberInput,
    tags: ['autodocs'],
    argTypes: {
        min: { control: 'number' },
        max: { control: 'number' },
        step: { control: 'number' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassNumberInput>;

export const Default: Story = {
    args: {

    },
};

export const WithLimits: Story = {
    args: {
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
    },
};

export const Disabled: Story = {
    args: {
        defaultValue: 10,
        disabled: true
    }
}
