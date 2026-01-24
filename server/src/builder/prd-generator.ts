/**
 * PRD Generator
 *
 * Generates Ralph-compatible prd.json from build requests and architecture plans.
 * Follows ralph_convert.md rules: atomic stories, sequential ordering, typecheck criteria.
 */

import type {
  BuildRequest,
  ArchitecturePlan,
  RalphPRD,
  RalphStory,
} from './types.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/**
 * Generate a Ralph-compatible PRD from a build request and architecture plan.
 */
export async function generatePRD(request: BuildRequest, plan: ArchitecturePlan): Promise<RalphPRD> {
  const appId = request.appId || slugify(request.description);
  const stories: RalphStory[] = [];
  let storyNum = 1;
  let priority = 10;

  // Story 1: Scaffold manifest + entry component
  stories.push({
    id: `US-${String(storyNum++).padStart(3, '0')}`,
    title: 'Create app manifest and entry component',
    priority: priority--,
    passes: false,
    description: `Create the app scaffold for ${appId} so it loads in LiquidOS`,
    acceptanceCriteria: [
      `manifest.json exists at src/applications/${appId}/manifest.json`,
      `App.tsx renders without errors`,
      `App appears in Dock when dock.enabled is true`,
      'Typecheck passes',
    ],
  });

  // Story 2: Zustand store (if needed)
  if (plan.stores?.length) {
    for (const store of plan.stores) {
      stories.push({
        id: `US-${String(storyNum++).padStart(3, '0')}`,
        title: `Create ${store.name} Zustand store`,
        priority: priority--,
        passes: false,
        description: `Create Zustand store ${store.name} with fields: ${store.fields.join(', ')}`,
        acceptanceCriteria: [
          `${store.name}.ts exists in src/applications/${appId}/`,
          `Store exports a use* hook`,
          `Store has fields: ${store.fields.join(', ')}`,
          'Typecheck passes',
        ],
      });
    }
  }

  // Story 3: Executor (if hasAgent)
  if (plan.executor) {
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `Create A2A executor for ${appId}`,
      priority: priority--,
      passes: false,
      description: `Create AgentExecutor with skills: ${plan.executor.skills.map(s => s.id).join(', ')}`,
      acceptanceCriteria: [
        `server/src/a2a/executors/${appId}.ts exists`,
        `Executor implements AgentExecutor interface`,
        `Agent card has correct skills defined`,
        `Executor registered in router (elysia-plugin.ts)`,
        'Typecheck passes',
      ],
    });
  }

  // Stories: Component implementation
  for (const component of plan.components) {
    if (component.type === 'existing') continue; // Skip existing components

    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `Implement ${component.name} component`,
      priority: priority--,
      passes: false,
      description: `Create ${component.name} component using Glass design system`,
      acceptanceCriteria: [
        `${component.name}.tsx exists in src/applications/${appId}/components/`,
        `Component uses semantic tokens only (no hex colors)`,
        `Component uses lucide-react icons (no emojis)`,
        'Typecheck passes',
        'Verify in browser using browser tool',
      ],
    });
  }

  // Stories: New custom components (Glass/A2UI/SmartGlass)
  if (plan.newComponents?.length) {
    for (const comp of plan.newComponents) {
      stories.push({
        id: `US-${String(storyNum++).padStart(3, '0')}`,
        title: `Create ${comp.name} component with Storybook story`,
        priority: priority--,
        passes: false,
        description: `Create ${comp.category} component ${comp.name} in ${comp.location}/${comp.subdir}/`,
        acceptanceCriteria: [
          `${comp.name}.tsx exists at ${comp.location}/${comp.subdir}/${comp.name}.tsx`,
          `${comp.name}.stories.tsx exists with Default, WithProps, and Interactive stories`,
          `Component uses lucide-react icons (no emojis)`,
          `Component uses semantic tokens only (no hex colors)`,
          ...(comp.category === 'a2ui' ? ['Component registered in GLASS_COMPONENT_CATALOG'] : []),
          ...(comp.category === 'smartglass' && comp.smartEnhancement
            ? [`SmartEnhancement "${comp.smartEnhancement}" works correctly`]
            : []),
          'Typecheck passes',
          'Storybook renders without errors',
          'Verify in browser using browser tool',
        ],
      });
    }
  }

  // Story: LiquidMind resources (if hasResources)
  if (plan.resources?.length) {
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `Seed LiquidMind resources for ${appId}`,
      priority: priority--,
      passes: false,
      description: `Create and seed LiquidMind resources: ${plan.resources.map(r => r.name).join(', ')}`,
      acceptanceCriteria: [
        `Resources created via POST /api/resources`,
        `Resources have correct ownerType and ownerId`,
        ...plan.resources.map(r => `Resource "${r.name}" (type: ${r.type}) exists`),
        'Typecheck passes',
      ],
    });
  }

  // Final story: Design audit
  stories.push({
    id: `US-${String(storyNum++).padStart(3, '0')}`,
    title: 'Design audit and final verification',
    priority: 1,
    passes: false,
    description: 'Verify all components follow Liquid Glass design system',
    acceptanceCriteria: [
      'No hex colors in component files',
      'No emojis in any source files',
      'All icons use lucide-react imports',
      'All components use semantic tokens (text-primary, bg-glass-surface, etc.)',
      ...(plan.newComponents?.length ? [
        'All new components have Storybook stories',
        'Storybook builds without errors',
      ] : []),
      'Typecheck passes',
      'Verify in browser using browser tool',
    ],
  });

  return {
    project: request.description,
    branchName: `builder/${appId}`,
    userStories: stories,
  };
}
