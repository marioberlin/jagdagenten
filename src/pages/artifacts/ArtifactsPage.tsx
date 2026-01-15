/**
 * ArtifactsPage
 *
 * Full-page view for browsing and managing A2A artifacts.
 * Features:
 * - Grid/List view toggle
 * - Category filtering
 * - Search and sort
 * - QuickLook preview
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassArtifactExplorer } from '@/components/artifacts/GlassArtifactExplorer';
import { GlassArtifactDock } from '@/components/artifacts/GlassArtifactDock';
import { useArtifactStore } from '@/stores/artifactStore';

export function ArtifactsPage() {
  const {
    recentArtifacts,
    pinnedArtifactIds,
    fetchRecentArtifacts,
    isLoading
  } = useArtifactStore();

  useEffect(() => {
    fetchRecentArtifacts(50);
  }, [fetchRecentArtifacts]);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Artifacts</h1>
              <p className="text-white/60">Browse and manage agent-generated artifacts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRecentArtifacts(50)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <GlassContainer className="p-4" border>
          <p className="text-white/60 text-sm mb-1">Total Artifacts</p>
          <p className="text-2xl font-bold text-white">{recentArtifacts.length}</p>
        </GlassContainer>
        <GlassContainer className="p-4" border>
          <p className="text-white/60 text-sm mb-1">Pinned</p>
          <p className="text-2xl font-bold text-white">{pinnedArtifactIds.length}</p>
        </GlassContainer>
        <GlassContainer className="p-4" border>
          <p className="text-white/60 text-sm mb-1">This Week</p>
          <p className="text-2xl font-bold text-white">
            {recentArtifacts.filter(a => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(a.createdAt) > weekAgo;
            }).length}
          </p>
        </GlassContainer>
        <GlassContainer className="p-4" border>
          <p className="text-white/60 text-sm mb-1">Categories</p>
          <p className="text-2xl font-bold text-white">
            {new Set(recentArtifacts.map(a => a.metadata?.category).filter(Boolean)).size}
          </p>
        </GlassContainer>
      </motion.div>

      {/* Pinned Artifacts Dock */}
      {pinnedArtifactIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Pinned Artifacts</h2>
          <GlassArtifactDock />
        </motion.div>
      )}

      {/* Main Explorer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassArtifactExplorer isOpen={true} onClose={() => {}} className="relative h-[calc(100vh-400px)] min-h-[500px]" />
      </motion.div>
    </div>
  );
}

export default ArtifactsPage;
