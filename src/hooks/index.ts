// ============================================
// Primary Hooks (Recommended)
// ============================================

// Theme & Appearance - main hook for all theme settings
export * from './useTheme';

// Glass Settings - focused glass material access
export * from './useGlass';

// Glass Animation - standardized animation props
export * from './useGlassAnimation';

// Glass Context Preferences - reduced motion, GPU tier
export * from './useGlassPreferences';

// ============================================
// Feature Hooks
// ============================================
export * from './useAtmosphere';
export * from './useFullscreen';
export * from './useScrollOptimization';
export * from './usePerformance';
export * from './useHaptics';
export * from './useFocusTrap';
export * from './useContrastDetection';
export * from './useAdaptiveText';
export * from './useShowCode';

// ============================================
// Service Hooks
// ============================================
export * from './useA2AClient';
export * from './useBinanceStream';
export * from './useServiceHealth';
export * from './useGoogleAuth';
export * from './useGoogleDrive';

// ============================================
// Console/Admin Hooks
// ============================================
export * from './useAdminWebSocket';
export * from './useCoworkWebSocket';
export * from './useConsoleContexts';
export * from './useConsoleSecurity';
export * from './useConsoleTasks';

// ============================================
// Deprecated - Will be removed in v2.0
// Use useTheme() or useGlass() instead
// ============================================
export * from './useAppearance';        // @deprecated
export * from './useGlassIntensity';    // @deprecated
export * from './useUnifiedTheme';      // @deprecated
