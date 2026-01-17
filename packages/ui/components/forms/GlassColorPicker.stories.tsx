import type { Meta, StoryObj } from '@storybook/react';
import { GlassColorPicker } from './GlassColorPicker';
import { useState } from 'react';

const meta: Meta<typeof GlassColorPicker> = {
    title: 'Forms/GlassColorPicker',
    component: GlassColorPicker,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassColorPicker>;

export const Default: Story = {
    render: () => {
        const [color, setColor] = useState("#3B82F6");
        return (
            <div className="p-8">
                <GlassColorPicker color={color} onChange={setColor} />
                <p className="mt-4 text-sm text-secondary">Selected: {color}</p>
            </div>
        );
    },
};
