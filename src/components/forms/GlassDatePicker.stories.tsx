import type { Meta, StoryObj } from '@storybook/react';
import { GlassDatePicker } from './GlassDatePicker';
import { useState } from 'react';

const meta: Meta<typeof GlassDatePicker> = {
    title: 'Forms/GlassDatePicker',
    component: GlassDatePicker,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDatePicker>;

export const Default: Story = {
    render: () => {
        const [date, setDate] = useState<Date>();
        return <GlassDatePicker date={date} onSelect={setDate} />;
    },
};

export const WithPreselectedDate: Story = {
    render: () => {
        const [date, setDate] = useState<Date>(new Date('2025-01-01'));
        return <GlassDatePicker date={date} onSelect={setDate} />;
    },
};
