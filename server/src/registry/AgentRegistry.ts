/**
 * Agent Registry
 * 
 * Manages registered A2A agents for discovery and routing.
 */

export interface Agent {
    id: string;
    card?: {
        name?: string;
        description?: string;
        url?: string;
        skills?: Array<{
            id: string;
            name?: string;
            description?: string;
            tags?: string[];
        }>;
    };
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastSeen?: string;
}

class AgentRegistry {
    private agents: Map<string, Agent> = new Map();

    getAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    getAgent(id: string): Agent | undefined {
        return this.agents.get(id);
    }

    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
    }

    unregisterAgent(id: string): boolean {
        return this.agents.delete(id);
    }

    updateStatus(id: string, status: Agent['status']): void {
        const agent = this.agents.get(id);
        if (agent) {
            agent.status = status;
            agent.lastSeen = new Date().toISOString();
        }
    }
}

export const agentRegistry = new AgentRegistry();
