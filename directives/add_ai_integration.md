---
"name": "add_ai_integration"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Add AI Integration

## Goal
Integrate AI capabilities into a component using the Liquid Engine hooks and Liquid Wire protocol.

## Prerequisites
- Component already exists
- Understanding of Liquid Engine (`src/liquid-engine/`)
- Gemini API key configured in `.env` (or Claude, or Proxy)

## Inputs
- Component to integrate with AI
- What state should be exposed to AI?
- What actions should AI be able to invoke?
- Context strategy: `flat` or `tree`

## Tools/Scripts
```bash
npm run dev          # Test AI integration in dev mode
npm run lint         # Verify code quality
npm run build        # Ensure build succeeds
```

## Outputs
- Component with AI hooks integrated
- Registered actions callable by AI
- Exposed state readable by AI

## Success Criteria
- `useLiquidAction` hooks registered successfully
- `useLiquidReadable` hooks expose component state
- AI can read component state and invoke actions
- Liquid Wire protocol maintained (no direct LLM calls)

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

4. **Follow Liquid Wire protocol**
   - DO NOT call LLM services directly
   - All AI interactions go through registered actions
   - Use `LLMServiceRouter` for capability-based routing (handled automatically)

5. **Test the integration**
   ```bash
   npm run dev
   ```
   - Open component in browser
   - Use AI features to verify actions work
   - Check that state updates are reflected

6. **Verify build**
   ```bash
   npm run lint
   npm run build
   ```

## Edge Cases
- If using route-specific context, ensure component is under the right route
- Image generation always uses Gemini (regardless of selected provider)
- File search capabilities always use Gemini
- Text/Chat uses user-selected provider (Gemini, Claude, or Proxy)

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Actions not appearing | Check that component is mounted and hooks are called |
| State not updating | Verify `useLiquidReadable` is using current state, not stale |
| Type errors in parameters | Ensure parameter types match TypeScript interfaces |
| AI can't invoke action | Check `AgentConfigContext` is wrapping the component |

## Learning Notes
- The Liquid Wire protocol ensures all AI interactions are traceable
- Context strategy (`flat` vs `tree`) affects which contexts are available
- Always provide clear descriptions for AI to understand actions

---

*Created: 2026-01-08*
