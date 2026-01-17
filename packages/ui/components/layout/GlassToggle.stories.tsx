import type { Meta, StoryObj } from '@storybook/react';
import { GlassToggle } from './GlassToggle';
import { Bold } from 'lucide-react';

const meta: Meta<typeof GlassToggle> = {
    title: 'Layout/GlassToggle',
    component: GlassToggle,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassToggle>;

export const Default: Story = {
    args: {
        "aria-label": "Toggle bold",
        children: <Bold className="h-4 w-4" />,
    },
};
