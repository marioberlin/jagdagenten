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
    Search,
    HelpCircle,
    GitBranch,
    FileWarning,
    KeyRound,
    Sparkles,
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

const LayoutDashboard = BarChart; // Fallback or import if available (Lucide export check later)

/**
 * Curated list of verified A2A agents
 * In production, this would come from a server API
 */
export const CURATED_AGENTS: CuratedAgent[] = [
    {
        id: 'restaurant-finder',
        name: 'Restaurant Finder',
        description: 'Discover and book restaurants near you with Google Places discovery and OpenTable reservations. Get personalized suggestions based on cuisine preferences, ratings, and availability.\n\n**What I can do:**\n• Search restaurants by cuisine, location, or vibe\n• Show ratings, reviews, and photos\n• Check availability and make reservations\n• Recommend dishes based on preferences\n\n**Try saying:** "Find Italian restaurants near me with outdoor seating" or "Book a table for 4 at 7pm tonight"',
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
        description: 'Real-time cryptocurrency market analysis powered by Binance API and Gemini AI. Get instant insights on market trends, technical analysis, and trading signals.\n\n**What I can do:**\n• Fetch live prices for any crypto pair\n• Analyze market trends and momentum\n• Provide technical analysis indicators\n• Alert on significant price movements\n\n**Try saying:** "What\'s the current BTC price?" or "Analyze ETH/USDT trend" or "Show me top gainers today"',
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
        description: 'Transform your data into beautiful, interactive visualizations. Generate charts, dashboards, and reports from natural language queries.\n\n**What I can do:**\n• Create line, bar, pie, and scatter charts\n• Generate multi-chart dashboards\n• Process CSV/JSON data uploads\n• Export charts as images or embeds\n\n**Try saying:** "Create a bar chart of monthly sales" or "Show me a pie chart of market share" or "Build a dashboard with revenue trends"',
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
        description: 'Intelligent document analysis and knowledge extraction powered by Gemini AI. Upload documents and get instant summaries and insights.\n\n**What I can do:**\n• Summarize PDFs, Word docs, and text files\n• Extract key entities and facts\n• Answer questions about document content\n• Compare multiple documents\n\n**Try saying:** "Summarize this document" or "What are the key findings?" or "Extract all dates and names mentioned"',
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
        description: 'Generate stunning images from text descriptions using Gemini AI. Create artwork, product mockups, logos, and more with state-of-the-art AI models.\n\n**What I can do:**\n• Generate images from text prompts\n• Create product mockups and logos\n• Apply different artistic styles\n• Iterate and refine based on feedback\n\n**Try saying:** "Generate a sunset over mountains in watercolor style" or "Create a minimalist logo for a coffee shop" or "Make this more vibrant"',
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
        description: 'Plan your perfect trip with AI assistance powered by Amadeus, Google Places, and Gemini AI. Get personalized itineraries and recommendations.\n\n**What I can do:**\n• Create day-by-day travel itineraries\n• Suggest flights, hotels, and activities\n• Provide local tips and hidden gems\n• Adjust plans based on budget and preferences\n\n**Try saying:** "Plan a 5-day trip to Tokyo" or "Find hotels near the Eiffel Tower under $200" or "What should I do in Barcelona?"',
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
    {
        id: 'dashboard-builder',
        name: 'Dashboard Builder',
        description: 'AI-powered dashboard creation agent. Create, update, and manage SaaS dashboards with natural language commands.\n\n**What I can do:**\n• Add metric widgets (revenue, users, orders)\n• Create charts and visualizations\n• Update values and refresh data\n• Rearrange and resize widgets\n\n**Try saying:** "Add a revenue widget showing $50,000" or "Create a chart of monthly sales" or "Remove the users widget" or "Update orders to 150"',
        shortDescription: 'AI-powered dashboard creation',
        url: 'http://127.0.0.1:3000/agents/dashboard-builder',
        version: '1.0.0',
        icon: LayoutDashboard,
        category: 'productivity',
        tags: ['dashboard', 'ui', 'widgets', 'saas'],
        featured: true,
        verified: true,
        rating: 5.0,
        reviewCount: 1,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#3B82F6',
    },
    {
        id: 'ai-researcher',
        name: 'AI Researcher',
        description: 'Autonomous research agent powered by Gemini AI. Searches the web, extracts facts, and synthesizes comprehensive reports with verified sources.\n\n**What I can do:**\n• Search the web for any topic\n• Extract and verify facts from sources\n• Synthesize findings into reports\n• Provide citations and references\n\n**Try saying:** "Research the latest AI trends" or "Find information about climate change solutions" or "What are the pros and cons of electric vehicles?"',
        shortDescription: 'AI-powered web research with source verification',
        url: 'http://127.0.0.1:3000/agents/ai-researcher',
        version: '1.0.0',
        icon: Search,
        category: 'productivity',
        tags: ['research', 'search', 'facts', 'web', 'gemini'],
        featured: true,
        verified: true,
        rating: 4.8,
        reviewCount: 312,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#10B981',
    },
    {
        id: 'research-canvas',
        name: 'Research Canvas',
        description: 'Interactive research workspace with AI-assisted note-taking, source management, and knowledge synthesis. Perfect for deep dives and complex projects.\n\n**What I can do:**\n• Create and organize research notes\n• Track sources and citations\n• Synthesize findings across notes\n• Generate summaries and outlines\n\n**Try saying:** "Create a new note about machine learning" or "Summarize my research so far" or "Add this source to my project"',
        shortDescription: 'AI-assisted research workspace & note-taking',
        url: 'http://127.0.0.1:3000/agents/research-canvas',
        version: '1.0.0',
        icon: Sparkles,
        category: 'productivity',
        tags: ['research', 'notes', 'workspace', 'canvas', 'knowledge'],
        featured: false,
        verified: true,
        rating: 4.7,
        reviewCount: 189,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'none',
        color: '#8B5CF6',
    },
    {
        id: 'qa-agent',
        name: 'Q&A Agent',
        description: 'Knowledge-based question answering agent. Ask questions and get AI-powered answers with sources. Maintains conversation context for follow-up questions.\n\n**What I can do:**\n• Answer general knowledge questions\n• Explain complex concepts simply\n• Provide sources and citations\n• Remember context for follow-ups\n\n**Try saying:** "What is quantum computing?" or "Explain it like I\'m 5" or "Can you give me more details on that last point?"',
        shortDescription: 'AI Q&A with contextual knowledge retention',
        url: 'http://127.0.0.1:3000/agents/qa',
        version: '1.0.0',
        icon: HelpCircle,
        category: 'productivity',
        tags: ['qa', 'questions', 'answers', 'knowledge', 'support'],
        featured: false,
        verified: true,
        rating: 4.6,
        reviewCount: 423,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#06B6D4',
    },
    {
        id: 'state-machine',
        name: 'State Machine Wizard',
        description: 'AI-guided multi-step workflow assistant. Navigate complex processes with intelligent stage management and contextual guidance.\n\n**What I can do:**\n• Guide you through multi-step processes\n• Track progress and current stage\n• Validate inputs at each step\n• Provide contextual help and tips\n\n**Try saying:** "Start the car purchase wizard" or "What step am I on?" or "Go back to the previous step" or "Help me with the financing options"',
        shortDescription: 'AI-guided multi-step workflow assistant',
        url: 'http://127.0.0.1:3000/agents/state-machine',
        version: '1.0.0',
        icon: GitBranch,
        category: 'productivity',
        tags: ['workflow', 'wizard', 'forms', 'state', 'process'],
        featured: false,
        verified: true,
        rating: 4.5,
        reviewCount: 156,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#F59E0B',
    },
    {
        id: 'copilot-form',
        name: 'Form Copilot',
        description: 'AI-powered form filling assistant. Describe your request in natural language and let the AI extract and populate form fields automatically.\n\n**What I can do:**\n• Parse natural language into form fields\n• Auto-fill incident reports\n• Extract dates, names, and details\n• Validate and correct entries\n\n**Try saying:** "There was a water leak in room 405 yesterday at 3pm, severity is high" or "Fill in the form with sample data" or "Report a broken AC unit in the lobby"',
        shortDescription: 'Natural language form filling assistant',
        url: 'http://127.0.0.1:3000/agents/copilot-form',
        version: '1.0.0',
        icon: FileWarning,
        category: 'productivity',
        tags: ['forms', 'copilot', 'assistant', 'input', 'automation'],
        featured: false,
        verified: true,
        rating: 4.7,
        reviewCount: 287,
        addedAt: '2026-01-17',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: false, fileUpload: false },
        authentication: 'none',
        color: '#EF4444',
    },
    {
        id: 'remote-password',
        name: 'Password Generator',
        description: 'Secure password generation agent running on a remote A2A server. Demonstrates external agent connectivity with enterprise-grade security.\n\n**What I can do:**\n• Generate strong, random passwords\n• Customize length and complexity\n• Create memorable passphrases\n• Check password strength\n\n**Try saying:** "Generate a 16-character password" or "Create a passphrase with 4 words" or "Make a password without special characters"',
        shortDescription: 'Remote A2A password generation agent',
        url: '/remote-a2a',
        version: '1.0.0',
        icon: KeyRound,
        category: 'security',
        tags: ['password', 'security', 'remote', 'external', 'a2a'],
        featured: true,
        verified: true,
        rating: 4.9,
        reviewCount: 542,
        addedAt: '2026-01-17',
        provider: { name: 'ShowHeroes', url: 'https://showheroes.com', verified: true },
        capabilities: { streaming: false, a2ui: false, pushNotifications: false, fileUpload: false },
        authentication: 'bearer',
        color: '#DC2626',
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
    Search,
    HelpCircle,
    GitBranch,
    FileWarning,
    KeyRound,
    Sparkles,
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
