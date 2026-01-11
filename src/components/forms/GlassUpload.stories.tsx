import type { Meta, StoryObj } from '@storybook/react';
import { GlassUpload } from './GlassUpload';

const meta: Meta<typeof GlassUpload> = {
    title: 'Forms/GlassUpload',
    component: GlassUpload,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassUpload>;

export const Default: Story = {
    args: {
        onUpload: (files) => alert(`${files.length} files dropped`),
    },
};

export const WithLabel: Story = {
    render: () => (
        <div className="space-y-2">
            <div>
                <h3 className="text-sm font-medium text-primary">Upload Documents</h3>
                <p className="text-xs text-secondary">Support for PDF, JPG, PNG</p>
            </div>
            <GlassUpload onUpload={(files) => console.log(files)} />
        </div>
    )
};

export const Compact: Story = {
    args: {
        className: "max-w-xs",
        onUpload: (files) => console.log(files)
    }
}
