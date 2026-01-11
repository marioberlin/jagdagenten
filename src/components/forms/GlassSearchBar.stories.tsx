import type { Meta, StoryObj } from '@storybook/react';
import { GlassSearchBar } from './GlassSearchBar';

const meta: Meta<typeof GlassSearchBar> = {
    title: 'Forms/GlassSearchBar',
    component: GlassSearchBar,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSearchBar>;

export const Default: Story = {
    args: {
        placeholder: 'Search...',
        onSearch: (query) => console.log('Searching for:', query),
    },
};
