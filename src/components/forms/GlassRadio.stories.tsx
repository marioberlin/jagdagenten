import type { Meta, StoryObj } from '@storybook/react';
import { GlassRadio } from './GlassRadio';

const meta: Meta<typeof GlassRadio> = {
    title: 'Forms/GlassRadio',
    component: GlassRadio,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassRadio>;

export const Default: Story = {
    args: {
        value: 'option1',
        id: 'r1',
    },
    render: (args) => (
        <div className="flex items-center space-x-2">
            <GlassRadio {...args} />
            <label htmlFor="r1" className="text-white">Option 1</label>
        </div>
    )
};
