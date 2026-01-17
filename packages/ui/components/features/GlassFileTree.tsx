import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FileCode, FileImage, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    language?: string; // For icon selection
}

interface GlassFileTreeProps {
    data: FileNode[];
    className?: string;
    onSelect?: (node: FileNode) => void;
    /** Callback when Space is pressed on a file (for Quick Look preview) */
    onPreview?: (node: FileNode) => void;
}

const FileIcon = ({ name, language }: { name: string, language?: string }) => {
    const ext = name.split('.').pop()?.toLowerCase();

    if (language === 'typescript' || ext === 'ts' || ext === 'tsx') return <FileCode size={14} className="text-blue-400" />;
    if (ext === 'css' || ext === 'scss') return <FileCode size={14} className="text-pink-400" />;
    if (ext === 'html') return <FileCode size={14} className="text-orange-400" />;
    if (['jpg', 'png', 'svg', 'webp'].includes(ext || '')) return <FileImage size={14} className="text-purple-400" />;
    if (ext === 'md' || ext === 'txt') return <FileText size={14} className="text-secondary" />;

    return <File size={14} className="text-secondary" />;
};

interface TreeNodeProps {
    node: FileNode;
    level: number;
    onSelect?: (node: FileNode) => void;
    onPreview?: (node: FileNode) => void;
    isFocused: boolean;
    onFocus: (id: string) => void;
    onToggle: (id: string, isOpen: boolean) => void;
    isOpen: boolean;
}

const TreeNode = ({
    node,
    level,
    onSelect,
    onPreview,
    isFocused,
    onFocus,
    onToggle,
    isOpen
}: TreeNodeProps) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

    // Auto-scroll focused node into view
    useEffect(() => {
        if (isFocused && nodeRef.current) {
            nodeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isFocused]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocus(node.id);
        if (node.type === 'folder') {
            onToggle(node.id, !isOpen);
        } else {
            onSelect?.(node);
        }
    };

    return (
        <div className="select-none" role="treeitem" aria-expanded={node.type === 'folder' ? isOpen : undefined}>
            <div
                ref={nodeRef}
                tabIndex={isFocused ? 0 : -1}
                className={cn(
                    "flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm outline-none",
                    level > 0 && "ml-3",
                    isFocused
                        ? "bg-accent/20 ring-1 ring-accent/50"
                        : "hover:bg-glass-surface"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                {node.type === 'folder' ? (
                    <span className="text-tertiary mr-0.5">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                ) : (
                    <span className="w-4" /> // Spacer
                )}

                {node.type === 'folder' ? (
                    <Folder size={14} className={cn("text-yellow-400/80", isOpen ? "fill-yellow-400/20" : "")} />
                ) : (
                    <FileIcon name={node.name} language={node.language} />
                )}

                <span className="text-primary truncate">{node.name}</span>
            </div>

            {isOpen && hasChildren && (
                <div className="border-l border-[var(--glass-border)] ml-[15px]" role="group">
                    {node.children!.map((child) => (
                        <TreeNodeWrapper
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            onPreview={onPreview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Wrapper to connect to context
const TreeNodeWrapper = (props: Omit<TreeNodeProps, 'isFocused' | 'onFocus' | 'onToggle' | 'isOpen'>) => {
    const context = React.useContext(FileTreeContext);
    if (!context) return null;

    const { focusedId, setFocusedId, openFolders, toggleFolder } = context;

    return (
        <TreeNode
            {...props}
            isFocused={focusedId === props.node.id}
            onFocus={setFocusedId}
            onToggle={toggleFolder}
            isOpen={openFolders.has(props.node.id)}
        />
    );
};

// Context for managing focus and open state
interface FileTreeContextType {
    focusedId: string | null;
    setFocusedId: (id: string) => void;
    openFolders: Set<string>;
    toggleFolder: (id: string, isOpen: boolean) => void;
}

const FileTreeContext = React.createContext<FileTreeContextType | null>(null);

// Flatten tree for keyboard navigation
const flattenTree = (nodes: FileNode[], openFolders: Set<string>): FileNode[] => {
    const result: FileNode[] = [];
    const traverse = (items: FileNode[]) => {
        for (const item of items) {
            result.push(item);
            if (item.type === 'folder' && item.children && openFolders.has(item.id)) {
                traverse(item.children);
            }
        }
    };
    traverse(nodes);
    return result;
};

export const GlassFileTree = ({ data, className, onSelect, onPreview }: GlassFileTreeProps) => {
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFolder = useCallback((id: string, isOpen: boolean) => {
        setOpenFolders(prev => {
            const next = new Set(prev);
            if (isOpen) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const visibleNodes = flattenTree(data, openFolders);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!focusedId) {
            if (visibleNodes.length > 0) {
                setFocusedId(visibleNodes[0].id);
            }
            return;
        }

        const currentIndex = visibleNodes.findIndex(n => n.id === focusedId);
        if (currentIndex === -1) return;

        const currentNode = visibleNodes[currentIndex];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < visibleNodes.length - 1) {
                    setFocusedId(visibleNodes[currentIndex + 1].id);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    setFocusedId(visibleNodes[currentIndex - 1].id);
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentNode.type === 'folder') {
                    if (!openFolders.has(currentNode.id)) {
                        toggleFolder(currentNode.id, true);
                    } else if (currentNode.children && currentNode.children.length > 0) {
                        // Move to first child
                        setFocusedId(currentNode.children[0].id);
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentNode.type === 'folder' && openFolders.has(currentNode.id)) {
                    toggleFolder(currentNode.id, false);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (currentNode.type === 'folder') {
                    toggleFolder(currentNode.id, !openFolders.has(currentNode.id));
                } else {
                    onSelect?.(currentNode);
                }
                break;
            case ' ':
                e.preventDefault();
                if (currentNode.type === 'file') {
                    onPreview?.(currentNode);
                } else {
                    toggleFolder(currentNode.id, !openFolders.has(currentNode.id));
                }
                break;
        }
    }, [focusedId, visibleNodes, openFolders, toggleFolder, onSelect, onPreview]);

    const contextValue: FileTreeContextType = {
        focusedId,
        setFocusedId,
        openFolders,
        toggleFolder
    };

    return (
        <FileTreeContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                className={cn("w-full overflow-y-auto font-mono focus:outline-none", className)}
                role="tree"
                aria-label="File browser"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (!focusedId && visibleNodes.length > 0) {
                        setFocusedId(visibleNodes[0].id);
                    }
                }}
            >
                {data.map(node => (
                    <TreeNodeWrapper
                        key={node.id}
                        node={node}
                        level={0}
                        onSelect={onSelect}
                        onPreview={onPreview}
                    />
                ))}
            </div>
        </FileTreeContext.Provider>
    );
};

GlassFileTree.displayName = 'GlassFileTree';
