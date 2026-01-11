import type { Meta, StoryObj } from '@storybook/react';
import { GlassPopover } from './GlassPopover';
import { GlassButton } from '../primitives/GlassButton';
import { GlassLabel } from '../primitives/GlassLabel';
import { GlassInput } from '../forms/GlassInput';

const meta: Meta<typeof GlassPopover> = {
    title: 'Overlays/GlassPopover',
    component: GlassPopover,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPopover>;

export const Default: Story = {
    render: () => (
        <GlassPopover
            trigger={<GlassButton variant="outline">Open Popover</GlassButton>}
            width={320}
        >
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
                </div>
                <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <GlassLabel htmlFor="width">Width</GlassLabel>
                        <GlassInput id="width" defaultValue="100%" className="col-span-2 h-8" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <GlassLabel htmlFor="maxWidth">Max. width</GlassLabel>
                        <GlassInput id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                    </div>
                </div>
            </div>
        </GlassPopover>
    ),
};
