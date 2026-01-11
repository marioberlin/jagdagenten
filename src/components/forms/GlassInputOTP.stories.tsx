import type { Meta, StoryObj } from '@storybook/react';
import { GlassInputOTP } from './GlassInputOTP';

const meta: Meta<typeof GlassInputOTP> = {
    title: 'Forms/GlassInputOTP',
    component: GlassInputOTP,
    tags: ['autodocs'],
    argTypes: {
        length: { control: 'number' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassInputOTP>;

export const Default: Story = {
    args: {
        length: 6,
        onChange: (value) => console.log(value),
    },
};

export const WithValue: Story = {
    args: {
        length: 4,
        value: "1234",
        onChange: (value) => console.log(value),
    },
};
