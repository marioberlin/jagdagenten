import type { Meta, StoryObj } from '@storybook/react';
import { GlassRadioGroup, GlassRadioGroupItem } from './GlassRadioGroup';


const meta: Meta<typeof GlassRadioGroup> = {
    title: 'Forms/GlassRadioGroup',
    component: GlassRadioGroup,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassRadioGroup>;

export const Default: Story = {
    render: () => (
        <GlassRadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
                <GlassRadioGroupItem value="default">Default</GlassRadioGroupItem>
            </div>
            <div className="flex items-center space-x-2">
                <GlassRadioGroupItem value="comfortable">Comfortable</GlassRadioGroupItem>
            </div>
            <div className="flex items-center space-x-2">
                <GlassRadioGroupItem value="compact">Compact</GlassRadioGroupItem>
            </div>
        </GlassRadioGroup>
    ),
};
