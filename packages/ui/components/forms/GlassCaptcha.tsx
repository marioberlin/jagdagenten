import { useState, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassSlider } from './GlassSlider';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export interface GlassCaptchaProps {
    /**
     * Callback when verification succeeds or fails
     */
    onVerify: (isValid: boolean) => void;
    /**
     * Image URL to use for the background. 
     * Ideally purely decorative or abstract.
     */
    image?: string;
    className?: string;
}

export function GlassCaptcha({
    onVerify,
    image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    className
}: GlassCaptchaProps) {
    const [sliderValue, setSliderValue] = useState(0);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [targetX, setTargetX] = useState(0);

    // Randomize target position on mount
    useEffect(() => {
        resetCaptcha();
    }, []);

    const resetCaptcha = () => {
        setStatus('idle');
        setSliderValue(0);
        // Random position between 20% and 80%
        setTargetX(Math.floor(Math.random() * (80 - 20 + 1)) + 20);
    };

    const handleVerify = (val: number) => {
        setSliderValue(val);
        // Temporarily set to verifying if needed, or just wait for drop?
        // For slider, we usually verify on release (pointer up), but GlassSlider 
        // prop 'onValueChange' fires continuously.
        // We'll verify continuously or add a debounce? 
        // actually standard slide capthca checks on drop.
        // Since our GlassSlider doesn't expose onCommit/onRelease easily without modification,
        // we might simulate it or just let the user "place" it and we check.
        // Let's check when they stop moving? No, let's add a "Verify" mechanic 
        // OR simply verify if it matches closely enough.

        // Let's continuously check for visual feedback but only "lock" or "verify" if we had an event.
        // Since we don't have onAfterChange in our GlassSlider (yet), we will just check if it's close.
        // But preventing brute force is key.

        // For this demo: Live feedback.
    };

    // Since our GlassSlider doesn't have onSlidingComplete, we'll verify when the mouse is released
    // by adding a listener to the window when interaction starts? 
    // Simpler: Just rely on the user leaving it there for a split second?
    // Let's modify the UX: Slider moves the piece. 
    // If we assume this is a demo, we can just check if matches when value stabilizes.
    // Or we verify when value matches target +/- threshold.

    // Better UX: Verify on mouse up. We can attach a listener to the slider wrapper 
    // if we want, or just verify "live" but only trigger `onVerify(true)` once.

    useEffect(() => {
        if (status === 'success') return;

        const threshold = 5; // 5% tolerance
        if (Math.abs(sliderValue - targetX) < threshold) {
            // We could auto-verify, but better if we wait for user to stop specific interaction.
            // For now, let's just show visual indicator that it's "aligned".
        }
    }, [sliderValue, targetX, status]);

    // Use a pointerup listener strictly for the "Check" action
    const handlePointerUp = () => {
        if (status === 'success') return;

        const threshold = 5;
        if (Math.abs(sliderValue - targetX) < threshold) {
            setStatus('success');
            onVerify(true);
        } else {
            setStatus('error');
            onVerify(false);
            // Auto reset after error
            setTimeout(() => {
                setStatus('idle');
                setSliderValue(0);
            }, 1000);
        }
    };

    return (
        <GlassContainer className={cn("w-full max-w-sm p-4 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Security Check</span>
                <button
                    onClick={resetCaptcha}
                    className="p-1 hover:bg-glass-layer-2 rounded-full transition-colors"
                >
                    <RefreshCw size={16} className="text-secondary" />
                </button>
            </div>

            {/* Puzzle Area */}
            <div
                className="relative h-40 w-full rounded-lg overflow-hidden bg-black/50"
                onPointerUp={handlePointerUp} // Check on release anywhere in this area (works if slider is inside)
            >
                {/* Background Image */}
                <img
                    src={image}
                    alt="Captcha Background"
                    className="w-full h-full object-cover opacity-80"
                />

                {/* Target Hole */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] border border-white/20 rounded-md backdrop-blur-sm"
                    style={{ left: `${targetX}%` }}
                />

                {/* Puzzle Piece (Overlay) */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-10 h-10 border border-white/80 rounded-md shadow-xl z-10",
                        "transition-shadow duration-300"
                    )}
                    style={{
                        left: `${sliderValue}%`,
                        backgroundImage: `url(${image})`,
                        backgroundSize: 'cover', // This needs to match the parent relative sizing...
                        // Complex to match perfectly responsive bg without fixed sizes.
                        // Simplified: Use a cutout color or clone the image logic.
                        // For a robust glass UI demo, let's use a "Glass Piece" instead of image matching 
                        // to avoid image alignment complexity.
                        backgroundPosition: `${sliderValue}% 50%`, // Attempt to shift visual? No, that's complex.
                        // Let's simply make it a "Glass Lens"
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'brightness(1.5) blur(2px)',
                    }}
                >
                    {/* Feedback Icon */}
                    {status === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-green-400">
                            <CheckCircle size={20} />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-400">
                            <XCircle size={20} />
                        </div>
                    )}
                </div>

                {/* Status Overlay Text */}
                {status === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-glass-surface/80 backdrop-blur-sm z-20">
                        <span className="font-bold text-green-400 flex items-center gap-2">
                            <CheckCircle size={18} /> Verified
                        </span>
                    </div>
                )}
            </div>

            {/* Slider Control */}
            <div className="pt-2" onPointerUp={handlePointerUp}>
                <p className="text-xs text-secondary text-center mb-2">Slide to align the glass piece</p>
                <GlassSlider
                    value={sliderValue}
                    max={90} // limit to avoid overflow
                    step={0.5}
                    onValueChange={handleVerify}
                />
            </div>
        </GlassContainer>
    );
}
