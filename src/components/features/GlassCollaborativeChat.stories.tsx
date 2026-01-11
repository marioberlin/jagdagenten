import type { Meta, StoryObj } from '@storybook/react';
import { GlassCollaborativeChatWindow } from './GlassCollaborativeChat';

const meta: Meta<typeof GlassCollaborativeChatWindow> = {
    title: 'Features/GlassCollaborativeChat',
    component: GlassCollaborativeChatWindow,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCollaborativeChatWindow>;

export const Default: Story = {
    args: {
        currentUserId: 'user1',
        participants: [
            { id: 'user1', name: 'You', isActive: true },
            { id: 'user2', name: 'Alice', isActive: true },
        ],
        messages: [
            { id: 'm1', senderId: 'user2', content: 'Hello team!', timestamp: '10:00 AM' },
        ],
        onSend: (msg) => console.log(msg),
    },
};
