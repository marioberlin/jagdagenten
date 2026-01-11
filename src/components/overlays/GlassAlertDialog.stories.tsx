import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GlassAlertDialog } from './GlassAlertDialog';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassAlertDialog> = {
    title: 'Overlays/GlassAlertDialog',
    component: GlassAlertDialog,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassAlertDialog>;

export const Default: Story = {
    args: {
        open: false,
        title: "Delete Account",
        description: "Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
        variant: "destructive",
        confirmText: "Delete Account",
    },
    render: (args) => {
        const [open, setOpen] = React.useState(false);
        return (
            <>
                <GlassButton variant="destructive" onClick={() => setOpen(true)}>Delete Account</GlassButton>
                <GlassAlertDialog
                    {...args}
                    open={open}
                    onOpenChange={setOpen}
                    onConfirm={() => {
                        alert("Account deleted");
                        setOpen(false);
                    }}
                />
            </>
        )
    }
};
