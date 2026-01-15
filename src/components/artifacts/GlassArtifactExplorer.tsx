/**
 * GlassArtifactExplorer
 *
 * Full-page artifact browser with search, filters, and categories.
 * Features:
 * - Grid/List view toggle
 * - Category filtering
 * - Full-text search
 * - Sort by date, name, type
 * - Batch operations (delete, export)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  Trash2,
  X,
  FolderOpen,
  Clock,
  Type,
  Package,
  Loader2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassArtifactCard } from './GlassArtifactCard';
import { GlassArtifactQuickLook } from './GlassArtifactQuickLook';
import {
  type StoredArtifact,
  type ArtifactCategory,
  useArtifactStore,
  ARTIFACT_CATEGORIES,
} from '../../stores/artifactStore';

// ============================================================================
// Types
// ============================================================================

export interface GlassArtifactExplorerProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'createdAt' | 'name' | 'category';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// Category Badge
// ============================================================================

function CategoryBadge({
  category,
  isSelected,
  onClick,
}: {
  category: { id: string; label: string; icon: string; color: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        text-sm whitespace-nowrap
        transition-all duration-200
        ${
          isSelected
            ? `${category.color} text-white shadow-lg scale-105`
            : 'bg-white/5 text-white/70 hover:bg-white/10'
        }
      `}
    >
      <span>{category.icon}</span>
      <span>{category.label}</span>
    </button>
  );
}

// ============================================================================
// Sort Dropdown
// ============================================================================

function SortDropdown({
  value,
  direction,
  onChange,
}: {
  value: SortField;
  direction: SortDirection;
  onChange: (field: SortField, direction: SortDirection) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const options: { field: SortField; label: string; icon: React.ReactNode }[] = [
    { field: 'createdAt', label: 'Date', icon: <Clock size={14} /> },
    { field: 'name', label: 'Name', icon: <Type size={14} /> },
    { field: 'category', label: 'Category', icon: <FolderOpen size={14} /> },
  ];

  const currentOption = options.find((o) => o.field === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
      >
        {currentOption?.icon}
        <span className="text-sm text-white/80">{currentOption?.label}</span>
        {direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 z-50"
          >
            <GlassContainer className="p-1 min-w-[150px]" border>
              {options.map((option) => (
                <button
                  key={option.field}
                  onClick={() => {
                    if (option.field === value) {
                      onChange(value, direction === 'asc' ? 'desc' : 'asc');
                    } else {
                      onChange(option.field, 'desc');
                    }
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm
                    transition-colors
                    ${option.field === value ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}
                  `}
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {option.field === value && (
                    <span className="ml-auto">
                      {direction === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
                    </span>
                  )}
                </button>
              ))}
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function GlassArtifactExplorer({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  className = '',
}: GlassArtifactExplorerProps) {
  const {
    artifacts,
    recentArtifacts,
    isLoading,
    isExplorerOpen,
    closeExplorer,
    searchQuery,
    setSearchQuery,
    searchArtifacts,
    fetchRecentArtifacts,
    viewMode: storeViewMode,
    setViewMode: storeSetViewMode,
    deleteArtifact,
  } = useArtifactStore();

  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen ?? isExplorerOpen;
  const handleClose = controlledOnClose ?? closeExplorer;

  // Local state
  const [localViewMode, setLocalViewMode] = useState<ViewMode>('grid');
  const [selectedCategories, setSelectedCategories] = useState<Set<ArtifactCategory>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedArtifacts, setSelectedArtifacts] = useState<Set<string>>(new Set());

  const viewMode = storeViewMode ?? localViewMode;
  const setViewMode = storeSetViewMode ?? setLocalViewMode;

  // Fetch artifacts on mount
  useEffect(() => {
    if (isOpen) {
      fetchRecentArtifacts(100);
    }
  }, [isOpen, fetchRecentArtifacts]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
      // Cmd+A to select all
      if (e.metaKey && e.key === 'a') {
        e.preventDefault();
        if (selectedArtifacts.size === filteredArtifacts.length) {
          setSelectedArtifacts(new Set());
        } else {
          setSelectedArtifacts(new Set(filteredArtifacts.map((a) => a.id)));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, selectedArtifacts.size]);

  // Filter and sort artifacts
  const filteredArtifacts = useMemo(() => {
    let result = [...(searchQuery ? artifacts : recentArtifacts)];

    // Filter by category
    if (selectedCategories.size > 0) {
      result = result.filter((a) => {
        const category = a.metadata?.category as ArtifactCategory | undefined;
        return category && selectedCategories.has(category);
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'category':
          const catA = (a.metadata?.category as string) || '';
          const catB = (b.metadata?.category as string) || '';
          comparison = catA.localeCompare(catB);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [artifacts, recentArtifacts, searchQuery, selectedCategories, sortField, sortDirection]);

  const handleCategoryToggle = useCallback((category: ArtifactCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSortChange = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const handleSelectArtifact = useCallback((artifact: StoredArtifact, selected: boolean) => {
    setSelectedArtifacts((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(artifact.id);
      } else {
        next.delete(artifact.id);
      }
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedArtifacts.size === 0) return;
    if (!confirm(`Delete ${selectedArtifacts.size} artifact(s)?`)) return;

    for (const id of selectedArtifacts) {
      await deleteArtifact(id);
    }
    setSelectedArtifacts(new Set());
  }, [selectedArtifacts, deleteArtifact]);

  const handleBatchExport = useCallback(() => {
    if (selectedArtifacts.size === 0) return;

    const toExport = filteredArtifacts.filter((a) => selectedArtifacts.has(a.id));
    const blob = new Blob([JSON.stringify(toExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifacts-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedArtifacts, filteredArtifacts]);

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

          {/* Explorer Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              fixed inset-y-0 right-0 w-full max-w-4xl z-[101]
              ${className}
            `}
          >
            <GlassContainer className="w-full h-full flex flex-col" border>
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Artifact Explorer</h2>
                    <span className="bg-white/10 text-white/60 text-sm px-2 py-0.5 rounded">
                      {filteredArtifacts.length} items
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X size={20} className="text-white/70" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    placeholder="Search artifacts..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="
                      w-full bg-white/5 border border-white/10 rounded-lg
                      pl-10 pr-4 py-2.5
                      text-white placeholder-white/40
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50
                    "
                  />
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <Filter size={16} className="text-white/40 flex-shrink-0" />
                  {ARTIFACT_CATEGORIES.map((cat) => (
                    <CategoryBadge
                      key={cat.id}
                      category={cat}
                      isSelected={selectedCategories.has(cat.id as ArtifactCategory)}
                      onClick={() => handleCategoryToggle(cat.id as ArtifactCategory)}
                    />
                  ))}
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white/5 rounded-md p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`
                        p-1.5 rounded transition-colors
                        ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/60'}
                      `}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`
                        p-1.5 rounded transition-colors
                        ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/60'}
                      `}
                    >
                      <List size={16} />
                    </button>
                  </div>

                  {/* Sort */}
                  <SortDropdown
                    value={sortField}
                    direction={sortDirection}
                    onChange={handleSortChange}
                  />
                </div>

                {/* Batch Actions */}
                {selectedArtifacts.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">
                      {selectedArtifacts.size} selected
                    </span>
                    <button
                      onClick={handleBatchExport}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-sm"
                    >
                      <Download size={14} />
                      Export
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                  </div>
                ) : filteredArtifacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-white/40">
                    <Package className="w-12 h-12 mb-4" />
                    <p className="text-lg">No artifacts found</p>
                    <p className="text-sm">
                      {searchQuery ? 'Try a different search query' : 'Artifacts will appear here'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredArtifacts.map((artifact) => (
                      <div key={artifact.id} className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectArtifact(artifact, !selectedArtifacts.has(artifact.id));
                          }}
                          className={`
                            absolute top-2 left-2 z-10 w-5 h-5 rounded border
                            transition-colors
                            ${
                              selectedArtifacts.has(artifact.id)
                                ? 'bg-purple-500 border-purple-500'
                                : 'bg-white/5 border-white/20 hover:border-white/40'
                            }
                          `}
                        >
                          {selectedArtifacts.has(artifact.id) && (
                            <Check size={14} className="text-white" />
                          )}
                        </button>
                        <GlassArtifactCard
                          artifact={artifact}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <button
                          onClick={() => handleSelectArtifact(artifact, !selectedArtifacts.has(artifact.id))}
                          className={`
                            w-5 h-5 rounded border flex-shrink-0
                            transition-colors
                            ${
                              selectedArtifacts.has(artifact.id)
                                ? 'bg-purple-500 border-purple-500'
                                : 'bg-white/5 border-white/20 hover:border-white/40'
                            }
                          `}
                        >
                          {selectedArtifacts.has(artifact.id) && (
                            <Check size={14} className="text-white" />
                          )}
                        </button>
                        <GlassArtifactCard
                          artifact={artifact}
                          size="sm"
                          showMetadata={false}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {artifact.name || artifact.artifactId}
                          </p>
                          <p className="text-white/60 text-sm truncate">
                            {artifact.description || 'No description'}
                          </p>
                        </div>
                        <span className="text-white/40 text-sm whitespace-nowrap">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassContainer>
          </motion.div>

          {/* QuickLook overlay */}
          <GlassArtifactQuickLook />
        </>
      )}
    </AnimatePresence>
  );
}

export default GlassArtifactExplorer;
