import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassInputOTPProps {
    length?: number;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export const GlassInputOTP = forwardRef<HTMLDivElement, GlassInputOTPProps>(
    ({ length = 6, value = "", onChange, className }, ref) => {
        const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
        const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

        useEffect(() => {
            if (value) {
                const newVal = value.slice(0, length).split("");
                const filled = [...newVal, ...new Array(length - newVal.length).fill("")];
                setOtp(filled);
            }
        }, [value, length]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
            const val = e.target.value;
            const newOtp = [...otp];

            // Handle last character only (if user types multiple chars rapidly or autofill)
            newOtp[index] = val.substring(val.length - 1);
            setOtp(newOtp);
            onChange?.(newOtp.join(""));

            // Move to next input
            if (val && index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            if (e.key === "Backspace" && !otp[index] && index > 0) {
                // Move to previous if current is empty
                inputRefs.current[index - 1]?.focus();
            }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
            if (!pastedData) return;

            const newOtp = [...otp];
            pastedData.split("").forEach((char, i) => {
                if (i < length) newOtp[i] = char;
            });
            setOtp(newOtp);
            onChange?.(newOtp.join(""));

            // Focus last filled
            const lastIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[lastIndex]?.focus();
        };

        return (
            <div ref={ref} className={cn("flex gap-3", className)}>
                {otp.map((digit, index) => (
                    <GlassContainer
                        key={index}
                        material="regular"
                        enableLiquid={false} // Clean edges for OTP inputs
                        className="w-10 h-12 flex items-center justify-center !p-0 focus-within:ring-2 ring-primary/50 transition-all"
                    >
                        <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            className="w-full h-full bg-transparent text-center text-lg font-bold outline-none text-primary"
                        />
                    </GlassContainer>
                ))}
            </div>
        );
    }
);

GlassInputOTP.displayName = 'GlassInputOTP';
