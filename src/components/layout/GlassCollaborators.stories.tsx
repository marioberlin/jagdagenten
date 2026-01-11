import type { Meta, StoryObj } from '@storybook/react';
import { GlassCollaborators } from './GlassCollaborators';

const meta: Meta<typeof GlassCollaborators> = {
    title: 'Layout/GlassCollaborators',
    component: GlassCollaborators,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCollaborators>;

const users = [
    { id: '1', name: 'Mario Berlin', avatar: 'https://github.com/shadcn.png' },
    { id: '2', name: 'John Doe', avatar: 'https://github.com/vercel.png' },
    { id: '3', name: 'Jane Smith', fallback: 'JS' },
    { id: '4', name: 'Alice', fallback: 'A' },
];

export const Default: Story = {
    args: {
        users,

    },
};
