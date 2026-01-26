/**
 * Soul.me Generator Service
 * 
 * Auto-generates soul.me files for apps and agents based on their metadata.
 * Soul.me files define personality, capabilities, goals, and constraints.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// ============================================================================
// Types
// ============================================================================

export interface SoulDefinition {
    id: string;
    name: string;
    version: string;
    type: 'app' | 'agent' | 'a2a-server';
    capabilities: string[];
    triggers: string[];
    tags: string[];

    // Markdown content sections
    personality: string;
    goals: string[];
    voiceTone: string[];
    constraints: string[];
}

export interface SoulGeneratorConfig {
    appsDir: string;
    a2aDir: string;
    templates: Record<string, Partial<SoulDefinition>>;
}

// ============================================================================
// Default Templates
// ============================================================================

const DEFAULT_TEMPLATES: Record<string, Partial<SoulDefinition>> = {
    app: {
        type: 'app',
        version: '1.0.0',
        capabilities: ['user-interaction', 'data-display'],
        triggers: [],
        tags: ['app'],
        personality: 'You are a helpful application assistant focused on providing a great user experience.',
        goals: ['Help users accomplish their tasks efficiently', 'Provide clear and actionable guidance'],
        voiceTone: ['Professional yet friendly', 'Concise and clear', 'Patient and helpful'],
        constraints: ['Do not make assumptions about user intent', 'Ask for clarification when needed'],
    },
    agent: {
        type: 'agent',
        version: '1.0.0',
        capabilities: ['autonomous-action', 'tool-use', 'reasoning'],
        triggers: [],
        tags: ['agent', 'autonomous'],
        personality: 'You are an autonomous AI agent capable of complex reasoning and task execution.',
        goals: ['Complete assigned tasks accurately', 'Learn from interactions', 'Minimize user intervention'],
        voiceTone: ['Direct and efficient', 'Technical when appropriate', 'Results-oriented'],
        constraints: ['Always verify before destructive actions', 'Report uncertainties clearly'],
    },
    'a2a-server': {
        type: 'a2a-server',
        version: '1.0.0',
        capabilities: ['api-service', 'inter-agent-communication'],
        triggers: [],
        tags: ['a2a', 'server'],
        personality: 'You are a service agent that processes requests from other agents and applications.',
        goals: ['Process requests reliably', 'Return accurate responses', 'Maintain service availability'],
        voiceTone: ['Precise and technical', 'Structured responses', 'Error-aware'],
        constraints: ['Validate all inputs', 'Handle errors gracefully', 'Respect rate limits'],
    },
};

// ============================================================================
// App Metadata Analyzers
// ============================================================================

const APP_METADATA: Record<string, Partial<SoulDefinition>> = {
    'agent-hub': {
        name: 'Agent Hub',
        capabilities: ['agent-management', 'agent-discovery', 'agent-deployment'],
        personality: 'You are the central hub for managing AI agents. You help users discover, configure, and deploy agents.',
        goals: ['Help users find the right agent for their task', 'Simplify agent configuration', 'Monitor agent health'],
        tags: ['hub', 'management', 'agents'],
    },
    'ai-explorer': {
        name: 'AI Explorer',
        capabilities: ['resource-browsing', 'resource-editing', 'context-visualization'],
        personality: 'You are an AI resource explorer. You help users browse, edit, and understand their AI resources like prompts, memory, and knowledge.',
        goals: ['Make AI resources discoverable', 'Enable easy editing', 'Visualize context compilation'],
        tags: ['explorer', 'resources', 'debug'],
    },
    'artifacts': {
        name: 'Artifacts',
        capabilities: ['artifact-storage', 'artifact-rendering', 'version-control'],
        personality: 'You manage generated artifacts like code, documents, and charts. You help users organize and retrieve their AI-generated content.',
        goals: ['Store artifacts reliably', 'Enable quick retrieval', 'Track artifact history'],
        tags: ['artifacts', 'storage', 'history'],
    },
    'aurora-travel': {
        name: 'Aurora Travel',
        capabilities: ['trip-planning', 'destination-search', 'itinerary-generation'],
        personality: 'You are a sophisticated travel planning assistant. You help users discover destinations, plan itineraries, and book memorable trips.',
        goals: ['Inspire wanderlust', 'Create perfect itineraries', 'Save time on travel planning'],
        tags: ['travel', 'planning', 'booking'],
    },
    'aurora-weather': {
        name: 'Aurora Weather',
        capabilities: ['weather-forecasting', 'location-tracking', 'alerts'],
        personality: 'You provide beautiful, accurate weather information. You help users plan their day with confidence.',
        goals: ['Deliver accurate forecasts', 'Alert on severe weather', 'Present data beautifully'],
        tags: ['weather', 'forecasting', 'alerts'],
    },
    'builder': {
        name: 'Builder',
        capabilities: ['app-creation', 'code-generation', 'deployment'],
        personality: 'You are a powerful app builder. You help users create applications from natural language descriptions.',
        goals: ['Turn ideas into apps', 'Generate clean code', 'Deploy seamlessly'],
        tags: ['builder', 'code', 'deployment'],
    },
    'cowork': {
        name: 'Cowork',
        capabilities: ['collaboration', 'real-time-editing', 'team-coordination'],
        personality: 'You facilitate team collaboration on AI projects. You help teams work together on prompts, agents, and resources.',
        goals: ['Enable seamless collaboration', 'Prevent conflicts', 'Track contributions'],
        tags: ['collaboration', 'team', 'real-time'],
    },
    'demos': {
        name: 'Demos',
        capabilities: ['showcase', 'interactive-examples', 'learning'],
        personality: 'You showcase the capabilities of LiquidOS. You provide interactive demos that help users learn the platform.',
        goals: ['Demonstrate features', 'Enable hands-on learning', 'Inspire creativity'],
        tags: ['demos', 'learning', 'showcase'],
    },
    'design-guide': {
        name: 'Design Guide',
        capabilities: ['design-system', 'component-library', 'theming'],
        personality: 'You are the living design system documentation. You help developers build consistent, beautiful interfaces.',
        goals: ['Document design patterns', 'Provide copyable components', 'Ensure consistency'],
        tags: ['design', 'components', 'documentation'],
    },
    'docs': {
        name: 'Documentation',
        capabilities: ['documentation', 'search', 'tutorials'],
        personality: 'You are the documentation hub. You help users find answers, learn features, and troubleshoot issues.',
        goals: ['Answer questions quickly', 'Provide clear examples', 'Keep docs current'],
        tags: ['docs', 'help', 'tutorials'],
    },
    'ibird': {
        name: 'iBird',
        capabilities: ['car-navigation', 'speed-camera-alerts', 'route-planning'],
        personality: 'You are an intelligent driving assistant. You help drivers navigate safely with real-time alerts and smart routing.',
        goals: ['Keep drivers safe', 'Avoid speed traps', 'Optimize routes'],
        tags: ['navigation', 'driving', 'safety'],
    },
    'icloud': {
        name: 'iCloud',
        capabilities: ['cloud-storage', 'sync', 'file-management'],
        personality: 'You manage cloud storage and synchronization. You help users keep their files accessible everywhere.',
        goals: ['Sync reliably', 'Manage storage efficiently', 'Protect data'],
        tags: ['cloud', 'storage', 'sync'],
    },
    'neon-tokyo': {
        name: 'Neon Tokyo',
        capabilities: ['cyberpunk-theme', 'visual-demo', 'aesthetic-showcase'],
        personality: 'You are a cyberpunk-themed visual experience. You showcase the aesthetic possibilities of LiquidOS.',
        goals: ['Inspire with visuals', 'Demonstrate themes', 'Create immersive experiences'],
        tags: ['theme', 'cyberpunk', 'visual'],
    },
    'rush-hour-trading': {
        name: 'Rush Hour Trading',
        capabilities: ['trading', 'market-analysis', 'portfolio-management', 'risk-assessment'],
        personality: 'You are a sophisticated trading assistant. You help traders analyze markets, manage risk, and execute strategies.',
        goals: ['Provide market insights', 'Manage risk effectively', 'Execute trades precisely'],
        tags: ['trading', 'finance', 'analysis'],
    },
    'sheets': {
        name: 'Sheets',
        capabilities: ['spreadsheet', 'data-analysis', 'formulas', 'visualization'],
        personality: 'You are an intelligent spreadsheet application. You help users analyze data, create formulas, and visualize results.',
        goals: ['Simplify data analysis', 'Generate insights', 'Create beautiful charts'],
        tags: ['spreadsheet', 'data', 'analysis'],
    },
    'a2a-console': {
        name: 'A2A Console',
        capabilities: ['a2a-debugging', 'message-inspection', 'agent-testing'],
        personality: 'You are the A2A debugging console. You help developers inspect agent-to-agent communication and test integrations.',
        goals: ['Debug A2A issues', 'Inspect message flow', 'Test agent interactions'],
        tags: ['a2a', 'debug', 'console'],
    },
    '_system': {
        name: 'System',
        capabilities: ['system-management', 'configuration', 'health-monitoring'],
        personality: 'You manage core system operations. You handle configuration, health checks, and system-level tasks.',
        goals: ['Keep system healthy', 'Manage configuration', 'Report issues'],
        tags: ['system', 'core', 'management'],
    },
};

// ============================================================================
// Soul Generator Service
// ============================================================================

export class SoulGeneratorService {
    private config: SoulGeneratorConfig;

    constructor(config?: Partial<SoulGeneratorConfig>) {
        this.config = {
            appsDir: config?.appsDir ?? 'src/applications',
            a2aDir: config?.a2aDir ?? 'server/src/a2a',
            templates: { ...DEFAULT_TEMPLATES, ...config?.templates },
        };
    }

    /**
     * Generate soul.me for a specific app
     */
    async generateForApp(appId: string, overrides?: Partial<SoulDefinition>): Promise<string> {
        const template = this.config.templates.app!;
        const appMeta = APP_METADATA[appId] ?? {};

        const soul: SoulDefinition = {
            id: appId,
            name: appMeta.name ?? this.formatName(appId),
            version: template.version ?? '1.0.0',
            type: 'app',
            capabilities: [...(template.capabilities ?? []), ...(appMeta.capabilities ?? [])],
            triggers: appMeta.triggers ?? template.triggers ?? [],
            tags: [...(template.tags ?? []), ...(appMeta.tags ?? [])],
            personality: appMeta.personality ?? template.personality ?? '',
            goals: appMeta.goals ?? template.goals ?? [],
            voiceTone: appMeta.voiceTone ?? template.voiceTone ?? [],
            constraints: appMeta.constraints ?? template.constraints ?? [],
            ...overrides,
        };

        return this.formatSoulFile(soul);
    }

    /**
     * Generate soul.me for an A2A server
     */
    async generateForA2A(serverId: string, overrides?: Partial<SoulDefinition>): Promise<string> {
        const template = this.config.templates['a2a-server']!;

        const soul: SoulDefinition = {
            id: serverId,
            name: this.formatName(serverId),
            version: template.version ?? '1.0.0',
            type: 'a2a-server',
            capabilities: template.capabilities ?? [],
            triggers: template.triggers ?? [],
            tags: [...(template.tags ?? []), serverId],
            personality: template.personality ?? '',
            goals: template.goals ?? [],
            voiceTone: template.voiceTone ?? [],
            constraints: template.constraints ?? [],
            ...overrides,
        };

        return this.formatSoulFile(soul);
    }

    /**
     * Generate and write soul.me for all apps
     */
    async generateAllApps(): Promise<string[]> {
        const appsDir = this.config.appsDir;
        const created: string[] = [];

        try {
            const entries = await readdir(appsDir, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;

                const appId = entry.name;
                const soulPath = join(appsDir, appId, 'soul.md');

                // Skip if soul.me already exists
                try {
                    await access(soulPath);
                    continue; // File exists, skip
                } catch {
                    // File doesn't exist, create it
                }

                const content = await this.generateForApp(appId);
                await this.writeSoulFile(soulPath, content);
                created.push(soulPath);
            }
        } catch (error) {
            console.error('Failed to generate app souls:', error);
        }

        return created;
    }

    /**
     * Generate and write soul.me for all A2A servers
     */
    async generateAllA2A(): Promise<string[]> {
        const a2aDir = this.config.a2aDir;
        const created: string[] = [];

        try {
            const entries = await readdir(a2aDir, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;

                const serverId = entry.name;
                const soulPath = join(a2aDir, serverId, 'soul.md');

                try {
                    await access(soulPath);
                    continue;
                } catch {
                    // Create it
                }

                const content = await this.generateForA2A(serverId);
                await this.writeSoulFile(soulPath, content);
                created.push(soulPath);
            }
        } catch (error) {
            console.error('Failed to generate A2A souls:', error);
        }

        return created;
    }

    /**
     * Format soul definition into soul.me file content
     */
    private formatSoulFile(soul: SoulDefinition): string {
        const frontmatter = {
            id: soul.id,
            name: soul.name,
            version: soul.version,
            type: soul.type,
            capabilities: soul.capabilities,
            triggers: soul.triggers,
            tags: soul.tags,
        };

        const content = [
            '---',
            stringifyYaml(frontmatter).trim(),
            '---',
            '',
            '# Personality',
            soul.personality,
            '',
            '# Goals',
            ...soul.goals.map(g => `- ${g}`),
            '',
            '# Voice & Tone',
            ...soul.voiceTone.map(v => `- ${v}`),
            '',
            '# Constraints',
            ...soul.constraints.map(c => `- ${c}`),
            '',
        ].join('\n');

        return content;
    }

    /**
     * Write soul.me file
     */
    private async writeSoulFile(path: string, content: string): Promise<void> {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, 'utf-8');
    }

    /**
     * Format app/server ID to display name
     */
    private formatName(id: string): string {
        return id
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// ============================================================================
// Factory
// ============================================================================

export function createSoulGenerator(config?: Partial<SoulGeneratorConfig>): SoulGeneratorService {
    return new SoulGeneratorService(config);
}

export default SoulGeneratorService;
