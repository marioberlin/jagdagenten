/**
 * Router Agent Implementation
 *
 * The main orchestrator that classifies intent, delegates to specialists,
 * and composes final responses. Uses Gemini for intent classification
 * and function calling.
 */

import { GoogleGenAI } from '@google/genai';
import type {
    AgentContext,
    AgentResponse,
    AgentRole,
    HandoffRequest,
    ToolCallRecord,
    ActionChip,
} from './types.js';
import { ROUTER_SYSTEM_PROMPT, getAgentPrompt } from './prompts/index.js';
import { TOOL_SCHEMAS } from '../schemas/index.js';
import { componentLoggers } from '../logger.js';

const logger = componentLoggers.agents;
const MODEL = 'gemini-2.5-flash-preview-05-20';

// ============================================================================
// Intent Classification
// ============================================================================

type IntentCategory =
    | 'scout_conditions'
    | 'scout_plan'
    | 'bureaucracy_export'
    | 'bureaucracy_permit'
    | 'quartermaster_checklist'
    | 'journal_start'
    | 'journal_log'
    | 'journal_end'
    | 'pack_event'
    | 'feed_publish'
    | 'news_fetch'
    | 'general_chat';

const INTENT_TO_AGENT: Record<IntentCategory, AgentRole> = {
    scout_conditions: 'scout',
    scout_plan: 'scout',
    bureaucracy_export: 'bureaucracy',
    bureaucracy_permit: 'bureaucracy',
    quartermaster_checklist: 'quartermaster',
    journal_start: 'journal',
    journal_log: 'journal',
    journal_end: 'journal',
    pack_event: 'pack',
    feed_publish: 'feed',
    news_fetch: 'news',
    general_chat: 'router',
};

const INTENT_KEYWORDS: Record<IntentCategory, string[]> = {
    scout_conditions: ['wetter', 'wind', 'bedingungen', 'mond', 'dämmerung', 'conditions'],
    scout_plan: ['ansitz', 'hochsitz', 'wo soll ich', 'jagdplan', 'empfehlung', 'plan'],
    bureaucracy_export: ['streckenliste', 'export', 'meldung', 'bericht', 'csv'],
    bureaucracy_permit: ['begehungsschein', 'gastschein', 'permit', 'gast'],
    quartermaster_checklist: ['checkliste', 'ausrüstung', 'munition', 'packliste', 'checklist'],
    journal_start: ['jagd starten', 'session starten', 'anfangen', 'start'],
    journal_log: ['sichtung', 'schuss', 'erlegung', 'notiz', 'protokollieren', 'log'],
    journal_end: ['jagd beenden', 'session beenden', 'fertig', 'end'],
    pack_event: ['drückjagd', 'veranstaltung', 'event', 'team', 'gruppe'],
    feed_publish: ['posten', 'teilen', 'veröffentlichen', 'share', 'publish'],
    news_fetch: ['nachrichten', 'news', 'neuigkeiten', 'aktuell'],
    general_chat: [],
};

function classifyIntent(message: string): IntentCategory {
    const lowerMessage = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            return intent as IntentCategory;
        }
    }

    return 'general_chat';
}

// ============================================================================
// Router Agent Class
// ============================================================================

export class RouterAgent {
    private client: GoogleGenAI | null = null;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.client = new GoogleGenAI({ apiKey });
        } else {
            logger.warn('GEMINI_API_KEY not set, RouterAgent will use mock responses');
        }
    }

    /**
     * Main routing method - classifies intent and delegates to specialists.
     */
    async route(message: string, context: AgentContext): Promise<AgentResponse> {
        const intent = classifyIntent(message);
        const targetAgent = INTENT_TO_AGENT[intent];

        logger.info({ intent, targetAgent, message: message.substring(0, 50) }, 'Routing request');

        // If it's general chat or router handles it directly
        if (targetAgent === 'router' || !this.client) {
            return this.handleDirectly(message, context);
        }

        // Delegate to specialist
        return this.delegateToSpecialist(targetAgent, message, context);
    }

    /**
     * Handle general chat directly without specialist delegation.
     */
    private async handleDirectly(message: string, context: AgentContext): Promise<AgentResponse> {
        if (!this.client) {
            return {
                text: 'Der KI-Jagdberater ist derzeit nicht verfügbar. Bitte konfigurieren Sie die GEMINI_API_KEY Umgebungsvariable.',
                agentRole: 'router',
                ui: {
                    chips: ['Explain'] as ActionChip[],
                    explain: ['API-Schlüssel nicht konfiguriert'],
                },
            };
        }

        try {
            const response = await this.client.models.generateContent({
                model: MODEL,
                contents: [{ role: 'user', parts: [{ text: message }] }],
                config: {
                    systemInstruction: ROUTER_SYSTEM_PROMPT,
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            });

            const text = response.text ?? 'Ich konnte keine Antwort generieren.';

            return {
                text,
                agentRole: 'router',
                ui: {
                    chips: ['Explain'] as ActionChip[],
                },
            };
        } catch (error) {
            logger.error({ error }, 'Router direct handling failed');
            return {
                text: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
                agentRole: 'router',
            };
        }
    }

    /**
     * Delegate to a specialist agent with function calling.
     */
    private async delegateToSpecialist(
        targetAgent: AgentRole,
        message: string,
        context: AgentContext
    ): Promise<AgentResponse> {
        if (!this.client) {
            return this.handleDirectly(message, context);
        }

        const systemPrompt = getAgentPrompt(targetAgent);
        const tools = this.getToolsForAgent(targetAgent);

        try {
            const response = await this.client.models.generateContent({
                model: MODEL,
                contents: [{ role: 'user', parts: [{ text: message }] }],
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.5,
                    maxOutputTokens: 2048,
                },
                // Note: Function calling config would go here when Gemini supports it
                // tools: [{ functionDeclarations: tools }],
            });

            const text = response.text ?? 'Ich konnte keine Antwort generieren.';

            // Determine appropriate chips based on agent type
            const chips = this.getChipsForAgent(targetAgent);
            const primaryAction = this.getPrimaryActionForAgent(targetAgent, context);

            return {
                text,
                agentRole: targetAgent,
                ui: {
                    chips,
                    primaryAction,
                    explain: this.generateExplanation(targetAgent, message),
                },
            };
        } catch (error) {
            logger.error({ error, targetAgent }, 'Specialist delegation failed');
            return {
                text: `${targetAgent} Agent konnte die Anfrage nicht bearbeiten. Bitte versuchen Sie es erneut.`,
                agentRole: targetAgent,
            };
        }
    }

    /**
     * Get available tools for a specific agent.
     */
    private getToolsForAgent(agent: AgentRole): typeof TOOL_SCHEMAS {
        // Filter tools based on agent role
        const toolMap: Record<AgentRole, string[]> = {
            router: [],
            scout: ['scout.get_conditions_snapshot', 'scout.recommend_plan'],
            bureaucracy: ['bureaucracy.generate_export_pack', 'bureaucracy.create_guest_permit_pdf'],
            quartermaster: ['gear.generate_checklist'],
            journal: ['timeline.start_session', 'timeline.log_event', 'timeline.end_session'],
            pack: ['pack.create_event', 'pack.assign_role'],
            feed: ['feed.publish_post'],
            news: ['news.ingest_sources', 'news.summarize_with_citations'],
            moderation: ['moderation.check_post'],
            privacy: [],
        };

        const allowedTools = toolMap[agent] || [];
        return TOOL_SCHEMAS.filter(tool => allowedTools.includes(tool.name));
    }

    /**
     * Get appropriate action chips for agent type.
     */
    private getChipsForAgent(agent: AgentRole): ActionChip[] {
        const chipMap: Record<AgentRole, ActionChip[]> = {
            router: ['Explain'],
            scout: ['Plan', 'Do', 'Explain'],
            bureaucracy: ['Plan', 'Do', 'Save'],
            quartermaster: ['Do', 'Save'],
            journal: ['Do', 'Save', 'Share'],
            pack: ['Plan', 'Do', 'Share'],
            feed: ['Plan', 'Do', 'Share'],
            news: ['Explain'],
            moderation: ['Explain'],
            privacy: ['Explain'],
        };
        return chipMap[agent] || ['Explain'];
    }

    /**
     * Get primary action for agent type.
     */
    private getPrimaryActionForAgent(agent: AgentRole, context: AgentContext) {
        const actionMap: Record<AgentRole, { label: string; tool: string } | undefined> = {
            router: undefined,
            scout: { label: 'Jagdplan erstellen', tool: 'scout.recommend_plan' },
            bureaucracy: { label: 'Export erstellen', tool: 'bureaucracy.generate_export_pack' },
            quartermaster: { label: 'Checkliste erstellen', tool: 'gear.generate_checklist' },
            journal: { label: 'Jagd starten', tool: 'timeline.start_session' },
            pack: { label: 'Event erstellen', tool: 'pack.create_event' },
            feed: { label: 'Veröffentlichen', tool: 'feed.publish_post' },
            news: undefined,
            moderation: undefined,
            privacy: undefined,
        };
        return actionMap[agent];
    }

    /**
     * Generate explanation bullets for the UI.
     */
    private generateExplanation(agent: AgentRole, message: string): string[] {
        const explanations: Record<AgentRole, string[]> = {
            router: ['Allgemeine Anfrage bearbeitet'],
            scout: [
                'Wetterbedingungen analysiert',
                'Windrichtung berücksichtigt',
                'Optimales Zeitfenster berechnet',
            ],
            bureaucracy: [
                'Regionale Anforderungen geprüft',
                'Pflichtfelder identifiziert',
                'Export-Format vorbereitet',
            ],
            quartermaster: [
                'Wettervorhersage berücksichtigt',
                'Ausrüstung geprüft',
                'Checkliste personalisiert',
            ],
            journal: [
                'Zeitachse aktualisiert',
                'Ereignis protokolliert',
                'Standort verarbeitet',
            ],
            pack: [
                'Teilnehmer benachrichtigt',
                'Rollen zugewiesen',
                'Sicherheitshinweise ergänzt',
            ],
            feed: [
                'Datenschutz-Einstellungen angewandt',
                'Moderation durchgeführt',
                'Standort anonymisiert',
            ],
            news: [
                'Quellen geprüft',
                'Zusammenfassung erstellt',
                'Quellenangaben hinzugefügt',
            ],
            moderation: [
                'Inhalt geprüft',
                'Richtlinien angewandt',
                'Entscheidung protokolliert',
            ],
            privacy: [
                'Datenschutz-Regeln angewandt',
                'Standort anonymisiert',
                'Metadaten entfernt',
            ],
        };
        return explanations[agent] || [];
    }
}

export default RouterAgent;
