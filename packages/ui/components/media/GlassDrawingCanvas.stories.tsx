import type { Meta, StoryObj } from '@storybook/react';
import { GlassDrawingCanvas } from './GlassDrawingCanvas';
import { GlassButton } from '../primitives/GlassButton';
import { useRef } from 'react';

const meta: Meta<typeof GlassDrawingCanvas> = {
    title: 'Media/GlassDrawingCanvas',
    component: GlassDrawingCanvas,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDrawingCanvas>;

export const Default: Story = {
    render: () => {
        const canvasRef = useRef<any>(null);

        return (
            <div className="space-y-4">
                <div className="h-[400px] border border-glass-border rounded-lg overflow-hidden">
                    <GlassDrawingCanvas ref={canvasRef} />
                </div>
                <div className="flex gap-2">
                    <GlassButton onClick={() => canvasRef.current?.clear()}>Clear</GlassButton>
                    <GlassButton onClick={() => canvasRef.current?.undo()}>Undo</GlassButton>
                </div>
            </div>
        );
    },
};
