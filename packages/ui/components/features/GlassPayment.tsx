import { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Wifi, Disc } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassPaymentProps {
    className?: string;
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvc?: string;
}

export const GlassPayment = ({
    className,
    cardNumber = "•••• •••• •••• ••••",
    cardHolder = "YOUR NAME",
    expiry = "MM/YY",
    cvc = "•••"
}: GlassPaymentProps) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className={cn("relative w-[340px] h-[215px] perspective-1000 cursor-pointer group", className)}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={cn("relative w-full h-full duration-700 preserve-3d transition-transform", isFlipped ? "rotate-y-180" : "")}>

                {/* Front */}
                <GlassContainer className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between bg-gradient-to-br from-glass-surface-hover to-glass-surface border-[var(--glass-border)] shadow-2xl">
                    <div className="flex justify-between items-start">
                        <Disc size={32} className="text-secondary" />
                        <Wifi size={24} className="rotate-90 text-tertiary" />
                    </div>

                    <div className="space-y-6">
                        <div className="text-2xl font-mono text-primary tracking-widest drop-shadow-md">
                            {cardNumber || "•••• •••• •••• ••••"}
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <div className="text-[10px] text-tertiary uppercase tracking-wider">Card Holder</div>
                                <div className="text-sm font-medium text-primary tracking-wide uppercase">{cardHolder || "YOUR NAME"}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] text-tertiary uppercase tracking-wider">Expires</div>
                                <div className="text-sm font-medium text-primary tracking-wide">{expiry || "MM/YY"}</div>
                            </div>
                        </div>
                    </div>
                </GlassContainer>

                {/* Back */}
                <GlassContainer className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden bg-gradient-to-bl from-glass-surface-hover to-glass-surface border-[var(--glass-border)] shadow-2xl">
                    <div className="mt-6 h-12 bg-black/40 w-full" />

                    <div className="px-6 space-y-2">
                        <div className="text-[10px] text-tertiary uppercase tracking-wider text-right">CVC</div>
                        <div className="h-10 bg-glass-surface-hover rounded flex items-center justify-end px-3">
                            <span className="font-mono text-primary tracking-widest">{cvc}</span>
                        </div>
                        <p className="text-[8px] text-tertiary text-center leading-tight mt-4">
                            This card is property of Liquid Glass Corp. Use implies acceptance of all terms.
                            <br />Authorized Signature Not Required.
                        </p>
                    </div>

                    <div className="h-6" />
                </GlassContainer>

            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .rotate-90 { transform: rotate(90deg); }
            `}</style>
        </div>
    );
};

GlassPayment.displayName = 'GlassPayment';
