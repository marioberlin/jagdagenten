import { ContextStrategy, ReadableContext } from './definitions';

export class TreeContextStrategy implements ContextStrategy {
    name = 'tree';
    description = 'Only relevant contexts based on hierarchy and focus are included.';

    buildPrompt(contexts: Map<string, ReadableContext>, focusId?: string): string {
        const allContexts = Array.from(contexts.values());
        const includedContexts = new Set<ReadableContext>();

        // 1. Always include 'global' and 'user' contexts
        allContexts.forEach(ctx => {
            if (ctx.type === 'global' || ctx.type === 'user') {
                includedContexts.add(ctx);
            }
        });

        // 2. If we have a focusId, traverse up the tree
        if (focusId) {
            let currentId: string | undefined = focusId;
            const visited = new Set<string>(); // Prevent cycles

            while (currentId && !visited.has(currentId)) {
                visited.add(currentId);
                const ctx = contexts.get(currentId);

                if (ctx) {
                    includedContexts.add(ctx);
                    currentId = ctx.parentId;
                } else {
                    // Context not found (maybe unregistered usually?), stop traversing
                    break;
                }
            }
        } else {
            // No focus? Only show global stuff (already added)
            // Or maybe fallback to showing 'page' types if we want a default "show all high level pages" behavior? 
            // For now, strict pruning is safer.
        }

        // 3. Render the included contexts
        const sortedContexts = Array.from(includedContexts).sort((a, b) => {
            // Sort by priority (descending), then generic type order
            const pA = a.priority || 0;
            const pB = b.priority || 0;
            if (pA !== pB) return pB - pA;
            return 0;
        });

        if (sortedContexts.length === 0) return '';

        const sections = sortedContexts.map(ctx =>
            `## ${ctx.description} [${ctx.type || 'unknown'}]\n\`\`\`json\n${JSON.stringify(ctx.value, null, 2)}\n\`\`\``
        );

        return `# Current Application State (Tree Mode - Focused: ${focusId || 'None'})\n\n${sections.join('\n\n')}`;
    }
}
