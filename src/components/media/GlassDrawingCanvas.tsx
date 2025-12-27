import { useRef, useState, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { GlassSlider } from '../forms/GlassSlider';
import { cn } from '@/utils/cn';
import { Eraser, Pen, Download, Trash2 } from 'lucide-react';

export interface GlassDrawingCanvasProps {
    width?: number;
    height?: number;
    className?: string;
}

export function GlassDrawingCanvas({
    width = 600,
    height = 400,
    className
}: GlassDrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#3B82F6');
    const [lineWidth, setLineWidth] = useState(3);

    // Setup Context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }
    }, []);

    // Update Context on prop change
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = tool === 'eraser' ? '#000000' : color; // Eraser just uses comp op or background? 
            // Better: globalCompositeOperation
            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = color;
            }
            ctx.lineWidth = lineWidth;
        }
    }, [tool, color, lineWidth]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'drawing.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    return (
        <GlassContainer className={cn("p-4 flex flex-col gap-4", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-glass-layer-2 rounded-lg border border-glass-border">
                <div className="flex items-center gap-2">
                    <GlassButton
                        size="icon"
                        variant={tool === 'pen' ? 'primary' : 'ghost'}
                        onClick={() => setTool('pen')}
                    >
                        <Pen size={18} />
                    </GlassButton>
                    <GlassButton
                        size="icon"
                        variant={tool === 'eraser' ? 'primary' : 'ghost'}
                        onClick={() => setTool('eraser')}
                    >
                        <Eraser size={18} />
                    </GlassButton>

                    <div className="w-px h-6 bg-glass-border mx-2" />

                    {/* Simple Color Dots */}
                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B'].map(c => (
                        <button
                            key={c}
                            onClick={() => { setTool('pen'); setColor(c); }}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                color === c && tool === 'pen' ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                            )}
                            style={{ backgroundColor: c }}
                        />
                    ))}

                    <div className="w-px h-6 bg-glass-border mx-2" />
                    <div className="w-24">
                        <GlassSlider
                            value={lineWidth}
                            min={1}
                            max={20}
                            step={1}
                            onValueChange={(val) => setLineWidth(val)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <GlassButton size="icon" variant="ghost" onClick={clearCanvas}>
                        <Trash2 size={18} className="text-secondary hover:text-red-400" />
                    </GlassButton>
                    <GlassButton size="icon" variant="ghost" onClick={downloadCanvas}>
                        <Download size={18} className="text-secondary" />
                    </GlassButton>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="relative rounded-xl overflow-hidden border border-glass-border bg-white/5 cursor-crosshair touch-none">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full h-auto bg-transparent"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />
            </div>
        </GlassContainer>
    );
}
