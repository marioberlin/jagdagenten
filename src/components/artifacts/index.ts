/**
 * Artifact Components Index
 *
 * Exports all artifact management UI components.
 */

// Main components
export { GlassArtifactCard, type GlassArtifactCardProps, type ArtifactCardSize } from './GlassArtifactCard';
export { GlassArtifactDock, type GlassArtifactDockProps } from './GlassArtifactDock';
export { GlassArtifactQuickLook, type GlassArtifactQuickLookProps } from './GlassArtifactQuickLook';
export { GlassArtifactExplorer, type GlassArtifactExplorerProps } from './GlassArtifactExplorer';

// Re-export store and types for convenience
export {
  useArtifactStore,
  type StoredArtifact,
  type ArtifactPart,
  type ArtifactSearchResult,
  type ArtifactCategory,
  type ViewMode,
  type ArtifactStore,
  ARTIFACT_CATEGORIES,
  getArtifactIcon,
  getArtifactPreviewText,
  formatArtifactDate,
  selectPinnedArtifacts,
  selectUnpinnedRecentArtifacts,
  selectFilteredArtifacts,
} from '../../stores/artifactStore';
