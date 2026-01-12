/**
 * Curated Agent Registry
 *
 * A local registry of verified A2A agents for the Agent Hub.
 * This provides the "App Store" experience for discovering agents.
 */

import type { AgentCard } from '@/a2a/types';

export interface CuratedAgent {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    url: string;
    version: string;
    icon: string;  // Emoji or URL
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
    icon: string;
    description: string;
    color: string;
}

export const AGENT_CATEGORIES: AgentCategoryInfo[] = [
    { id: 'finance', name: 'Finance', icon: '📈', description: 'Trading, portfolio, and financial analysis', color: '#10B981' },
    { id: 'commerce', name: 'Commerce', icon: '🛒', description: 'Shopping, booking, and transactions', color: '#F59E0B' },
    { id: 'analytics', name: 'Analytics', icon: '📊', description: 'Data visualization and insights', color: '#6366F1' },
    { id: 'security', name: 'Security', icon: '🔐', description: 'Authentication and protection', color: '#EF4444' },
    { id: 'creative', name: 'Creative', icon: '🎨', description: 'Design, images, and content creation', color: '#EC4899' },
    { id: 'productivity', name: 'Productivity', icon: '⚡', description: 'Tasks, notes, and workflows', color: '#8B5CF6' },
    { id: 'developer', name: 'Developer', icon: '💻', description: 'Code, APIs, and technical tools', color: '#06B6D4' },
    { id: 'communication', name: 'Communication', icon: '💬', description: 'Chat, email, and messaging', color: '#14B8A6' },
];

/**
 * Curated list of verified A2A agents
 * In production, this would come from a server API
 */
export const CURATED_AGENTS: CuratedAgent[] = [
    {
        id: 'restaurant-finder',
        name: 'Restaurant Finder',
        description: 'Discover and book restaurants near you with AI-powered recommendations. Get personalized suggestions based on cuisine preferences, ratings, and availability. Seamlessly make reservations directly through the agent.',
        shortDescription: 'Find & book restaurants with AI recommendations',
        url: 'https://restaurant-agent.example.com',
        version: '1.2.0',
        icon: '🍽️',
        category: 'commerce',
        tags: ['food', 'booking', 'local', 'dining'],
        featured: true,
        verified: true,
        rating: 4.8,
        reviewCount: 2847,
        addedAt: '2025-12-15',
        provider: { name: 'Google Sample Agents', url: 'https://developers.google.com/a2a', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'none',
        color: '#F97316',
    },
    {
        id: 'crypto-advisor',
        name: 'Crypto Advisor',
        description: 'Real-time cryptocurrency market analysis, portfolio tracking, and trading signals. Get instant insights on market trends, technical analysis, and personalized investment recommendations.',
        shortDescription: 'AI-powered crypto market analysis & signals',
        url: 'https://crypto-advisor.example.com',
        version: '2.0.1',
        icon: '₿',
        category: 'finance',
        tags: ['crypto', 'trading', 'portfolio', 'signals'],
        featured: true,
        verified: true,
        rating: 4.6,
        reviewCount: 5234,
        addedAt: '2025-11-20',
        provider: { name: 'LiquidCrypto Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'api_key',
        color: '#F7931A',
    },
    {
        id: 'rizzcharts',
        name: 'RizzCharts Analytics',
        description: 'Transform your data into beautiful, interactive visualizations. Generate charts, dashboards, and reports from natural language queries. Supports live data connections and real-time updates.',
        shortDescription: 'Create stunning data visualizations with AI',
        url: 'https://rizzcharts.example.com',
        version: '1.5.0',
        icon: '📊',
        category: 'analytics',
        tags: ['charts', 'data', 'visualization', 'dashboards'],
        featured: true,
        verified: true,
        rating: 4.9,
        reviewCount: 3156,
        addedAt: '2025-10-08',
        provider: { name: 'RizzCharts Inc.', url: 'https://rizzcharts.com', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'oauth',
        color: '#6366F1',
    },
    {
        id: 'documind',
        name: 'DocuMind',
        description: 'Intelligent document analysis and knowledge extraction. Upload PDFs, images, or text and get instant summaries, key insights, and answers to your questions. Perfect for research and legal document review.',
        shortDescription: 'AI document analysis & knowledge extraction',
        url: 'https://documind.example.com',
        version: '3.1.0',
        icon: '📄',
        category: 'productivity',
        tags: ['documents', 'pdf', 'research', 'analysis'],
        featured: false,
        verified: true,
        rating: 4.7,
        reviewCount: 1892,
        addedAt: '2025-09-15',
        provider: { name: 'DocuMind AI', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'api_key',
        color: '#8B5CF6',
    },
    {
        id: 'imagegen-pro',
        name: 'ImageGen Pro',
        description: 'Generate stunning images from text descriptions. Create artwork, product mockups, logos, and more with state-of-the-art AI models. Edit and refine with natural language commands.',
        shortDescription: 'Generate stunning images from text',
        url: 'https://imagegen.example.com',
        version: '2.3.0',
        icon: '🎨',
        category: 'creative',
        tags: ['images', 'art', 'design', 'generation'],
        featured: true,
        verified: true,
        rating: 4.5,
        reviewCount: 8921,
        addedAt: '2025-08-22',
        provider: { name: 'Creative AI Labs', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'api_key',
        color: '#EC4899',
    },
    {
        id: 'secure-sign',
        name: 'SecureSign',
        description: 'Enterprise-grade digital signatures and document authentication. Sign contracts, verify identities, and maintain complete audit trails. SOC2 and GDPR compliant.',
        shortDescription: 'Digital signatures & document authentication',
        url: 'https://securesign.example.com',
        version: '1.0.5',
        icon: '🔐',
        category: 'security',
        tags: ['signatures', 'authentication', 'legal', 'compliance'],
        featured: false,
        verified: true,
        rating: 4.9,
        reviewCount: 743,
        addedAt: '2025-12-01',
        provider: { name: 'SecureSign Corp', verified: true },
        capabilities: { streaming: false, a2ui: true, pushNotifications: true, fileUpload: true },
        authentication: 'oauth',
        color: '#EF4444',
    },
    {
        id: 'code-pilot',
        name: 'CodePilot',
        description: 'AI pair programming assistant that understands your codebase. Get intelligent code suggestions, refactoring advice, bug detection, and documentation generation. Supports 50+ languages.',
        shortDescription: 'AI pair programming & code assistance',
        url: 'https://codepilot.example.com',
        version: '4.0.0',
        icon: '💻',
        category: 'developer',
        tags: ['code', 'programming', 'debugging', 'refactoring'],
        featured: false,
        verified: true,
        rating: 4.8,
        reviewCount: 12453,
        addedAt: '2025-07-10',
        provider: { name: 'DevTools Inc.', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: false, fileUpload: true },
        authentication: 'api_key',
        color: '#06B6D4',
    },
    {
        id: 'travel-planner',
        name: 'Travel Planner',
        description: 'Plan your perfect trip with AI assistance. Get personalized itineraries, flight and hotel recommendations, local tips, and real-time travel updates. Supports 150+ destinations worldwide.',
        shortDescription: 'AI-powered travel planning & booking',
        url: 'https://travel-planner.example.com',
        version: '2.1.0',
        icon: '✈️',
        category: 'commerce',
        tags: ['travel', 'booking', 'hotels', 'flights'],
        featured: false,
        verified: true,
        rating: 4.4,
        reviewCount: 4521,
        addedAt: '2025-11-05',
        provider: { name: 'Wanderlust AI', verified: true },
        capabilities: { streaming: true, a2ui: true, pushNotifications: true, fileUpload: false },
        authentication: 'oauth',
        color: '#0EA5E9',
    },
];

/**
 * Get all curated agents
 */
export function getCuratedAgents(): CuratedAgent[] {
    return CURATED_AGENTS;
}

/**
 * Get featured agents for the hero section
 */
export function getFeaturedAgents(): CuratedAgent[] {
    return CURATED_AGENTS.filter(a => a.featured);
}

/**
 * Get agents by category
 */
export function getAgentsByCategory(category: AgentCategory): CuratedAgent[] {
    return CURATED_AGENTS.filter(a => a.category === category);
}

/**
 * Search agents by name, description, or tags
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
 * Get a single agent by ID
 */
export function getAgentById(id: string): CuratedAgent | undefined {
    return CURATED_AGENTS.find(a => a.id === id);
}

/**
 * Get category info
 */
export function getCategoryInfo(category: AgentCategory): AgentCategoryInfo | undefined {
    return AGENT_CATEGORIES.find(c => c.id === category);
}
