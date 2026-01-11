import type { Meta, StoryObj } from '@storybook/react';
import { GlassSeparator } from './GlassSeparator';

const meta: Meta<typeof GlassSeparator> = {
    title: 'Layout/GlassSeparator',
    component: GlassSeparator,
    tags: ['autodocs'],
    argTypes: {
        orientation: {
            control: 'radio',
            options: ['horizontal', 'vertical'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassSeparator>;

export const Horizontal: Story = {
    args: {
        orientation: 'horizontal',
    },
    render: (args) => (
        <div className="w-full max-w-md space-y-4">
            <h3 className="text-lg font-medium">Header</h3>
            <GlassSeparator {...args} />
            <p className="text-secondary">Content section below the separator.</p>
        </div>
    ),
};

export const Vertical: Story = {
    args: {
        orientation: 'vertical',
    },
    render: (args) => (
        <div className="flex h-10 items-center space-x-4 text-sm">
            <div>Blog</div>
            <GlassSeparator {...args} />
            <div>Docs</div>
            <GlassSeparator {...args} />
            <div>Source</div>
        </div>
    ),
};
