import type { Meta, StoryObj } from '@storybook/react';
import { GlassSlider } from './GlassSlider';

const meta: Meta<typeof GlassSlider> = {
    title: 'Forms/GlassSlider',
    component: GlassSlider,
    tags: ['autodocs'],
    argTypes: {
        min: { control: 'number' },
        max: { control: 'number' },
        step: { control: 'number' },
        disabled: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassSlider>;

export const Default: Story = {
    args: {
        defaultValue: 50,
    },
};

export const Stepped: Story = {
    args: {
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 20,
    },
};

export const LargeRange: Story = {
    args: {
        defaultValue: 1000,
        min: 0,
        max: 5000,
        step: 100,
    },
};

export const Disabled: Story = {
    args: {
        defaultValue: 30,
        disabled: true,
    },
};
