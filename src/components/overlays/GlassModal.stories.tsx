import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GlassModal } from './GlassModal';
import { GlassButton } from '../primitives/GlassButton';

const ModalWrapper = (args: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <GlassButton onClick={() => setIsOpen(true)}>Open Modal</GlassButton>
            <GlassModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

const meta: Meta<typeof GlassModal> = {
    title: 'Overlays/GlassModal',
    component: GlassModal,
    tags: ['autodocs'],
    argTypes: {
        isOpen: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassModal>;

export const Default: Story = {
    render: (args) => (
        <ModalWrapper {...args} title="Simple Modal">
            <p className="text-secondary">
                This is a standard glass modal with focus trapping and body scroll locking.
            </p>
        </ModalWrapper>
    ),
};

export const WithForm: Story = {
    render: (args) => (
        <ModalWrapper {...args} title="Settings">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-secondary">Username</label>
                    <input className="bg-white/5 border border-white/10 rounded-lg p-2 text-primary outline-none focus:border-accent/50" placeholder="Enter username" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-secondary">Email</label>
                    <input className="bg-white/5 border border-white/10 rounded-lg p-2 text-primary outline-none focus:border-accent/50" placeholder="Enter email" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <GlassButton variant="ghost">Cancel</GlassButton>
                    <GlassButton>Save Changes</GlassButton>
                </div>
            </div>
        </ModalWrapper>
    ),
};

export const LongContent: Story = {
    render: (args) => (
        <ModalWrapper {...args} title="Terms of Service">
            <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <p key={i} className="text-secondary">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                ))}
            </div>
        </ModalWrapper>
    ),
};
