import { useState } from 'react';
import {
    GlassAgent,
    GlassPrompt,
    GlassCopilot,
    GlassDynamicUI,
    GlassButton,
    GlassCard,
    GlassBadge,
    GlassCode,
} from '@/components';
import type { UINode } from '@/components/agentic/GlassDynamicUI';
import type { AgentState } from '@/components/agentic/GlassAgent';

export const ShowcaseAgentic = () => {
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [copilotOpen, setCopilotOpen] = useState(false);

    // Sample Dynamic UI Schema
    const sampleSchema: UINode = {
        type: 'card',
        props: { className: 'p-4 w-full max-w-sm' },
        children: [
            {
                type: 'stack',
                props: { direction: 'vertical', gap: 4 },
                children: [
                    { type: 'text', props: { variant: 'h3' }, children: 'Quick Settings' },
                    { type: 'slider', id: 'volume', props: { label: 'Volume', value: 75, max: 100 } },
                    { type: 'toggle', id: 'notifications', props: { label: 'Enable Notifications', checked: true } },
                    { type: 'button', id: 'save', props: { variant: 'primary' }, children: 'Save' },
                ]
            }
        ]
    };

    return (
        <div className="space-y-16">
            {/* Section Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-primary">Agentic UI</h2>
                    <GlassBadge variant="glass">2.0</GlassBadge>
                </div>
                <p className="text-secondary max-w-2xl">
                    AI-native components for building intelligent interfaces. Features organic animations,
                    multi-modal inputs, and generative UI capabilities.
                </p>
            </div>

            {/* Component Grid */}
            <div className="space-y-16">

                {/* GlassAgent */}
                <section id="agent" className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Agentic</span>
                            <h3 className="text-xl font-semibold text-primary">GlassAgent</h3>
                        </div>
                        <GlassBadge variant="outline">AI State</GlassBadge>
                    </div>
                    <p className="text-secondary text-sm">
                        Visual representation of an AI agent's current state with animated effects.
                    </p>

                    <GlassCard className="p-8 flex flex-col items-center gap-8">
                        {/* Variant: Orb */}
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-xs text-tertiary uppercase tracking-wider">Orb Variant</span>
                            <div className="flex gap-6 items-end">
                                <div className="flex flex-col items-center">
                                    <GlassAgent state="idle" size="sm" variant="orb" />
                                    <span className="text-xs text-tertiary mt-2">Idle</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <GlassAgent state="listening" size="md" variant="orb" />
                                    <span className="text-xs text-tertiary mt-2">Listen</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <GlassAgent state="thinking" size="lg" variant="orb" />
                                    <span className="text-xs text-tertiary mt-2">Think</span>
                                </div>
                            </div>
                        </div>

                        {/* Variant: Flux */}
                        <div className="flex flex-col items-center gap-4 pt-6 border-t border-glass-border w-full">
                            <span className="text-xs text-tertiary uppercase tracking-wider">Flux Variant (Organic)</span>
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <GlassAgent
                                    state={agentState}
                                    size="lg"
                                    variant="flux"
                                    className="scale-125"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <GlassButton size="sm" onClick={() => setAgentState('idle')}>Idle</GlassButton>
                                <GlassButton size="sm" onClick={() => setAgentState('listening')}>Listen</GlassButton>
                                <GlassButton size="sm" onClick={() => setAgentState('thinking')}>Think</GlassButton>
                                <GlassButton size="sm" onClick={() => setAgentState('replying')}>Reply</GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* GlassPrompt */}
                <section id="prompt" className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Agentic</span>
                            <h3 className="text-xl font-semibold text-primary">GlassPrompt</h3>
                        </div>
                        <GlassBadge variant="outline">Multi-Modal Input</GlassBadge>
                    </div>
                    <p className="text-secondary text-sm">
                        AI input interface with file upload, intent detection, and voice support.
                    </p>

                    <GlassCard className="p-6">
                        <GlassPrompt
                            variant="standard"
                            placeholder="Ask me anything..."
                            onSubmit={() => { }}
                        />
                    </GlassCard>
                </section>

                {/* GlassDynamicUI */}
                <section id="dynamic-ui" className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Agentic</span>
                            <h3 className="text-xl font-semibold text-primary">GlassDynamicUI</h3>
                        </div>
                        <GlassBadge variant="outline">Generative</GlassBadge>
                    </div>
                    <p className="text-secondary text-sm">
                        Render Glass UI components from JSON schemas. Supports interactive elements.
                    </p>

                    <GlassCard className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Rendered Output */}
                            <div className="flex-1">
                                <span className="text-xs text-tertiary uppercase tracking-wider block mb-3">Rendered Output</span>
                                <GlassDynamicUI
                                    schema={sampleSchema}
                                    onAction={(id, data) => console.log('Action:', id, data)}
                                />
                            </div>
                            {/* Schema Preview */}
                            <div className="flex-1 bg-glass-surface/30 rounded-2xl p-4 overflow-auto max-h-[300px]">
                                <span className="text-xs text-tertiary uppercase tracking-wider block mb-2">JSON Schema</span>
                                <pre className="text-xs text-secondary font-mono whitespace-pre-wrap">
                                    {JSON.stringify(sampleSchema, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* GlassCopilot */}
                <section id="copilot" className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Agentic</span>
                            <h3 className="text-xl font-semibold text-primary">GlassCopilot</h3>
                        </div>
                        <GlassBadge variant="outline">Assistant</GlassBadge>
                    </div>
                    <p className="text-secondary text-sm">
                        Context-aware floating assistant widget. Supports floating and sidebar modes.
                    </p>

                    <GlassCard className="p-6">
                        <div className="space-y-4">
                            <span className="text-xs text-tertiary uppercase tracking-wider block">Interactive Demo</span>
                            <p className="text-sm text-secondary">
                                Click the button below to toggle the floating Copilot widget.
                            </p>
                            <GlassButton onClick={() => setCopilotOpen(prev => !prev)}>
                                {copilotOpen ? 'Hide Copilot' : 'Show Copilot'}
                            </GlassButton>

                            <div className="mt-4 p-4 bg-glass-surface/30 rounded-xl text-sm text-tertiary">
                                <strong>Modes:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><code>floating</code> - Collapsible pill/chat widget (default)</li>
                                    <li><code>sidebar</code> - Full-height docked panel</li>
                                </ul>
                            </div>
                        </div>
                    </GlassCard>
                </section>
            </div>

            {/* Floating Copilot Demo */}
            {copilotOpen && (
                <GlassCopilot
                    mode="floating"
                    state={agentState}
                    context="ShowcaseAgentic.tsx"
                    defaultExpanded={true}
                    onClose={() => setCopilotOpen(false)}
                />
            )}

            {/* Code Examples */}
            <section className="p-6">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Agentic</span>
                    <h3 className="text-xl font-bold text-primary mb-4">Usage Examples</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Agent Component</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassAgent
  state="thinking" // 'idle' | 'thinking' | 'streaming' | 'done'
  title="AI Agent"
  onStateChange={setState}
/>`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Copilot & Prompt</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassCopilot
  mode="floating"
  state={agentState}
  context="filename.tsx"
/>

<GlassPrompt
  placeholder="Ask AI..."
  onSubmit={handleSubmit}
/>`}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};
