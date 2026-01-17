import type { Meta, StoryObj } from '@storybook/react';
import { GlassFluidNav } from '../showcase/GlassFluidNav';

const meta: Meta<typeof GlassFluidNav> = {
    title: 'Overlays/GlassFluidNav',
    component: GlassFluidNav,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFluidNav>;



export const Default: Story = {
    render: () => (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2">
            <GlassFluidNav />
        </div>
    )
};
