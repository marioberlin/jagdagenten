import Webcam from 'react-webcam';
import { useState, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Camera, RefreshCw } from 'lucide-react';

interface GlassScannerProps {
    className?: string;
}

export function GlassScanner({ className }: GlassScannerProps) {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
            setIsScanning(false);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
        setIsScanning(true);
    };

    return (
        <div className={cn("glass-panel p-1 rounded-xl relative overflow-hidden h-[400px] flex flex-col", className)}>
            <div className="relative flex-1 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                {imgSrc ? (
                    <img src={imgSrc} alt="Scanned" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                            videoConstraints={{ facingMode: "user" }}
                        />

                        {/* HUD Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {/* Corner Brackets */}
                                <div className="absolute top-10 left-10 w-16 h-16 border-t-2 border-l-2 border-accent-primary opacity-80" />
                                <div className="absolute top-10 right-10 w-16 h-16 border-t-2 border-r-2 border-accent-primary opacity-80" />
                                <div className="absolute bottom-10 left-10 w-16 h-16 border-b-2 border-l-2 border-accent-primary opacity-80" />
                                <div className="absolute bottom-10 right-10 w-16 h-16 border-b-2 border-r-2 border-accent-primary opacity-80" />

                                {/* Scanning Line */}
                                <div className="w-[80%] h-0.5 bg-accent-primary/80 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.8)] animate-[scan_2s_ease-in-out_infinite]" />

                                <div className="absolute top-12 text-xs font-mono text-accent-primary animate-pulse">
                                    SYSTEM READY // SCANNING TARGET
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 flex justify-between items-center glass-card mt-1 rounded-none border-0 border-t border-white/5">
                <div className="flex gap-4">
                    <div className="text-xs">
                        <div className="text-white/40 uppercase tracking-wider text-[10px]">Status</div>
                        <div className="text-accent-primary font-mono">{isScanning ? 'ACTIVE' : 'IDLE'}</div>
                    </div>
                    <div className="text-xs">
                        <div className="text-white/40 uppercase tracking-wider text-[10px]">Format</div>
                        <div className="text-white/80 font-mono">JPEG / 1080p</div>
                    </div>
                </div>

                <div>
                    {imgSrc ? (
                        <button
                            onClick={retake}
                            className="glass-button px-6 py-2 flex items-center gap-2 hover:bg-white/10"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retake
                        </button>
                    ) : (
                        <button
                            onClick={capture}
                            className="glass-button bg-accent-primary/20 hover:bg-accent-primary/30 border-accent-primary/50 text-accent-primary px-8 py-2 flex items-center gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            Capture
                        </button>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes scan {
          0% { transform: translateY(-150px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
