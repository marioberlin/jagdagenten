import type { Meta, StoryObj } from '@storybook/react';
import { GlassFullscreenButton } from './GlassFullscreenButton';

const meta: Meta<typeof GlassFullscreenButton> = {
    title: 'Primitives/GlassFullscreenButton',
    component: GlassFullscreenButton,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFullscreenButton>;

export const Default: Story = {
    args: {},
    render: (args) => (
        <div id="fullscreen-target" className="p-8 border border-glass-border rounded-lg bg-glass-surface flex flex-col items-center gap-4">
            <h3 className="text-lg font-bold">Fullscreen Me</h3>
            <p>Click the button to make this container fullscreen.</p>
            <GlassFullscreenButton {...args} />
        </div>
    )
};
