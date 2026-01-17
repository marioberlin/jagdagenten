import type { Meta, StoryObj } from '@storybook/react';
import { GlassImageEditor } from './GlassImageEditor';

const meta: Meta<typeof GlassImageEditor> = {
    title: 'Media/GlassImageEditor',
    component: GlassImageEditor,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassImageEditor>;

export const Default: Story = {
    args: {
        image: 'https://images.unsplash.com/photo-1620641788421-7f1c338e620a?q=80&w=2940&auto=format&fit=crop',

    },
};
