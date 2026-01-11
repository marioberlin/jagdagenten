import type { Meta, StoryObj } from '@storybook/react';
import { GlassAgent } from './GlassAgent';

const meta: Meta<typeof GlassAgent> = {
    title: 'Agentic/GlassAgent',
    component: GlassAgent,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassAgent>;

export const Default: Story = {
    args: {


    },
};
