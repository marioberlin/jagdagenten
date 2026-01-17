import type { Meta, StoryObj } from '@storybook/react';
import { GlassSpreadsheet } from './GlassSpreadsheet';

const meta: Meta<typeof GlassSpreadsheet> = {
    title: 'Features/GlassSpreadsheet',
    component: GlassSpreadsheet,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSpreadsheet>;

export const Default: Story = {};
