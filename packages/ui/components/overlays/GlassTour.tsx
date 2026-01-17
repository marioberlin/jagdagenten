import { useState, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
    title: string;
    description?: string;
    content?: string; // Alias for description
    targetId?: string; // Ideally used to calculate position, but simplified for demo
}

interface GlassTourProps {
    steps: Step[];
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

export const GlassTour = ({ steps, isOpen = false, onClose = () => { }, className }: GlassTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Reset loop when opened
    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLast) {
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Popover */}
            <GlassContainer className={cn("relative w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-[var(--glass-border)]", className)}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-tertiary hover:text-primary transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-bold text-accent uppercase tracking-widest bg-accent-muted px-2 py-1 rounded">
                            Step {currentStep + 1} of {steps.length}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-primary">{step.title}</h3>
                    <p className="text-label-glass-secondary leading-relaxed">
                        {step.description || step.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn("w-2 h-2 rounded-full transition-colors", i === currentStep ? "bg-primary" : "bg-secondary")}
                                />
                            ))}
                        </div>
                        <GlassButton onClick={handleNext} size="sm">
                            {isLast ? "Begin" : "Next"}
                        </GlassButton>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};

GlassTour.displayName = 'GlassTour';
