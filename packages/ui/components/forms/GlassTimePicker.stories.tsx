import type { Meta, StoryObj } from '@storybook/react';
import { GlassTimePicker } from './GlassTimePicker';
import { useState } from 'react';

const meta: Meta<typeof GlassTimePicker> = {
    title: 'Forms/GlassTimePicker',
    component: GlassTimePicker,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTimePicker>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState<string>('12:00');
        return <GlassTimePicker value={value} onChange={setValue} />;
    },
};

export const WithPreselectedTime: Story = {
    render: () => {
        const [value, setValue] = useState<string>('14:30');
        return <GlassTimePicker value={value} onChange={setValue} />;
    },
};
