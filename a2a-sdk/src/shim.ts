
import * as Types from './minimal-types';

export class A2AClientError extends Error {
    constructor(message: string, public code: number) {
        super(message);
        this.name = 'A2AClientError';
    }
}

export interface A2AClientConfig {
    baseUrl: string;
    authToken?: string;
    enableA2UI?: boolean;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface A2AClient {
    getAgentCard(): Promise<Types.AgentCard>;
    sendText(text: string, options?: any): Promise<Types.Task>;
    streamText(text: string, options?: any, signalOpt?: any): AsyncIterableIterator<StreamEvent>;
    cancelTask(taskId: string): Promise<void>;
    getTask(taskId: string): Promise<Types.Task>;
    close(): void;
}

export const createA2AClient = (config: A2AClientConfig): A2AClient => {
    return {
        getAgentCard: async () => ({
            url: config.baseUrl,
            name: 'Mock Agent',
            capabilities: { streaming: true },
            skills: []
        }),
        sendText: async (text) => ({
            id: 'mock-task',
            status: { state: 'completed' },
            context_id: 'ctx',
            artifacts: []
        }),
        streamText: async function* (text) {
            yield { type: 'status', data: { status: { state: 'working' } } };
            yield { type: 'complete', task: { id: 'mock', status: { state: 'completed' }, context_id: 'ctx' } };
        },
        cancelTask: async () => { },
        getTask: async () => ({ id: 'mock', status: { state: 'completed' }, context_id: 'ctx' }),
        close: () => { }
    };
};

export namespace v1 {
    export type Task = Types.Task;
    export type AgentCard = Types.AgentCard;
    export type MessageSendConfiguration = Types.MessageSendConfiguration;
    export type JSONValue = Types.JSONValue;
    export type Artifact = Types.Artifact;

    export function isTextPart(part: any): part is Types.TextPart {
        return part.kind === 'text';
    }
}

export type StreamEvent =
    | { type: 'complete'; task: v1.Task }
    | { type: 'error'; error: any }
    | { type: 'status'; data: { status: Types.TaskStatus } }
    | { type: 'artifact'; data: { artifact: v1.Artifact } };


export namespace a2ui {
    export interface A2UIComponent {
        id: string;
        type: string;
        [key: string]: any;
    }

    export interface A2UISurfaceStyling {
        [key: string]: any;
    }

    export interface A2UIMessage {
        surfaceId: string;
    }

    export interface BeginRenderingMessage extends A2UIMessage {
        type: 'begin-rendering';
        rootComponentId: string;
        styling?: A2UISurfaceStyling;
    }

    export interface SurfaceUpdateMessage extends A2UIMessage {
        type: 'surface-update';
        components: A2UIComponent[];
    }

    export interface SetModelMessage extends A2UIMessage {
        type: 'set-model';
        model: Record<string, any>;
    }

    export function isA2UIArtifact(artifact: any): boolean {
        return artifact?.extensions?.includes('a2ui');
    }

    export function extractA2UIMessages(artifact: any): A2UIMessage[] {
        return [];
    }

    export function isBeginRenderingMessage(msg: A2UIMessage): msg is BeginRenderingMessage {
        return (msg as any).type === 'begin-rendering';
    }

    export function isSurfaceUpdateMessage(msg: A2UIMessage): msg is SurfaceUpdateMessage {
        return (msg as any).type === 'surface-update';
    }

    export function isSetModelMessage(msg: A2UIMessage): msg is SetModelMessage {
        return (msg as any).type === 'set-model';
    }
}
