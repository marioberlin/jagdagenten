import type { Meta, StoryObj } from '@storybook/react';
import { GlassPlayground } from './GlassPlayground';

const meta: Meta<typeof GlassPlayground> = {
    title: 'Data Display/GlassPlayground',
    component: GlassPlayground,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPlayground>;

export const Default: Story = {
    args: {

    },
};
