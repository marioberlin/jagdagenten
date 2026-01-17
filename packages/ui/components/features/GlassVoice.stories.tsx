import type { Meta, StoryObj } from '@storybook/react';
import { GlassVoice } from './GlassVoice';

const meta: Meta<typeof GlassVoice> = {
    title: 'Features/GlassVoice',
    component: GlassVoice,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassVoice>;

export const Default: Story = {};

export const Listening: Story = {
    args: {
        isListening: true,
    }
}
