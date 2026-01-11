import type { Meta, StoryObj } from '@storybook/react';
import { GlassVideo } from './GlassVideo';

const meta: Meta<typeof GlassVideo> = {
    title: 'Media/GlassVideo',
    component: GlassVideo,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassVideo>;

export const Default: Story = {
    args: {
        src: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        poster: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    },
};
