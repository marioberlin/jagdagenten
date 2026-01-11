import type { Meta, StoryObj } from '@storybook/react';
import { GlassContainer } from './GlassContainer';

const meta: Meta<typeof GlassContainer> = {
    title: 'Primitives/GlassContainer',
    component: GlassContainer,
    tags: ['autodocs'],
    argTypes: {
        material: {
            control: 'select',
            options: ['thin', 'regular', 'thick']
        },
        interactive: {
            control: 'boolean'
        },
        border: {
            control: 'boolean'
        },
        enableLiquid: {
            control: 'boolean'
        }
    },
};

export default meta;
type Story = StoryObj<typeof GlassContainer>;

export const Thin: Story = {
    args: {
        material: 'thin',
        className: 'w-64 h-32 flex items-center justify-center p-8',
        children: 'Thin Glass',
    },
};

export const Regular: Story = {
    args: {
        material: 'regular',
        className: 'w-64 h-32 flex items-center justify-center p-8',
        children: 'Regular Glass',
    },
};

export const Thick: Story = {
    args: {
        material: 'thick',
        className: 'w-64 h-32 flex items-center justify-center p-8',
        children: 'Thick Glass',
    },
};

export const Interactive: Story = {
    args: {
        interactive: true,
        className: 'w-64 h-32 flex items-center justify-center p-8',
        children: 'Hover Me',
    },
};

export const NoBorder: Story = {
    args: {
        border: false,
        className: 'w-64 h-32 flex items-center justify-center p-8',
        children: 'No Border',
    },
};
