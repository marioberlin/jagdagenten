import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { GlassButton } from '../primitives/GlassButton';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassScreenshotProps {
    /**
     * Ref of the element to capture. 
     * If not provided, you must pass a ref to a child or use a different trigger mechanism.
     * This component can mostly act as a trigger button.
     */
    targetRef: React.RefObject<HTMLElement>;

    /**
     * Filename for the downloaded image
     */
    fileName?: string;

    /**
     * Callback after capture (e.g. to upload instead of download)
     */
    onCapture?: (blob: Blob) => void;

    /**
     * Custom button label
     */
    label?: string;

    /**
     * Additional class names
     */
    className?: string;
}

export function GlassScreenshot({
    targetRef,
    fileName = 'screenshot.png',
    onCapture,
    label = 'Take Screenshot',
    className
}: GlassScreenshotProps) {
    const [isCapturing, setIsCapturing] = useState(false);

    const handleCapture = async () => {
        if (!targetRef.current) return;

        setIsCapturing(true);
        try {
            const canvas = await html2canvas(targetRef.current, {
                backgroundColor: null, // Transparent background if possible
                scale: 2, // Retina quality
                logging: false,
                useCORS: true // Allow cross-origin details if configured
            });

            if (onCapture) {
                canvas.toBlob((blob) => {
                    if (blob) onCapture(blob);
                });
            } else {
                // Default behavior: download
                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (error) {
            console.error("Screenshot failed:", error);
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <GlassButton
            onClick={handleCapture}
            disabled={isCapturing}
            className={cn("gap-2", className)}
        >
            {isCapturing ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
            {label}
        </GlassButton>
    );
}

GlassScreenshot.displayName = 'GlassScreenshot';
