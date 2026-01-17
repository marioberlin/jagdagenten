import type { Meta, StoryObj } from '@storybook/react';
import { GlassButtonDropdown } from './GlassButtonDropdown';
import { Settings, User, LogOut } from 'lucide-react';

const meta: Meta<typeof GlassButtonDropdown> = {
    title: 'Compound/GlassButtonDropdown',
    component: GlassButtonDropdown,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassButtonDropdown>;

const options = [
    { label: 'Profile', onClick: () => console.log('Profile'), icon: User },
    { label: 'Settings', onClick: () => console.log('Settings'), icon: Settings, description: 'Manage your account' },
    { label: 'Logout', onClick: () => console.log('Logout'), icon: LogOut, disabled: true },
];

export const Default: Story = {
    args: {
        label: 'Actions',
        options,
    },
};
