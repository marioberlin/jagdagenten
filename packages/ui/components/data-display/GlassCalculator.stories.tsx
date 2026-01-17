import type { Meta, StoryObj } from '@storybook/react';
import { GlassCalculator } from './GlassCalculator';

const meta: Meta<typeof GlassCalculator> = {
    title: 'Data Display/GlassCalculator',
    component: GlassCalculator,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCalculator>;

export const Default: Story = {
    render: () => (
        <div className="p-4">
            <GlassCalculator />
        </div>
    )
};
