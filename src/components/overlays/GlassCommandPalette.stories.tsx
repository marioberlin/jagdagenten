import type { Meta, StoryObj } from '@storybook/react';
import { GlassCommandPalette } from './GlassCommandPalette';
import { GlassButton } from '../primitives/GlassButton';
import { useState } from 'react';

const meta: Meta<typeof GlassCommandPalette> = {
    title: 'Overlays/GlassCommandPalette',
    component: GlassCommandPalette,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCommandPalette>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);

        return (
            <>
                <GlassButton onClick={() => setOpen(true)}>Open Command Palette (Cmd+K)</GlassButton>
                <GlassCommandPalette isOpen={open} onClose={() => setOpen(false)} />
            </>
        );
    },
};
