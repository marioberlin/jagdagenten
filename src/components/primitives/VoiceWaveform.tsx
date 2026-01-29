import { cn } from '@/utils/cn';

type VoiceState = 'idle' | 'listening' | 'speaking' | 'connecting' | 'error';

interface VoiceWaveformProps {
    state: VoiceState;
    className?: string;
}

/**
 * VoiceWaveform
 * 
 * An animated waveform indicator for voice input states.
 * Renders 5 bars with state-dependent animations and colors.
 */
export const VoiceWaveform = ({ state, className }: VoiceWaveformProps) => {
    const isActive = state === 'listening' || state === 'speaking';

    // Different color schemes for each state
    const getBarColor = () => {
        switch (state) {
            case 'listening':
                return 'bg-gradient-to-t from-cyan-400 to-blue-400';
            case 'speaking':
                return 'bg-gradient-to-t from-amber-400 to-orange-400';
            case 'connecting':
                return 'bg-gradient-to-t from-blue-400 to-indigo-400';
            case 'error':
                return 'bg-gradient-to-t from-red-400 to-rose-400';
            default:
                return 'bg-gradient-to-t from-white/40 to-white/60';
        }
    };

    const barColor = getBarColor();

    return (
        <div
            className={cn(
                "flex items-center justify-center gap-[2px] h-6 w-6",
                className
            )}
        >
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={cn(
                        "w-[3px] rounded-full transition-all duration-150",
                        barColor,
                        isActive ? "animate-waveform" : "h-2 opacity-60"
                    )}
                    style={{
                        animationDelay: isActive ? `${i * 100}ms` : undefined,
                        height: isActive ? undefined : `${6 + Math.sin(i * 1.2) * 4}px`,
                    }}
                />
            ))}

            <style>{`
                @keyframes waveform {
                    0%, 100% { height: 6px; }
                    50% { height: 18px; }
                }
                .animate-waveform {
                    animation: waveform 0.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

VoiceWaveform.displayName = 'VoiceWaveform';
