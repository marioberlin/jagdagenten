import type { Meta, StoryObj } from '@storybook/react';
import { GlassSankey } from './GlassSankey';

const meta: Meta<typeof GlassSankey> = {
    title: 'Data Display/GlassSankey',
    component: GlassSankey,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSankey>;



export const Default: Story = {
    args: {

        height: 400,
    },
};
