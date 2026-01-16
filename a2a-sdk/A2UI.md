# A2UI (Agent-to-User Interface) Guide

A2UI is an open-source standard enabling AI agents to generate rich, interactive user interfaces through declarative JSON. This guide covers the A2A SDK's A2UI implementation.

> **Reference**: [A2UI Specification](https://github.com/google/a2ui)

## Overview

A2UI allows AI agents to:

1. Generate dynamic UI components declaratively
2. Stream UI updates in real-time
3. Handle user interactions via callbacks
4. Maintain consistent styling across surfaces

The key principle is that A2UI components are **declarative data**, not executable code. This provides security by restricting agents to pre-approved components from a trusted catalog.

## Quick Start

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

// Create a simple card with text and button
const card = a2ui.card('welcome-card', [
  a2ui.text('title', 'Welcome!'),
  a2ui.button('action-btn', 'Get Started', a2ui.callback('start-clicked')),
]);

// Create messages for streaming
const messages = [
  a2ui.beginRendering('main-surface', 'welcome-card'),
  a2ui.surfaceUpdate('main-surface', [card]),
];

// Create an A2UI artifact part for A2A response
const uiPart = a2ui.createA2UIPart(messages);
```

## Component Types

The SDK supports 50+ component types organized by category:

### Layout Components

| Type | Description | Helper |
|------|-------------|--------|
| `container` | Generic container | - |
| `row` | Horizontal layout | `a2ui.row(id, children, style?)` |
| `column` | Vertical layout | `a2ui.column(id, children, style?)` |
| `grid` | Grid layout | - |
| `stack` | Stack layout | - |

```typescript
// Row with items
const header = a2ui.row('header', [
  a2ui.text('logo', 'MyApp'),
  a2ui.button('menu', 'Menu'),
], { justifyContent: 'space-between' });

// Column with spacing
const sidebar = a2ui.column('sidebar', [
  a2ui.text('nav-1', 'Home'),
  a2ui.text('nav-2', 'Settings'),
], { gap: 16 });
```

### Text Components

| Type | Description | Helper |
|------|-------------|--------|
| `text` | Plain text | `a2ui.text(id, content, style?)` |
| `heading` | Heading (h1-h6) | - |
| `paragraph` | Paragraph text | - |
| `markdown` | Markdown content | - |
| `code-block` | Code display | - |

```typescript
const content = a2ui.column('content', [
  { id: 'h1', type: 'heading', props: { text: 'Title', level: 1 } },
  a2ui.text('intro', 'Welcome to our application'),
  { id: 'code', type: 'code-block', props: { text: 'const x = 1;' } },
]);
```

### Input Components

| Type | Description | Helper |
|------|-------------|--------|
| `text-field` | Text input | `a2ui.textField(id, label, props?)` |
| `text-area` | Multi-line input | - |
| `select` | Dropdown select | - |
| `checkbox` | Checkbox input | - |
| `radio` | Radio button | - |
| `switch` | Toggle switch | - |
| `slider` | Range slider | - |
| `date-picker` | Date selection | - |
| `time-picker` | Time selection | - |
| `file-upload` | File upload | - |

```typescript
const loginForm = a2ui.form('login-form', [
  a2ui.textField('email', 'Email', { required: true }),
  a2ui.textField('password', 'Password', { type: 'password' }),
  a2ui.button('submit', 'Login', a2ui.callback('login')),
], a2ui.callback('form-submit'));
```

### Display Components

| Type | Description | Helper |
|------|-------------|--------|
| `card` | Container card | `a2ui.card(id, children, props?, style?)` |
| `list` | Ordered/unordered list | `a2ui.list(id, items, ordered?)` |
| `table` | Data table | - |
| `image` | Image display | `a2ui.image(id, src, alt?, style?)` |
| `icon` | Icon display | - |
| `badge` | Badge/chip | - |
| `avatar` | User avatar | - |

```typescript
// Card with content
const productCard = a2ui.card('product', [
  a2ui.image('img', 'https://...', 'Product image'),
  a2ui.text('name', 'Widget Pro'),
  a2ui.text('price', '$99.99'),
  a2ui.button('buy', 'Buy Now', a2ui.callback('purchase')),
]);

// List of items
const menuList = a2ui.list('menu', [
  { id: 'item-1', type: 'list-item', props: { text: 'Home' } },
  { id: 'item-2', type: 'list-item', props: { text: 'About' } },
], false);
```

### Data Components

| Type | Description |
|------|-------------|
| `chart` | Data visualization |
| `map` | Geographic map |
| `progress` | Progress indicator |

```typescript
const chartComponent: A2UIComponent = {
  id: 'sales-chart',
  type: 'chart',
  props: {
    chartType: 'bar',
    data: salesData,
    xAxis: 'month',
    yAxis: 'revenue',
  },
};
```

### Interactive Components

| Type | Description | Helper |
|------|-------------|--------|
| `button` | Interactive button | `a2ui.button(id, label, onClick?, props?)` |
| `link` | Hyperlink | - |
| `tabs` | Tab container | - |
| `accordion` | Collapsible sections | - |
| `carousel` | Image carousel | - |

```typescript
const nav = a2ui.row('nav', [
  a2ui.button('home', 'Home', a2ui.callback('nav-home')),
  a2ui.button('about', 'About', a2ui.callback('nav-about')),
  a2ui.button('contact', 'Contact', a2ui.callback('nav-contact')),
]);
```

### Feedback Components

| Type | Description |
|------|-------------|
| `alert` | Alert/notification |
| `dialog` | Modal dialog |
| `tooltip` | Tooltip |
| `spinner` | Loading spinner |
| `divider` | Visual divider |
| `spacer` | Spacing element |

## A2UI Messages

A2UI uses a message-based protocol for streaming UI updates:

### Message Types

| Message Type | Description | Helper |
|--------------|-------------|--------|
| `begin-rendering` | Initialize a surface | `a2ui.beginRendering(surfaceId, rootId, styling?)` |
| `surface-update` | Update components | `a2ui.surfaceUpdate(surfaceId, components)` |
| `set-model` | Update data model | `a2ui.setModel(surfaceId, model)` |
| `end-rendering` | Finalize rendering | - |
| `clear-surface` | Clear all components | - |

### Streaming Example

```typescript
// Server-side: Stream UI updates
async function* streamDashboard(): AsyncIterableIterator<A2UIMessage> {
  // Start rendering
  yield a2ui.beginRendering('dashboard', 'root', {
    theme: 'dark',
    primaryColor: '#6366f1',
  });

  // Initial layout
  yield a2ui.surfaceUpdate('dashboard', [
    a2ui.column('root', [
      a2ui.text('loading', 'Loading dashboard...'),
      { id: 'spinner', type: 'spinner' },
    ]),
  ]);

  // Load data
  const data = await fetchDashboardData();

  // Update with real content
  yield a2ui.surfaceUpdate('dashboard', [
    a2ui.column('root', [
      a2ui.text('title', 'Dashboard'),
      createMetricsCard(data),
      createChartCard(data),
    ]),
  ]);

  // Set data model for bindings
  yield a2ui.setModel('dashboard', {
    metrics: data.metrics,
    lastUpdated: new Date().toISOString(),
  });
}
```

## Event Handling

A2UI supports four action types for interactivity:

### Callback Action

Sends data back to the agent:

```typescript
// Create a callback action
const onClick = a2ui.callback('button-clicked', {
  buttonId: 'submit',
  timestamp: Date.now(),
});

// Use in button
const btn = a2ui.button('submit', 'Submit', onClick);
```

### Navigate Action

Client-side navigation:

```typescript
const navAction: A2UINavigateAction = {
  type: 'navigate',
  target: '/dashboard',
};

const link: A2UIComponent = {
  id: 'dashboard-link',
  type: 'link',
  props: { text: 'Go to Dashboard' },
  events: [{ event: 'click', action: navAction }],
};
```

### Set Model Action

Updates local state:

```typescript
const toggleAction: A2UISetModelAction = {
  type: 'set-model',
  path: 'ui.sidebarOpen',
  value: true,
};
```

### Submit Action

Submits form data:

```typescript
const submitAction: A2UISubmitAction = {
  type: 'submit',
  endpoint: '/api/form',
};

const form = a2ui.form('contact', [
  a2ui.textField('name', 'Name'),
  a2ui.textField('email', 'Email'),
  a2ui.button('send', 'Send'),
], submitAction);
```

## Styling

Components support comprehensive styling:

```typescript
const styledCard = a2ui.card('card', [
  a2ui.text('title', 'Styled Card'),
], {}, {
  backgroundColor: '#1e1e2e',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const styledText = a2ui.text('emphasis', 'Important', {
  color: '#f59e0b',
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
});
```

### Available Style Properties

- **Colors**: `backgroundColor`, `color`, `borderColor`
- **Spacing**: `padding`, `margin`, `gap` (and directional variants)
- **Border**: `borderWidth`, `borderRadius`, `borderStyle`
- **Layout**: `display`, `flexDirection`, `alignItems`, `justifyContent`
- **Sizing**: `width`, `height`, `minWidth`, `maxWidth`
- **Typography**: `fontSize`, `fontWeight`, `fontFamily`, `textAlign`
- **Effects**: `opacity`, `boxShadow`, `transform`, `overflow`

## A2A Integration

### Creating A2UI Artifacts

```typescript
import { a2ui, type Artifact, dataPart } from '@liquidcrypto/a2a-sdk';

// Create A2UI messages
const messages = [
  a2ui.beginRendering('surface-1', 'root'),
  a2ui.surfaceUpdate('surface-1', [
    a2ui.text('greeting', 'Hello from the agent!'),
  ]),
];

// Create artifact with A2UI content
const artifact: Artifact = {
  artifactId: 'ui-artifact-1',
  name: 'Dashboard UI',
  parts: [
    a2ui.createA2UIPart(messages),
  ],
  extensions: ['https://a2a-protocol.org/extensions/a2ui'],
};
```

### Processing A2UI from Artifacts

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

function processArtifact(artifact: Artifact) {
  // Check if artifact contains A2UI
  if (a2ui.isA2UIArtifact(artifact)) {
    const messages = a2ui.extractA2UIMessages(artifact);

    for (const msg of messages) {
      if (a2ui.isBeginRenderingMessage(msg)) {
        initializeSurface(msg.surfaceId, msg.rootComponentId, msg.styling);
      } else if (a2ui.isSurfaceUpdateMessage(msg)) {
        renderComponents(msg.surfaceId, msg.components);
      } else if (a2ui.isSetModelMessage(msg)) {
        updateDataModel(msg.surfaceId, msg.model);
      }
    }
  }
}
```

## Type Guards

The SDK provides type guards for all message types:

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

function handleMessage(msg: A2UIMessage) {
  if (a2ui.isBeginRenderingMessage(msg)) {
    // msg is BeginRenderingMessage
    console.log('Surface:', msg.surfaceId);
    console.log('Root:', msg.rootComponentId);
  } else if (a2ui.isSurfaceUpdateMessage(msg)) {
    // msg is SurfaceUpdateMessage
    console.log('Components:', msg.components.length);
  } else if (a2ui.isSetModelMessage(msg)) {
    // msg is SetModelMessage
    console.log('Model:', msg.model);
  } else if (a2ui.isEndRenderingMessage(msg)) {
    // msg is EndRenderingMessage
    console.log('Rendering complete');
  } else if (a2ui.isClearSurfaceMessage(msg)) {
    // msg is ClearSurfaceMessage
    console.log('Surface cleared');
  }
}
```

## Complete Example

Here's a complete example of an agent that generates A2UI:

```typescript
import {
  type AgentExecutor,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type Message,
  agentMessage,
  textPart,
  dataPart,
  a2ui,
} from '@liquidcrypto/a2a-sdk';

const dashboardAgent: AgentExecutor = {
  async execute(message: Message, context: AgentExecutionContext): Promise<AgentExecutionResult> {
    const userText = message.parts.find(p => p.text)?.text || '';

    // Create A2UI dashboard
    const dashboard = a2ui.column('root', [
      // Header
      a2ui.row('header', [
        a2ui.text('title', 'Analytics Dashboard', { fontSize: 24, fontWeight: 'bold' }),
        a2ui.button('refresh', 'Refresh', a2ui.callback('refresh-data')),
      ], { justifyContent: 'space-between', marginBottom: 24 }),

      // Metrics row
      a2ui.row('metrics', [
        createMetricCard('users', 'Active Users', '1,234'),
        createMetricCard('revenue', 'Revenue', '$45,678'),
        createMetricCard('orders', 'Orders', '567'),
      ], { gap: 16 }),

      // Chart
      a2ui.card('chart-card', [
        a2ui.text('chart-title', 'Weekly Trends'),
        {
          id: 'chart',
          type: 'chart',
          props: {
            chartType: 'line',
            data: weeklyData,
          },
        },
      ], {}, { marginTop: 24 }),
    ]);

    // Create A2UI messages
    const a2uiMessages = [
      a2ui.beginRendering('dashboard', 'root', { theme: 'dark' }),
      a2ui.surfaceUpdate('dashboard', [dashboard]),
      a2ui.setModel('dashboard', { lastUpdated: new Date().toISOString() }),
    ];

    return {
      message: agentMessage([
        textPart('Here is your analytics dashboard'),
      ]),
      artifacts: [{
        artifactId: 'dashboard-ui',
        name: 'Analytics Dashboard',
        parts: [a2ui.createA2UIPart(a2uiMessages)],
        extensions: ['https://a2a-protocol.org/extensions/a2ui'],
      }],
    };
  },
};

function createMetricCard(id: string, label: string, value: string) {
  return a2ui.card(`metric-${id}`, [
    a2ui.text(`${id}-label`, label, { color: '#9ca3af', fontSize: 14 }),
    a2ui.text(`${id}-value`, value, { fontSize: 32, fontWeight: 'bold' }),
  ], {}, { padding: 20, minWidth: 200 });
}
```

## Best Practices

1. **Use Unique IDs**: Every component needs a unique `id` within its surface
2. **Prefer Helpers**: Use builder functions like `a2ui.text()` for cleaner code
3. **Stream Updates**: For complex UIs, stream incremental updates instead of one large payload
4. **Handle Callbacks**: Always handle user actions via callbacks
5. **Consistent Styling**: Use surface styling for consistent theming
6. **Accessibility**: Set `accessibility` properties for screen readers

## API Reference

### Helper Functions

| Function | Signature |
|----------|-----------|
| `text` | `(id: string, content: string, style?: A2UIStyle) => A2UIComponent` |
| `button` | `(id: string, label: string, onClick?: A2UIEventAction, props?: Partial<A2UIComponentProps>) => A2UIComponent` |
| `card` | `(id: string, children: A2UIComponent[], props?: Partial<A2UIComponentProps>, style?: A2UIStyle) => A2UIComponent` |
| `list` | `(id: string, items: A2UIComponent[], ordered?: boolean) => A2UIComponent` |
| `image` | `(id: string, src: string, alt?: string, style?: A2UIStyle) => A2UIComponent` |
| `textField` | `(id: string, label: string, props?: Partial<A2UIComponentProps>) => A2UIComponent` |
| `form` | `(id: string, children: A2UIComponent[], onSubmit?: A2UIEventAction) => A2UIComponent` |
| `row` | `(id: string, children: A2UIComponent[], style?: A2UIStyle) => A2UIComponent` |
| `column` | `(id: string, children: A2UIComponent[], style?: A2UIStyle) => A2UIComponent` |
| `callback` | `(callbackId: string, data?: Record<string, unknown>) => A2UICallbackAction` |
| `beginRendering` | `(surfaceId: string, rootComponentId: string, styling?: A2UISurfaceStyling) => BeginRenderingMessage` |
| `surfaceUpdate` | `(surfaceId: string, components: A2UIComponent[]) => SurfaceUpdateMessage` |
| `setModel` | `(surfaceId: string, model: Record<string, unknown>) => SetModelMessage` |
| `createA2UIPart` | `(messages: A2UIMessage[]) => A2UIPart` |

### Type Guards

| Function | Returns |
|----------|---------|
| `isA2UIArtifact(artifact)` | `boolean` |
| `extractA2UIMessages(artifact)` | `A2UIMessage[]` |
| `isBeginRenderingMessage(msg)` | `msg is BeginRenderingMessage` |
| `isSurfaceUpdateMessage(msg)` | `msg is SurfaceUpdateMessage` |
| `isSetModelMessage(msg)` | `msg is SetModelMessage` |
| `isEndRenderingMessage(msg)` | `msg is EndRenderingMessage` |
| `isClearSurfaceMessage(msg)` | `msg is ClearSurfaceMessage` |

---

## Agent-to-Glass Rendering Pipeline

LiquidCrypto uses a transformer system to convert A2UI component JSON into Glass (Liquid Glass Design System) React components. This enables agents to generate rich UIs that render as native Glass components.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Agent-to-Glass Pipeline                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐   │
│  │    Agent     │───▶│  A2A Protocol    │───▶│  Artifact with      │   │
│  │  (Backend)   │    │  (JSON-RPC 2.0)  │    │  A2UI Part          │   │
│  └──────────────┘    └──────────────────┘    └─────────┬───────────┘   │
│                                                        │               │
│                                                        ▼               │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐   │
│  │  GlassDynamic│◀───│   Transformer    │◀───│   A2UI Messages     │   │
│  │    UI        │    │  (a2ui → Glass)  │    │   (BeginRendering,  │   │
│  └──────────────┘    └──────────────────┘    │   SurfaceUpdate)    │   │
│        │                                     └─────────────────────┘   │
│        ▼                                                               │
│  ┌──────────────┐                                                      │
│  │ Glass React  │   Rendered in browser with Liquid Glass styling      │
│  │ Components   │                                                      │
│  └──────────────┘                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Flow Summary

1. **Agent generates A2UI** - Server-side agent creates A2UI messages
2. **A2A Response** - Messages are wrapped in an A2UI artifact part
3. **Transformer processes** - Client-side transformer converts A2UI to UINode tree
4. **GlassDynamicUI renders** - React component renders the UINode tree as Glass components

### Component Type Mapping

A2UI types are mapped to Glass components via the transformer:

| A2UI Type | Glass Component | UINodeType |
|-----------|-----------------|------------|
| `text` | `GlassLabel` | `text` |
| `button` | `GlassButton` | `button` |
| `button-group` | `GlassButtonGroup` | `button-group` |
| `container` | `GlassContainer` | `container` |
| `card` | `GlassCard` | `card` |
| `row` / `column` | `GlassStack` | `stack` |
| `grid` | `GlassGrid` | `grid` |
| `bento` | `GlassBento` | `bento` |
| `masonry` | `GlassMasonry` | `masonry` |
| `navbar` | `GlassNavbar` | `navbar` |
| `sidebar` | `GlassSidebar` | `sidebar` |
| `dock` | `GlassDock` | `dock` |
| `tabs` | `GlassTabs` | `tabs` |
| `text-field` | `GlassInput` | `input` |
| `text-area` | `GlassTextarea` | `textarea` |
| `select` | `GlassSelect` | `select` |
| `checkbox` | `GlassCheckbox` | `checkbox` |
| `switch` | `GlassSwitch` | `toggle` |
| `slider` | `GlassSlider` | `slider` |
| `date-picker` | `GlassDatePicker` | `datepicker` |
| `time-picker` | `GlassTimePicker` | `timepicker` |
| `image` | `GlassImage` | `image` |
| `avatar` | `GlassAvatar` | `avatar` |
| `badge` | `GlassBadge` | `badge` |
| `chart` | `GlassChart` | `chart` |
| `line-chart` | `GlassLineChart` | `line-chart` |
| `bar-chart` | `GlassBarChart` | `bar-chart` |
| `pie-chart` | `GlassPieChart` | `pie-chart` |
| `candlestick-chart` | `GlassCandlestickChart` | `candlestick` |
| `heatmap` | `GlassHeatmap` | `heatmap` |
| `table` | `GlassDataTable` | `table` |
| `alert` | `GlassAlert` | `alert` |
| `toast` | `GlassToast` | `toast` |
| `dialog` | `GlassDialog` | `dialog` |
| `modal` | `GlassModal` | `modal` |
| `tooltip` | `GlassTooltip` | `tooltip` |
| `spinner` | `GlassSpinner` | `spinner` |
| `skeleton` | `GlassSkeleton` | `skeleton` |
| `video` | `GlassVideo` | `video` |
| `audio` | `GlassAudio` | `audio` |
| `file-upload` | `GlassFileUpload` | `file-upload` |
| `agent` | `GlassAgent` | `agent` |
| `copilot` | `GlassCopilot` | `copilot` |
| `thinking` | `GlassThinking` | `thinking` |
| `trading-grid` | `GlassTradingGrid` | `trading-grid` |
| `order-entry` | `GlassOrderEntry` | `order-entry` |
| `market-ticker` | `GlassMarketTicker` | `market-ticker` |
| `portfolio-card` | `GlassPortfolioCard` | `portfolio-card` |
| `depth-chart` | `GlassDepthChart` | `depth-chart` |

### How Agents Generate Glass UIs

#### Step 1: Define A2UI Messages

Agents create A2UI messages that describe the UI structure:

```typescript
import { a2ui } from '@liquidcrypto/a2a-sdk';

// Server-side agent code
function generateDashboardUI(data: DashboardData): A2UIMessage[] {
  return [
    a2ui.beginRendering('dashboard', 'root', {
      theme: 'dark',
      primaryColor: '#6366f1',
    }),
    a2ui.surfaceUpdate('dashboard', [
      {
        id: 'root',
        type: 'column',
        children: ['header', 'metrics-row', 'chart-card'],
        props: { gap: 16 },
      },
      {
        id: 'header',
        type: 'text',
        props: { text: 'Trading Dashboard', semantic: 'h2' },
      },
      {
        id: 'metrics-row',
        type: 'row',
        children: ['btc-ticker', 'eth-ticker', 'portfolio'],
        props: { gap: 12 },
      },
      {
        id: 'btc-ticker',
        type: 'market-ticker',  // Maps to GlassMarketTicker
        props: {
          symbol: 'BTC',
          price: data.btcPrice,
          change: data.btcChange24h,
        },
      },
      {
        id: 'eth-ticker',
        type: 'market-ticker',
        props: {
          symbol: 'ETH',
          price: data.ethPrice,
          change: data.ethChange24h,
        },
      },
      {
        id: 'portfolio',
        type: 'portfolio-card',  // Maps to GlassPortfolioCard
        props: {
          totalValue: data.portfolioValue,
          change24h: data.portfolioChange,
          holdings: data.holdings,
        },
      },
      {
        id: 'chart-card',
        type: 'card',  // Maps to GlassCard
        children: ['chart'],
        props: { glassMaterial: 'frosted', glassIntensity: 0.8 },
      },
      {
        id: 'chart',
        type: 'candlestick-chart',  // Maps to GlassCandlestickChart
        props: {
          symbol: 'BTC/USD',
          ohlc: data.candleData,
          timeframe: '1h',
        },
      },
    ]),
    a2ui.setModel('dashboard', {
      lastUpdated: new Date().toISOString(),
      ...data,
    }),
  ];
}
```

#### Step 2: Return in A2A Response

The agent executor returns the A2UI as an artifact:

```typescript
const executor: AgentExecutor = {
  async execute(message, context): Promise<AgentExecutionResult> {
    const data = await fetchDashboardData();
    const a2uiMessages = generateDashboardUI(data);

    return {
      message: agentMessage([textPart('Here is your trading dashboard')]),
      artifacts: [{
        artifactId: 'dashboard',
        name: 'Trading Dashboard',
        parts: [
          { type: 'a2ui', a2ui: a2uiMessages },
        ],
      }],
    };
  },
};
```

#### Step 3: Client-Side Transformation

The client extracts and transforms A2UI:

```typescript
// Client-side React component
import { transformA2UI } from '@/a2a/transformer';
import { GlassDynamicUI } from '@/components/agentic/GlassDynamicUI';

function AgentResponse({ artifact }: { artifact: Artifact }) {
  const a2uiPart = artifact.parts.find(p => p.type === 'a2ui');

  if (!a2uiPart) return null;

  // Transform A2UI to Glass UINode tree
  const uiNode = transformA2UI(a2uiPart.a2ui, handleAction);

  // Render using GlassDynamicUI
  return <GlassDynamicUI spec={uiNode} />;
}

function handleAction(actionId: string, data?: unknown) {
  // Handle callbacks from user interactions
  console.log('Action:', actionId, data);
}
```

### Using Glass-Specific Properties

A2UI components support Glass-specific styling through the extended props:

```typescript
// Use Glass material effects
{
  id: 'frosted-card',
  type: 'card',
  props: {
    glassMaterial: 'frosted',    // 'standard' | 'frosted' | 'clear' | 'tinted'
    glassIntensity: 0.8,         // 0-1 blur intensity
    glassColor: 'rgba(99, 102, 241, 0.1)',
  },
  children: ['content'],
}

// Use agentic components
{
  id: 'thinking-indicator',
  type: 'thinking',  // GlassThinking component
  props: {
    thinking: true,
    streaming: true,
    agentId: 'crypto-advisor',
  },
}

// Use trading components
{
  id: 'order-form',
  type: 'order-entry',  // GlassOrderEntry component
  props: {
    symbol: 'BTC/USD',
    side: 'buy',
    orderTypes: ['market', 'limit', 'stop-limit'],
  },
}
```

### Trading-Specific A2UI Components

For cryptocurrency trading interfaces, use the specialized trading components:

```typescript
import { TradingComponents } from '@/a2a/executors/trading-components';

// Generate a complete trading dashboard
const tradingUI = [
  a2ui.beginRendering('trading', 'root'),
  a2ui.surfaceUpdate('trading', [
    { id: 'root', type: 'row', children: ['ticker', 'orderbook', 'form'] },

    // Market ticker using TradingComponents helper
    TradingComponents.MarketTicker('BTC', 45000, 2.5),

    // Order book visualization
    TradingComponents.OrderBook('/orderBook/bids', '/orderBook/asks', {
      maxEntries: 10,
      showSpread: true,
    }),

    // Trade entry form
    TradingComponents.TradeForm('BTC', 'buy', {
      showLimit: true,
      showStopLoss: true,
    }),
  ]),
  a2ui.setModel('trading', {
    orderBook: { bids: [...], asks: [...] },
    balance: 10000,
  }),
];
```

### Security Considerations

The transformer enforces security constraints:

1. **Component Whitelist**: Only approved A2UI types are transformed
2. **Max Components**: Limit of 500 components per surface
3. **No Code Execution**: A2UI is data, not executable code
4. **Auth-Required Components**: Some Glass components (GlassAgent, GlassCopilot) require authentication

```typescript
// Validate A2UI before rendering
import { validateA2UIPayload, GLASS_COMPONENT_CATALOG } from '@/a2a/types';

const { valid, errors } = validateA2UIPayload(messages, GLASS_COMPONENT_CATALOG);
if (!valid) {
  console.error('A2UI validation failed:', errors);
  return <FallbackUI />;
}
```

### Complete A2UI Component Types

The SDK supports 150+ component types that map to Glass components:

#### Primitives
`text`, `button`, `button-group`, `icon-button`, `label`, `icon`

#### Layout
`container`, `card`, `row`, `column`, `grid`, `stack`, `bento`, `masonry`, `split-view`, `scroll-area`, `aspect-ratio`, `center`

#### Navigation
`navbar`, `sidebar`, `dock`, `breadcrumb`, `pagination`, `stepper`, `tabs`, `vertical-tabs`, `segmented-control`

#### Forms
`text-field`, `text-area`, `select`, `multi-select`, `checkbox`, `radio`, `switch`, `slider`, `range-slider`, `date-picker`, `time-picker`, `datetime-picker`, `color-picker`, `file-upload`, `form`, `form-field`, `otp-input`, `phone-input`, `autocomplete`, `combobox`, `tag-input`

#### Data Display
`table`, `data-table`, `list`, `list-item`, `tree`, `tree-item`, `timeline`, `timeline-item`, `accordion`, `accordion-item`, `carousel`, `image`, `avatar`, `avatar-group`, `badge`, `chip`, `tag`, `stat-card`, `metric`, `kpi`, `comparison`

#### Charts
`chart`, `line-chart`, `area-chart`, `bar-chart`, `pie-chart`, `donut-chart`, `radar-chart`, `scatter-chart`, `bubble-chart`, `candlestick-chart`, `heatmap`, `treemap`, `sankey`, `gauge`, `sparkline`, `mini-chart`

#### Feedback
`alert`, `toast`, `notification`, `banner`, `callout`, `empty-state`, `error-boundary`, `skeleton`, `spinner`, `progress`, `progress-circle`

#### Overlays
`modal`, `dialog`, `drawer`, `sheet`, `popover`, `tooltip`, `dropdown`, `context-menu`, `command-palette`

#### Media
`video`, `audio`, `media-player`, `image-gallery`, `lightbox`, `webcam`, `screen-share`

#### Features
`calendar`, `kanban`, `gantt`, `rich-text-editor`, `code-editor`, `terminal`, `diff-viewer`, `pdf-viewer`, `map`, `search`, `filter`, `sort`

#### Agentic
`agent`, `copilot`, `chat`, `chat-message`, `chat-input`, `thinking`, `streaming-text`, `tool-call`, `tool-result`, `artifact-preview`, `code-artifact`, `document-artifact`, `reasoning-chain`

#### Generative
`generative-image`, `generative-text`, `prompt-input`, `generation-preview`, `model-selector`, `parameter-controls`, `generation-history`

#### Trading
`trading-grid`, `order-entry`, `order-book`, `market-ticker`, `portfolio-card`, `position-card`, `trade-history`, `depth-chart`, `price-alert`, `watchlist`

#### Artifacts
`artifact-card`, `artifact-viewer`, `file-preview`, `download-card`, `share-card`, `embed-card`, `version-history`

#### Collaboration
`presence-indicator`, `cursor`, `selection`, `comment`, `comment-thread`, `annotation`, `mention`, `reaction`

#### Special
`divider`, `spacer`, `separator`, `skeleton-text`, `skeleton-image`, `skeleton-card`, `custom`, `plugin`
