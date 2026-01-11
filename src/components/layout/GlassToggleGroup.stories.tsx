import type { Meta, StoryObj } from '@storybook/react';
import { GlassToggleGroup, GlassToggleGroupItem } from './GlassToggleGroup';
import { Bold, Italic, Underline } from 'lucide-react';

const meta: Meta<typeof GlassToggleGroup> = {
    title: 'Layout/GlassToggleGroup',
    component: GlassToggleGroup,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassToggleGroup>;

export const Default: Story = {
    render: () => (
        <GlassToggleGroup type="multiple">
            <GlassToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="h-4 w-4" />
            </GlassToggleGroupItem>
            <GlassToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
            </GlassToggleGroupItem>
            <GlassToggleGroupItem value="underline" aria-label="Toggle underline">
                <Underline className="h-4 w-4" />
            </GlassToggleGroupItem>
        </GlassToggleGroup>
    ),
};
