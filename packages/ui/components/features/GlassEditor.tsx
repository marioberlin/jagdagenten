import { useState, useRef, useEffect } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Bold, Italic, AlignLeft, AlignCenter } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassEditorProps {
    initialValue?: string;
    placeholder?: string;
    className?: string;
}

export const GlassEditor = ({ initialValue = '', placeholder = 'Start typing...', className }: GlassEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number, left: number } | null>(null);
    const [, setContent] = useState(initialValue);

    const checkSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            setToolbarPosition(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Relative to offset offsetParent is tricky, using fixed for demo simplicity or calculating relative
        // For this demo, let's keep it simple relative to viewport but careful with scroll.
        // Better: relative to the editor container.

        if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
            // Calculate position relative to the viewport + scroll
            setToolbarPosition({
                top: rect.top - 50 + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX
            });
        } else {
            setToolbarPosition(null);
        }
    };

    useEffect(() => {
        document.addEventListener('selectionchange', checkSelection);
        return () => document.removeEventListener('selectionchange', checkSelection);
    }, []);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    return (
        <GlassContainer className={cn("relative min-h-[200px] flex flex-col", className)}>
            {/* Floating Toolbar */}
            {toolbarPosition && (
                <div
                    className="fixed z-50 flex items-center gap-1 p-1 bg-black/80 backdrop-blur-xl border border-[var(--glass-border)] rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: toolbarPosition.top, left: toolbarPosition.left, transform: 'translateX(-50%)' }}
                >
                    <button onClick={() => execCommand('bold')} className="p-2 hover:bg-glass-surface-hover rounded-full text-primary transition-colors">
                        <Bold size={16} />
                    </button>
                    <button onClick={() => execCommand('italic')} className="p-2 hover:bg-glass-surface-hover rounded-full text-primary transition-colors">
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-4 bg-glass-surface mx-1" />
                    <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-glass-surface-hover rounded-full text-primary transition-colors">
                        <AlignLeft size={16} />
                    </button>
                    <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-glass-surface-hover rounded-full text-primary transition-colors">
                        <AlignCenter size={16} />
                    </button>
                </div>
            )}

            <div
                ref={editorRef}
                className="flex-1 w-full h-full p-6 outline-none text-lg text-primary empty:before:content-[attr(data-placeholder)] empty:before:text-tertiary"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onBlur={(e) => setContent(e.currentTarget.innerHTML)}
            />

            <div className="absolute top-4 right-4 text-xs text-tertiary pointer-events-none select-none">
                Markdown Supported
            </div>
        </GlassContainer>
    );
};

GlassEditor.displayName = 'GlassEditor';
