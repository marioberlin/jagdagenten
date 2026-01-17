import type { Meta, StoryObj } from '@storybook/react';

import { GlassNavbar } from './GlassNavbar';

const meta: Meta<typeof GlassNavbar> = {
    title: 'Layout/GlassNavbar',
    component: GlassNavbar,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof GlassNavbar>;

export const Fixed: Story = {
    render: (args) => (
        <div className="h-[200vh] bg-app-dark pt-24 text-center">
            <GlassNavbar {...args} />
            <div className="max-w-2xl mx-auto space-y-8 p-8">
                <h1 className="text-4xl font-bold">Navbar stays fixed</h1>
                <p className="text-secondary text-lg">Scroll down to see the glass effect over content.</p>
                {Array.from({ length: 10 }).map((_, i) => (
                    <p key={i} className="text-secondary">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                ))}
            </div>
        </div>
    ),
};

export const Relative: Story = {
    args: {
        position: 'relative',
    },
    render: (args) => (
        <div className="bg-app-dark min-h-screen">
            <GlassNavbar {...args} />
            <div className="p-8">
                <h2 className="text-2xl font-bold">Relative Positioning</h2>
                <p className="text-secondary">Used within specific scrolling containers or static headers.</p>
            </div>
        </div>
    ),
};
