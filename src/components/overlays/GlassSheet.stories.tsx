import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GlassSheet } from './GlassSheet';
import { GlassButton } from '../primitives/GlassButton';
import { GlassLabel } from '../primitives/GlassLabel';
import { GlassInput } from '../forms/GlassInput';

const meta: Meta<typeof GlassSheet> = {
    title: 'Overlays/GlassSheet',
    component: GlassSheet,
    tags: ['autodocs'],
    argTypes: {
        side: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right']
        }
    }
};

export default meta;
type Story = StoryObj<typeof GlassSheet>;

export const Default: Story = {
    args: {
        open: true,
        title: "Edit profile",
        description: "Make changes to your profile here. Click save when you're done.",
        children: (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <GlassLabel htmlFor="name" className="text-right">Name</GlassLabel>
                    <GlassInput id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <GlassLabel htmlFor="username" className="text-right">Username</GlassLabel>
                    <GlassInput id="username" defaultValue="@peduarte" className="col-span-3" />
                </div>
                <div className="flex justify-end mt-4">
                    <GlassButton type="submit">Save changes</GlassButton>
                </div>
            </div>
        ),
    },
    render: (args) => {
        // We need to manage state for the story to be interactive
        const [open, setOpen] = React.useState(false);

        return (
            <>
                <GlassButton variant="outline" onClick={() => setOpen(true)}>Open Sheet</GlassButton>
                <GlassSheet
                    {...args}
                    open={open}
                    onOpenChange={setOpen}
                />
            </>
        );
    }
};
