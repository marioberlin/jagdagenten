import type { Meta, StoryObj } from '@storybook/react';
import { GlassChip } from './GlassChip';
import { Mail, Tag } from 'lucide-react';

const meta: Meta<typeof GlassChip> = {
    title: 'Primitives/GlassChip',
    component: GlassChip,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'primary', 'success', 'warning', 'destructive'],
        },
        size: {
            control: 'radio',
            options: ['sm', 'default', 'lg'],
        },
        onRemove: { action: 'removed' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassChip>;

export const Default: Story = {
    args: {
        children: 'Default Chip',
    },
};

export const WithIcon: Story = {
    args: {
        icon: <Mail size={14} />,
        children: 'Email',
    },
};

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        children: 'Success',
    },
};

export const Removable: Story = {
    args: {
        children: 'Click X to remove',
        onRemove: () => alert('Chip removed!'),
    },
};

export const Group: Story = {
    render: () => (
        <div className="flex gap-2">
            <GlassChip icon={<Tag size={14} />}>Default</GlassChip>
            <GlassChip icon={<Tag size={14} />} variant="primary">Primary</GlassChip>
            <GlassChip icon={<Tag size={14} />} variant="destructive">Destructive</GlassChip>
        </div>
    ),
};
