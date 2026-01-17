import type { Meta, StoryObj } from '@storybook/react';
import { GlassFilePreview } from './GlassFilePreview';

const meta: Meta<typeof GlassFilePreview> = {
    title: 'Features/GlassFilePreview',
    component: GlassFilePreview,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFilePreview>;

export const Default: Story = {
    args: {
        file: {
            id: '1',
            name: 'example.pdf',
            type: 'file',
        },
        content: 'Preview content not supported for PDF in this demo.',
    },
};

export const Image: Story = {
    args: {
        file: {
            id: '2',
            name: 'vacation.jpg',
            type: 'file',
        },
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
    },
};
