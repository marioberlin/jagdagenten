/**
 * Glass Canvas Split Pane
 * 
 * Embedded split-pane layout with chat on left and canvas output on right.
 * Supports HTML, Markdown, Mermaid, and interactive content.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './GlassCanvasSplitPane.css';

// ============================================================================
// Types
// ============================================================================

export type CanvasMode = 'embedded' | 'overlay' | 'popup' | 'hidden';
export type ContentType = 'html' | 'markdown' | 'mermaid' | 'code' | 'iframe';

interface CanvasContent {
    id: string;
    type: ContentType;
    content: string;
    title?: string;
    timestamp: Date;
}

interface GlassCanvasSplitPaneProps {
    children: React.ReactNode; // Chat content goes here
    mode?: CanvasMode;
    defaultSplit?: number; // 0-100, percentage for left pane
    minPaneWidth?: number;
    onModeChange?: (mode: CanvasMode) => void;
}

// ============================================================================
// Component
// ============================================================================

export const GlassCanvasSplitPane: React.FC<GlassCanvasSplitPaneProps> = ({
    children,
    mode = 'embedded',
    defaultSplit = 50,
    minPaneWidth = 300,
    onModeChange,
}) => {
    const [splitPosition, setSplitPosition] = useState(defaultSplit);
    const [isDragging, setIsDragging] = useState(false);
    const [canvasContent, setCanvasContent] = useState<CanvasContent | null>(null);
    const [canvasHistory, setCanvasHistory] = useState<CanvasContent[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentMode, setCurrentMode] = useState(mode);

    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Handle drag resize
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

            // Respect min width constraints
            const minPercent = (minPaneWidth / rect.width) * 100;
            const maxPercent = 100 - minPercent;

            setSplitPosition(Math.min(maxPercent, Math.max(minPercent, newPosition)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minPaneWidth]);

    // Expose canvas API globally
    useEffect(() => {
        (window as any).liquidCanvas = {
            show: (content: string, type: ContentType = 'html', title?: string) => {
                const newContent: CanvasContent = {
                    id: `canvas-${Date.now()}`,
                    type,
                    content,
                    title,
                    timestamp: new Date(),
                };
                setCanvasContent(newContent);
                setCanvasHistory(prev => [...prev.slice(0, historyIndex + 1), newContent]);
                setHistoryIndex(prev => prev + 1);
            },
            clear: () => {
                setCanvasContent(null);
            },
            setMode: (newMode: CanvasMode) => {
                setCurrentMode(newMode);
                onModeChange?.(newMode);
            },
            navigate: (url: string) => {
                const newContent: CanvasContent = {
                    id: `canvas-${Date.now()}`,
                    type: 'iframe',
                    content: url,
                    title: url,
                    timestamp: new Date(),
                };
                setCanvasContent(newContent);
                setCanvasHistory(prev => [...prev.slice(0, historyIndex + 1), newContent]);
                setHistoryIndex(prev => prev + 1);
            },
        };

        return () => {
            delete (window as any).liquidCanvas;
        };
    }, [historyIndex, onModeChange]);

    const handleBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setCanvasContent(canvasHistory[historyIndex - 1]);
        }
    };

    const handleForward = () => {
        if (historyIndex < canvasHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setCanvasContent(canvasHistory[historyIndex + 1]);
        }
    };

    const handleClose = () => {
        setCanvasContent(null);
    };

    const handlePopout = () => {
        if (!canvasContent) return;

        const popup = window.open('', '_blank', 'width=800,height=600');
        if (popup) {
            popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${canvasContent.title || 'Canvas'}</title>
            <style>
              body { margin: 0; padding: 20px; background: #1a1a2e; color: #fff; font-family: system-ui; }
            </style>
          </head>
          <body>${canvasContent.content}</body>
        </html>
      `);
        }
        setCurrentMode('popup');
        onModeChange?.('popup');
    };

    const renderCanvasContent = () => {
        if (!canvasContent) {
            return (
                <div className="canvas-empty">
                    <div className="empty-icon">🎨</div>
                    <h3>Canvas Ready</h3>
                    <p>AI-generated content will appear here</p>
                </div>
            );
        }

        switch (canvasContent.type) {
            case 'html':
                return (
                    <div
                        className="canvas-html"
                        dangerouslySetInnerHTML={{ __html: canvasContent.content }}
                    />
                );
            case 'markdown':
                // In production, use a markdown renderer
                return (
                    <div className="canvas-markdown">
                        <pre>{canvasContent.content}</pre>
                    </div>
                );
            case 'mermaid':
                return (
                    <div className="canvas-mermaid">
                        <pre className="mermaid">{canvasContent.content}</pre>
                    </div>
                );
            case 'code':
                return (
                    <div className="canvas-code">
                        <pre><code>{canvasContent.content}</code></pre>
                    </div>
                );
            case 'iframe':
                return (
                    <iframe
                        ref={iframeRef}
                        src={canvasContent.content}
                        className="canvas-iframe"
                        sandbox="allow-scripts allow-same-origin"
                    />
                );
            default:
                return <div className="canvas-text">{canvasContent.content}</div>;
        }
    };

    // Hidden mode - just render children
    if (currentMode === 'hidden') {
        return <div className="glass-canvas-hidden">{children}</div>;
    }

    // Overlay mode
    if (currentMode === 'overlay' && canvasContent) {
        return (
            <div className="glass-canvas-overlay-container">
                <div className="main-content">{children}</div>
                <div className="canvas-overlay">
                    <div className="canvas-toolbar">
                        <div className="toolbar-left">
                            <button onClick={handleBack} disabled={historyIndex <= 0}>←</button>
                            <button onClick={handleForward} disabled={historyIndex >= canvasHistory.length - 1}>→</button>
                        </div>
                        <span className="canvas-title">{canvasContent?.title || 'Canvas'}</span>
                        <div className="toolbar-right">
                            <button onClick={handlePopout}>↗</button>
                            <button onClick={handleClose}>×</button>
                        </div>
                    </div>
                    <div className="canvas-body">{renderCanvasContent()}</div>
                </div>
            </div>
        );
    }

    // Embedded split-pane mode
    return (
        <div
            ref={containerRef}
            className={`glass-canvas-split-pane ${isDragging ? 'dragging' : ''} ${canvasContent ? 'has-content' : ''}`}
        >
            <div
                className="split-left"
                style={{ width: canvasContent ? `${splitPosition}%` : '100%' }}
            >
                {children}
            </div>

            {canvasContent && (
                <>
                    <div
                        className="split-divider"
                        onMouseDown={handleMouseDown}
                    >
                        <div className="divider-handle" />
                    </div>

                    <div
                        className="split-right"
                        style={{ width: `${100 - splitPosition}%` }}
                    >
                        <div className="canvas-toolbar">
                            <div className="toolbar-left">
                                <button onClick={handleBack} disabled={historyIndex <= 0}>←</button>
                                <button onClick={handleForward} disabled={historyIndex >= canvasHistory.length - 1}>→</button>
                            </div>
                            <span className="canvas-title">{canvasContent?.title || 'Canvas'}</span>
                            <div className="toolbar-right">
                                <button onClick={handlePopout} title="Pop out">↗</button>
                                <button onClick={handleClose} title="Close">×</button>
                            </div>
                        </div>
                        <div className="canvas-body">
                            {renderCanvasContent()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GlassCanvasSplitPane;
