/**
 * DropZone
 *
 * Drag-and-drop zone for staging context files before a build.
 * Uploads files to .builder/context/{appId}/ on the server.
 */

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Code, File } from 'lucide-react';
import type { ContextFile } from '../store';

interface DropZoneProps {
  appId: string;
  files: ContextFile[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (fileName: string) => Promise<void>;
}

function getFileIcon(name: string) {
  if (name.endsWith('.md') || name.endsWith('.txt')) return <FileText size={14} />;
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return <Image size={14} />;
  if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js')) return <Code size={14} />;
  return <File size={14} />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function DropZone({ appId, files, onUpload, onRemove }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploading(true);
    try {
      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [onUpload]);

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-secondary uppercase tracking-wide">
        Context Files ({appId})
      </div>

      {/* Drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
          isDragging
            ? 'border-accent/60 bg-accent/5'
            : 'border-white/15 hover:border-white/25'
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-secondary" />
        <div className="text-xs text-secondary">
          {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </div>
        <div className="text-xs text-secondary/60 mt-1">
          design.md, api-spec.yaml, screenshots, skills
        </div>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map(file => (
            <div
              key={file.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 group"
            >
              <span className="text-secondary">{getFileIcon(file.name)}</span>
              <span className="text-xs text-primary flex-1 truncate">{file.name}</span>
              <span className="text-xs text-secondary/60">{formatSize(file.size)}</span>
              <button
                onClick={() => onRemove(file.name)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-secondary hover:text-primary transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
