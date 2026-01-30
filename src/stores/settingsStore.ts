/**
 * Unified Settings Store
 * 
 * Consolidates settings from AgentConfigContext into Zustand for:
 * - Single source of truth
 * - Better DevTools integration
 * - Automatic persistence
 * - Simpler component access
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type RuntimeMode = 'demo' | 'production';
export type ContextStrategyType = 'flat' | 'layered';
export type NLWebMode = 'standard' | 'nlweb' | 'a2a';
export type LLMProvider = 'gemini' | 'claude' | 'proxy';

export interface FileSearchConfig {
    enabled: boolean;
    stores: string[];
}

export interface PageConfig {
    systemPrompt: string;
    knowledge: string[];
    fileSearch?: FileSearchConfig;
}

export interface SettingsState {
    // Runtime & Mode Settings
    runtimeMode: RuntimeMode;
    contextStrategy: ContextStrategyType;
    nlwebMode: NLWebMode;
    llmProvider: LLMProvider;

    // API Keys (only used in demo mode)
    claudeApiKey: string;

    // Security
    securityBlacklist: string[];

    // Per-page Agent Config
    pageConfigs: Record<string, PageConfig>;

    // Hunt Mode
    huntModeEnabled: boolean;
    huntModeAutoActivate: boolean;

    // Hydration flag
    _hydrated: boolean;
}

export interface SettingsActions {
    // Mode setters
    setRuntimeMode: (mode: RuntimeMode) => void;
    setContextStrategy: (strategy: ContextStrategyType) => void;
    setNLWebMode: (mode: NLWebMode) => void;
    setLLMProvider: (provider: LLMProvider) => void;

    // API Key management
    setClaudeApiKey: (key: string) => void;

    // Security
    setSecurityBlacklist: (items: string[]) => void;
    addToBlacklist: (item: string) => void;
    removeFromBlacklist: (item: string) => void;

    // Page config
    getPageConfig: (path: string) => PageConfig;
    setPageConfig: (path: string, config: Partial<PageConfig>) => void;
    clearPageConfig: (path: string) => void;

    // Hunt Mode
    setHuntMode: (enabled: boolean) => void;
    setHuntModeAutoActivate: (enabled: boolean) => void;

    // Reset
    resetToDefaults: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PAGE_CONFIG: PageConfig = {
    systemPrompt: '',
    knowledge: [],
};

const DEFAULT_STATE: SettingsState = {
    runtimeMode: 'production',
    contextStrategy: 'flat',
    nlwebMode: 'standard',
    llmProvider: 'gemini',
    claudeApiKey: '',
    securityBlacklist: [],
    pageConfigs: {},
    huntModeEnabled: false,
    huntModeAutoActivate: false,
    _hydrated: false,
};

// ============================================================================
// Store
// ============================================================================

export const useSettingsStore = create<SettingsStore>()(
    devtools(
        persist(
            immer((set, get) => ({
                // Initial State
                ...DEFAULT_STATE,

                // Mode Setters
                setRuntimeMode: (mode) => {
                    set((state) => {
                        state.runtimeMode = mode;
                    });
                },

                setContextStrategy: (strategy) => {
                    set((state) => {
                        state.contextStrategy = strategy;
                    });
                },

                setNLWebMode: (mode) => {
                    set((state) => {
                        state.nlwebMode = mode;
                    });
                },

                setLLMProvider: (provider) => {
                    set((state) => {
                        state.llmProvider = provider;
                    });
                },

                // API Key Management
                setClaudeApiKey: (key) => {
                    set((state) => {
                        state.claudeApiKey = key;
                    });
                },

                // Security
                setSecurityBlacklist: (items) => {
                    set((state) => {
                        state.securityBlacklist = items;
                    });
                },

                addToBlacklist: (item) => {
                    set((state) => {
                        if (!state.securityBlacklist.includes(item)) {
                            state.securityBlacklist.push(item);
                        }
                    });
                },

                removeFromBlacklist: (item) => {
                    set((state) => {
                        state.securityBlacklist = state.securityBlacklist.filter(
                            (i) => i !== item
                        );
                    });
                },

                // Page Config
                getPageConfig: (path) => {
                    const state = get();
                    return state.pageConfigs[path] || DEFAULT_PAGE_CONFIG;
                },

                setPageConfig: (path, config) => {
                    set((state) => {
                        state.pageConfigs[path] = {
                            ...DEFAULT_PAGE_CONFIG,
                            ...state.pageConfigs[path],
                            ...config,
                        };
                    });
                },

                clearPageConfig: (path) => {
                    set((state) => {
                        delete state.pageConfigs[path];
                    });
                },

                // Hunt Mode
                setHuntMode: (enabled) => {
                    set((state) => {
                        state.huntModeEnabled = enabled;
                    });
                    // Apply to DOM immediately
                    if (typeof document !== 'undefined') {
                        document.body.setAttribute('data-hunt-mode', enabled.toString());
                    }
                },

                setHuntModeAutoActivate: (enabled) => {
                    set((state) => {
                        state.huntModeAutoActivate = enabled;
                    });
                },

                // Reset
                resetToDefaults: () => {
                    set(() => DEFAULT_STATE);
                },
            })),
            {
                name: 'liquid-settings-store',
                version: 1,
                partialize: (state) => ({
                    runtimeMode: state.runtimeMode,
                    contextStrategy: state.contextStrategy,
                    nlwebMode: state.nlwebMode,
                    llmProvider: state.llmProvider,
                    claudeApiKey: state.claudeApiKey,
                    securityBlacklist: state.securityBlacklist,
                    pageConfigs: state.pageConfigs,
                    huntModeEnabled: state.huntModeEnabled,
                    huntModeAutoActivate: state.huntModeAutoActivate,
                }),
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        state._hydrated = true;
                    }
                },
            }
        ),
        { name: 'SettingsStore', enabled: process.env.NODE_ENV === 'development' }
    )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Check if we're in production mode (using proxy)
 */
export const selectIsProduction = (state: SettingsStore) =>
    state.runtimeMode === 'production';

/**
 * Check if Claude is the active provider
 */
export const selectIsClaudeActive = (state: SettingsStore) =>
    state.llmProvider === 'claude';

/**
 * Get active API key based on provider (only in demo mode)
 */
export const selectActiveApiKey = (state: SettingsStore) => {
    if (state.runtimeMode === 'production') {
        return null; // Proxy handles auth
    }
    if (state.llmProvider === 'claude') {
        return state.claudeApiKey;
    }
    return null; // Gemini uses env var
};

// ============================================================================
// Migration Helper
// ============================================================================

/**
 * Migrate from old localStorage keys to new store
 * Call this once on app startup
 */
export function migrateFromLegacyStorage() {
    const store = useSettingsStore.getState();
    if (store._hydrated) return; // Already migrated via persist

    const legacyKeys = {
        runtime: 'liquid_glass_runtime_mode',
        strategy: 'liquid_glass_context_strategy',
        nlweb: 'liquid_glass_nlweb_mode',
        provider: 'liquid_glass_llm_provider',
        claude: 'liquid_glass_claude_api_key',
        blacklist: 'liquid_glass_security_blacklist',
    };

    try {
        const runtime = localStorage.getItem(legacyKeys.runtime) as RuntimeMode;
        if (runtime) store.setRuntimeMode(runtime);

        const strategy = localStorage.getItem(legacyKeys.strategy) as ContextStrategyType;
        if (strategy) store.setContextStrategy(strategy);

        const nlweb = localStorage.getItem(legacyKeys.nlweb) as NLWebMode;
        if (nlweb) store.setNLWebMode(nlweb);

        const provider = localStorage.getItem(legacyKeys.provider) as LLMProvider;
        if (provider) store.setLLMProvider(provider);

        const claude = localStorage.getItem(legacyKeys.claude);
        if (claude) store.setClaudeApiKey(claude);

        const blacklist = localStorage.getItem(legacyKeys.blacklist);
        if (blacklist) {
            try {
                store.setSecurityBlacklist(JSON.parse(blacklist));
            } catch {
                // Invalid JSON, ignore
            }
        }

        // Clean up legacy keys after migration
        Object.values(legacyKeys).forEach((key) => {
            localStorage.removeItem(key);
        });

        console.log('[SettingsStore] Migrated from legacy localStorage');
    } catch (e) {
        console.warn('[SettingsStore] Migration failed:', e);
    }
}
