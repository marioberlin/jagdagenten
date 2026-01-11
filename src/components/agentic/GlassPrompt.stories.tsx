import type { Meta, StoryObj } from '@storybook/react';
import { GlassPrompt } from './GlassPrompt';

const meta: Meta<typeof GlassPrompt> = {
    title: 'Agentic/GlassPrompt',
    component: GlassPrompt,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPrompt>;

export const Default: Story = {
    args: {
        onSubmit: (prompt) => console.log(prompt),
    },
};
