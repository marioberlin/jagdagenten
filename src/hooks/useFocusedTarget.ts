/**
 * useFocusedTarget Hook
 *
 * Resolves the currently focused window/app into a resource target
 * (ownerType + ownerId). Used by menus and panels to show resources
 * for the currently active application or agent.
 */

import { useMemo } from 'react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import type { OwnerType } from '@/stores/resourceStore';

export interface FocusedTarget {
  ownerType: OwnerType;
  ownerId: string;
  name: string;
}

/**
 * Returns the currently focused target for resource queries.
 * Falls back to 'system' / 'global' when no app is active.
 */
export function useFocusedTarget(): FocusedTarget {
  const activeAppId = useAppStoreStore((s) => s.activeAppId);
  const installedApps = useAppStoreStore((s) => s.installedApps);

  return useMemo(() => {
    if (!activeAppId) {
      return { ownerType: 'system' as OwnerType, ownerId: 'global', name: 'System' };
    }

    const app = installedApps[activeAppId];

    // Check if this app has an associated agent
    const isAgent = app?.manifest?.category === 'agent' ||
                    activeAppId.includes('agent');

    return {
      ownerType: (isAgent ? 'agent' : 'app') as OwnerType,
      ownerId: activeAppId,
      name: app?.manifest?.name || activeAppId,
    };
  }, [activeAppId, installedApps]);
}
