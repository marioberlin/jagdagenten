import { ContextStrategy, ReadableContext } from './definitions';

export class FlatContextStrategy implements ContextStrategy {
    name = 'flat';
    description = 'All registered contexts are included in the prompt (Legacy behavior).';

    buildPrompt(contexts: Map<string, ReadableContext>, _focusId?: string): string {
        const contextList = Array.from(contexts.values());
        if (contextList.length === 0) return '';

        const sections = contextList.map(ctx =>
            `## ${ctx.description}\n\`\`\`json\n${JSON.stringify(ctx.value, null, 2)}\n\`\`\``
        );

        return `# Current Application State (Flat Mode)\n\n${sections.join('\n\n')}`;
    }
}
