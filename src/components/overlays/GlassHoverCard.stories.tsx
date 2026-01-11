import type { Meta, StoryObj } from '@storybook/react';
import { GlassHoverCard } from './GlassHoverCard';
import { GlassButton } from '../primitives/GlassButton';
import { GlassAvatar } from '../data-display/GlassAvatar';
import { CalendarDays } from 'lucide-react';

const meta: Meta<typeof GlassHoverCard> = {
    title: 'Overlays/GlassHoverCard',
    component: GlassHoverCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassHoverCard>;

export const Default: Story = {
    render: () => (
        <GlassHoverCard trigger={<GlassButton variant="ghost">@nextjs</GlassButton>} width={320}>
            <div className="flex justify-between space-x-4">
                <GlassAvatar
                    src="https://github.com/vercel.png"
                    fallback="VC"
                />
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold">@nextjs</h4>
                    <p className="text-sm">
                        The React Framework – created and maintained by @vercel.
                    </p>
                    <div className="flex items-center pt-2">
                        <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-xs text-muted-foreground">
                            Joined December 2021
                        </span>
                    </div>
                </div>
            </div>
        </GlassHoverCard>
    ),
};
