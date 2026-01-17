
import type { Meta, StoryObj } from '@storybook/react';
import { GlassContextMenu } from './GlassContextMenu';

const meta: Meta<typeof GlassContextMenu> = {
    title: 'Overlays/GlassContextMenu',
    component: GlassContextMenu,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassContextMenu>;

export const Default: Story = {
    args: {
        trigger: (
            <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-glass-border border-dashed text-sm">
                Right click here
            </div>
        ),
        content: (
            <div className="flex flex-col min-w-[160px]">
                <button className="flex items-center px-4 py-2 hover:bg-glass-surface rounded-md text-sm text-left">Back</button>
                <button className="flex items-center px-4 py-2 hover:bg-glass-surface rounded-md text-sm text-left" disabled>Forward</button>
                <button className="flex items-center px-4 py-2 hover:bg-glass-surface rounded-md text-sm text-left">Reload</button>
                <div className="h-[1px] bg-glass-border my-1" />
                <button className="flex items-center px-4 py-2 hover:bg-glass-surface rounded-md text-sm text-left">Save As...</button>
                <button className="flex items-center px-4 py-2 hover:bg-glass-surface rounded-md text-sm text-left">Print</button>
            </div>
        )
    },
};


