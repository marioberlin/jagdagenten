/**
 * Service Descriptions
 * 
 * Centralized service metadata for tooltips and About dialog.
 */

export interface ServiceFeature {
    name: string;
    description: string;
}

export interface ServiceEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    purpose: string;
}

export interface ServiceDescription {
    id: string;
    name: string;
    shortName: string;
    description: string;
    purpose: string;
    port?: number;
    features: ServiceFeature[];
    endpoints?: ServiceEndpoint[];
    healthEndpoint?: string;
    /** Whether this service is required for the system to function */
    required?: boolean;
}

export const SERVICE_DESCRIPTIONS: Record<string, ServiceDescription> = {
    'liquid-runtime': {
        id: 'liquid-runtime',
        name: 'Liquid Runtime',
        shortName: 'Runtime',
        description: 'AI Agent Execution Container',
        purpose: 'A sandboxed Docker container that provides isolated environments for executing AI agent code safely.',
        port: 8081,
        healthEndpoint: '/health/runtime',
        required: false, // Optional - agents can run in demo mode without it
        features: [
            { name: 'Command Execution', description: 'Runs commands with timeout protection (default 5 min)' },
            { name: 'Streaming Output', description: 'Real-time stdout/stderr via Server-Sent Events' },
            { name: 'Secrets Management', description: 'Injects secrets safely into agent environments' },
            { name: 'Memory Limits', description: 'Capped at 512MB with OOM kill detection' },
            { name: 'Container Recycling', description: 'Reset and reuse containers for different agents' },
        ],
        endpoints: [
            { method: 'GET', path: '/health', purpose: 'Health check for pool management' },
            { method: 'POST', path: '/init', purpose: 'Initialize container for a specific agent' },
            { method: 'POST', path: '/execute', purpose: 'Run a command and get results' },
            { method: 'GET', path: '/execute/stream', purpose: 'Stream command output in real-time' },
            { method: 'POST', path: '/reset', purpose: 'Clean up and recycle the container' },
            { method: 'GET', path: '/state', purpose: 'Debug current container state' },
        ],
    },
    'postgres': {
        id: 'postgres',
        name: 'PostgreSQL Database',
        shortName: 'Database',
        description: 'Primary Data Store',
        purpose: 'PostgreSQL 16 database for persistent storage of agents, tasks, user data, and system state.',
        port: 5432,
        healthEndpoint: '/health/postgres',
        required: true, // Required for persistence
        features: [
            { name: 'Agent Metadata', description: 'Stores agent configurations and capabilities' },
            { name: 'Task History', description: 'Complete audit trail of all executed tasks' },
            { name: 'User Preferences', description: 'Personalized settings and workspace data' },
            { name: 'A2A State', description: 'Agent-to-agent communication history' },
        ],
    },
    'redis': {
        id: 'redis',
        name: 'Redis Cache',
        shortName: 'Cache',
        description: 'In-Memory Data Grid',
        purpose: 'Redis 7 for high-speed caching, real-time pub/sub messaging, and session management.',
        port: 6379,
        healthEndpoint: '/health/redis',
        required: false, // Optional - caching improves performance but not critical
        features: [
            { name: 'Session Cache', description: 'Fast session lookups and auth tokens' },
            { name: 'Pub/Sub', description: 'Real-time event distribution across services' },
            { name: 'Rate Limiting', description: 'API throttling and quota management' },
            { name: 'Task Queue', description: 'Lightweight job queue for async operations' },
        ],
    },
    'backend': {
        id: 'backend',
        name: 'Liquid Backend',
        shortName: 'API',
        description: 'Elysia API Server',
        purpose: 'High-performance TypeScript backend powered by Elysia and Bun runtime.',
        port: 3000,
        healthEndpoint: '/health',
        required: true, // Required for API functionality
        features: [
            { name: 'REST API', description: 'Full CRUD for agents, tasks, and system config' },
            { name: 'WebSocket', description: 'Real-time updates and streaming responses' },
            { name: 'A2A Protocol', description: 'Google A2A agent-to-agent communication' },
            { name: 'Container Orchestration', description: 'Manages liquid-runtime container pool' },
        ],
    },
    'frontend': {
        id: 'frontend',
        name: 'Liquid Frontend',
        shortName: 'UI',
        description: 'React + Vite Application',
        purpose: 'Modern React application with glassmorphic UI, built with Vite for instant HMR.',
        port: 5173,
        features: [
            { name: 'Liquid Glass UI', description: 'Premium glassmorphic design system' },
            { name: 'Command Center', description: 'Centralized agent management dashboard' },
            { name: 'Cowork Mode', description: 'Collaborative multi-agent workspace' },
            { name: 'Real-time Updates', description: 'WebSocket-powered live data' },
        ],
    },
    'system': {
        id: 'system',
        name: 'System Status',
        shortName: 'System',
        description: 'Overall Health',
        purpose: 'Aggregate health status of all LiquidOS services.',
        features: [
            { name: 'Health Monitoring', description: 'Continuous polling of all service endpoints' },
            { name: 'Auto-recovery', description: 'Automatic reconnection on failures' },
            { name: 'Alerting', description: 'Visual warnings when services are degraded' },
        ],
    },
    'network': {
        id: 'network',
        name: 'Network Status',
        shortName: 'Network',
        description: 'Connectivity Monitor',
        purpose: 'Monitors network connectivity and external service availability.',
        features: [
            { name: 'Internet Check', description: 'Validates external connectivity' },
            { name: 'LLM Providers', description: 'Monitors OpenAI, Anthropic, Google endpoints' },
            { name: 'Latency Tracking', description: 'Measures round-trip times to key services' },
        ],
    },
    'ai-core': {
        id: 'ai-core',
        name: 'AI Core',
        shortName: 'AI',
        description: 'LLM Integration Layer',
        purpose: 'Unified interface for multiple LLM providers with automatic fallback.',
        features: [
            { name: 'Multi-provider', description: 'Claude, GPT-4, Gemini support' },
            { name: 'Context Management', description: 'Intelligent context window handling' },
            { name: 'Tool Calling', description: 'Native function/tool call support' },
            { name: 'Streaming', description: 'Real-time token streaming responses' },
        ],
    },
};

/**
 * Get service description by ID
 */
export const getServiceDescription = (id: string): ServiceDescription | undefined => {
    return SERVICE_DESCRIPTIONS[id];
};

/**
 * Map StatusCard labels to service IDs
 */
export const STATUS_CARD_SERVICE_MAP: Record<string, string> = {
    'System Status': 'system',
    'AI Core': 'ai-core',
    'Runtime': 'liquid-runtime',
    'Network': 'network',
};
