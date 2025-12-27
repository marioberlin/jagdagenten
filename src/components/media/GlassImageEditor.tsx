import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassSlider } from '../forms/GlassSlider';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { ZoomIn, RotateCw } from 'lucide-react';

export interface GlassImageEditorProps {
    /**
     * URL of the image to edit
     */
    image: string;

    /**
     * Callback when crop is complete (on user interaction end)
     */
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;

    /**
     * Initial aspect ratio (default: 4/3)
     */
    aspect?: number;

    /**
     * Additional class names
     */
    className?: string;
}

export function GlassImageEditor({
    image,
    onCropComplete,
    aspect = 4 / 3,
    className
}: GlassImageEditorProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const onCropChange = useCallback((location: Point) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    return (
        <GlassContainer className={cn("flex flex-col gap-4 p-4", className)}>
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-black/50 border border-glass-border">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropComplete}
                    onZoomChange={onZoomChange}
                    classes={{
                        containerClassName: "glass-cropper-container",
                        mediaClassName: "glass-cropper-media",
                        cropAreaClassName: "glass-cropper-area !border-2 !border-primary/50 !shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                    }}
                />
            </div>

            <div className="space-y-4 px-2">
                <div className="flex items-center gap-4">
                    <ZoomIn size={18} className="text-secondary" />
                    <GlassSlider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(val) => setZoom(val)}
                        className="flex-1"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <RotateCw size={18} className="text-secondary" />
                    <GlassSlider
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        onValueChange={(val) => setRotation(val)}
                        className="flex-1"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <GlassButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setZoom(1);
                            setRotation(0);
                            setCrop({ x: 0, y: 0 });
                        }}
                    >
                        Reset
                    </GlassButton>
                </div>
            </div>
        </GlassContainer>
    );
}

GlassImageEditor.displayName = 'GlassImageEditor';
