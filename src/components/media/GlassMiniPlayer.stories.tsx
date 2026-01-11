import type { Meta, StoryObj } from '@storybook/react';
import { GlassMiniPlayer } from './GlassMiniPlayer';

const meta: Meta<typeof GlassMiniPlayer> = {
    title: 'Media/GlassMiniPlayer',
    component: GlassMiniPlayer,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassMiniPlayer>;

export const Default: Story = {
    args: {
        title: 'Midnight City',
        artist: 'M83',
        albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop',
        isPlaying: true,
        showShuffle: true,
        showRepeat: true,
        onPlayPause: () => console.log('Toggle Play/Pause'),

    },
    render: (args) => (
        <div className="fixed bottom-4 right-4">
            <GlassMiniPlayer {...args} />
        </div>
    )
};
