/**
 * Agents Registry API Routes
 *
 * Provides endpoints for the Agent Hub to discover and manage A2A agents.
 * In production, this would connect to a database for dynamic agent management.
 */

import { Elysia } from 'elysia';

// ============================================================================
// Types
// ============================================================================

export interface AgentRegistryEntry {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  url: string;
  version: string;
  iconName: string; // Lucide icon name (rendered on frontend)
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
  iconName: string;
  description: string;
  color: string;
}

// ============================================================================
// Static Data (would be database in production)
// ============================================================================

const AGENT_CATEGORIES: AgentCategoryInfo[] = [
  { id: 'finance', name: 'Finance', iconName: 'TrendingUp', description: 'Trading, portfolio, and financial analysis', color: '#10B981' },
  { id: 'commerce', name: 'Commerce', iconName: 'ShoppingCart', description: 'Shopping, booking, and transactions', color: '#F59E0B' },
  { id: 'analytics', name: 'Analytics', iconName: 'BarChart', description: 'Data visualization and insights', color: '#6366F1' },
  { id: 'security', name: 'Security', iconName: 'Lock', description: 'Authentication and protection', color: '#EF4444' },
  { id: 'creative', name: 'Creative', iconName: 'Palette', description: 'Design, images, and content creation', color: '#EC4899' },
  { id: 'productivity', name: 'Productivity', iconName: 'Zap', description: 'Tasks, notes, and workflows', color: '#8B5CF6' },
  { id: 'developer', name: 'Developer', iconName: 'Code', description: 'Code, APIs, and technical tools', color: '#06B6D4' },
  { id: 'communication', name: 'Communication', iconName: 'MessageSquare', description: 'Chat, email, and messaging', color: '#14B8A6' },
];

const CURATED_AGENTS: AgentRegistryEntry[] = [
  {
    id: 'restaurant-finder',
    name: 'Restaurant Finder',
    description: 'Discover and book restaurants near you with AI-powered recommendations. Get personalized suggestions based on cuisine preferences, ratings, and availability.',
    shortDescription: 'Find & book restaurants with AI recommendations',
    url: 'http://127.0.0.1:3000/agents/restaurant',
    version: '1.2.0',
    iconName: 'Utensils',
    category: 'commerce',
    tags: ['food', 'booking', 'local', 'dining'],
    featured: true,
    verified: true,
    rating: 4.8,
    reviewCount: 2847,
    addedAt: '2025-12-15',
    provider: { name: 'Google Sample Agents', url: 'https://developers.google.com/a2a', verified: true },
    capabilities: { streaming: false, a2ui: true, pushNotifications: true, fileUpload: false },
    authentication: 'none',
    color: '#F97316',
  },
  {
    id: 'crypto-advisor',
    name: 'Crypto Advisor',
    description: 'Real-time cryptocurrency market analysis, portfolio tracking, and trading signals. Get instant insights on market trends and personalized recommendations.',
    shortDescription: 'AI-powered crypto market analysis & signals',
    url: 'https://crypto-advisor.example.com',
    version: '2.0.1',
    iconName: 'Bitcoin',
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
    description: 'Transform your data into beautiful, interactive visualizations. Generate charts, dashboards, and reports from natural language queries.',
    shortDescription: 'Create stunning data visualizations with AI',
    url: 'http://127.0.0.1:3000/agents/rizzcharts',
    version: '1.5.0',
    iconName: 'BarChart2',
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
    description: 'Intelligent document analysis and knowledge extraction. Upload PDFs, images, or text and get instant summaries, key insights, and answers.',
    shortDescription: 'AI document analysis & knowledge extraction',
    url: 'https://documind.example.com',
    version: '3.1.0',
    iconName: 'FileText',
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
    description: 'Generate stunning images from text descriptions. Create artwork, product mockups, logos, and more with state-of-the-art AI models.',
    shortDescription: 'Generate stunning images from text',
    url: 'https://imagegen.example.com',
    version: '2.3.0',
    iconName: 'Image',
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
    description: 'Enterprise-grade digital signatures and document authentication. Sign contracts, verify identities, and maintain complete audit trails.',
    shortDescription: 'Digital signatures & document authentication',
    url: 'https://securesign.example.com',
    version: '1.0.5',
    iconName: 'ShieldCheck',
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
    description: 'AI pair programming assistant that understands your codebase. Get intelligent code suggestions, refactoring advice, and bug detection.',
    shortDescription: 'AI pair programming & code assistance',
    url: 'https://codepilot.example.com',
    version: '4.0.0',
    iconName: 'Terminal',
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
    description: 'Plan your perfect trip with AI assistance. Get personalized itineraries, flight and hotel recommendations, and real-time travel updates.',
    shortDescription: 'AI-powered travel planning & booking',
    url: 'https://travel-planner.example.com',
    version: '2.1.0',
    iconName: 'Plane',
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

// ============================================================================
// Routes
// ============================================================================

export function createAgentsRoutes() {
  return new Elysia({ prefix: '/api/agents' })
    // Get all agents with optional filters
    .get('/', ({ query }) => {
      let agents = [...CURATED_AGENTS];

      // Filter by category
      if (query.category) {
        agents = agents.filter(a => a.category === query.category);
      }

      // Filter by featured
      if (query.featured === 'true') {
        agents = agents.filter(a => a.featured);
      }

      // Filter by verified
      if (query.verified === 'true') {
        agents = agents.filter(a => a.verified);
      }

      // Search by query
      if (query.q) {
        const lower = (query.q as string).toLowerCase();
        agents = agents.filter(a =>
          a.name.toLowerCase().includes(lower) ||
          a.description.toLowerCase().includes(lower) ||
          a.tags.some(t => t.toLowerCase().includes(lower))
        );
      }

      // Pagination
      const limit = query.limit ? parseInt(query.limit as string, 10) : 50;
      const offset = query.offset ? parseInt(query.offset as string, 10) : 0;
      const total = agents.length;
      agents = agents.slice(offset, offset + limit);

      return {
        agents,
        total,
        limit,
        offset,
      };
    })

    // Get featured agents
    .get('/featured', () => {
      const featured = CURATED_AGENTS.filter(a => a.featured);
      return { agents: featured };
    })

    // Get agent by ID
    .get('/:id', ({ params, set }) => {
      const agent = CURATED_AGENTS.find(a => a.id === params.id);
      if (!agent) {
        set.status = 404;
        return { error: 'Agent not found' };
      }
      return { agent };
    })

    // Get all categories
    .get('/categories/all', () => {
      return { categories: AGENT_CATEGORIES };
    })

    // Get agents by category
    .get('/categories/:category', ({ params }) => {
      const agents = CURATED_AGENTS.filter(a => a.category === params.category);
      const categoryInfo = AGENT_CATEGORIES.find(c => c.id === params.category);
      return {
        category: categoryInfo,
        agents,
      };
    });
}
