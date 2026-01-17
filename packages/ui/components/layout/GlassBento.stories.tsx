import type { Meta, StoryObj } from '@storybook/react';

import { GlassBento, GlassBentoItem } from './GlassBento';
import { Activity, Zap, Shield, Globe, Star, TrendingUp } from 'lucide-react';

const meta: Meta<typeof GlassBento> = {
    title: 'Layout/GlassBento',
    component: GlassBento,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="p-8 bg-app-dark min-h-screen">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassBento>;

export const Default: Story = {
    render: () => (
        <GlassBento columns={3}>
            <GlassBentoItem
                title="Performance"
                description="Real-time trading analytics and execution speed."
                visual={<Zap className="w-24 h-24 text-accent/20 absolute -right-4 -bottom-4" />}
            >
                <div className="text-3xl font-bold text-accent">99.9%</div>
            </GlassBentoItem>

            <GlassBentoItem
                colSpan={2}
                title="Security"
                description="Multi-layer encryption and biometric authentication."
                visual={<Shield className="w-32 h-32 text-emerald-400/10 absolute -right-8 -bottom-8" />}
            >
                <div className="flex gap-2">
                    {['SSL', 'AES-256', '2FA'].map(tag => (
                        <span key={tag} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">{tag}</span>
                    ))}
                </div>
            </GlassBentoItem>

            <GlassBentoItem
                rowSpan={2}
                title="Market Trends"
                description="Global market sentiment analysis."
                visual={<TrendingUp className="w-24 h-24 text-blue-400/20 absolute right-4 top-4" />}
            >
                <div className="mt-auto space-y-2">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-blue-500" />
                    </div>
                    <div className="text-xs text-secondary">Bullish Sentiment: 75%</div>
                </div>
            </GlassBentoItem>

            <GlassBentoItem
                title="Global Reach"
                visual={<Globe className="w-24 h-24 text-purple-400/20 absolute -left-4 -top-4 rotate-12" />}
            >
                <div />
            </GlassBentoItem>

            <GlassBentoItem
                title="Community"
                description="Join 1M+ active traders."
                visual={<Star className="w-24 h-24 text-yellow-400/10 absolute -right-6 -bottom-6" />}
            >
                <div />
            </GlassBentoItem>
        </GlassBento>
    ),
};

export const FourColumns: Story = {
    render: () => (
        <GlassBento columns={4}>
            {Array.from({ length: 4 }).map((_, i) => (
                <GlassBentoItem key={i} title={`Module ${i + 1}`} description="Compact grid item example.">
                    <Activity size={24} className="text-accent" />
                </GlassBentoItem>
            ))}
        </GlassBento>
    ),
};
