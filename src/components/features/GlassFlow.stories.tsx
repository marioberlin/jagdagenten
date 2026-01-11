import type { Meta, StoryObj } from '@storybook/react';
import { GlassFlow } from './GlassFlow';

const meta: Meta<typeof GlassFlow> = {
    title: 'Features/GlassFlow',
    component: GlassFlow,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFlow>;

export const Default: Story = {
    render: () => (
        <div style={{ height: 500, width: '100%' }}>
            <GlassFlow />
        </div>
    )
};
