import type { Meta, StoryObj } from '@storybook/react';
import { GlassAutosizeTextarea } from './GlassAutosizeTextarea';

const meta: Meta<typeof GlassAutosizeTextarea> = {
    title: 'Forms/GlassAutosizeTextarea',
    component: GlassAutosizeTextarea,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassAutosizeTextarea>;

export const Default: Story = {
    args: {
        placeholder: 'Type something...',
    },
};
