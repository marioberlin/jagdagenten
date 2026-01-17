import type { Meta, StoryObj } from '@storybook/react';
import { GlassSkeleton } from './GlassSkeleton';

const meta: Meta<typeof GlassSkeleton> = {
    title: 'Feedback/GlassSkeleton',
    component: GlassSkeleton,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSkeleton>;

export const Default: Story = {
    args: {
        className: 'w-[100px] h-[20px] rounded-full',
    },
};

export const CardLoading: Story = {
    render: () => (
        <div className="flex flex-col space-y-3 w-[250px]">
            <GlassSkeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <GlassSkeleton className="h-4 w-[250px]" />
                <GlassSkeleton className="h-4 w-[200px]" />
            </div>
        </div>
    ),
};

export const ProfileLoading: Story = {
    render: () => (
        <div className="flex items-center space-x-4">
            <GlassSkeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <GlassSkeleton className="h-4 w-[250px]" />
                <GlassSkeleton className="h-4 w-[200px]" />
            </div>
        </div>
    ),
};
