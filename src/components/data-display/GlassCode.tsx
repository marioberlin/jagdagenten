import { useState, useContext } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ShowCodeContext } from '@/context/ShowCodeContext';

interface GlassCodeProps {
    code: string;
    language?: string;
    filename?: string;
    showLineNumbers?: boolean;
    className?: string;
    /** Force show regardless of context (e.g., for code demos) */
    forceShow?: boolean;
}

export const GlassCode = ({
    code,
    language = 'typescript',
    filename,
    showLineNumbers = true,
    className,
    forceShow = false
}: GlassCodeProps) => {
    const [copied, setCopied] = useState(false);

    // Read ShowCode context - will be undefined if not within ShowCodeProvider
    const context = useContext(ShowCodeContext);
    const showCode = context?.showCode ?? true;

    // Hide if showCode is false (unless forceShow is true)
    if (!showCode && !forceShow) {
        return null;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Simple regex-based syntax highlighting with CSS variable colors
    // Colors adapt to theme via CSS classes that respond to .dark class
    const highlightCode = (code: string) => {
        const keywords = /\b(const|let|var|function|return|import|export|from|as|if|else|for|while|interface|type|extends|implements|class|new|this|true|false|null|undefined)\b/g;
        const strings = /(['"`])(.*?)\1/g;
        const numbers = /\b(\d+)\b/g;
        const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
        const properties = /--[a-zA-Z0-9-]+/g;

        return code.split('\n').map((line, i) => {
            let highlighted = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Apply highlighting with theme-aware classes
            highlighted = highlighted
                .replace(keywords, '<span class="syntax-keyword">$1</span>')
                .replace(strings, '<span class="syntax-string">$&</span>')
                .replace(numbers, '<span class="syntax-number">$1</span>')
                .replace(comments, '<span class="syntax-comment">$1</span>')
                .replace(properties, '<span class="syntax-property">$&</span>');

            return (
                <div key={i} className="table-row">
                    {showLineNumbers && (
                        <span className="table-cell text-right select-none text-label-glass-tertiary pr-4 text-xs w-8">
                            {i + 1}
                        </span>
                    )}
                    <span
                        className="table-cell whitespace-pre font-mono text-sm text-label-glass-primary"
                        dangerouslySetInnerHTML={{ __html: highlighted || ' ' }}
                    />
                </div>
            );
        });
    };

    return (
        <GlassContainer className={cn("overflow-hidden group", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--glass-surface)] border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    {filename && (
                        <span className="text-xs text-label-glass-tertiary font-mono">{filename}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-label-glass-tertiary uppercase tracking-wider">{language}</span>
                    <GlassButton
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="w-6 h-6"
                    >
                        {copied ? <Check size={12} className="text-[var(--system-green)]" /> : <Copy size={12} className="text-label-glass-secondary" />}
                    </GlassButton>
                </div>
            </div>

            {/* Code Area */}
            <div className="p-4 overflow-x-auto bg-[var(--glass-surface)]">
                <div className="table min-w-full">
                    {highlightCode(code)}
                </div>
            </div>
        </GlassContainer>
    );
};

GlassCode.displayName = 'GlassCode';
