import type { Meta, StoryObj } from '@storybook/react';
import { GlassCalendar } from './GlassCalendar';
import { useState } from 'react';

const meta: Meta<typeof GlassCalendar> = {
    title: 'Forms/GlassCalendar',
    component: GlassCalendar,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCalendar>;

export const Default: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <div className="p-4 rounded-lg bg-glass-panel border border-glass-border inline-block">
                <GlassCalendar

                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-none"
                />
            </div>
        );
    },
};

