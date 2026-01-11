export interface ReadableContext {
    id: string;
    description: string;
    value: unknown;
    // NEW METADATA FOR TREE STRATEGY
    parentId?: string; // ID of parent context
    type?: 'global' | 'page' | 'component' | 'user';
    priority?: number; // Higher priority = less likely to be pruned
}

export interface ContextStrategy {
    name: string;
    description: string;
    /**
     * Build the system prompt section for the given contexts and optional focus.
     */
    buildPrompt(contexts: Map<string, ReadableContext>, focusId?: string): string;
}
