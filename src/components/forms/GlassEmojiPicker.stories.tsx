import type { Meta, StoryObj } from '@storybook/react';
import { GlassEmojiPicker } from './GlassEmojiPicker';
import { useState } from 'react';

const meta: Meta<typeof GlassEmojiPicker> = {
    title: 'Forms/GlassEmojiPicker',
    component: GlassEmojiPicker,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassEmojiPicker>;

export const Default: Story = {
    render: () => {
        const [emoji, setEmoji] = useState<string | null>(null);
        return (
            <div className="flex flex-col gap-4">
                <GlassEmojiPicker onEmojiClick={(emoji) => setEmoji(emoji.emoji)} />
                {emoji && <div className="text-lg">Selected: {emoji}</div>}
            </div>
        );
    },
};
