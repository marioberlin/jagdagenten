import React, { useState } from 'react';
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

const TreeNode = ({ node, level, onSelect }: { node: FileNode, level: number, onSelect?: (node: FileNode) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onSelect?.(node);
        }
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-1.5 py-1 px-2 rounded hover:bg-glass-surface cursor-pointer transition-colors text-sm",
                    level > 0 && "ml-3"
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
                <div className="border-l border-[var(--glass-border)] ml-[15px]">
                    {node.children!.map((child) => (
                        <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const GlassFileTree = ({ data, className, onSelect }: GlassFileTreeProps) => {
    return (
        <div className={cn("w-full overflow-y-auto font-mono", className)}>
            {data.map(node => (
                <TreeNode key={node.id} node={node} level={0} onSelect={onSelect} />
            ))}
        </div>
    );
};

GlassFileTree.displayName = 'GlassFileTree';
