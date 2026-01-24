/**
 * PRD Generator
 *
 * Generates Ralph-compatible prd.json from build requests and architecture plans.
 * Stories are split into user-facing (shown in review) and internal (hidden).
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
 * Extract user-facing feature stories from the description and architecture.
 * These describe WHAT the user sees and interacts with, not HOW it's built.
 */
function extractFeatureStories(description: string, _plan: ArchitecturePlan): Array<{ title: string; description: string; acceptanceCriteria: string[] }> {
  const desc = description.toLowerCase();
  const stories: Array<{ title: string; description: string; acceptanceCriteria: string[] }> = [];

  if (desc.includes('counter')) {
    stories.push({
      title: 'Display and update a counter',
      description: 'Show a numeric counter that the user can increment, decrement, and reset.',
      acceptanceCriteria: [
        'Counter displays current count value (starts at 0)',
        'Increment button increases count by 1',
        'Decrement button decreases count by 1',
        'Reset button sets count back to 0',
      ],
    });
  }
  if (desc.includes('timer') || desc.includes('stopwatch')) {
    stories.push({
      title: 'Timer with start/stop controls',
      description: 'Provide a timer that counts elapsed time with start, pause, and reset controls.',
      acceptanceCriteria: [
        'Timer displays elapsed time in minutes:seconds format',
        'Start button begins counting',
        'Pause button freezes the timer',
        'Reset button stops and clears back to 00:00',
      ],
    });
  }
  if (desc.includes('todo') || desc.includes('task')) {
    stories.push({
      title: 'Add and manage tasks',
      description: 'Let the user create, complete, and delete tasks in a list.',
      acceptanceCriteria: [
        'Text input allows typing a new task',
        'Pressing Enter or clicking Add creates the task',
        'Each task has a checkbox to mark it complete',
        'Completed tasks are visually distinct (strikethrough or faded)',
        'Delete button removes a task from the list',
        'Empty state message shown when there are no tasks',
      ],
    });
  }
  if (desc.includes('note') || desc.includes('notepad')) {
    stories.push({
      title: 'Write and save notes',
      description: 'Provide a text area where the user can write notes and save them.',
      acceptanceCriteria: [
        'Text area accepts multi-line input',
        'Save button persists the current note',
        'Visual confirmation shown after saving',
      ],
    });
  }
  if (desc.includes('word') && (desc.includes('count') || desc.includes('counter'))) {
    stories.push({
      title: 'Real-time text statistics',
      description: 'Show word count, character count, and sentence count as the user types.',
      acceptanceCriteria: [
        'Word count updates in real-time',
        'Character count (with and without spaces) shown',
        'Sentence count shown',
        'Stats display is always visible below/beside the input',
      ],
    });
  }
  if (desc.includes('calculator')) {
    stories.push({
      title: 'Basic calculator operations',
      description: 'A calculator with number pad and basic arithmetic operations.',
      acceptanceCriteria: [
        'Number pad with digits 0-9',
        'Buttons for +, -, *, / operations',
        'Display shows current input and computed result',
        'Clear button resets the display',
        'Equals button computes the result',
      ],
    });
  }
  if (desc.includes('chat') || desc.includes('messaging')) {
    stories.push({
      title: 'Send and view messages',
      description: 'A chat interface where the user can send messages and see a conversation thread.',
      acceptanceCriteria: [
        'Text input for composing messages',
        'Send button (or Enter key) submits the message',
        'Sent messages appear in a scrollable conversation view',
        'Messages show timestamp',
      ],
    });
  }
  if (desc.includes('agent') || desc.includes('ai')) {
    stories.push({
      title: 'AI-powered responses',
      description: 'The app uses an AI agent to respond to user input.',
      acceptanceCriteria: [
        'User messages are sent to the AI agent',
        'AI responses appear in the conversation',
        'Loading state shown while waiting for response',
      ],
    });
  }
  if (desc.includes('poem') || desc.includes('generator') || desc.includes('generate')) {
    stories.push({
      title: 'Generate content on demand',
      description: 'A button triggers content generation and displays the result.',
      acceptanceCriteria: [
        'Generate button triggers content creation',
        'Loading indicator while generating',
        'Result displays in a readable format',
      ],
    });
  }
  if (desc.includes('form') || desc.includes('input') || desc.includes('submit')) {
    stories.push({
      title: 'Form with user input',
      description: 'A form that collects user input and provides feedback on submission.',
      acceptanceCriteria: [
        'Form fields accept user input',
        'Submit button processes the form',
        'Validation errors shown for invalid input',
        'Success confirmation after submission',
      ],
    });
  }
  if (desc.includes('list') && !desc.includes('todo') && !desc.includes('task')) {
    stories.push({
      title: 'Display a list of items',
      description: 'Show items in a scrollable list with the ability to add and remove entries.',
      acceptanceCriteria: [
        'Items display in a vertical list',
        'User can add new items',
        'User can remove items',
        'Empty state shown when list is empty',
      ],
    });
  }

  // Fallback: if no patterns matched, create a single generic feature story
  if (stories.length === 0) {
    stories.push({
      title: description,
      description: `Build an app that: ${description}`,
      acceptanceCriteria: [
        'App launches and displays the main interface',
        'Core functionality works as described',
        'User interactions produce expected results',
      ],
    });
  }

  return stories;
}

/**
 * Generate a Ralph-compatible PRD from a build request and architecture plan.
 *
 * Stories are divided into:
 * - User-facing stories (shown during review, editable by user)
 * - Internal stories (hidden from review, auto-executed)
 */
export async function generatePRD(request: BuildRequest, plan: ArchitecturePlan): Promise<RalphPRD> {
  const appId = request.appId || slugify(request.description);
  const stories: RalphStory[] = [];
  let storyNum = 1;

  // --- User-facing feature stories (shown in review) ---
  const featureStories = extractFeatureStories(request.description, plan);
  for (const fs of featureStories) {
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: fs.title,
      priority: featureStories.length - stories.length + 10,
      passes: false,
      description: fs.description,
      acceptanceCriteria: fs.acceptanceCriteria,
    });
  }

  // --- Internal implementation stories (hidden from review, tagged with [internal]) ---

  // Internal: Scaffold manifest + entry component
  stories.push({
    id: `US-${String(storyNum++).padStart(3, '0')}`,
    title: '[internal] Create app scaffold',
    priority: 2,
    passes: false,
    description: `[internal] Create manifest.json and App.tsx for ${appId} so it loads in LiquidOS`,
    acceptanceCriteria: [
      `manifest.json exists at src/applications/${appId}/manifest.json`,
      `App.tsx renders without errors`,
      'Typecheck passes',
    ],
  });

  // Internal: Zustand store (if needed)
  if (plan.stores?.length) {
    for (const store of plan.stores) {
      stories.push({
        id: `US-${String(storyNum++).padStart(3, '0')}`,
        title: `[internal] Create ${store.name} store`,
        priority: 2,
        passes: false,
        description: `[internal] Create Zustand store ${store.name} with fields: ${store.fields.join(', ')}`,
        acceptanceCriteria: [
          `${store.name}.ts exists in src/applications/${appId}/`,
          `Store exports a use* hook`,
          'Typecheck passes',
        ],
      });
    }
  }

  // Internal: Executor (if hasAgent)
  if (plan.executor) {
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `[internal] Create AI agent executor`,
      priority: 2,
      passes: false,
      description: `[internal] Create AgentExecutor with skills: ${plan.executor.skills.map(s => s.id).join(', ')}`,
      acceptanceCriteria: [
        `server/src/a2a/executors/${appId}.ts exists`,
        `Executor implements AgentExecutor interface`,
        'Typecheck passes',
      ],
    });
  }

  // Internal: Component implementations
  for (const component of plan.components) {
    if (component.type === 'existing') continue;
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `[internal] Implement ${component.name}`,
      priority: 2,
      passes: false,
      description: `[internal] Create ${component.name} component using Glass design system`,
      acceptanceCriteria: [
        `${component.name}.tsx exists in src/applications/${appId}/components/`,
        'Typecheck passes',
      ],
    });
  }

  // Internal: New custom components
  if (plan.newComponents?.length) {
    for (const comp of plan.newComponents) {
      stories.push({
        id: `US-${String(storyNum++).padStart(3, '0')}`,
        title: `[internal] Create ${comp.name} with Storybook`,
        priority: 2,
        passes: false,
        description: `[internal] Create ${comp.category} component ${comp.name}`,
        acceptanceCriteria: [
          `${comp.name}.tsx exists`,
          `${comp.name}.stories.tsx exists`,
          'Typecheck passes',
        ],
      });
    }
  }

  // Internal: LiquidMind resources
  if (plan.resources?.length) {
    stories.push({
      id: `US-${String(storyNum++).padStart(3, '0')}`,
      title: `[internal] Seed AI resources`,
      priority: 2,
      passes: false,
      description: `[internal] Create LiquidMind resources: ${plan.resources.map(r => r.name).join(', ')}`,
      acceptanceCriteria: [
        'Resources created via API',
        'Typecheck passes',
      ],
    });
  }

  // Internal: Design audit (always last)
  stories.push({
    id: `US-${String(storyNum++).padStart(3, '0')}`,
    title: '[internal] Design audit',
    priority: 1,
    passes: false,
    description: '[internal] Verify all components follow Liquid Glass design system',
    acceptanceCriteria: [
      'No hex colors in component files',
      'All icons use lucide-react',
      'Typecheck passes',
      'Verify in browser',
    ],
  });

  return {
    project: request.description,
    branchName: `builder/${appId}`,
    userStories: stories,
  };
}
