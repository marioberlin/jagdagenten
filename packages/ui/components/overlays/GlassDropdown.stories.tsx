import type { Meta, StoryObj } from '@storybook/react';
import { GlassDropdown, GlassDropdownItem, GlassDropdownLabel, GlassDropdownSeparator } from './GlassDropdown';
import { GlassButton } from '../primitives/GlassButton';
import { Cloud, CreditCard, Github, Keyboard, LifeBuoy, LogOut, Plus, Settings, User, UserPlus, Users } from 'lucide-react';

const meta: Meta<typeof GlassDropdown> = {
    title: 'Overlays/GlassDropdown',
    component: GlassDropdown,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDropdown>;

export const Default: Story = {
    render: () => (
        <GlassDropdown trigger={<GlassButton variant="outline">Open Menu</GlassButton>} className="w-56">
            <GlassDropdownLabel>My Account</GlassDropdownLabel>
            <GlassDropdownSeparator />

            <GlassDropdownItem icon={User} shortcut="⇧⌘P">Profile</GlassDropdownItem>
            <GlassDropdownItem icon={CreditCard} shortcut="⌘B">Billing</GlassDropdownItem>
            <GlassDropdownItem icon={Settings} shortcut="⌘S">Settings</GlassDropdownItem>
            <GlassDropdownItem icon={Keyboard} shortcut="⌘K">Keyboard shortcuts</GlassDropdownItem>

            <GlassDropdownSeparator />

            <GlassDropdownItem icon={Users}>Team</GlassDropdownItem>
            <GlassDropdownItem icon={UserPlus}>Invite users</GlassDropdownItem>
            <GlassDropdownItem icon={Plus} shortcut="⌘+T">New Team</GlassDropdownItem>

            <GlassDropdownSeparator />

            <GlassDropdownItem icon={Github}>GitHub</GlassDropdownItem>
            <GlassDropdownItem icon={LifeBuoy}>Support</GlassDropdownItem>
            <GlassDropdownItem icon={Cloud}>API</GlassDropdownItem>

            <GlassDropdownSeparator />

            <GlassDropdownItem icon={LogOut} shortcut="⇧⌘Q">Log out</GlassDropdownItem>
        </GlassDropdown>
    ),
};

