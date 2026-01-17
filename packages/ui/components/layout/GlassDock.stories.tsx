import type { Meta, StoryObj } from '@storybook/react';

import { GlassDock } from './GlassDock';
import { Settings, Search, Heart, User } from 'lucide-react';

const meta: Meta<typeof GlassDock> = {
    title: 'Layout/GlassDock',
    component: GlassDock,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="h-[200vh] w-full bg-app-dark p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h1 className="text-4xl font-bold">Scroll Down to benchmark the Dock</h1>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <p key={i} className="text-secondary text-lg leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed iaculis ante quis sodales hendrerit. Quisque ut mi orci. Ut venenatis, nisl scelerisque sollicitudin fermentum, quam libero hendrerit ipsum, ut vestibulum nisi tellus quis ipsum.
                        </p>
                    ))}
                </div>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassDock>;

export const Default: Story = {
    args: {},
};

export const CustomItems: Story = {
    render: () => (
        <GlassDock
            items={[
                { icon: <Search size={20} />, label: 'Search', path: '/search' },
                { icon: <Heart size={20} />, label: 'Favorites', path: '/favorites' },
                { icon: <User size={20} />, label: 'Profile', path: '/profile' },
                { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
            ]}
        />
    ),
};
