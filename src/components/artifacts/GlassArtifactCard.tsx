/**
 * GlassArtifactCard
 *
 * Individual artifact display card with 3 sizes (sm, md, lg).
 * Features:
 * - Adaptive preview based on content type
 * - Hover preview with metadata
 * - Connection indicators for related artifacts
 * - Pin/unpin functionality
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  PinOff,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  History,
  FileText,
  Image,
  Code,
  BarChart3,
  Database,
  Sparkles,
  TrendingUp,
  LineChart,
  Briefcase,
  Bell,
  Folder,
  FileEdit,
  type LucideIcon,
} from 'lucide-react';
import {
  type StoredArtifact,
  type ArtifactIconName,
  getArtifactIcon,
  getArtifactPreviewText,
  formatArtifactDate,
  useArtifactStore,
} from '../../stores/artifactStore';

// ============================================================================
// Icon Map
// ============================================================================

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

import { GlassContainer } from '../primitives/GlassContainer';
// Note: GlassTooltip available at '../overlays/GlassTooltip' if needed

// ============================================================================
// Types
// ============================================================================

export type ArtifactCardSize = 'sm' | 'md' | 'lg';

export interface GlassArtifactCardProps {
  artifact: StoredArtifact;
  size?: ArtifactCardSize;
  isPinned?: boolean;
  showMetadata?: boolean;
  onClick?: (artifact: StoredArtifact) => void;
  onContextMenu?: (artifact: StoredArtifact, event: React.MouseEvent) => void;
  className?: string;
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeConfig = {
  sm: {
    width: 'w-16',
    height: 'h-16',
    iconSize: 24,
    showName: false,
    showPreview: false,
    showMeta: false,
  },
  md: {
    width: 'w-48',
    height: 'h-32',
    iconSize: 32,
    showName: true,
    showPreview: true,
    showMeta: false,
  },
  lg: {
    width: 'w-64',
    height: 'h-48',
    iconSize: 40,
    showName: true,
    showPreview: true,
    showMeta: true,
  },
};

// ============================================================================
// Content Type Icon
// ============================================================================

function getContentTypeIcon(artifact: StoredArtifact) {
  const hasText = artifact.parts.some((p) => p.text);
  const hasFile = artifact.parts.some((p) => p.file);
  const hasData = artifact.parts.some((p) => p.data);
  const category = artifact.metadata?.category as string | undefined;

  if (category === 'chart' || category === 'analysis') {
    return <BarChart3 className="w-4 h-4" />;
  }
  if (hasFile) {
    const file = artifact.parts.find((p) => p.file)?.file;
    if (file?.mimeType?.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  }
  if (hasData) {
    return <Database className="w-4 h-4" />;
  }
  if (hasText) {
    const text = artifact.parts.find((p) => p.text)?.text || '';
    if (text.includes('```') || text.includes('function') || text.includes('const ')) {
      return <Code className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  }

  return <Sparkles className="w-4 h-4" />;
}

// ============================================================================
// Component
// ============================================================================

export function GlassArtifactCard({
  artifact,
  size = 'md',
  isPinned = false,
  showMetadata = true,
  onClick,
  onContextMenu,
  className = '',
}: GlassArtifactCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { pinArtifact, unpinArtifact, openQuickLook } = useArtifactStore();

  const config = sizeConfig[size];
  const icon = getArtifactIcon(artifact);
  const previewText = getArtifactPreviewText(artifact);
  const dateStr = formatArtifactDate(artifact.createdAt);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(artifact);
    } else {
      openQuickLook(artifact);
    }
  }, [artifact, onClick, openQuickLook]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onContextMenu) {
        onContextMenu(artifact, e);
      } else {
        setShowMenu(true);
      }
    },
    [artifact, onContextMenu]
  );

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPinned) {
        unpinArtifact(artifact.id);
      } else {
        pinArtifact(artifact.id);
      }
    },
    [artifact.id, isPinned, pinArtifact, unpinArtifact]
  );

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassContainer
        className={`
          ${config.width} ${config.height}
          p-3 cursor-pointer
          transition-all duration-200
          ${isHovered ? 'ring-2 ring-white/20' : ''}
          ${artifact.isStreaming ? 'animate-pulse' : ''}
        `}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        border
      >
        {/* Icon and Category Badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = ICON_MAP[icon];
              return IconComponent ? (
                <IconComponent
                  size={config.iconSize}
                  className="text-purple-400"
                  aria-label="artifact type"
                />
              ) : null;
            })()}
            {getContentTypeIcon(artifact)}
          </div>

          {/* Pin Button (shown on hover for md/lg) */}
          {size !== 'sm' && isHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`
                p-1 rounded-md transition-colors
                ${isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60 hover:text-white'}
              `}
              onClick={handlePin}
              title={isPinned ? 'Unpin' : 'Pin to dock'}
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </motion.button>
          )}
        </div>

        {/* Name */}
        {config.showName && (
          <h4 className="text-sm font-medium text-white truncate mb-1">
            {artifact.name || artifact.artifactId}
          </h4>
        )}

        {/* Preview Text */}
        {config.showPreview && (
          <p className="text-xs text-white/60 line-clamp-2 mb-2">{previewText}</p>
        )}

        {/* Metadata */}
        {config.showMeta && showMetadata && (
          <div className="flex items-center gap-2 text-xs text-white/40 mt-auto">
            <Clock size={12} />
            <span>{dateStr}</span>
            {artifact.version > 1 && (
              <span className="bg-white/10 px-1.5 py-0.5 rounded">v{artifact.version}</span>
            )}
          </div>
        )}

        {/* Streaming Indicator */}
        {artifact.isStreaming && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Streaming</span>
          </div>
        )}
      </GlassContainer>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-0 mt-1 z-50"
          >
            <GlassContainer className="p-1 min-w-[160px]" border>
              <ContextMenuItem
                icon={<ExternalLink size={14} />}
                label="Open"
                onClick={() => {
                  openQuickLook(artifact);
                  setShowMenu(false);
                }}
              />
              <ContextMenuItem
                icon={<Copy size={14} />}
                label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
                  setShowMenu(false);
                }}
              />
              <ContextMenuItem
                icon={isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                label={isPinned ? 'Unpin' : 'Pin to Dock'}
                onClick={(e) => {
                  handlePin(e);
                  setShowMenu(false);
                }}
              />
              <ContextMenuItem
                icon={<History size={14} />}
                label="View History"
                onClick={() => {
                  // TODO: Open version history
                  setShowMenu(false);
                }}
              />
              <div className="h-px bg-white/10 my-1" />
              <ContextMenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                onClick={() => {
                  // TODO: Confirm and delete
                  setShowMenu(false);
                }}
                destructive
              />
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Tooltip for Small Cards */}
      {size === 'sm' && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <GlassContainer className="p-2 min-w-[150px]" border>
            <p className="text-sm font-medium text-white truncate">
              {artifact.name || artifact.artifactId}
            </p>
            <p className="text-xs text-white/60 mt-1">{dateStr}</p>
          </GlassContainer>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Context Menu Item
// ============================================================================

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  destructive?: boolean;
}

function ContextMenuItem({ icon, label, onClick, destructive }: ContextMenuItemProps) {
  return (
    <button
      className={`
        w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm
        transition-colors
        ${
          destructive
            ? 'text-red-400 hover:bg-red-500/20'
            : 'text-white/80 hover:bg-white/10'
        }
      `}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default GlassArtifactCard;
