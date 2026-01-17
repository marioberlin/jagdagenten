import type { Meta, StoryObj } from '@storybook/react';
import { GlassTextarea } from './GlassTextarea';
import { GlassLabel } from '../primitives/GlassLabel';

const meta: Meta<typeof GlassTextarea> = {
    title: 'Forms/GlassTextarea',
    component: GlassTextarea,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTextarea>;

export const Default: Story = {
    args: {
        placeholder: 'Type your message here.',
    },
};

export const WithLabel: Story = {
    render: (args) => (
        <div className="grid w-full gap-1.5">
            <GlassLabel htmlFor="message">Your Message</GlassLabel>
            <GlassTextarea {...args} id="message" />
        </div>
    ),
};

export const Disabled: Story = {
    args: {
        disabled: true,
        placeholder: "You cannot edit this."
    }
}
