import type { Meta, StoryObj } from '@storybook/react';
import { GlassPageHeader } from './GlassPageHeader';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassPageHeader> = {
    title: 'Layout/GlassPageHeader',
    component: GlassPageHeader,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPageHeader>;

export const Default: Story = {
    args: {
        title: 'Dashboard',

        actions: <GlassButton>Create New</GlassButton>,
    },
};
