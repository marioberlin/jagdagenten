import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';
import { GlassButton } from '../primitives/GlassButton';
import { GlassInput } from '../forms/GlassInput';
import { GlassLabel } from '../primitives/GlassLabel';

const meta: Meta<typeof GlassCard> = {
    title: 'Data Display/GlassCard',
    component: GlassCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCard>;

export const Default: Story = {
    render: () => (
        <GlassCard
            className="w-[350px]"
            title="Create project"
            description="Deploy your new project in one-click."
            footer={
                <div className="flex justify-between w-full">
                    <GlassButton variant="ghost">Cancel</GlassButton>
                    <GlassButton>Deploy</GlassButton>
                </div>
            }
        >
            <form>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <GlassLabel htmlFor="name">Name</GlassLabel>
                        <GlassInput id="name" placeholder="Name of your project" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <GlassLabel htmlFor="framework">Framework</GlassLabel>
                        <GlassInput id="framework" placeholder="Select" />
                    </div>
                </div>
            </form>
        </GlassCard>
    ),
};

export const Simple: Story = {
    render: () => (
        <GlassCard
            className="w-[350px]"
            title="Notifications"
            description="You have 3 unread messages."
            footer={<GlassButton className="w-full">Mark all as read</GlassButton>}
        >
            <div className="flex items-center space-x-4 rounded-md border border-[var(--glass-border)] p-4">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Push Notifications</p>
                    <p className="text-sm text-secondary">Send notifications to device.</p>
                </div>
                <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
        </GlassCard>
    ),
};
