import { GlassContainer } from '../primitives/GlassContainer';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
    label: string;
    description?: string;
}

interface GlassStepperProps {
    steps: Step[];
    currentStep: number;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export const GlassStepper = ({ steps, currentStep, className, orientation = 'horizontal' }: GlassStepperProps) => {
    const isHorizontal = orientation === 'horizontal';

    return (
        <GlassContainer
            className={cn("p-6", className)}
            enableLiquid={false}
        >
            <div className={cn(
                "flex",
                isHorizontal ? "flex-row items-start justify-center gap-0" : "flex-col gap-0"
            )}>
                {steps.map((step, i) => {
                    const isCompleted = i < currentStep;
                    const isActive = i === currentStep;
                    const isLast = i === steps.length - 1;

                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex",
                                isHorizontal ? "flex-col items-center" : "flex-row items-start gap-4",
                                !isLast && isHorizontal && "flex-1"
                            )}
                        >
                            {/* Step indicator row with connector */}
                            <div className={cn(
                                "flex items-center",
                                isHorizontal ? "w-full" : "flex-col"
                            )}>
                                {/* Circle indicator */}
                                <div
                                    className={cn(
                                        "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                                        // Completed state
                                        isCompleted && "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30",
                                        // Active state
                                        isActive && "bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-2 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/20",
                                        // Inactive state
                                        !isCompleted && !isActive && "bg-glass-surface/50 border-2 border-[var(--glass-border)] text-tertiary"
                                    )}
                                >
                                    {/* Inner glow for active state */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" />
                                    )}

                                    {/* Completed checkmark */}
                                    {isCompleted ? (
                                        <Check size={20} strokeWidth={3} className="relative z-10" />
                                    ) : (
                                        <span className={cn(
                                            "text-sm font-bold relative z-10",
                                            isActive && "text-blue-500"
                                        )}>
                                            {i + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Connector line */}
                                {!isLast && (
                                    <div className={cn(
                                        "transition-all duration-500",
                                        isHorizontal
                                            ? "flex-1 h-1 mx-2 rounded-full min-w-[40px]"
                                            : "w-1 h-12 my-2 rounded-full ml-[22px]",
                                        isCompleted
                                            ? "bg-gradient-to-r from-blue-500 to-blue-400"
                                            : "bg-glass-surface/50"
                                    )} />
                                )}
                            </div>

                            {/* Label and description */}
                            <div className={cn(
                                "flex flex-col mt-3",
                                isHorizontal ? "items-center text-center px-2" : "items-start"
                            )}>
                                <span className={cn(
                                    "text-sm font-semibold transition-colors duration-300",
                                    isCompleted && "text-blue-500",
                                    isActive && "text-primary",
                                    !isCompleted && !isActive && "text-tertiary"
                                )}>
                                    {step.label}
                                </span>
                                {step.description && (
                                    <span className="text-xs text-tertiary mt-1 max-w-[100px]">
                                        {step.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassContainer>
    );
};

GlassStepper.displayName = 'GlassStepper';
