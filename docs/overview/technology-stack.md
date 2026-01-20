# Technology Decisions

> Last Updated: January 2026
> Status: Reference Document

This document provides rationale for all major technology choices in the LiquidCrypto project, comparing alternatives and explaining why each decision was made.

---

## Table of Contents

1. [Frontend Framework](#1-frontend-framework)
2. [State Management](#2-state-management)
3. [Styling Solution](#3-styling-solution)
4. [Build Tool](#4-build-tool)
5. [Backend Runtime](#5-backend-runtime)
6. [Web Framework](#6-web-framework)
7. [AI Providers](#7-ai-providers)
8. [Caching Layer](#8-caching-layer)
9. [Testing Strategy](#9-testing-strategy)
10. [Component Documentation](#10-component-documentation)
11. [Animation Library](#11-animation-library)
12. [Form Management](#12-form-management)
13. [Chart Library](#13-chart-library)
14. [Deployment Platform](#14-deployment-platform)
15. [Agent Architecture & Skills](#15-agent-architecture--skills)

---

## 1. Frontend Framework

### Decision: React 19

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **React 19** ✅ | Largest ecosystem, concurrent features, Server Components | Larger bundle than alternatives | **Selected** |
| Vue 3 | Simpler learning curve, good performance | Smaller component library ecosystem | Not selected |
| Svelte 5 | Smallest bundle, compiled approach | Less mature ecosystem, fewer UI libraries | Not selected |
| Solid.js | Excellent performance, fine-grained reactivity | Smaller community, fewer patterns | Not selected |

### Rationale

1. **Ecosystem Maturity**: React has the largest ecosystem of UI component libraries, which accelerated the Glass design system development.

2. **Concurrent Features**: React 19's concurrent rendering enables smooth animations and responsive UI even during heavy AI processing.

3. **Server Components**: Future migration path to RSC for improved initial load performance.

4. **Team Expertise**: Most available developers have React experience.

5. **AI Integration**: Best documentation and examples for AI/LLM integration patterns.

### Trade-offs Accepted

- Larger initial bundle size (~40KB gzipped for React vs ~5KB for Svelte)
- More boilerplate than Vue/Svelte
- Requires additional libraries for routing, forms, etc.

---

## 2. State Management

### Decision: React Context + Custom Hooks + LiquidClient

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Context + Hooks** ✅ | Built-in, no dependencies, composable | Re-render concerns at scale | **Selected** |
| Redux Toolkit | Predictable, great DevTools | Boilerplate, overkill for this scale | Not selected |
| Zustand | Simple, minimal boilerplate | Additional dependency | Considered for future |
| Jotai | Atomic model, great for derived state | Learning curve | Not selected |
| MobX | Automatic tracking, less boilerplate | Magic can be confusing | Not selected |

### Rationale

1. **Appropriate Scale**: The application's state complexity doesn't warrant a heavy state management library.

2. **Separation of Concerns**:
   - **UI State**: React Context (theme, glass settings, appearance)
   - **AI State**: LiquidClient class (tool states, contexts, actions)
   - **Server State**: Direct API calls with caching

3. **Custom LiquidClient**: Purpose-built for AI streaming, providing:
   - Tool call state management
   - Context strategy patterns
   - Action registry
   - Subscription-based updates

4. **No External Dependencies**: Reduces bundle size and maintenance burden.

### Architecture

```typescript
// UI State - React Context
<ThemeProvider>
  <GlassProvider>
    <AppearanceProvider>
      {children}
    </AppearanceProvider>
  </GlassProvider>
</ThemeProvider>

// AI State - LiquidClient instance
const client = new LiquidClient();
client.subscribe((states) => updateUI(states));
```

---

## 3. Styling Solution

### Decision: Tailwind CSS + CSS Custom Properties

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Tailwind CSS** ✅ | Utility-first, purged CSS, consistent | Learning curve, verbose HTML | **Selected** |
| CSS Modules | Scoped by default, familiar syntax | No design system utilities | Not selected |
| Styled Components | CSS-in-JS, dynamic styling | Runtime cost, larger bundle | Not selected |
| Vanilla Extract | Type-safe, zero runtime | Build complexity | Considered |
| Emotion | Flexible, good performance | CSS-in-JS overhead | Not selected |

### Rationale

1. **Design Token Integration**: CSS custom properties provide runtime theme switching, while Tailwind provides utility classes.

2. **Bundle Size**: Tailwind's purge mechanism results in minimal CSS (~50KB for entire app).

3. **Consistency**: Utility classes enforce design system constraints (4px grid, color palette).

4. **Developer Experience**: Rapid prototyping with utility classes, no context switching.

5. **Glass System Compatibility**: Easy to implement backdrop-blur, transparency, and layering.

### Token Architecture

```css
/* Level 1: CSS Custom Properties */
:root {
  --space-4: 1rem;
  --radius-md: 0.5rem;
}

/* Level 2: Tailwind Integration */
/* tailwind.config.js */
spacing: {
  4: 'var(--space-4)'
}

/* Level 3: Component Usage */
<div className="p-4 rounded-md" />
```

---

## 4. Build Tool

### Decision: Vite 6

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Vite 6** ✅ | Fast HMR, native ESM, Rollup output | Less mature plugin ecosystem | **Selected** |
| Webpack 5 | Mature, extensive plugins | Slower builds, complex config | Not selected |
| Turbopack | Very fast, Vercel-backed | Still in beta, less stable | Considered for future |
| Parcel | Zero config | Less control, larger bundles | Not selected |
| esbuild | Fastest builds | Limited plugin support | Used internally by Vite |

### Rationale

1. **Development Speed**: ~100ms HMR updates vs 1-2s with Webpack.

2. **Native ESM**: No bundling during development, faster startup.

3. **Rollup for Production**: Optimized chunking and tree-shaking.

4. **Library Build Mode**: Built-in support for publishing component library.

5. **Ecosystem Compatibility**: Works with existing Rollup plugins.

### Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2']
        }
      }
    }
  }
});
```

---

## 5. Backend Runtime

### Decision: Bun

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Bun** ✅ | 3-5x faster, native TS, smaller memory | Less mature, some API gaps | **Selected** |
| Node.js 22 | Most mature, largest ecosystem | Slower, requires transpilation | Not selected |
| Deno | Security-first, modern APIs | Smaller ecosystem | Considered |

### Rationale

1. **Performance**: 3-5x faster cold starts, critical for serverless deployments.

2. **Native TypeScript**: No transpilation step needed.

3. **Built-in Tooling**: Package manager, bundler, test runner included.

4. **Compatibility**: 95%+ Node.js API compatibility.

5. **Memory Efficiency**: Lower memory footprint for AI workloads.

### Benchmarks (Internal Testing)

| Metric | Node.js 22 | Bun 1.1 | Improvement |
|--------|------------|---------|-------------|
| Cold Start | 450ms | 95ms | 4.7x |
| req/sec (simple) | 45,000 | 142,000 | 3.2x |
| Memory (idle) | 85MB | 32MB | 2.7x |

---

## 6. Web Framework

### Decision: Elysia

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Elysia** ✅ | Bun-native, type-safe, fast | Smaller community | **Selected** |
| Express | Most popular, extensive middleware | Old patterns, slow | Not selected |
| Fastify | Fast, schema validation | Node.js only | Not selected |
| Hono | Universal, lightweight | Less feature-rich | Considered |
| Koa | Modern Express | Smaller ecosystem | Not selected |

### Rationale

1. **Bun Optimization**: Built specifically for Bun runtime.

2. **Type Safety**: End-to-end type inference from route to response.

3. **Performance**: Fastest web framework for Bun.

4. **Plugin System**: Composable middleware architecture.

5. **Developer Experience**: Fluent API design.

### Example

```typescript
const app = new Elysia()
  .get('/api/v1', () => ({ status: 'ok' }))
  .post('/api/v1/chat', async ({ body }) => {
    // Type-safe body parsing
    return await processChat(body);
  })
  .listen(3000);
```

---

## 7. AI Providers

### Decision: Multi-Provider (Gemini + Claude)

| Provider | Strengths | Weaknesses | Use Case |
|----------|-----------|------------|----------|
| **Gemini 2.0 Flash** | Fast, cheap, good at structured output | Less nuanced reasoning | Default provider, function calling |
| **Claude Sonnet 4** | Best reasoning, nuanced responses | Slower, more expensive | Complex analysis, fallback |
| GPT-4o | Good general purpose | Most expensive | Not included (cost) |
| Llama 3.3 (local) | Free, private | Requires GPU | Future consideration |

### Rationale

1. **Cost Optimization**: Gemini for high-volume, simple queries; Claude for complex analysis.

2. **Redundancy**: If one provider fails, fallback to the other.

3. **Parallel Processing**: Compare responses from both for critical decisions.

4. **Function Calling**: Gemini has excellent function calling support for UI generation.

### Cost Comparison (per 1M tokens)

| Provider | Input | Output |
|----------|-------|--------|
| Gemini 2.0 Flash | $0.25 | $0.50 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| GPT-4o | $5.00 | $15.00 |

---

## 8. Caching Layer

### Decision: Redis with Memory Fallback

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Redis** ✅ | Distributed, persistent, pub/sub | Requires infrastructure | **Primary** |
| **Memory Map** ✅ | Zero latency, no dependencies | Not distributed, lost on restart | **Fallback** |
| Memcached | Fast, simple | No persistence | Not selected |
| KeyDB | Redis-compatible, multi-threaded | Less mature | Considered |

### Rationale

1. **Distributed Rate Limiting**: Multiple server instances share limits.

2. **AI Response Caching**: SHA-256 prompt hashing for cache keys.

3. **Graceful Degradation**: Falls back to memory when Redis unavailable.

4. **Pub/Sub**: Used for real-time price broadcasting.

### Implementation

```typescript
// Auto-detection and fallback
async function initRedis() {
  try {
    redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    rateLimitStore = { type: 'redis', client: redis };
  } catch {
    rateLimitStore = { type: 'memory', store: new Map() };
  }
}
```

---

## 9. Testing Strategy

### Decision: Vitest + Playwright + Storybook

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | **Vitest** | Component logic, hooks, utilities |
| Integration | **Storybook Tests** | Component interactions |
| E2E | **Playwright** | Full user flows |
| Visual | **Chromatic** (planned) | Visual regression |

### Rationale

1. **Vitest**: Vite-native, fast, compatible with Jest patterns.

2. **Playwright**: Cross-browser E2E, reliable, fast execution.

3. **Storybook Integration**: Test components in isolation with real browser.

4. **Coverage Strategy**:
   - Unit: Business logic, hooks
   - Integration: Component interactions
   - E2E: Critical user paths

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}']
  }
});
```

---

## 10. Component Documentation

### Decision: Storybook 8

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Storybook 8** ✅ | Industry standard, great addons | Complex config | **Selected** |
| Docusaurus | Good for docs | Not component-focused | Not selected |
| Histoire | Vue-focused, simpler | Less mature for React | Not selected |
| Ladle | Lightweight | Fewer features | Considered |

### Rationale

1. **Component Playground**: Interactive component exploration.

2. **Addon Ecosystem**: a11y, controls, actions, viewport.

3. **Documentation**: Auto-generated prop tables from TypeScript.

4. **Testing Integration**: Storybook tests with Vitest.

5. **Design System Export**: Publishable documentation site.

### Addons Used

```typescript
// .storybook/main.ts
addons: [
  '@storybook/addon-a11y',        // Accessibility
  '@storybook/addon-docs',        // Documentation
  '@storybook/addon-interactions' // Testing
]
```

---

## 11. Animation Library

### Decision: Framer Motion

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Framer Motion** ✅ | Declarative, gestures, layout animations | Larger bundle | **Selected** |
| React Spring | Physics-based, smaller | Less intuitive API | Not selected |
| Motion One | Smallest, web-native | Less React-specific | Considered |
| CSS Animations | Zero runtime | Limited capabilities | Used for simple cases |
| GSAP | Powerful, timeline | Learning curve, licensing | Not selected |

### Rationale

1. **Layout Animations**: AnimatePresence for mount/unmount animations.

2. **Gesture Support**: Built-in drag, pan, hover, tap.

3. **Variants**: Declarative animation states.

4. **Performance**: Hardware-accelerated transforms.

5. **Glass Effects**: Easy to animate blur, opacity, scale.

### Usage Pattern

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ type: 'spring', damping: 20 }}
/>
```

---

## 12. Form Management

### Decision: React Hook Form + Zod

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **React Hook Form** ✅ | Performant, uncontrolled | Learning curve | **Selected** |
| Formik | Popular, intuitive | Re-renders, larger | Not selected |
| React Final Form | Flexible | Less maintained | Not selected |
| Native Forms | Zero dependencies | Manual validation | Not selected |

### Rationale

1. **Performance**: Uncontrolled inputs minimize re-renders.

2. **Zod Integration**: Type-safe validation with inference.

3. **DevTools**: Form state debugging.

4. **Size**: Smaller than Formik.

### Pattern

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

---

## 13. Chart Library

### Decision: Chart.js + uPlot

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Chart.js** ✅ | Popular, good docs, responsive | Canvas-only | **Primary** |
| **uPlot** ✅ | Extremely fast, small | Less customizable | **High-performance** |
| D3.js | Most flexible | Steep learning curve | Used for Sankey only |
| Recharts | React-native, composable | Slower for large data | Not selected |
| ECharts | Feature-rich | Large bundle | Not selected |

### Rationale

1. **Chart.js**: Good for standard charts (line, bar, pie).

2. **uPlot**: 10x faster for time-series with 10K+ points.

3. **D3**: Used only for complex visualizations (Sankey diagrams).

### Performance Comparison (10K data points)

| Library | Render Time | Memory |
|---------|-------------|--------|
| uPlot | 15ms | 2MB |
| Chart.js | 180ms | 15MB |
| D3 | 250ms | 20MB |

---

## 14. Deployment Platform

### Decision: Vercel (Frontend) + Railway (Backend)

| Alternative | Frontend | Backend | Verdict |
|-------------|----------|---------|---------|
| **Vercel** ✅ | Excellent | Limited | **Frontend** |
| **Railway** | Good | Excellent | **Backend** |
| AWS (S3 + Lambda) | Cheap at scale | Complex | Not selected |
| Cloudflare Pages | Fast edge | Workers limitations | Considered |
| Fly.io | Good | Excellent | Considered |

### Rationale

1. **Vercel for Frontend**:
   - Optimized for React/Vite
   - Global edge network
   - Preview deployments
   - Simple GitHub integration

2. **Railway for Backend**:
   - Native Bun support
   - Simple deployment
   - Built-in Redis
   - SSH access for debugging

3. **Separation**: Frontend and backend can scale independently.

### CI/CD Integration

```yaml
# Frontend → Vercel
deploy-production:
  uses: amondnet/vercel-action@v25
  
# Backend → Railway/PM2
server-deploy:
  uses: appleboy/ssh-action@v1
  script: pm2 restart liquid-glass-server
```

---

## Decision Review Schedule

| Decision | Next Review | Criteria for Change |
|----------|-------------|---------------------|
| React | Q3 2026 | RSC adoption rate, Solid.js maturity |
| Tailwind | Q2 2026 | v4 stability, bundle size |
| Bun | Quarterly | Node.js parity, ecosystem growth |
| AI Providers | Monthly | Cost changes, new models |
| Redis | Yearly | Scaling needs |

---

## Appendix: Decision Log

| Date | Decision | Reason | Impact |
|------|----------|--------|--------|
| 2025-06 | Chose React 19 | Ecosystem, team expertise | High |
| 2025-08 | Migrated to Vite 6 | Speed, DX | Medium |
| 2025-10 | Added Bun | Performance | High |
| 2025-11 | Added Claude | Reasoning quality | Medium |
| 2026-01 | Elysia over Express | Type safety, speed | Medium |
| 2026-01 | Tailwind CSS v4 | CSS-first, smaller bundle | Medium |
| 2026-01 | Zod for validation | Type-safe schemas | Medium |
| 2026-01 | Chromatic for visual testing | Automated screenshots | Low |
| 2026-01 | bundlewatch | Bundle size monitoring | Low |
| 2026-01 | Container Queries | Responsive components | Low |
| 2026-01 | Prompt Versioning | AI prompt management | Medium |
| 2026-01 | WebGPU Charts (prototype) | Future performance | Low |
| 2026-01 | PWA with Vite Plugin | Offline support | Medium |
| 2026-01 | WebGPU Charts (prototype) | Future performance | Low |
| 2026-01 | PWA with Vite Plugin | Offline support | Medium |
| 2026-01 | Focus-Visible Styles | A11y for keyboard nav | Medium |
| 2026-01 | **LiquidSkills Architecture** | Harmonized Plugin System | High |

---

## 15. Agent Architecture & Skills

### Decision: LiquidSkills (Harmonized Claude Plugin Standard)

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **LiquidSkills** ✅ | Manifest-driven, standardized, multi-runtime | Slightly higher complexity for simple tasks | **Selected** |
| Flat Directives | Zero friction, simple markdown | Hard to scale, no automated hooks | Deprecated |
| Vendor-Locked SDKs | Optimised for one provider | Limit cross-agent compatibility | Not selected |

### Rationale

1. **Manifest-Driven Discovery**: Using `.claude-plugin/plugin.json` allows for semantic versioning and capability indexing that any advanced agent can parse.
2. **Automated Governance (Hooks)**: The `PostToolUse` hook enables structural enforcement (e.g., Design Audits) without developer intervention.
3. **Multi-Language Support**: Bridge the gap between native Bun/TS and legacy/vendor Python tools via a centralized `.venv`.
4. **Ecosystem Compatibility**: Allows immediate ingestion of 130+ official Claude plugins.

### Architecture

```
LiquidSkills/
├── _registry.md         # Discovery Log
├── [skill-name]/        # Skill Module
│   ├── plugin.json      # Metadata & Hooks
│   ├── SKILL.md         # Instructions
│   └── tools/           # Executables (Bun/Python)
```

---

## References

- [React 19 Release Notes](https://react.dev/blog)
- [Vite Documentation](https://vitejs.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [Elysia Documentation](https://elysiajs.com/)
- [Tailwind CSS v4 Announcement](https://tailwindcss.com/blog)
