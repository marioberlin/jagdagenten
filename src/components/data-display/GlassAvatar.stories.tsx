import type { Meta, StoryObj } from '@storybook/react';
import { GlassAvatar } from './GlassAvatar';

const meta: Meta<typeof GlassAvatar> = {
    title: 'Data Display/GlassAvatar',
    component: GlassAvatar,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg', 'xl'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassAvatar>;

export const Default: Story = {
    args: {
        size: 'md',
        src: 'https://github.com/shadcn.png',
        alt: '@shadcn',
        fallback: 'CN'
    },
};

export const WithFallback: Story = {
    args: {
        size: 'md',
        alt: '@user',
        fallback: 'JD'
    },
};



export const Sizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            <GlassAvatar size="sm" fallback="SM" />
            <GlassAvatar size="md" fallback="MD" />
            <GlassAvatar size="lg" fallback="LG" />
            <GlassAvatar size="xl" fallback="XL" />
        </div>
    ),
};
