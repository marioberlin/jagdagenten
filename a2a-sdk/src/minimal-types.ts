
// Minimal types needed for shim
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export interface TextPart {
    kind: 'text';
    text: string;
    metadata?: Record<string, JSONValue>;
}

export type Part = TextPart | { kind: 'file'; file: any } | { kind: 'data'; data: any };

export interface Artifact {
    artifact_id: string;
    description?: string;
    extensions?: string[];
    metadata?: Record<string, JSONValue>;
    name?: string;
    parts: Part[];
}

export interface Message {
    id: string;
    role: 'user' | 'agent';
    content?: string; // Add if needed, simplified
    // ... maps to Message in hook
}

export interface TaskStatus {
    message?: any; // Simplified
    state: string;
    timestamp?: string;
}

export interface Task {
    id: string;
    status: TaskStatus;
    artifacts?: Artifact[];
    context_id: string;
    kind?: 'task';
    // ...
}

export interface MessageSendConfiguration {
    // ...
}

export interface AgentCard {
    capabilities?: {
        streaming?: boolean;
        pushNotifications?: boolean;
        extensions?: { uri: string }[];
    };
    skills?: any[];
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
    url: string;
    name: string;
    preferred_transport?: string;
}

export interface AgentExtension {
    uri: string;
}
