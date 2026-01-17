import type { Meta, StoryObj } from '@storybook/react';
import { GlassTreemap } from './GlassTreemap';

const meta: Meta<typeof GlassTreemap> = {
    title: 'Data Display/GlassTreemap',
    component: GlassTreemap,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTreemap>;

const data = {
    name: "Root",
    value: 100000,
    children: [
        {
            name: 'axis',
            value: 40000,
            children: [
                { name: 'Axis', value: 24593 },
                { name: 'Axes', value: 1302 },
                { name: 'AxisGridLine', value: 652 },
                { name: 'AxisLabel', value: 636 },
                { name: 'CartesianAxes', value: 6703 },
            ],
        },
        {
            name: 'controls',
            value: 60000,
            children: [
                { name: 'AnchorControl', value: 2138 },
                { name: 'ClickControl', value: 3824 },
                { name: 'Control', value: 1353 },
                { name: 'ControlList', value: 4665 },
                { name: 'DragControl', value: 2649 },
                { name: 'ExpandControl', value: 2832 },
                { name: 'HoverControl', value: 4896 },
                { name: 'IControl', value: 763 },
                { name: 'PanZoomControl', value: 5222 },
                { name: 'SelectionControl', value: 7862 },
                { name: 'TooltipControl', value: 8435 },
            ],
        },
    ]
};

export const Default: Story = {
    args: {
        data,
    },
};
