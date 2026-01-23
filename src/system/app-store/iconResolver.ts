/**
 * Icon Resolver (System-level)
 *
 * Resolves icon names from app manifests to Lucide React components.
 * Used by the dock and other system-level UI components.
 */

import * as LucideIcons from 'lucide-react';
import type { ElementType } from 'react';

/**
 * Resolve a Lucide icon name to its component.
 * Falls back to a generic Package icon if not found.
 */
export function resolveIconComponent(iconName: string): ElementType | null {
  if (!iconName) return null;

  // Try exact match first (e.g., "Settings", "TrendingUp")
  const icon = (LucideIcons as any)[iconName];
  if (icon) return icon;

  // Try PascalCase conversion (e.g., "trending-up" -> "TrendingUp")
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const pascalIcon = (LucideIcons as any)[pascalCase];
  if (pascalIcon) return pascalIcon;

  // Fallback to Package icon
  return (LucideIcons as any).Package ?? null;
}
