import type { Meta, StoryObj } from '@storybook/react';
import { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent } from './GlassTabs';
import { GlassCard } from '../data-display/GlassCard';
import { GlassLabel } from '../primitives/GlassLabel';
import { GlassInput } from '../forms/GlassInput';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassTabs> = {
    title: 'Layout/GlassTabs',
    component: GlassTabs,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTabs>;

export const Default: Story = {
    render: () => (
        <GlassTabs defaultValue="account" className="w-[400px]">
            <GlassTabsList className="grid w-full grid-cols-2">
                <GlassTabsTrigger value="account">Account</GlassTabsTrigger>
                <GlassTabsTrigger value="password">Password</GlassTabsTrigger>
            </GlassTabsList>
            <GlassTabsContent value="account">
                <GlassCard className="p-4 space-y-4">
                    <div>
                        <h3 className="font-bold">Account</h3>
                        <p className="text-sm text-secondary">Make changes to your account here.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <GlassLabel htmlFor="name">Name</GlassLabel>
                            <GlassInput id="name" defaultValue="Pedro Duarte" />
                        </div>
                        <div className="space-y-1">
                            <GlassLabel htmlFor="username">Username</GlassLabel>
                            <GlassInput id="username" defaultValue="@peduarte" />
                        </div>
                    </div>
                    <div>
                        <GlassButton>Save changes</GlassButton>
                    </div>
                </GlassCard>
            </GlassTabsContent>
            <GlassTabsContent value="password">
                <GlassCard className="p-4 space-y-4">
                    <div>
                        <h3 className="font-bold">Password</h3>
                        <p className="text-sm text-secondary">Change your password here.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <GlassLabel htmlFor="current">Current password</GlassLabel>
                            <GlassInput id="current" type="password" />
                        </div>
                        <div className="space-y-1">
                            <GlassLabel htmlFor="new">New password</GlassLabel>
                            <GlassInput id="new" type="password" />
                        </div>
                    </div>
                    <div>
                        <GlassButton>Save password</GlassButton>
                    </div>
                </GlassCard>
            </GlassTabsContent>
        </GlassTabs>
    ),
};
