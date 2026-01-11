import type { Meta, StoryObj } from '@storybook/react';
import { GlassBreadcrumb } from './GlassBreadcrumb';

const meta: Meta<typeof GlassBreadcrumb> = {
    title: 'Layout/GlassBreadcrumb',
    component: GlassBreadcrumb,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassBreadcrumb>;

export const Default: Story = {
    args: {
        items: [
            { label: 'Home', href: '/' },
            { label: 'Components', href: '/components' },
            { label: 'Breadcrumb', isActive: true }
        ]
    }
};
