/**
 * useResourcesForTarget Hook
 *
 * Fetches and subscribes to resources for a given target (ownerType + ownerId).
 * Optionally filters by resource type.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useResourceStore, type AIResource, type OwnerType, type ResourceType } from '@/stores/resourceStore';

const EMPTY_ARRAY: AIResource[] = [];

interface UseResourcesForTargetOptions {
  type?: ResourceType;
  autoFetch?: boolean;
}

interface UseResourcesForTargetResult {
  resources: AIResource[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches resources for a target, with optional type filtering.
 * Caches results in the store's targetCache.
 */
export function useResourcesForTarget(
  ownerType: OwnerType,
  ownerId: string,
  options: UseResourcesForTargetOptions = {}
): UseResourcesForTargetResult {
  const { type, autoFetch = true } = options;

  const cached = useResourceStore((s) => s.targetCache[`${ownerType}:${ownerId}`] ?? EMPTY_ARRAY);
  const isLoading = useResourceStore((s) => s.isLoading);
  const error = useResourceStore((s) => s.error);

  // Use ref to avoid re-triggering effects when store actions change reference
  const fetchedRef = useRef(false);
  const paramsRef = useRef({ ownerType, ownerId, type });
  paramsRef.current = { ownerType, ownerId, type };

  const refetch = useMemo(() => async () => {
    const { ownerType: ot, ownerId: oi, type: t } = paramsRef.current;
    if (oi) {
      await useResourceStore.getState().fetchByTarget(ot, oi, t);
    }
  }, []);

  useEffect(() => {
    // Reset fetched flag when params change
    fetchedRef.current = false;
  }, [ownerType, ownerId, type]);

  useEffect(() => {
    if (autoFetch && ownerId && !fetchedRef.current) {
      fetchedRef.current = true;
      refetch();
    }
  }, [autoFetch, ownerId, ownerType, type, refetch]);

  // Apply type filter client-side — memoize to keep stable reference
  const resources = useMemo(() => {
    if (!type) return cached;
    if (cached === EMPTY_ARRAY) return EMPTY_ARRAY;
    const filtered = cached.filter((r) => r.resourceType === type);
    return filtered.length === 0 ? EMPTY_ARRAY : filtered;
  }, [cached, type]);

  return { resources, isLoading, error, refetch };
}
