import type { Meta, StoryObj } from '@storybook/react';
import { GlassCaptcha } from './GlassCaptcha';

const meta: Meta<typeof GlassCaptcha> = {
    title: 'Forms/GlassCaptcha',
    component: GlassCaptcha,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCaptcha>;

export const Default: Story = {
    args: {
        onVerify: (token) => alert(`Verified: ${token}`),
    },
};
