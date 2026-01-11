import type { Meta, StoryObj } from '@storybook/react';
import { GlassCode } from './GlassCode';

const meta: Meta<typeof GlassCode> = {
    title: 'Data Display/GlassCode',
    component: GlassCode,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCode>;

export const Default: Story = {
    args: {
        code: `function hello() {
  console.log("Hello World");
}`,
        language: 'javascript',
        showLineNumbers: true,
    },
};
