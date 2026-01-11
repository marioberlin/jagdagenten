import type { Meta, StoryObj } from '@storybook/react';
import { GlassInput } from './GlassInput';
import { Search, Mail, Lock, User, Send } from 'lucide-react';

const meta: Meta<typeof GlassInput> = {
    title: 'Forms/GlassInput',
    component: GlassInput,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel', 'url'],
        },
        error: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassInput>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};

export const WithIcon: Story = {
    args: {
        placeholder: 'Search components...',
        startContent: <Search className="w-4 h-4" />,
    },
};

export const Password: Story = {
    args: {
        type: 'password',
        placeholder: 'Enter password',
        startContent: <Lock className="w-4 h-4" />,
    },
};

export const Error: Story = {
    args: {
        placeholder: 'Invalid input',
        error: true,
        defaultValue: 'wrong value',
        startContent: <Mail className="w-4 h-4" />,
    },
};

export const Disabled: Story = {
    args: {
        placeholder: 'Cannot edit',
        disabled: true,
        startContent: <User className="w-4 h-4" />,
    },
};

export const NumberInput: Story = {
    args: {
        type: 'number',
        placeholder: '0.00',
        defaultValue: '10.50',
        step: '0.1',
        min: '0',
        max: '100',
    },
};

export const WithEndContent: Story = {
    args: {
        placeholder: 'Message',
        endContent: <Send className="w-4 h-4 cursor-pointer hover:text-accent transition-colors" />,
    },
};
