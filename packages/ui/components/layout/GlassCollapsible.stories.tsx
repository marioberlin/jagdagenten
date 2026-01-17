import type { Meta, StoryObj } from '@storybook/react';
import { GlassCollapsible } from './GlassCollapsible';
import { GlassButton } from '../primitives/GlassButton';
import { ChevronsUpDown } from 'lucide-react';

const meta: Meta<typeof GlassCollapsible> = {
    title: 'Layout/GlassCollapsible',
    component: GlassCollapsible,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCollapsible>;

export const Default: Story = {
    render: () => (
        <GlassCollapsible
            className="w-[350px] space-y-2"
            trigger={
                <div className="flex items-center justify-between space-x-4 px-4 py-2 hover:bg-glass-surface rounded-md transition-colors">
                    <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
                    <GlassButton variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                    </GlassButton>
                </div>
            }
        >
            <div className="rounded-md border border-glass-border px-4 py-3 font-mono text-sm mb-2">
                @radix-ui/primitives
            </div>
            <div className="space-y-2">
                <div className="rounded-md border border-glass-border px-4 py-3 font-mono text-sm">
                    @radix-ui/colors
                </div>
                <div className="rounded-md border border-glass-border px-4 py-3 font-mono text-sm">
                    @stitches/react
                </div>
            </div>
        </GlassCollapsible>
    ),
};
