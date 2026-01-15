/**
 * GlassArtifactDock
 *
 * Persistent bottom bar with recent artifacts.
 * Features:
 * - Recent artifacts as thumbnails with hover preview
 * - Pinned artifacts section
 * - "All Artifacts" opens the full explorer
 * - Badge shows new artifacts count
 * - Keyboard shortcut support (Cmd+Shift+A for explorer)
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  ChevronUp,
  ChevronDown,
  Pin,
  Grid,
  Loader2,
} from 'lucide-react';
import {
  useArtifactStore,
  selectPinnedArtifacts,
  selectUnpinnedRecentArtifacts,
} from '../../stores/artifactStore';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassArtifactCard } from './GlassArtifactCard';

// ============================================================================
// Types
// ============================================================================

export interface GlassArtifactDockProps {
  position?: 'bottom' | 'right';
  autoHide?: boolean;
  maxVisible?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function GlassArtifactDock({
  position = 'bottom',
  autoHide = false,
  maxVisible = 8,
  className = '',
}: GlassArtifactDockProps) {
  const {
    recentArtifacts,
    newArtifactCount,
    isDockVisible,
    isLoading,
    toggleDock,
    clearNewArtifactCount,
    fetchRecentArtifacts,
    openExplorer,
    openQuickLook,
    searchArtifacts,
    searchQuery,
    setSearchQuery,
  } = useArtifactStore();

  const pinnedArtifacts = useArtifactStore(selectPinnedArtifacts);
  const unpinnedArtifacts = useArtifactStore(selectUnpinnedRecentArtifacts);

  // Fetch recent artifacts on mount
  useEffect(() => {
    fetchRecentArtifacts(20);
  }, [fetchRecentArtifacts]);

  // Auto-hide behavior
  useEffect(() => {
    if (!autoHide || !isDockVisible) return;

    let hideTimeout: ReturnType<typeof setTimeout>;

    const handleMouseLeave = () => {
      hideTimeout = setTimeout(() => {
        toggleDock();
      }, 2000);
    };

    const handleMouseEnter = () => {
      clearTimeout(hideTimeout);
    };

    const dockEl = document.getElementById('artifact-dock');
    if (dockEl) {
      dockEl.addEventListener('mouseleave', handleMouseLeave);
      dockEl.addEventListener('mouseenter', handleMouseEnter);
    }

    return () => {
      clearTimeout(hideTimeout);
      if (dockEl) {
        dockEl.removeEventListener('mouseleave', handleMouseLeave);
        dockEl.removeEventListener('mouseenter', handleMouseEnter);
      }
    };
  }, [autoHide, isDockVisible, toggleDock]);

  // Clear new artifact count when dock becomes visible
  useEffect(() => {
    if (isDockVisible && newArtifactCount > 0) {
      clearNewArtifactCount();
    }
  }, [isDockVisible, newArtifactCount, clearNewArtifactCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+A to open explorer
      if (e.metaKey && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        openExplorer();
      }
      // Cmd+K for search (when dock is visible)
      if (e.metaKey && e.key === 'k' && isDockVisible) {
        e.preventDefault();
        // Focus search input
        const searchInput = document.getElementById('artifact-dock-search');
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openExplorer, isDockVisible]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.trim()) {
        searchArtifacts(query);
      }
    },
    [setSearchQuery, searchArtifacts]
  );

  // Visible artifacts (limited by maxVisible)
  const visiblePinned = pinnedArtifacts.slice(0, Math.min(3, maxVisible));
  const visibleUnpinned = unpinnedArtifacts.slice(
    0,
    maxVisible - visiblePinned.length
  );

  const isHorizontal = position === 'bottom';

  return (
    <div
      id="artifact-dock"
      className={`
        fixed z-50
        ${isHorizontal ? 'bottom-0 left-0 right-0' : 'right-0 top-0 bottom-0'}
        ${className}
      `}
    >
      {/* Toggle Button (when hidden) */}
      <AnimatePresence>
        {!isDockVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`
              absolute
              ${isHorizontal ? 'bottom-2 left-1/2 -translate-x-1/2' : 'right-2 top-1/2 -translate-y-1/2'}
            `}
            onClick={toggleDock}
          >
            <GlassContainer className="px-4 py-2 flex items-center gap-2" border>
              <Package size={16} className="text-white/60" />
              <span className="text-sm text-white/80">Artifacts</span>
              {newArtifactCount > 0 && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {newArtifactCount}
                </span>
              )}
              <ChevronUp size={14} className="text-white/40" />
            </GlassContainer>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Dock */}
      <AnimatePresence>
        {isDockVisible && (
          <motion.div
            initial={{ opacity: 0, y: isHorizontal ? 100 : 0, x: isHorizontal ? 0 : 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: isHorizontal ? 100 : 0, x: isHorizontal ? 0 : 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <GlassContainer
              className={`
                mx-4 mb-4 p-3
                ${isHorizontal ? '' : 'h-full'}
              `}
              border
            >
              <div
                className={`
                  flex items-center gap-4
                  ${isHorizontal ? 'flex-row' : 'flex-col h-full'}
                `}
              >
                {/* Collapse Button */}
                <button
                  className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={toggleDock}
                  title="Hide dock"
                >
                  {isHorizontal ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-90" />}
                </button>

                {/* Pinned Artifacts */}
                {visiblePinned.length > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <Pin size={12} className="text-amber-400" />
                      <span className="text-xs text-white/40">Pinned</span>
                    </div>
                    <div
                      className={`
                        flex gap-2
                        ${isHorizontal ? 'flex-row' : 'flex-col'}
                      `}
                    >
                      {visiblePinned.map((artifact) => (
                        <GlassArtifactCard
                          key={artifact.id}
                          artifact={artifact}
                          size="sm"
                          isPinned
                          onClick={openQuickLook}
                        />
                      ))}
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                  </>
                )}

                {/* Recent Artifacts */}
                <div
                  className={`
                    flex gap-2 flex-1
                    ${isHorizontal ? 'flex-row overflow-x-auto' : 'flex-col overflow-y-auto'}
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="animate-spin text-white/40" />
                    </div>
                  ) : visibleUnpinned.length > 0 ? (
                    visibleUnpinned.map((artifact) => (
                      <GlassArtifactCard
                        key={artifact.id}
                        artifact={artifact}
                        size="sm"
                        onClick={openQuickLook}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-4 text-white/40 text-sm">
                      No recent artifacts
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className={`${isHorizontal ? 'w-px h-8' : 'h-px w-full'} bg-white/10`} />

                {/* Search */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    id="artifact-dock-search"
                    type="text"
                    placeholder="Search... (Cmd+K)"
                    value={searchQuery}
                    onChange={handleSearch}
                    className={`
                      bg-white/5 border border-white/10 rounded-md
                      pl-7 pr-3 py-1.5
                      text-sm text-white placeholder-white/40
                      focus:outline-none focus:ring-1 focus:ring-white/20
                      ${isHorizontal ? 'w-40' : 'w-full'}
                    `}
                  />
                </div>

                {/* All Artifacts Button */}
                <button
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md
                    bg-white/5 hover:bg-white/10 transition-colors
                    ${isHorizontal ? '' : 'w-full justify-center'}
                  `}
                  onClick={openExplorer}
                  title="Open Artifact Explorer (Cmd+Shift+A)"
                >
                  <Grid size={16} className="text-white/60" />
                  <span className="text-sm text-white/80">All</span>
                  <span className="bg-white/10 text-white/60 text-xs px-1.5 py-0.5 rounded">
                    {recentArtifacts.length}
                  </span>
                </button>
              </div>
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GlassArtifactDock;
