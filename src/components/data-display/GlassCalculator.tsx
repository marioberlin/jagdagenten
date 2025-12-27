import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Delete } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassCalculatorProps {
    className?: string;
}

export const GlassCalculator = ({ className }: GlassCalculatorProps) => {
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState('');
    const [previousInput, setPreviousInput] = useState<string | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const clear = () => {
        setDisplay('0');
        setHistory('');
        setPreviousInput(null);
        setOperator(null);
        setShouldResetDisplay(false);
    };

    const backspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const handleNumber = (value: string) => {
        if (display === '0' || shouldResetDisplay) {
            setDisplay(value);
            setShouldResetDisplay(false);
        } else {
            setDisplay(display + value);
        }
    };

    const handleDecimal = () => {
        if (shouldResetDisplay) {
            setDisplay('0.');
            setShouldResetDisplay(false);
        } else if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const handleOperator = (nextOperator: string) => {
        if (operator && !shouldResetDisplay && previousInput !== null) {
            calculate();
        }
        setPreviousInput(display);
        setOperator(nextOperator);
        setHistory(`${display} ${nextOperator}`);
        setShouldResetDisplay(true);
    };

    const calculate = () => {
        if (!operator || previousInput === null) return;

        const prev = parseFloat(previousInput);
        const current = parseFloat(display);
        let result = 0;

        switch (operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/':
                if (current === 0) {
                    setDisplay('Error');
                    return;
                }
                result = prev / current;
                break;
            case '%': result = prev % current; break;
            default: return;
        }

        setDisplay(result.toString());
        setHistory('');
        setOperator(null);
        setPreviousInput(null);
        setShouldResetDisplay(true);
    };

    // Simple button component - no nested GlassContainer
    const CalcButton = ({
        children,
        onClick,
        variant = 'default',
        span = 1
    }: {
        children: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'operator' | 'action' | 'equals';
        span?: number;
    }) => {
        const variants = {
            default: 'bg-glass-surface-hover hover:bg-glass-surface-active text-label-glass-primary active:scale-95',
            operator: 'bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 active:scale-95',
            action: 'bg-glass-surface hover:bg-glass-surface-hover text-label-glass-secondary active:scale-95',
            equals: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30 active:scale-95',
        };

        return (
            <button
                onClick={onClick}
                className={cn(
                    "rounded-2xl text-xl font-medium h-14 transition-all duration-150",
                    "flex items-center justify-center",
                    variants[variant],
                    span === 2 && "col-span-2"
                )}
            >
                {children}
            </button>
        );
    };

    return (
        <GlassContainer
            className={cn("w-full max-w-xs p-5 rounded-3xl", className)}
            border
            material="regular"
            enableLiquid={false}
        >
            {/* Display - flat design, no nested glass */}
            <div className="bg-black/30 rounded-2xl p-4 mb-4 text-right border border-[var(--glass-border)]">
                <div className="text-label-glass-tertiary text-sm h-5 font-mono truncate">
                    {history}
                </div>
                <div className="text-label-glass-primary text-4xl font-semibold truncate tracking-tight mt-1">
                    {display}
                </div>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-2">
                <CalcButton onClick={clear} variant="action">
                    <span className="text-orange-400">AC</span>
                </CalcButton>
                <CalcButton onClick={backspace} variant="action">
                    <Delete size={20} />
                </CalcButton>
                <CalcButton onClick={() => handleOperator('%')} variant="action">%</CalcButton>
                <CalcButton onClick={() => handleOperator('/')} variant="operator">÷</CalcButton>

                <CalcButton onClick={() => handleNumber('7')}>7</CalcButton>
                <CalcButton onClick={() => handleNumber('8')}>8</CalcButton>
                <CalcButton onClick={() => handleNumber('9')}>9</CalcButton>
                <CalcButton onClick={() => handleOperator('*')} variant="operator">×</CalcButton>

                <CalcButton onClick={() => handleNumber('4')}>4</CalcButton>
                <CalcButton onClick={() => handleNumber('5')}>5</CalcButton>
                <CalcButton onClick={() => handleNumber('6')}>6</CalcButton>
                <CalcButton onClick={() => handleOperator('-')} variant="operator">−</CalcButton>

                <CalcButton onClick={() => handleNumber('1')}>1</CalcButton>
                <CalcButton onClick={() => handleNumber('2')}>2</CalcButton>
                <CalcButton onClick={() => handleNumber('3')}>3</CalcButton>
                <CalcButton onClick={() => handleOperator('+')} variant="operator">+</CalcButton>

                <CalcButton onClick={() => handleNumber('0')} span={2}>0</CalcButton>
                <CalcButton onClick={handleDecimal}>.</CalcButton>
                <CalcButton onClick={calculate} variant="equals">=</CalcButton>
            </div>
        </GlassContainer>
    );
};

GlassCalculator.displayName = 'GlassCalculator';
