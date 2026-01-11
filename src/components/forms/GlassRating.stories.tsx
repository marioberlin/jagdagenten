import type { Meta, StoryObj } from '@storybook/react';
import { GlassRating } from './GlassRating';
import { useState } from 'react';

const meta: Meta<typeof GlassRating> = {
    title: 'Forms/GlassRating',
    component: GlassRating,
    tags: ['autodocs'],
    argTypes: {
        max: { control: 'number' },
        readOnly: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<typeof GlassRating>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState(3);
        return <GlassRating value={value} onChange={setValue} />;
    },
};

export const ReadOnly: Story = {
    render: () => {
        return <GlassRating value={4} readOnly />;
    },
};

export const LargeScale: Story = {
    render: () => {
        const [value, setValue] = useState(7);
        return <GlassRating value={value} onChange={setValue} max={10} />;
    }
}
