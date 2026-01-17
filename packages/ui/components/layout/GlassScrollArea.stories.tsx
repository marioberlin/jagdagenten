import type { Meta, StoryObj } from '@storybook/react';
import { GlassScrollArea } from './GlassScrollArea';

const meta: Meta<typeof GlassScrollArea> = {
    title: 'Layout/GlassScrollArea',
    component: GlassScrollArea,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassScrollArea>;

const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
);

export const Default: Story = {
    render: () => (
        <GlassScrollArea className="h-72 w-48 rounded-md border border-glass-border p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
            {tags.map((tag) => (
                <React.Fragment key={tag}>
                    <div className="text-sm border-b border-glass-border py-2">{tag}</div>
                </React.Fragment>
            ))}
        </GlassScrollArea>
    ),
};

import React from 'react';
