import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GlassScreenshot } from './GlassScreenshot';


const meta: Meta<typeof GlassScreenshot> = {
    title: 'Media/GlassScreenshot',
    component: GlassScreenshot,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassScreenshot>;

const SampleContent = () => (
    <div id="screenshot-target" className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Capture Me!</h1>
        <p className="text-lg">This is a sample component to demonstrate the screenshot functionality.</p>
    </div>
);

export const Default: Story = {
    render: () => {

        // Actually, just change to HTMLElement to satisfy the prop.
        const targetRef = React.useRef<HTMLElement>(null);
        return (
            <div className="space-y-4">
                <div ref={targetRef as any}>
                    <SampleContent />
                </div>
                <GlassScreenshot targetRef={targetRef as any} />
            </div>
        );
    },
};
