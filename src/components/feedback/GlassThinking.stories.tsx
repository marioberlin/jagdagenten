import type { Meta, StoryObj } from '@storybook/react';
import { GlassThinking } from '../generative/GlassThinking';

const meta: Meta<typeof GlassThinking> = {
    title: 'Feedback/GlassThinking',
    component: GlassThinking,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassThinking>;

export const Default: Story = {
    render: () => <GlassThinking stage="analyzing" />
};
