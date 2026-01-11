import type { Meta, StoryObj } from '@storybook/react';
import { GlassStatus } from './GlassStatus';

const meta: Meta<typeof GlassStatus> = {
    title: 'Feedback/GlassStatus',
    component: GlassStatus,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassStatus>;

export const Default: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <GlassStatus status="online" label="Online" />
            <GlassStatus status="offline" label="Offline" />
            <GlassStatus status="busy" label="Busy" />
            <GlassStatus status="away" label="Away" />
        </div>
    ),
};

export const Pulse: Story = {
    render: () => (
        <GlassStatus status="online" label="Live System" pulse />
    )
}
