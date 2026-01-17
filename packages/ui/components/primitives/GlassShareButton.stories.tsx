import type { Meta, StoryObj } from '@storybook/react';
import { GlassShareButton } from './GlassShareButton';

const meta: Meta<typeof GlassShareButton> = {
    title: 'Primitives/GlassShareButton',
    component: GlassShareButton,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassShareButton>;

export const Default: Story = {
    args: {
        shareData: {
            title: 'Liquid Glass',
            text: 'A stunning glassmorphism UI library.',
            url: 'https://liquid-glass.dev',
        }
    },
};
