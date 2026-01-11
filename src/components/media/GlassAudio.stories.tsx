import type { Meta, StoryObj } from '@storybook/react';
import { GlassAudio } from './GlassAudio';

const meta: Meta<typeof GlassAudio> = {
    title: 'Media/GlassAudio',
    component: GlassAudio,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassAudio>;

export const Default: Story = {
    args: {
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Example Song',
        artist: 'SoundHelix',
        poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    },
};
