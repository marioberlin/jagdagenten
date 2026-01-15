/**
 * GlassArtifactQuickLook
 *
 * macOS-style Quick Look modal for artifact preview.
 * Features:
 * - Full content preview
 * - Copy/download actions
 * - Version history navigation
 * - Related artifacts
 */

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Download,
  Pin,
  PinOff,
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
  Code,
  Image as ImageIcon,
  Database,
  BarChart3,
  Sparkles,
  TrendingUp,
  LineChart,
  Briefcase,
  Bell,
  Folder,
  FileEdit,
  type LucideIcon,
} from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import {
  type StoredArtifact,
  type ArtifactIconName,
  useArtifactStore,
  getArtifactIcon,
  formatArtifactDate,
} from '../../stores/artifactStore';

// Icon map for dynamic icon rendering
const ICON_MAP: Record<ArtifactIconName, LucideIcon> = {
  TrendingUp,
  BarChart3,
  FileText,
  LineChart,
  Briefcase,
  Bell,
  Folder,
  FileEdit,
};

// ============================================================================
// Types
// ============================================================================

export interface GlassArtifactQuickLookProps {
  isOpen?: boolean;
  artifact?: StoredArtifact | null;
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// Content Renderers
// ============================================================================

function renderTextContent(text: string): React.ReactNode {
  // Check if it's code
  const isCode = text.includes('```') || text.startsWith('function') || text.includes('const ');

  if (isCode) {
    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="text-white/80 whitespace-pre-wrap mb-4">
            {text.slice(lastIndex, match.index)}
          </p>
        );
      }

      // Add code block
      const lang = match[1] || 'plaintext';
      const code = match[2];
      parts.push(
        <pre
          key={`code-${match.index}`}
          className="bg-black/30 rounded-lg p-4 overflow-x-auto mb-4"
        >
          <code className={`language-${lang} text-sm text-white/90`}>{code}</code>
        </pre>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="text-white/80 whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </p>
      );
    }

    return parts.length > 0 ? parts : (
      <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-white/90">{text}</code>
      </pre>
    );
  }

  // Regular text
  return <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{text}</p>;
}

function renderDataContent(data: Record<string, unknown>): React.ReactNode {
  return (
    <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
      <code className="text-sm text-white/90">{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}

function renderFileContent(file: { name?: string; mimeType?: string; bytes?: string }): React.ReactNode {
  const { name, mimeType, bytes } = file;

  if (mimeType?.startsWith('image/') && bytes) {
    return (
      <div className="flex flex-col items-center">
        <img
          src={`data:${mimeType};base64,${bytes}`}
          alt={name || 'Image'}
          className="max-w-full max-h-[400px] rounded-lg"
        />
        {name && <p className="text-white/60 text-sm mt-2">{name}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4">
      <FileText className="w-8 h-8 text-white/60" />
      <div>
        <p className="text-white font-medium">{name || 'Untitled file'}</p>
        <p className="text-white/60 text-sm">{mimeType || 'Unknown type'}</p>
      </div>
    </div>
  );
}

function getContentTypeIcon(artifact: StoredArtifact) {
  const hasText = artifact.parts.some((p) => p.text);
  const hasFile = artifact.parts.some((p) => p.file);
  const hasData = artifact.parts.some((p) => p.data);
  const category = artifact.metadata?.category as string | undefined;

  if (category === 'chart' || category === 'analysis') {
    return <BarChart3 className="w-5 h-5" />;
  }
  if (hasFile) {
    const file = artifact.parts.find((p) => p.file)?.file;
    if (file?.mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  }
  if (hasData) {
    return <Database className="w-5 h-5" />;
  }
  if (hasText) {
    const text = artifact.parts.find((p) => p.text)?.text || '';
    if (text.includes('```') || text.includes('function')) {
      return <Code className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  }

  return <Sparkles className="w-5 h-5" />;
}

// ============================================================================
// Component
// ============================================================================

export function GlassArtifactQuickLook({
  isOpen: controlledIsOpen,
  artifact: controlledArtifact,
  onClose: controlledOnClose,
  className = '',
}: GlassArtifactQuickLookProps) {
  const {
    quickLookArtifact,
    isQuickLookOpen,
    closeQuickLook,
    pinArtifact,
    unpinArtifact,
    pinnedArtifactIds,
    recentArtifacts,
  } = useArtifactStore();

  const [copied, setCopied] = useState(false);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen ?? isQuickLookOpen;
  const artifact = controlledArtifact ?? quickLookArtifact;
  const handleClose = controlledOnClose ?? closeQuickLook;

  const isPinned = artifact ? pinnedArtifactIds.includes(artifact.id) : false;

  // Find prev/next artifact in recent list
  const currentIndex = artifact
    ? recentArtifacts.findIndex((a) => a.id === artifact.id)
    : -1;
  const prevArtifact = currentIndex > 0 ? recentArtifacts[currentIndex - 1] : null;
  const nextArtifact =
    currentIndex >= 0 && currentIndex < recentArtifacts.length - 1
      ? recentArtifacts[currentIndex + 1]
      : null;

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      if (e.key === 'ArrowLeft' && prevArtifact) {
        useArtifactStore.getState().openQuickLook(prevArtifact);
      }
      if (e.key === 'ArrowRight' && nextArtifact) {
        useArtifactStore.getState().openQuickLook(nextArtifact);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, prevArtifact, nextArtifact]);

  const handleCopy = useCallback(async () => {
    if (!artifact) return;

    try {
      // Copy artifact content
      const textParts = artifact.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join('\n\n');

      const dataParts = artifact.parts
        .filter((p) => p.data)
        .map((p) => JSON.stringify(p.data, null, 2))
        .join('\n\n');

      const content = [textParts, dataParts].filter(Boolean).join('\n\n');

      await navigator.clipboard.writeText(content || JSON.stringify(artifact, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy artifact');
    }
  }, [artifact]);

  const handleDownload = useCallback(() => {
    if (!artifact) return;

    const blob = new Blob([JSON.stringify(artifact, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.name || artifact.artifactId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [artifact]);

  const handlePin = useCallback(() => {
    if (!artifact) return;
    if (isPinned) {
      unpinArtifact(artifact.id);
    } else {
      pinArtifact(artifact.id);
    }
  }, [artifact, isPinned, pinArtifact, unpinArtifact]);

  if (!artifact) return null;

  const icon = getArtifactIcon(artifact);
  const dateStr = formatArtifactDate(artifact.createdAt);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed inset-8 md:inset-16 lg:inset-24 z-[101]
              ${className}
            `}
          >
            <GlassContainer className="w-full h-full flex flex-col" border>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = ICON_MAP[icon];
                    return IconComponent ? (
                      <IconComponent
                        size={32}
                        className="text-purple-400"
                        aria-label="artifact type"
                      />
                    ) : null;
                  })()}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {artifact.name || artifact.artifactId}
                      </h2>
                      {getContentTypeIcon(artifact)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span>{dateStr}</span>
                      {artifact.version > 1 && (
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs">
                          v{artifact.version}
                        </span>
                      )}
                      {artifact.isStreaming && (
                        <span className="flex items-center gap-1 text-green-400">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Streaming
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Action Buttons */}
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                    title="Copy content"
                  >
                    <Copy size={18} className={copied ? 'text-green-400' : 'text-white/70'} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                    title="Download"
                  >
                    <Download size={18} className="text-white/70" />
                  </button>
                  <button
                    onClick={handlePin}
                    className={`p-2 rounded-md transition-colors ${
                      isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                    title={isPinned ? 'Unpin' : 'Pin to dock'}
                  >
                    {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                  </button>
                  <button
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                    title="View history"
                  >
                    <History size={18} className="text-white/70" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors ml-2"
                  >
                    <X size={18} className="text-white/70" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {artifact.description && (
                  <p className="text-white/60 mb-6">{artifact.description}</p>
                )}

                <div className="space-y-6">
                  {artifact.parts.map((part, index) => (
                    <div key={index}>
                      {part.text && renderTextContent(part.text)}
                      {part.data && renderDataContent(part.data)}
                      {part.file && renderFileContent(part.file)}
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-medium text-white/60 mb-3">Metadata</h3>
                    <pre className="bg-black/20 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-white/70">
                        {JSON.stringify(artifact.metadata, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer - Navigation */}
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <button
                  onClick={() => prevArtifact && useArtifactStore.getState().openQuickLook(prevArtifact)}
                  disabled={!prevArtifact}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md
                    transition-colors
                    ${prevArtifact ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'text-white/30 cursor-not-allowed'}
                  `}
                >
                  <ChevronLeft size={16} />
                  <span className="text-sm">Previous</span>
                </button>

                <span className="text-sm text-white/40">
                  {currentIndex >= 0 && `${currentIndex + 1} of ${recentArtifacts.length}`}
                </span>

                <button
                  onClick={() => nextArtifact && useArtifactStore.getState().openQuickLook(nextArtifact)}
                  disabled={!nextArtifact}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md
                    transition-colors
                    ${nextArtifact ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'text-white/30 cursor-not-allowed'}
                  `}
                >
                  <span className="text-sm">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GlassArtifactQuickLook;
