import React, { useState, useRef, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassUploadProps {
    onUpload?: (files: File[]) => void;
    className?: string;
    accept?: string;
}

export const GlassUpload = forwardRef<HTMLDivElement, GlassUploadProps>(
    ({ onUpload, className, accept }, ref) => {
        const [isDragging, setIsDragging] = useState(false);
        const [files, setFiles] = useState<File[]>([]);
        const inputRef = useRef<HTMLInputElement>(null);

        const handleDrag = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.type === 'dragenter' || e.type === 'dragover') {
                setIsDragging(true);
            } else if (e.type === 'dragleave') {
                setIsDragging(false);
            }
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const newFiles = Array.from(e.dataTransfer.files);
                setFiles(prev => [...prev, ...newFiles]);
                onUpload?.(newFiles);
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                const newFiles = Array.from(e.target.files);
                setFiles(prev => [...prev, ...newFiles]);
                onUpload?.(newFiles);
            }
        };

        const removeFile = (index: number) => {
            setFiles(prev => prev.filter((_, i) => i !== index));
        };

        return (
            <div ref={ref} className={cn("space-y-4", className)}>
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group",
                        isDragging ? "border-accent bg-accent-muted scale-[1.02]" : "border-[var(--glass-border)] bg-glass-surface hover:border-[var(--glass-border)] hover:bg-glass-surface-hover"
                    )}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept={accept}
                        onChange={handleChange}
                    />

                    <div className={cn("w-16 h-16 rounded-full bg-glass-surface flex items-center justify-center mb-4 transition-transform duration-300", isDragging ? "scale-110" : "group-hover:scale-110")}>
                        <Upload size={32} className="text-secondary" />
                    </div>

                    <h3 className="text-lg font-medium text-label-glass-primary">
                        {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
                    </h3>
                    <p className="text-sm text-label-glass-secondary mt-2 max-w-xs">
                        Support for images, videos, and documents up to 50MB.
                    </p>
                </div>

                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((file, i) => (
                            <GlassContainer key={i} className="p-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-glass-surface flex items-center justify-center text-secondary">
                                    <File size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-label-glass-primary truncate">{file.name}</div>
                                    <div className="text-xs text-label-glass-tertiary">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-success-muted text-success flex items-center justify-center">
                                        <CheckCircle size={12} />
                                    </div>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="p-1.5 hover:bg-glass-surface-hover rounded-full text-tertiary hover:text-primary transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </GlassContainer>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

GlassUpload.displayName = 'GlassUpload';
