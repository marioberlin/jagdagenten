/**
 * Icon Resolver
 *
 * Resolves icon names from app manifests to Lucide React components.
 */

import * as LucideIcons from 'lucide-react';

/**
 * Resolve a Lucide icon name to its component.
 * Falls back to a generic icon if not found.
 */
export function resolveIconComponent(iconName: string): React.ElementType | null {
  if (!iconName) return null;

  // Try exact match first
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
