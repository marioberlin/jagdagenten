/**
 * Curated Agent Registry
 *
 * A local registry of verified A2A agents for the Agent Hub.
 * This provides the "App Store" experience for discovering agents.
 */

import React from 'react';
import {
    Utensils,
    Bitcoin,
    BarChart2,
    FileText,
    Banana,
    Plane,
    TrendingUp,
    ShoppingCart,
    BarChart,
    Lock,
    Palette,
    Zap,
    Code,
    MessageSquare,
} from 'lucide-react';

export interface CuratedAgent {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    url: string;
    version: string;
    icon: React.ElementType;  // Lucide Icon Component
    category: AgentCategory;
    tags: string[];
    featured: boolean;
    verified: boolean;
    rating: number;
    reviewCount: number;
    addedAt: string;
    provider: {
        name: string;
        url?: string;
        verified?: boolean;
    };
    capabilities: {
        streaming: boolean;
        a2ui: boolean;
        pushNotifications: boolean;
        fileUpload: boolean;
    };
    authentication: 'none' | 'api_key' | 'oauth' | 'bearer';
    screenshots?: string[];
    color?: string;  // Accent color for branding
}

export type AgentCategory =
    | 'finance'
    | 'commerce'
    | 'analytics'
    | 'security'
    | 'creative'
    | 'productivity'
    | 'developer'
    | 'communication';

export interface AgentCategoryInfo {
    id: AgentCategory;
    name: string;
    icon: React.ElementType;
    description: string;
    color: string;
}

export const AGENT_CATEGORIES: AgentCategoryInfo[] = [
    { id: 'finance', name: 'Finance', icon: TrendingUp, description: 'Trading, portfolio, and financial analysis', color: '#10B981' },
    { id: 'commerce', name: 'Commerce', icon: ShoppingCart, description: 'Shopping, booking, and transactions', color: '#F59E0B' },
    { id: 'analytics', name: 'Analytics', icon: BarChart, description: 'Data visualization and insights', color: '#6366F1' },
    { id: 'security', name: 'Security', icon: Lock, description: 'Authentication and protection', color: '#EF4444' },
    { id: 'creative', name: 'Creative', icon: Palette, description: 'Design, images, and content creation', color: '#EC4899' },
    { id: 'productivity', name: 'Productivity', icon: Zap, description: 'Tasks, notes, and workflows', color: '#8B5CF6' },
    { id: 'developer', name: 'Developer', icon: Code, description: 'Code, APIs, and technical tools', color: '#06B6D4' },
    { id: 'communication', name: 'Communication', icon: MessageSquare, description: 'Chat, email, and messaging', color: '#14B8A6' },
];

/**
 * Curated list of verified A2A agents
 * In production, this would come from a server API
 */
export const CURATED_AGENTS: CuratedAgent[] = [
    {
        id: 'restaurant-finder',
        name: 'Restaurant Finder',
        description: 'Discover and book restaurants near you with Google Places discovery and OpenTable reservations. Get personalized suggestions based on cuisine preferences, ratings, and availability. Seamlessly make reservations directly through the agent.',
        shortDescription: 'Find & book restaurants via Google Places + OpenTable',
        url: 'http://127.0.0.1:3000/agents/restaurant',
        version: '2.1.0',
        icon: Utensils,
        category: 'commerce',
        tags: ['food', 'booking', 'local', 'dining', 'opentable'],
        featured: true,
        verified: true,
        rating: 4.8,
        reviewCount: 2847,
        addedAt: '2025-12-15',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'none',
        color: '#F97316',
    },
    {
        id: 'crypto-advisor',
        name: 'Crypto Advisor',
        description: 'Real-time cryptocurrency market analysis powered by Binance API and Gemini AI. Get instant insights on market trends, technical analysis, trading signals, and personalized investment recommendations with live price data.',
        shortDescription: 'AI-powered crypto market analysis & signals',
        url: 'http://127.0.0.1:3000/agents/crypto-advisor',
        version: '2.0.0',
        icon: Bitcoin,
        category: 'finance',
        tags: ['crypto', 'trading', 'portfolio', 'signals', 'binance'],
        featured: true,
        verified: true,
        rating: 4.6,
        reviewCount: 5234,
        addedAt: '2025-11-20',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'none',
        color: '#F7931A',
    },
    {
        id: 'rizzcharts',
        name: 'RizzCharts Analytics',
        description: 'Transform your data into beautiful, interactive visualizations. Generate charts, dashboards, and reports from natural language queries. Supports live data connections and real-time updates.',
        shortDescription: 'Create stunning data visualizations with AI',
        url: 'http://127.0.0.1:3000/agents/rizzcharts',
        version: '1.5.0',
        icon: BarChart2,
        category: 'analytics',
        tags: ['charts', 'data', 'visualization', 'dashboards'],
        featured: true,
        verified: true,
        rating: 4.9,
        reviewCount: 3156,
        addedAt: '2025-10-08',
        provider: { name: 'RizzCharts Inc.', url: 'https://rizzcharts.com', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'none',
        color: '#6366F1',
    },
    {
        id: 'documind',
        name: 'DocuMind',
        description: 'Intelligent document analysis and knowledge extraction powered by Gemini AI. Upload documents and get instant summaries, key insights, entity extraction, and answers to your questions. Perfect for research and document review.',
        shortDescription: 'AI document analysis & knowledge extraction',
        url: 'http://127.0.0.1:3000/agents/documind',
        version: '1.0.0',
        icon: FileText,
        category: 'productivity',
        tags: ['documents', 'pdf', 'research', 'analysis', 'gemini'],
        featured: false,
        verified: true,
        rating: 4.7,
        reviewCount: 1892,
        addedAt: '2025-09-15',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'none',
        color: '#8B5CF6',
    },
    {
        id: 'nanobanana',
        name: 'NanoBanana Pro',
        description: 'Generate stunning images from text descriptions using Gemini AI. Create artwork, product mockups, logos, and more with state-of-the-art AI models. Track generation history and refine with style presets.',
        shortDescription: 'AI image generation powered by Gemini',
        url: 'http://127.0.0.1:3000/agents/nanobanana',
        version: '1.0.0',
        icon: Banana,
        category: 'creative',
        tags: ['images', 'art', 'design', 'generation', 'gemini'],
        featured: true,
        verified: true,
        rating: 4.5,
        reviewCount: 8921,
        addedAt: '2025-08-22',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#FBBF24',
    },
    {
        id: 'travel-planner',
        name: 'Travel Planner',
        description: 'Plan your perfect trip with AI assistance powered by Amadeus, Google Places, and Gemini AI. Get personalized itineraries, flight and hotel recommendations, local tips, and AI-generated travel plans.',
        shortDescription: 'AI-powered travel planning & booking',
        url: 'http://127.0.0.1:3000/agents/travel',
        version: '1.0.0',
        icon: Plane,
        category: 'commerce',
        tags: ['travel', 'booking', 'hotels', 'flights', 'amadeus'],
        featured: false,
        verified: true,
        rating: 4.4,
        reviewCount: 4521,
        addedAt: '2025-11-05',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'none',
        color: '#0EA5E9',
    },
];

// ============================================================================
// Icon Map for API responses
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
    Utensils,
    Bitcoin,
    BarChart2,
    FileText,
    Banana,
    Plane,
    TrendingUp,
    ShoppingCart,
    BarChart,
    Lock,
    Palette,
    Zap,
    Code,
    MessageSquare,
};

// ============================================================================
// API Client
// ============================================================================

interface ApiAgentRegistryEntry {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    url: string;
    version: string;
    iconName: string;
    category: AgentCategory;
    tags: string[];
    featured: boolean;
    verified: boolean;
    rating: number;
    reviewCount: number;
    addedAt: string;
    provider: {
        name: string;
        url?: string;
        verified?: boolean;
    };
    capabilities: {
        streaming: boolean;
        a2ui: boolean;
        pushNotifications: boolean;
        fileUpload: boolean;
    };
    authentication: 'none' | 'api_key' | 'oauth' | 'bearer';
    screenshots?: string[];
    color?: string;
}

function transformApiAgent(apiAgent: ApiAgentRegistryEntry): CuratedAgent {
    return {
        ...apiAgent,
        icon: ICON_MAP[apiAgent.iconName] || FileText,
    };
}

async function fetchFromApi<T>(endpoint: string): Promise<T | null> {
    try {
        const response = await fetch(`/api/agents${endpoint}`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

// ============================================================================
// Synchronous Functions (use local data - for backwards compatibility)
// ============================================================================

/**
 * Get all curated agents (sync - uses local data)
 */
export function getCuratedAgents(): CuratedAgent[] {
    return CURATED_AGENTS;
}

/**
 * Get featured agents for the hero section (sync - uses local data)
 */
export function getFeaturedAgents(): CuratedAgent[] {
    return CURATED_AGENTS.filter(a => a.featured);
}

/**
 * Get agents by category (sync - uses local data)
 */
export function getAgentsByCategory(category: AgentCategory): CuratedAgent[] {
    return CURATED_AGENTS.filter(a => a.category === category);
}

/**
 * Search agents by name, description, or tags (sync - uses local data)
 */
export function searchAgents(query: string): CuratedAgent[] {
    const lower = query.toLowerCase();
    return CURATED_AGENTS.filter(a =>
        a.name.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower) ||
        a.tags.some(t => t.toLowerCase().includes(lower))
    );
}

/**
 * Get a single agent by ID (sync - uses local data)
 */
export function getAgentById(id: string): CuratedAgent | undefined {
    return CURATED_AGENTS.find(a => a.id === id);
}

/**
 * Get category info (sync - uses local data)
 */
export function getCategoryInfo(category: AgentCategory): AgentCategoryInfo | undefined {
    return AGENT_CATEGORIES.find(c => c.id === category);
}

// ============================================================================
// Async Functions (fetch from API with fallback)
// ============================================================================

/**
 * Fetch all curated agents from API
 */
export async function fetchCuratedAgents(): Promise<CuratedAgent[]> {
    const data = await fetchFromApi<{ agents: ApiAgentRegistryEntry[] }>('/');
    if (data?.agents) {
        return data.agents.map(transformApiAgent);
    }
    return CURATED_AGENTS;
}

/**
 * Fetch featured agents from API
 */
export async function fetchFeaturedAgents(): Promise<CuratedAgent[]> {
    const data = await fetchFromApi<{ agents: ApiAgentRegistryEntry[] }>('/featured');
    if (data?.agents) {
        return data.agents.map(transformApiAgent);
    }
    return CURATED_AGENTS.filter(a => a.featured);
}

/**
 * Fetch agents by category from API
 */
export async function fetchAgentsByCategory(category: AgentCategory): Promise<CuratedAgent[]> {
    const data = await fetchFromApi<{ agents: ApiAgentRegistryEntry[] }>(`/categories/${category}`);
    if (data?.agents) {
        return data.agents.map(transformApiAgent);
    }
    return CURATED_AGENTS.filter(a => a.category === category);
}

/**
 * Search agents via API
 */
export async function fetchSearchAgents(query: string): Promise<CuratedAgent[]> {
    const data = await fetchFromApi<{ agents: ApiAgentRegistryEntry[] }>(`/?q=${encodeURIComponent(query)}`);
    if (data?.agents) {
        return data.agents.map(transformApiAgent);
    }
    return searchAgents(query);
}

/**
 * Fetch a single agent by ID from API
 */
export async function fetchAgentById(id: string): Promise<CuratedAgent | undefined> {
    const data = await fetchFromApi<{ agent: ApiAgentRegistryEntry }>(`/${id}`);
    if (data?.agent) {
        return transformApiAgent(data.agent);
    }
    return CURATED_AGENTS.find(a => a.id === id);
}
