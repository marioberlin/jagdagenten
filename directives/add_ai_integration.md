---
"name": "add_ai_integration"
"version": "2.0.0"
"updated": "2026-01-23"
---

# Add AI Integration

## Goal
Integrate AI capabilities into a component using the Liquid Engine hooks, Liquid Wire protocol, and **LiquidMind** persistent resources.

## Prerequisites
- Component already exists
- Understanding of Liquid Engine (`src/liquid-engine/`)
- Understanding of LiquidMind resource system (see `docs/infrastructure/liquidmind.md`)
- Gemini API key configured in `.env` (or Claude, or Proxy)
- PostgreSQL running (for LiquidMind persistence)

## Inputs
- Component to integrate with AI
- What state should be exposed to AI?
- What actions should AI be able to invoke?
- Context strategy: `flat` or `tree`
- **What persistent resources does this app/agent need?** (prompts, memory, knowledge, skills)

## Tools/Scripts
```bash
bun run dev          # Test AI integration in dev mode
bun run lint         # Verify code quality
bun run build        # Ensure build succeeds
```

## Outputs
- Component with AI hooks integrated
- Registered actions callable by AI
- Exposed state readable by AI
- **LiquidMind resources stored in PostgreSQL** (not localStorage)

## Success Criteria
- `useLiquidAction` hooks registered successfully
- `useLiquidReadable` hooks expose component state
- AI can read component state and invoke actions
- Liquid Wire protocol maintained (no direct LLM calls)
- **Resources persist in PostgreSQL via `/api/resources`**
- **Context compilation includes the app's resources**

## Steps

1. **Import Liquid Engine hooks**
   ```tsx
   import { useLiquidAction, useLiquidReadable } from '@/liquid-engine';
   ```

2. **Expose component state to AI**
   ```tsx
   useLiquidReadable({
     id: 'component-state-unique-id',
     name: 'Human Readable Name',
     value: currentState // The state object AI can read
   });
   ```

3. **Register AI-invokable actions**
   ```tsx
   useLiquidAction({
     name: 'actionName',
     description: 'Clear description for AI about what this does',
     parameters: [
       {
         name: 'paramName',
         type: 'string', // or 'number', 'boolean', 'object'
         description: 'What this parameter represents',
         required: true
       }
     ],
     handler: async (args) => {
       // Implementation
       return { success: true, message: 'Action completed' };
     }
   });
   ```

4. **Store persistent resources via LiquidMind**

   All AI resources (prompts, memory, knowledge, skills, etc.) MUST use the LiquidMind API. **Never use localStorage for AI data.**

   ```tsx
   import { useResourceStore } from '@/stores/resourceStore';

   const { createResource, updateResource } = useResourceStore();

   // Create a system prompt for your app
   await createResource({
     resourceType: 'prompt',
     ownerType: 'app',         // or 'agent' for A2A agents
     ownerId: 'your-app-id',   // Must match your app's ID
     name: 'System Prompt',
     content: 'You are a helpful assistant for...',
     typeMetadata: {
       type: 'prompt',
       template: 'Analyze {topic} using {method}',
       variables: ['topic', 'method'],
     },
     tags: ['system'],
     provenance: 'user_input',
   });

   // Store knowledge
   await createResource({
     resourceType: 'knowledge',
     ownerType: 'app',
     ownerId: 'your-app-id',
     name: 'Domain Knowledge',
     content: 'Important facts the AI should know...',
     typeMetadata: { type: 'knowledge', sourceType: 'input' },
     tags: ['domain'],
     provenance: 'user_input',
   });
   ```

5. **Use context compilation in chat flows**

   The `useLiquidAssistant` hook automatically compiles your app's resources into the AI context:

   ```tsx
   import { useLiquidAssistant } from '@/hooks/useLiquidAssistant';

   const { messages, sendMessage, isLoading } = useLiquidAssistant();
   // Resources for the focused app/agent are automatically compiled
   // into the system prompt sent to the AI
   ```

   For custom compilation:
   ```tsx
   import { compileContext } from '@/utils/compileContext';
   import { useResourcesForTarget } from '@/hooks/useResourcesForTarget';

   const { resources } = useResourcesForTarget({ ownerType: 'app', ownerId: 'your-app-id' });
   const compiled = compileContext(resources, { tokenBudget: 8000 });
   // compiled.systemPrompt contains the layered context
   ```

6. **Follow Liquid Wire protocol**
   - DO NOT call LLM services directly
   - All AI interactions go through registered actions
   - Use `LLMServiceRouter` for capability-based routing (handled automatically)

7. **Test the integration**
   ```bash
   bun run dev
   ```
   - Open component in browser
   - Use AI features to verify actions work
   - Check that state updates are reflected
   - Verify resources appear in AI Explorer

8. **Verify build**
   ```bash
   bun run lint
   bun run build
   ```

## LiquidMind Resource Types

| Type | When to Use | Key Metadata |
|------|-------------|--------------|
| `prompt` | System prompts, templates | `template`, `variables[]` |
| `memory` | Persistent facts, user preferences | `layer`, `importance` (0-1) |
| `context` | App state, configuration | `contextType`, `priority` |
| `knowledge` | Static docs, FAQs, domain info | `sourceType`, `ragStoreId` |
| `artifact` | Generated outputs | `category`, `artifactId` |
| `skill` | AI-invokable capabilities | `triggers[]`, `toolNames[]` |
| `mcp` | External tool servers | `serverUrl`, `transport` |

## Edge Cases
- If using route-specific context, ensure component is under the right route
- Image generation always uses Gemini (regardless of selected provider)
- File search capabilities always use Gemini
- Text/Chat uses user-selected provider (Gemini, Claude, or Proxy)
- **Memory resources decay over time** — pin important ones with `isPinned: true`
- **Shared resources** appear in the target's compilation — be mindful of what you share

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Actions not appearing | Check that component is mounted and hooks are called |
| State not updating | Verify `useLiquidReadable` is using current state, not stale |
| Type errors in parameters | Ensure parameter types match TypeScript interfaces |
| AI can't invoke action | Check `AgentConfigContext` is wrapping the component |
| Resources not persisting | Ensure PostgreSQL is running and `/api/resources` is accessible |
| Context not including resources | Check `ownerType`/`ownerId` match the focused target |
| Memory disappearing | Check importance score — below 0.2 gets archived. Use `isPinned: true` |

## Learning Notes
- The Liquid Wire protocol ensures all AI interactions are traceable
- Context strategy (`flat` vs `tree`) affects which contexts are available
- Always provide clear descriptions for AI to understand actions
- **LiquidMind** replaces localStorage for all AI resource persistence
- Resources are versioned — every update creates a version snapshot
- Use `shareResource()` to give other apps/agents access to your resources
- The context compiler respects a token budget (default 8000) — excess resources are deferred

---

*Created: 2026-01-08 · Updated: 2026-01-23 (LiquidMind integration)*
