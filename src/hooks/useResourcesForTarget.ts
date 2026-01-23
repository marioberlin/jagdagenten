/**
 * useResourcesForTarget Hook
 *
 * Fetches and subscribes to resources for a given target (ownerType + ownerId).
 * Optionally filters by resource type.
 */

import { useEffect, useCallback } from 'react';
import { useResourceStore, type AIResource, type OwnerType, type ResourceType } from '@/stores/resourceStore';

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

  const fetchByTarget = useResourceStore((s) => s.fetchByTarget);
  const isLoading = useResourceStore((s) => s.isLoading);
  const error = useResourceStore((s) => s.error);
  const cached = useResourceStore((s) => s.targetCache[`${ownerType}:${ownerId}`] || []);

  const refetch = useCallback(async () => {
    if (ownerId) {
      await fetchByTarget(ownerType, ownerId, type);
    }
  }, [fetchByTarget, ownerType, ownerId, type]);

  useEffect(() => {
    if (autoFetch && ownerId) {
      refetch();
    }
  }, [autoFetch, ownerId, refetch]);

  // Apply type filter client-side if needed (for cases where cache has all types)
  const resources = type
    ? cached.filter((r) => r.resourceType === type)
    : cached;

  return { resources, isLoading, error, refetch };
}
