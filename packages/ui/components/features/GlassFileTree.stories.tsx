import type { Meta, StoryObj } from '@storybook/react';
import { GlassFileTree } from './GlassFileTree';

const meta: Meta<typeof GlassFileTree> = {
    title: 'Features/GlassFileTree',
    component: GlassFileTree,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassFileTree>;

const sampleFiles = [
    {
        id: '1',
        name: 'src',
        type: 'folder' as const,
        children: [
            {
                id: '2', name: 'components', type: 'folder' as const, children: [
                    { id: '3', name: 'Button.tsx', type: 'file' as const },
                    { id: '4', name: 'Input.tsx', type: 'file' as const },
                ]
            },
            { id: '5', name: 'App.tsx', type: 'file' as const },
            { id: '6', name: 'index.css', type: 'file' as const },
        ],
    },
    { id: '7', name: 'package.json', type: 'file' as const },
    { id: '8', name: 'README.md', type: 'file' as const },
];

export const Default: Story = {
    args: {
        data: sampleFiles,
        onSelect: (file) => console.log('Selected:', file),
    },
};
