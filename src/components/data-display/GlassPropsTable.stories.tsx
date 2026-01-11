import type { Meta, StoryObj } from '@storybook/react';
import { GlassPropsTable } from './GlassPropsTable';

const meta: Meta<typeof GlassPropsTable> = {
    title: 'Data Display/GlassPropsTable',
    component: GlassPropsTable,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPropsTable>;



export const Default: Story = {
    args: {

    },
};
