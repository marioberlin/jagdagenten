import type { Meta, StoryObj } from '@storybook/react';
import { GlassPayment } from './GlassPayment';

const meta: Meta<typeof GlassPayment> = {
    title: 'Features/GlassPayment',
    component: GlassPayment,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPayment>;

export const Default: Story = {
    args: {
        cardNumber: "4532 1234 5678 9012",
        cardHolder: "ALEXANDER HAMILTON",
        expiry: "12/28",
        cvc: "123",
    },
};
