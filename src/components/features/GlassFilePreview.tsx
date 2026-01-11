import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, FileCode, FileImage, File } from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import type { FileNode } from './GlassFileTree';

interface GlassFilePreviewProps {
    /** The file node to preview */
    file: FileNode | null;
    /** Callback when the preview should be closed */
    onClose: () => void;
    /** Optional content to display for the file (for code/text files) */
    content?: string;
    /** Optional URL for image files */
    imageUrl?: string;
    /** Additional class names */
    className?: string;
}

/**
 * GlassFilePreview - Quick Look-style file preview modal.
 * Per Apple HIG, provides a fast way to preview files without fully opening them.
 * 
 * @example
 * ```tsx
 * const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
 * 
 * return (
 *   <>
 *     <GlassFileTree data={files} onPreview={setPreviewFile} />
 *     <GlassFilePreview 
 *       file={previewFile} 
 *       onClose={() => setPreviewFile(null)}
 *       content={getFileContent(previewFile?.id)}
 *     />
 *   </>
 * );
 * ```
 */
export const GlassFilePreview = ({
    file,
    onClose,
    content,
    imageUrl,
    className
}: GlassFilePreviewProps) => {
    // Close on Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (file) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [file, handleKeyDown]);

    // Determine file type for icon and preview style
    const getFileType = (name: string): 'image' | 'code' | 'text' | 'unknown' => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '')) return 'image';
        if (['ts', 'tsx', 'js', 'jsx', 'css', 'scss', 'html', 'json', 'py', 'rb', 'go', 'rs'].includes(ext || '')) return 'code';
        if (['md', 'txt', 'log', 'yml', 'yaml', 'xml'].includes(ext || '')) return 'text';
        return 'unknown';
    };

    const fileType = file ? getFileType(file.name) : 'unknown';

    const FileIcon = () => {
        switch (fileType) {
            case 'image': return <FileImage size={24} className="text-purple-400" />;
            case 'code': return <FileCode size={24} className="text-blue-400" />;
            case 'text': return <FileText size={24} className="text-secondary" />;
            default: return <File size={24} className="text-secondary" />;
        }
    };

    return (
        <AnimatePresence>
            {file && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        onClick={onClose}
                    />

                    {/* Preview Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            "fixed inset-4 md:inset-12 lg:inset-20 z-[201] flex flex-col",
                            className
                        )}
                    >
                        <GlassContainer
                            material="thick"
                            className="flex flex-col h-full w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                                <div className="flex items-center gap-3">
                                    <FileIcon />
                                    <div>
                                        <h3 className="text-sm font-semibold text-primary">{file.name}</h3>
                                        <p className="text-xs text-secondary capitalize">{fileType} file</p>
                                    </div>
                                </div>
                                <GlassButton
                                    size="icon"
                                    variant="ghost"
                                    onClick={onClose}
                                    aria-label="Close preview"
                                >
                                    <X size={18} />
                                </GlassButton>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-auto p-4">
                                {fileType === 'image' && imageUrl ? (
                                    <div className="flex items-center justify-center h-full">
                                        <img
                                            src={imageUrl}
                                            alt={file.name}
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                        />
                                    </div>
                                ) : (fileType === 'code' || fileType === 'text') && content ? (
                                    <pre className="text-sm text-primary font-mono whitespace-pre-wrap bg-black/20 rounded-lg p-4 overflow-auto h-full">
                                        <code>{content}</code>
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-secondary">
                                        <File size={64} className="opacity-30" />
                                        <p className="text-sm">No preview available for this file type</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="px-4 py-2 border-t border-[var(--glass-border)] text-center">
                                <p className="text-xs text-tertiary">Press <kbd className="px-1.5 py-0.5 bg-glass-surface rounded text-secondary">Esc</kbd> to close</p>
                            </div>
                        </GlassContainer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

GlassFilePreview.displayName = 'GlassFilePreview';
