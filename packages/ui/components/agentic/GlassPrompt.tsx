import React, { useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { Send, Mic, Image, Paperclip, X, Sparkles } from 'lucide-react';

interface GlassPromptProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    /** Callback when the prompt is submitted */
    onSubmit?: (text: string, files?: File[]) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the AI is currently processing */
    isLoading?: boolean;
    /** Show the intent indicator */
    intent?: string;
    /** Enable voice input button */
    enableVoice?: boolean;
    /** Enable file upload */
    enableFiles?: boolean;
    /** Visual style of the prompt */
    variant?: 'standard' | 'minimal';
}

export const GlassPrompt = React.forwardRef<HTMLDivElement, GlassPromptProps>(
    ({
        className,
        onSubmit,
        placeholder = 'Ask anything...',
        isLoading = false,
        intent,
        enableVoice = true,
        enableFiles = true,
        variant = 'standard',
        ...props
    }, ref) => {
        const [value, setValue] = useState('');
        const [files, setFiles] = useState<File[]>([]);
        const [isDragOver, setIsDragOver] = useState(false);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleSubmit = () => {
            if (!value.trim() && files.length === 0) return;
            onSubmit?.(value, files);
            setValue('');
            setFiles([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        };

        const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(e.target.value);
            // Auto-grow
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            }
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...droppedFiles]);
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(true);
        };

        const handleDragLeave = () => {
            setIsDragOver(false);
        };

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            }
        };

        const removeFile = (index: number) => {
            setFiles(prev => prev.filter((_, i) => i !== index));
        };

        // MINIMAL VARIANT (Spotlight/Command Style)
        if (variant === 'minimal') {
            return (
                <GlassContainer
                    ref={ref}
                    material="regular"
                    className={cn(
                        'relative transition-all duration-300 flex items-center gap-3 overflow-hidden',
                        'rounded-full px-4 py-2', // Pill shape
                        isDragOver && 'ring-2 ring-accent/50 bg-accent/5',
                        className
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    {...props}
                >
                    {/* Prefix Icon / Intent */}
                    <div className="flex-shrink-0 text-secondary">
                        {isLoading ? (
                            <Sparkles size={20} className="text-accent animate-pulse" />
                        ) : intent ? (
                            <Sparkles size={20} className="text-accent" />
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-secondary/50" />
                        )}
                    </div>

                    {/* Minimal Input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading}
                        rows={1}
                        className={cn(
                            'flex-1 bg-transparent resize-none outline-none text-xl font-light text-primary placeholder:text-tertiary',
                            'py-2 min-h-[44px] max-h-[200px] leading-relaxed',
                            isLoading && 'opacity-50 cursor-not-allowed'
                        )}
                    />

                    {/* Right Actions (Minimal) */}
                    <div className="flex items-center gap-2">
                        {files.length > 0 && (
                            <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                {files.length} file{files.length > 1 ? 's' : ''}
                            </span>
                        )}

                        {(value.trim() || files.length > 0) && (
                            <GlassButton
                                size="icon"
                                variant="ghost"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-8 h-8 rounded-full hover:bg-white/10"
                            >
                                <Send size={16} />
                            </GlassButton>
                        )}
                    </div>
                </GlassContainer>
            );
        }

        // STANDARD VARIANT
        return (
            <GlassContainer
                ref={ref}
                material="regular"
                className={cn(
                    'relative p-4 transition-all duration-300',
                    isDragOver && 'ring-2 ring-accent/50 bg-accent/5',
                    className
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                {...props}
            >
                {/* Intent Indicator */}
                {intent && (
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Sparkles size={14} className="text-accent animate-pulse" />
                        <span className="text-xs font-medium text-accent tracking-wide uppercase">
                            {intent}
                        </span>
                    </div>
                )}

                {/* File Previews */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-glass-surface rounded-full text-sm"
                            >
                                <Paperclip size={12} className="text-secondary" />
                                <span className="text-primary truncate max-w-[120px]">{file.name}</span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="text-secondary hover:text-destructive transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-end gap-3">
                    {/* Left Actions */}
                    <div className="flex items-center gap-1">
                        {enableFiles && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 rounded-full text-secondary hover:text-primary hover:bg-glass-surface-hover transition-colors"
                                    title="Attach files"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 rounded-full text-secondary hover:text-primary hover:bg-glass-surface-hover transition-colors"
                                    title="Add image"
                                >
                                    <Image size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading}
                        rows={1}
                        className={cn(
                            'flex-1 bg-transparent resize-none outline-none text-primary placeholder:text-tertiary',
                            'py-2 min-h-[40px] max-h-[200px]',
                            isLoading && 'opacity-50 cursor-not-allowed'
                        )}
                    />

                    {/* Right Actions */}
                    <div className="flex items-center gap-1">
                        {enableVoice && (
                            <button
                                className="p-2 rounded-full text-secondary hover:text-primary hover:bg-glass-surface-hover transition-colors"
                                title="Voice input"
                            >
                                <Mic size={18} />
                            </button>
                        )}
                        <GlassButton
                            size="icon"
                            variant={value.trim() || files.length > 0 ? 'primary' : 'ghost'}
                            onClick={handleSubmit}
                            disabled={isLoading || (!value.trim() && files.length === 0)}
                            loading={isLoading}
                            className="w-10 h-10"
                        >
                            <Send size={18} />
                        </GlassButton>
                    </div>
                </div>

                {/* Drag overlay */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-accent/10 rounded-3xl flex items-center justify-center pointer-events-none">
                        <span className="text-accent font-medium">Drop files here</span>
                    </div>
                )}
            </GlassContainer>
        );
    }
);

GlassPrompt.displayName = 'GlassPrompt';
