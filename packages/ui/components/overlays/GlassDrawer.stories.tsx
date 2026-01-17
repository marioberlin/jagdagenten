import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GlassDrawer } from './GlassDrawer';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassDrawer> = {
    title: 'Overlays/GlassDrawer',
    component: GlassDrawer,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDrawer>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = React.useState(false);
        return (
            <GlassDrawer
                open={open}
                onOpenChange={setOpen}
                title="Move Goal"
                description="Set your daily activity goal."
                size="sm"
            >
                <div className="p-4 pb-0">
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-4xl font-bold tracking-tighter">350</span>
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Calories/day</span>
                    </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <GlassButton onClick={() => setOpen(false)}>Submit</GlassButton>
                    <GlassButton variant="outline" onClick={() => setOpen(false)}>Cancel</GlassButton>
                </div>
                {/* Trigger for the story */}
                {!open && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <GlassButton variant="outline" onClick={() => setOpen(true)}>Open Drawer</GlassButton>
                        </div>
                    </div>
                )}
            </GlassDrawer>
        );
    },
};
