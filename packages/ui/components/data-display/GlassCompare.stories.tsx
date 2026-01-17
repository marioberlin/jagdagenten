import type { Meta, StoryObj } from '@storybook/react';
import { GlassCompare } from './GlassCompare';

const meta: Meta<typeof GlassCompare> = {
    title: 'Data Display/GlassCompare',
    component: GlassCompare,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCompare>;

export const Default: Story = {
    args: {
        beforeDetails: <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop" alt="Before" className="w-full h-full object-cover" />,
        afterDetails: <img src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1964&auto=format&fit=crop" alt="After" className="w-full h-full object-cover" />,
        beforeLabel: "Nike Adapt BB",
        afterLabel: "Nike Air Jordan",
    },
    render: (args) => (
        <div className="h-[400px] w-full">
            <GlassCompare {...args} />
        </div>
    )
};
