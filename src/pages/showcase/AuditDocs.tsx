import { GlassContainer, GlassButton } from '@/components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Info, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LiquidCodeBlock = ({ code, language = 'typescript' }: { code: string, language?: string }) => (
    <div className="relative rounded-lg overflow-hidden my-4 border border-white/10 group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            >
                <Copy size={14} />
            </button>
        </div>
        <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: '1.5rem', background: 'rgba(0,0,0,0.3)', fontSize: '13px' }}
        >
            {code}
        </SyntaxHighlighter>
    </div>
);

export default function AuditDocs() {
    const navigate = useNavigate();

    const liquidReadableExample = `// AG-UI: useLiquidReadable
useLiquidReadable({
    description: "Current application state",
    value: {
        theme: "dark",
        userRole: "admin",
        activePage: "/dashboard"
    }
});`;

    const liquidActionExample = `// AG-UI: useLiquidAction
useLiquidAction({
    name: "updateTheme",
    description: "Updates the UI theme preference",
    parameters: [
        { name: "mode", type: "string", description: "light or dark", required: true }
    ],
    handler: async ({ mode }) => {
        setTheme(mode);
        return { success: true };
    }
});`;

    const hybridStrategyExample = `// AG-UI: Hybrid Context Strategy
// In Settings or via Debug Console

// 1. Switch to Tree Strategy (Smart Pruning)
liquidClient.setContextStrategy('tree');

// 2. Set Focus (handled automatically by Router)
liquidClient.setFocus('/demos/ai-researcher');

// Result: Only "Global" and "AI Researcher" contexts are sent.
// Irrelevant contexts from other pages are pruned.`;

    return (
        <div className="min-h-screen bg-glass-base p-10 pb-20">
            {/* Background decoration */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <GlassButton
                    variant="ghost"
                    onClick={() => navigate('/showcase')}
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Showcase
                </GlassButton>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Technical Audit</h1>
                        <p className="text-xl text-white/60">AG-UI Liquid Engine vs. CopilotKit</p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
                        Architecture Review
                    </div>
                </div>

                <GlassContainer className="p-8 space-y-10">
                    {/* Executive Summary */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Executive Summary</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The <strong>Liquid Engine</strong> is a lightweight, client-side implementation of the CopilotKit architecture.
                            It successfully replicates the core developer experience (hooks, generative UI concepts) but differs significantly
                            in its runtime architecture. While CopilotKit relies on a backend runtime to proxy LLM calls and manage session
                            state, Liquid Engine runs entirely in the browser, connecting directly to Gemini or Claude APIs.
                        </p>
                    </section>

                    {/* Conceptual Mapping */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">1. Conceptual Mapping</h2>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-200">
                                    <tr>
                                        <th className="p-4 font-medium">CopilotKit Concept</th>
                                        <th className="p-4 font-medium">Liquid Engine Implementation</th>
                                        <th className="p-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="p-4 font-mono text-purple-300">{`<CopilotKit />`}</td>
                                        <td className="p-4 font-mono text-blue-300">{`<LiquidProvider />`}</td>
                                        <td className="p-4 flex items-center text-green-400"><CheckCircle2 className="w-4 h-4 mr-2" /> Implemented</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-mono text-purple-300">useCopilotReadable</td>
                                        <td className="p-4 font-mono text-blue-300">useLiquidReadable</td>
                                        <td className="p-4 flex items-center text-green-400"><CheckCircle2 className="w-4 h-4 mr-2" /> Implemented</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-mono text-purple-300">useCopilotAction</td>
                                        <td className="p-4 font-mono text-blue-300">useLiquidAction</td>
                                        <td className="p-4 flex items-center text-green-400"><CheckCircle2 className="w-4 h-4 mr-2" /> Implemented</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-mono text-purple-300">Generative UI</td>
                                        <td className="p-4 font-mono text-blue-300">{'<LiquidSmartComponent />'}</td>
                                        <td className="p-4 flex items-center text-green-400"><CheckCircle2 className="w-4 h-4 mr-2" /> Implemented</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-mono text-purple-300">Backend Runtime</td>
                                        <td className="p-4 font-mono text-blue-300">
                                            <span>GeminiService (Client)</span>
                                            <span className="mx-2 text-gray-500">/</span>
                                            <span>ProxyService (Node)</span>
                                        </td>
                                        <td className="p-4 flex items-center text-green-400"><CheckCircle2 className="w-4 h-4 mr-2" /> Implemented</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Code-Level Differences */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">2. Key Architecture Differences</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-3">Runtime Environment</h3>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li className="flex items-start">
                                        <span className="text-purple-400 mr-2 font-bold">CK:</span>
                                        Requires a backend endpoint (e.g., /api/copilotkit) to handle LLM interaction and security.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2 font-bold">AG:</span>
                                        <div>
                                            <span className="text-green-400 font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 mr-2">UPDATED</span>
                                            Supports <strong>Dual Runtime Modes</strong>:
                                            <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-500">
                                                <li><strong>Demo Mode:</strong> Client-side API calls (no backend required).</li>
                                                <li><strong>Production Mode:</strong> Proxies calls via Node.js backend to secure keys.</li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-3">Context Management</h3>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li className="flex items-start">
                                        <span className="text-purple-400 mr-2 font-bold">CK:</span>
                                        Uses a sophisticated tree-based context system with smart pruning.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2 font-bold">AG:</span>
                                        <div>
                                            <span className="text-green-400 font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 mr-2">UPDATED</span>
                                            Now implements a <strong>Hybrid Strategy Pattern</strong> toggleable via Settings:
                                            <ul className="list-disc ml-4 mt-1 space-y-1 text-gray-500">
                                                <li><strong>Flat Strategy:</strong> Classic behavior (full dump).</li>
                                                <li><strong>Tree Strategy:</strong> Smart pruning based on route focus (matches CK).</li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Code Comparison */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">3. Implementation Comparison</h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Readable Context</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    AG-UI mirrors the <code>useCopilotReadable</code> API almost exactly, allowing for easy migration.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-mono text-purple-300 mb-2">CopilotKit</div>
                                        <LiquidCodeBlock code={`useCopilotReadable({
  description: "App State",
  value: state
});`} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono text-blue-300 mb-2">Liquid Engine</div>
                                        <LiquidCodeBlock code={liquidReadableExample} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Liquid Actions</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Actions are defined client-side with a Zod-like schema structure, but without the heavy dependency.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-mono text-purple-300 mb-2">CopilotKit</div>
                                        <LiquidCodeBlock code={`useCopilotAction({
  name: "updateTheme",
  parameters: [ ... ],
  handler: async () => { ... }
});`} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono text-blue-300 mb-2">Liquid Engine</div>
                                        <LiquidCodeBlock code={liquidActionExample} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Hybrid Context Strategy</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    The unique ability to toggle between Flat and Tree-based context management strategies.
                                </p>
                                <LiquidCodeBlock code={hybridStrategyExample} />
                            </div>
                        </div>
                    </section>

                    {/* Component Deep Dive */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">4. Component Deep Dive</h2>
                        <div className="grid grid-cols-1 gap-6">

                            {/* LiquidProvider */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">&lt;LiquidProvider /&gt;</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    The root provider that initializes the <code>LiquidClient</code> singleton and passes it down via React Context.
                                    Unlike CopilotKit's provider which manages websocket connections to a backend, this provider manages the
                                    client-side event bus and state registry for the Liquid Engine.
                                </p>
                            </div>

                            {/* useLiquidReadable */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">useLiquidReadable</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    A hook to register application state into the AI's context window.
                                    It mimics <code>useCopilotReadable</code> but stores data in the local <code>ReadableContext</code> registry.
                                    When the "Tree Strategy" is active, these contexts are intelligently pruned based on the current route and hierarchy.
                                </p>
                            </div>

                            {/* useLiquidAction */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">useLiquidAction</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    Registers a callable function (tool) for the AI. It uses a Zod-like schema definition for parameters.
                                    When the LLM requests a tool call, the <code>LiquidClient</code> intercepts it, executes the registered handler,
                                    and feeds the result back to the model—all purely client-side.
                                </p>
                            </div>

                            {/* LiquidSmartComponent */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">&lt;LiquidSmartComponent /&gt;</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    A Generative UI wrapper. It doesn't just render content; it acts as a slot that the AI can "fill"
                                    dynamically. It registers itself as a potential target for generation. When the AI decides to show a UI element,
                                    it sends a command to mount a specific component into this slot.
                                </p>
                            </div>

                            {/* GeminiService */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">GeminiService (Client-Side)</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    The bridge between the Liquid Engine and the Google Generative AI SDK.
                                    It handles:
                                </p>
                                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-400">
                                    <li>Constructing the final System Prompt from the Strategy Engine.</li>
                                    <li>Converting registered Liquid Actions into Gemini <code>FunctionDeclarations</code>.</li>
                                    <li>Streaming the LLM response and parsing it into Liquid Protocol events (<code>tool_start</code>, <code>tool_delta</code>, etc.).</li>
                                </ul>
                            </div>

                            {/* GeminiProxyService */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono mb-2">New</span>
                                <h3 className="text-lg font-semibold text-blue-300 mb-2 font-mono">GeminiProxyService</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    The production-ready counterpart to <code>GeminiService</code>. Instead of calling Google's API directly, it:
                                </p>
                                <ul className="list-disc ml-5 space-y-1 text-sm text-gray-400">
                                    <li>Connects to the Node.js backend via <code>/api/chat</code>.</li>
                                    <li>Consumes Server-Sent Events (SSE) from the proxy.</li>
                                    <li>Eliminates client-side API key exposure while maintaining the exact same <code>ILiquidLLMService</code> interface.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Config & Knowledge Logic */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">5. Knowledge & System Architecture</h2>
                        <div className="space-y-6 text-gray-300">
                            <p>
                                The Liquid Engine handles demo-specific knowledge different from standard application state.
                                This allows for dynamic personality switching without code changes.
                            </p>

                            <div className="mt-4">
                                <h4 className="text-white font-semibold mb-2">How it works:</h4>
                                <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-400">
                                    <li>
                                        <strong>Storage:</strong> Page-specific configurations (System Prompts + Knowledge Arrays) are stored in <code>AgentConfigContext</code> (backed by LocalStorage).
                                    </li>
                                    <li>
                                        <strong>Injection:</strong> The global <code>AgSidebar</code> component listens to route changes.
                                    </li>
                                    <li>
                                        <strong>Registration:</strong> On every route change, <code>AgSidebar</code> grabs the config for the current path and uses <code>useLiquidReadable</code> to register a special context node: <code>agent_configuration</code>.
                                    </li>
                                    <li>
                                        <strong>Consumption:</strong> The active <code>GeminiService</code> reads this context (if permitted by the active Strategy) and prepends it to the chat session instructions.
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Directory Map */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">6. Implementation Directory</h2>
                        <div className="bg-black/30 rounded-xl p-6 border border-white/10 font-mono text-xs overflow-x-auto">
                            <pre className="text-gray-300">
                                {`src/
├── liquid-engine/          # Core Engine Logic
│   ├── client.ts           # LiquidClient (Event Bus & Registry)
│   ├── react.tsx           # React Hooks (Providers & Hooks)
│   ├── strategies/         # Context Strategies (Flat/Tree)
│   └── ...
│
├── server/                 # [NEW] Backend Proxy
│   ├── src/
│   │   ├── index.ts        # Express Server Entry
│   │   └── services/       # Server-side API Handlers
│   └── package.json
│
├── services/
│   ├── liquid.ts           # Singleton Instance
│   ├── types.ts            # [NEW] Service Interfaces
│   ├── gemini.ts           # Client-Side Adapter
│   ├── proxy/              # [NEW] Proxy Adapters
│   │   └── gemini.ts       # GeminiProxyService
│   └── claude.ts           # Anthropic Adapter
│
├── components/
    └── generative/         # GenUI Components
        ├── AgSidebar.tsx   # Chat Interface (w/ Factory Logic)
        └── ...`}
                            </pre>
                        </div>
                    </section>

                    {/* Feature Parity */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Unique AG-UI Features</h2>
                        <div className="space-y-4">
                            <div className="flex items-start p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-blue-300">Multi-Provider Support</h4>
                                    <p className="text-sm text-blue-200/70 mt-1">
                                        Seamlessly switches between <strong>Gemini 2.0 Flash</strong> and <strong>Claude 3.5 Sonnet</strong> on the fly,
                                        whereas standard CopilotKit configurations are typically static at the backend level.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Info className="w-5 h-5 text-purple-400 mt-0.5 mr-3 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-purple-300">Liquid Flow State</h4>
                                    <p className="text-sm text-purple-200/70 mt-1">
                                        Includes <code>useFlowState</code>, a custom state machine hook for wizard-like workflows that
                                        pairs perfectly with AI navigation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recommendations */}
                    <section className="border-t border-white/10 pt-8">
                        <h2 className="text-2xl font-bold text-white mb-4">8. Recommendations</h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                <strong>For Demo/Showcase:</strong> The current implementation is excellent. It minimizes friction (no backend needed), provides immediate feedback, and effectively demonstrates Generative UI patterns.
                            </p>
                            <p>
                                <strong>For Production:</strong> Use the newly implemented <strong>Production Mode</strong>. This routes traffic through the <code>/server</code> proxy, automatically securing API keys and allowing for future middleware (rate limiting, auth, logging).
                            </p>
                        </div>
                    </section>
                </GlassContainer>
            </div>
        </div>
    );
}
