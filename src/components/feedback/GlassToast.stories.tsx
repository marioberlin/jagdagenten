import type { Meta, StoryObj } from '@storybook/react';

import { GlassToastProvider, useToast, ToastType } from './GlassToast';
import { GlassButton } from '../primitives/GlassButton';

const ToastTrigger = ({ message, type, duration }: { message: string, type?: ToastType, duration?: number }) => {
    const { toast } = useToast();
    return (
        <GlassButton onClick={() => toast(message, type, duration)}>
            Show {type || 'info'} Toast
        </GlassButton>
    );
};

const meta: Meta<typeof GlassToastProvider> = {
    title: 'Feedback/GlassToast',
    component: GlassToastProvider,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <GlassToastProvider>
                <Story />
            </GlassToastProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassToastProvider>;

export const Success: Story = {
    render: () => <ToastTrigger message="Transaction successful!" type="success" />,
};

export const Error: Story = {
    render: () => <ToastTrigger message="Connection failed. Please try again." type="error" />,
};

export const Warning: Story = {
    render: () => <ToastTrigger message="Liquidity is low for this pair." type="warning" />,
};

export const Info: Story = {
    render: () => <ToastTrigger message="New market data available." type="info" />,
};

export const CustomDuration: Story = {
    render: () => <ToastTrigger message="This will disappear in 10 seconds." duration={10000} />,
};

export const MultiToast: Story = {
    render: () => (
        <div className="flex gap-4">
            <ToastTrigger message="First Message" type="info" />
            <ToastTrigger message="Second Message" type="success" />
        </div>
    ),
};
