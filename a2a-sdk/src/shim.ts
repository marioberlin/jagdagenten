
import { ClientFactory } from './client/client-factory';
import { JSONRPCTransport } from './transports/jsonrpc-transport';
import * as Types from './types/index';
import { AgentCard } from './types/index';
import { Client, ClientConfig } from './client/interfaces';

// Re-export types
export * from './types/index';

export class A2AClientError extends Error {
    constructor(message: string, public code: number) {
        super(message);
        this.name = 'A2AClientError';
    }
}

export type A2AClient = Client;
export type A2AClientConfig = ClientConfig & {
    enableA2UI?: boolean;
    baseUrl?: string;
    authToken?: string;
};

export const createA2AClient = (config: A2AClientConfig): A2AClient => {
    // Adapter to match useA2AClient expectation with ClientFactory
    const card: AgentCard = {
        url: config.baseUrl || '',
        name: 'Agent',
        description: 'Auto-created client',
        version: '1.0.0',
        capabilities: {},
        default_input_modes: [],
        default_output_modes: [],
        skills: []
    };

    // In the real SDK, ClientFactory.createClient takes a card. 
    // We construct a minimal card here to satisfy the signature, 
    // assuming the client will potentially fetch the real card later or use the URL.
    return ClientFactory.createClient(card, config);
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
        // Real implementation would check extension URI
        return artifact?.extensions?.some((ext: string) => ext.includes('a2ui')) ?? false;
    }

    export function extractA2UIMessages(artifact: any): A2UIMessage[] {
        // Real implementation would parse the artifact parts
        if (artifact.parts) {
            return artifact.parts
                .filter((p: any) => p.kind === 'data' && p.data && p.data.a2ui_messages)
                .flatMap((p: any) => p.data.a2ui_messages);
        }
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
