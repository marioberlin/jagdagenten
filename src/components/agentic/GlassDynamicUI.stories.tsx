import type { Meta, StoryObj } from '@storybook/react';
import { GlassDynamicUI } from './GlassDynamicUI';

const meta: Meta<typeof GlassDynamicUI> = {
    title: 'Agentic/GlassDynamicUI',
    component: GlassDynamicUI,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDynamicUI>;

export const Default: Story = {
    args: {
        schema: {
            type: 'container',
            id: 'root',
            children: [
                { type: 'text', children: 'Dynamic Content' },
                { type: 'button', children: 'Click Me', props: { variant: 'primary' } }
            ]
        },
    },
};
