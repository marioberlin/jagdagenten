import React, { useState, useEffect, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface TerminalLine {
    type: 'input' | 'output';
    content: string;
    timestamp?: string;
}

interface GlassTerminalProps {
    className?: string;
    welcomeMessage?: string;
}

export const GlassTerminal = ({ className, welcomeMessage = 'Liquid Glass UI [Version 1.0.0]\n(c) 2025 Liquid Corp. All rights reserved.\n' }: GlassTerminalProps) => {
    const [history, setHistory] = useState<TerminalLine[]>([
        { type: 'output', content: welcomeMessage }
    ]);
    const [currentInput, setCurrentInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = (cmd: string) => {
        const output: TerminalLine[] = [{ type: 'input', content: cmd }];

        switch (cmd.toLowerCase().trim()) {
            case 'help':
                output.push({ type: 'output', content: 'Available commands: help, clear, version, date, echo [text]' });
                break;
            case 'clear':
                setHistory([]);
                return;
            case 'version':
                output.push({ type: 'output', content: 'v1.0.0-beta' });
                break;
            case 'date':
                output.push({ type: 'output', content: new Date().toString() });
                break;
            default:
                if (cmd.startsWith('echo ')) {
                    output.push({ type: 'output', content: cmd.substring(5) });
                } else if (cmd.trim() !== '') {
                    output.push({ type: 'output', content: `Command not found: ${cmd}` });
                }
        }
        setHistory(prev => [...prev, ...output]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCommand(currentInput);
            setCurrentInput('');
        }
    };

    return (
        <GlassContainer className={cn("bg-black/80 font-mono text-sm p-4 overflow-y-auto min-h-[300px] flex flex-col font-mono", className)}>
            <div className="flex-1 space-y-1">
                {history.map((line, i) => (
                    <div key={i} className={cn("break-words", line.type === 'input' ? "text-white/90" : "text-white/60")}>
                        {line.type === 'input' && <span className="text-green-400 mr-2">➜ ~</span>}
                        {line.content.split('\n').map((l, j) => <div key={j}>{l}</div>)}
                    </div>
                ))}
            </div>

            <div className="flex items-center mt-2 group">
                <span className="text-green-400 mr-2">➜ ~</span>
                <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 caret-white"
                    autoFocus
                />
            </div>
            <div ref={bottomRef} />
        </GlassContainer>
    );
};

GlassTerminal.displayName = 'GlassTerminal';
