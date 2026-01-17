import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { liquidClient } from '../services/liquid';
import { vaultService, VaultFillPack, FormField, FormSuggestion } from '../services/vaultService';
import { SensitivityTier } from '../types/vaultTypes';

export interface FileSearchConfig {
    enabled: boolean;
    stores: string[]; // List of store names to search
}

export interface PageConfig {
    systemPrompt: string;
    knowledge: string[];
    fileSearch?: FileSearchConfig;
}

export type AgentConfig = Record<string, PageConfig>;
export type RuntimeMode = 'demo' | 'production';
export type ContextStrategyType = 'flat' | 'tree';
export type NLWebMode = 'standard' | 'secure';
export type LLMProvider = 'gemini' | 'claude' | 'proxy';

interface AgentConfigContextType {
    config: AgentConfig;
    contextStrategy: ContextStrategyType;
    runtimeMode: RuntimeMode;
    nlwebMode: NLWebMode;
    llmProvider: LLMProvider;
    claudeApiKey: string;
    securityBlacklist: string[];
    setContextStrategy: (strategy: ContextStrategyType) => void;
    setRuntimeMode: (mode: RuntimeMode) => void;
    setNLWebMode: (mode: NLWebMode) => void;
    setLLMProvider: (provider: LLMProvider) => void;
    setClaudeApiKey: (key: string) => void;
    setSecurityBlacklist: (blacklist: string[]) => void;
    updatePageConfig: (route: string, updates: Partial<PageConfig>) => void;
    getConfigForRoute: (route: string) => PageConfig;
    // Vault context methods for AI agents
    getVaultContext: (domain?: string, maxTier?: SensitivityTier) => VaultFillPack[];
    getVaultSuggestions: (formFields: FormField[], entityId?: string) => FormSuggestion[];
    requestVaultUnlock: (compartment: 'banking' | 'documents', reason?: string) => Promise<boolean>;
    isVaultCompartmentUnlocked: (compartment: 'banking' | 'documents') => boolean;
}

const AgentConfigContext = createContext<AgentConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'liquid_glass_agent_config';
const STRATEGY_KEY = 'liquid_glass_context_strategy';
const RUNTIME_KEY = 'liquid_glass_runtime_mode';
const NLWEB_KEY = 'liquid_glass_nlweb_mode';
const PROVIDER_KEY = 'liquid_glass_llm_provider';
const CLAUDE_KEY = 'liquid_glass_claude_api_key';
const BLACKLIST_KEY = 'liquid_glass_security_blacklist';

const DEFAULT_CONFIG: PageConfig = {
    systemPrompt: '',
    knowledge: []
};

export const AgentConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AgentConfig>({});
    const [contextStrategy, setStrategyState] = useState<ContextStrategyType>('flat');
    const [runtimeMode, setRuntimeModeState] = useState<RuntimeMode>('production');
    const [nlwebMode, setNLWebModeState] = useState<NLWebMode>('standard');
    const [llmProvider, setLLMProviderState] = useState<LLMProvider>('gemini');
    const [claudeApiKey, setClaudeApiKeyState] = useState<string>('');
    const [securityBlacklist, setSecurityBlacklistState] = useState<string[]>([]);
    const location = useLocation();

    // Load generic config from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setConfig(JSON.parse(stored));
            }

            const storedStrategy = localStorage.getItem(STRATEGY_KEY) as ContextStrategyType;
            if (storedStrategy) {
                setStrategyState(storedStrategy);
                liquidClient.setContextStrategy(storedStrategy);
            }

            const storedRuntime = localStorage.getItem(RUNTIME_KEY) as RuntimeMode;
            if (storedRuntime) {
                setRuntimeModeState(storedRuntime);
            }

            const storedNLWeb = localStorage.getItem(NLWEB_KEY) as NLWebMode;
            if (storedNLWeb) {
                setNLWebModeState(storedNLWeb);
            }

            const storedProvider = localStorage.getItem(PROVIDER_KEY) as LLMProvider;
            if (storedProvider) {
                setLLMProviderState(storedProvider);
            }

            const storedClaudeKey = localStorage.getItem(CLAUDE_KEY);
            if (storedClaudeKey) {
                setClaudeApiKeyState(storedClaudeKey);
            }

            const storedBlacklist = localStorage.getItem(BLACKLIST_KEY);
            if (storedBlacklist) {
                setSecurityBlacklistState(JSON.parse(storedBlacklist));
            }
        } catch (e) {
            console.error('Failed to load agent config', e);
        }
    }, []);

    // Save generic config to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }, [config]);

    // Handle Strategy Changes
    const setContextStrategy = React.useCallback((strategy: ContextStrategyType) => {
        setStrategyState(strategy);
        localStorage.setItem(STRATEGY_KEY, strategy);
        liquidClient.setContextStrategy(strategy);
    }, []);

    // Handle Runtime Mode Changes
    const setRuntimeMode = React.useCallback((mode: RuntimeMode) => {
        setRuntimeModeState(mode);
        localStorage.setItem(RUNTIME_KEY, mode);
    }, []);

    // Handle NLWeb Mode Changes
    const setNLWebMode = React.useCallback((mode: NLWebMode) => {
        setNLWebModeState(mode);
        localStorage.setItem(NLWEB_KEY, mode);
    }, []);

    // Handle LLM Provider Changes
    const setLLMProvider = React.useCallback((provider: LLMProvider) => {
        setLLMProviderState(provider);
        localStorage.setItem(PROVIDER_KEY, provider);
    }, []);

    // Handle Claude API Key Changes
    const setClaudeApiKey = React.useCallback((key: string) => {
        setClaudeApiKeyState(key);
        localStorage.setItem(CLAUDE_KEY, key);
    }, []);

    // Handle Security Blacklist Changes
    const setSecurityBlacklist = React.useCallback((blacklist: string[]) => {
        setSecurityBlacklistState(blacklist);
        localStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
    }, []);

    // Track Focus (Route) Changes
    useEffect(() => {
        // Inform the liquid client of the current focus (route)
        // This enables the "Tree" strategy to prune irrelevant contexts
        liquidClient.setFocus(location.pathname);
        console.log(`[AgentConfig] Focus set to: ${location.pathname}`);
    }, [location.pathname]);

    const updatePageConfig = React.useCallback((route: string, updates: Partial<PageConfig>) => {
        setConfig(prev => {
            const current = prev[route] || { ...DEFAULT_CONFIG };
            return {
                ...prev,
                [route]: { ...current, ...updates }
            };
        });
    }, []);

    const getConfigForRoute = React.useCallback((route: string): PageConfig => {
        return config[route] || { ...DEFAULT_CONFIG };
    }, [config]);

    // Vault context methods
    const getVaultContext = useCallback((domain?: string, maxTier: SensitivityTier = 3): VaultFillPack[] => {
        return vaultService.getContextForAgent(domain, maxTier);
    }, []);

    const getVaultSuggestions = useCallback((formFields: FormField[], entityId?: string): FormSuggestion[] => {
        return vaultService.getSuggestionsForForm(formFields, entityId);
    }, []);

    const requestVaultUnlock = useCallback(async (compartment: 'banking' | 'documents', reason?: string): Promise<boolean> => {
        return vaultService.requestUnlock(compartment, reason);
    }, []);

    const isVaultCompartmentUnlocked = useCallback((compartment: 'banking' | 'documents'): boolean => {
        return vaultService.isCompartmentUnlocked(compartment);
    }, []);

    const contextValue = React.useMemo(() => ({
        config,
        contextStrategy,
        runtimeMode,
        nlwebMode,
        llmProvider,
        claudeApiKey,
        securityBlacklist,
        setContextStrategy,
        setRuntimeMode,
        setNLWebMode,
        setLLMProvider,
        setClaudeApiKey,
        setSecurityBlacklist,
        updatePageConfig,
        getConfigForRoute,
        getVaultContext,
        getVaultSuggestions,
        requestVaultUnlock,
        isVaultCompartmentUnlocked,
    }), [config, contextStrategy, runtimeMode, nlwebMode, llmProvider, claudeApiKey, securityBlacklist, setContextStrategy, setRuntimeMode, setNLWebMode, setLLMProvider, setClaudeApiKey, setSecurityBlacklist, updatePageConfig, getConfigForRoute, getVaultContext, getVaultSuggestions, requestVaultUnlock, isVaultCompartmentUnlocked]);

    return (
        <AgentConfigContext.Provider value={contextValue}>
            {children}
        </AgentConfigContext.Provider>
    );
};

export const useAgentConfig = () => {
    const context = useContext(AgentConfigContext);
    if (!context) {
        throw new Error('useAgentConfig must be used within an AgentConfigProvider');
    }
    return context;
};

