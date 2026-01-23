/**
 * useFinderNavigation - Core navigation hook for the Finder app
 *
 * Handles directory fetching, history (back/forward), search,
 * sorting, and view mode state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileEntry, DirectoryListing, QuickAccessLocation, ViewMode, SortColumn, SortDirection } from './types';

const API_BASE = '/api/system/files';

interface UseFinderNavigationOptions {
  initialPath?: string;
}

export function useFinderNavigation(options: UseFinderNavigationOptions = {}) {
  const [currentPath, setCurrentPath] = useState(options.initialPath || '');
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showHidden, setShowHidden] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
  const [projectRoot, setProjectRoot] = useState('');
  const [quickAccess, setQuickAccess] = useState<QuickAccessLocation[]>([]);

  // Navigation history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isNavigatingRef = useRef(false);

  // Search debounce
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Fetch quick-access locations on mount to discover project root
  useEffect(() => {
    async function fetchQuickAccess() {
      try {
        const res = await fetch(`${API_BASE}/quick-access`);
        if (res.ok) {
          const json = await res.json();
          // API wraps response in { success, data }
          const locations: QuickAccessLocation[] = json.data || json.locations || [];
          setQuickAccess(locations);
          // Find "Current Directory" which is the server CWD
          // Derive project root by going up from server dir if needed
          const currentDir = locations.find(
            (loc: QuickAccessLocation) => loc.name === 'Current Directory'
          );
          let root = currentDir?.path || '';
          // If CWD is a subdirectory like /server, go up to project root
          if (root.endsWith('/server')) {
            root = root.replace(/\/server$/, '');
          }
          if (root) {
            setProjectRoot(root);
            if (!options.initialPath) {
              navigateTo(root);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch quick-access:', err);
      }
    }
    fetchQuickAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ path, showHidden: String(showHidden) });
      const res = await fetch(`${API_BASE}?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load directory (${res.status})`);
      }
      const json = await res.json();
      // API wraps response in { success, data }
      const data: DirectoryListing = json.data || json;
      setListing(data);
      setCurrentPath(data.path);
      setSearchQuery('');
      setSearchResults(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory');
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [showHidden]);

  const navigateTo = useCallback((path: string) => {
    if (isNavigatingRef.current) {
      // Just fetch, don't push to history (back/forward navigation)
      isNavigatingRef.current = false;
      fetchDirectory(path);
      return;
    }
    // Push to history
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(path);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
    fetchDirectory(path);
  }, [fetchDirectory, historyIndex]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    isNavigatingRef.current = true;
    navigateTo(history[newIndex]);
  }, [canGoBack, historyIndex, history, navigateTo]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    isNavigatingRef.current = true;
    navigateTo(history[newIndex]);
  }, [canGoForward, historyIndex, history, navigateTo]);

  const refresh = useCallback(() => {
    if (currentPath) {
      fetchDirectory(currentPath);
    }
  }, [currentPath, fetchDirectory]);

  // Re-fetch when showHidden changes
  useEffect(() => {
    if (currentPath) {
      fetchDirectory(currentPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          basePath: currentPath || projectRoot,
          q: searchQuery.trim(),
          limit: '50',
        });
        const res = await fetch(`${API_BASE}/search?${params}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          setSearchResults(data.results || data || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentPath, projectRoot]);

  // Sort entries
  const sortedEntries = (() => {
    const entries = searchResults || listing?.entries || [];
    return [...entries].sort((a, b) => {
      // Directories first
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let cmp = 0;
      switch (sortColumn) {
        case 'name':
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'modified':
          cmp = (a.modifiedAt || '').localeCompare(b.modifiedAt || '');
          break;
        case 'size':
          cmp = (a.size || 0) - (b.size || 0);
          break;
        case 'kind': {
          const extA = a.name.includes('.') ? a.name.split('.').pop() || '' : '';
          const extB = b.name.includes('.') ? b.name.split('.').pop() || '' : '';
          cmp = extA.localeCompare(extB);
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  })();

  const toggleSortColumn = useCallback((col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  return {
    currentPath,
    listing,
    loading,
    error,
    viewMode,
    showHidden,
    sortColumn,
    sortDirection,
    searchQuery,
    searchResults,
    canGoBack,
    canGoForward,
    projectRoot,
    quickAccess,
    sortedEntries,

    navigateTo,
    goBack,
    goForward,
    refresh,
    setViewMode,
    setShowHidden,
    toggleSortColumn,
    setSearchQuery,
  };
}
