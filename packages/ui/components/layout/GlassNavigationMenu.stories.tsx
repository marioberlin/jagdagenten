import type { Meta, StoryObj } from '@storybook/react';
import { GlassNavigationMenu } from './GlassNavigationMenu';

const meta: Meta<typeof GlassNavigationMenu> = {
    title: 'Layout/GlassNavigationMenu',
    component: GlassNavigationMenu,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassNavigationMenu>;

export const Default: Story = {
    args: {
        items: [
            {
                label: 'Getting started',
                children: [
                    { title: 'Introduction', href: '/docs', description: 'Re-usable components built using Radix UI and Tailwind CSS.' },
                    { title: 'Installation', href: '/docs/installation', description: 'How to install dependencies and structure your app.' },
                    { title: 'Typography', href: '/docs/primitives/typography', description: 'Styles for headings, paragraphs, lists...etc' },
                ]
            },
            {
                label: 'Components',
                children: [
                    { title: 'Alert Dialog', href: '/docs/primitives/alert-dialog', description: 'A modal dialog that interrupts the user with important content.' },
                    { title: 'Hover Card', href: '/docs/primitives/hover-card', description: 'For sighted users to preview content available behind a link.' },
                ]
            }
        ]
    }
};
