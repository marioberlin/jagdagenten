import { useState } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent } from '../../components/layout/GlassTabs';
import {
    FileWarning,
    LayoutDashboard,
    Car,
    Search,
    BookOpen,
    Plane,
    Microscope,
    Bot,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    route: string;
    tags?: string[];
    color?: string;
}

function DemoCard({ title, description, icon, route, tags = [], color = 'accent-primary' }: DemoCardProps) {
    return (
        <Link to={route}>
            <GlassContainer
                className="p-6 h-full group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                border
                material="thin"
                interactive
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${color}/10`}>
                        {icon}
                    </div>
                    <ArrowUpRight size={16} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-secondary mb-4">{description}</p>
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-secondary">
                            {tag}
                        </span>
                    ))}
                </div>
            </GlassContainer>
        </Link>
    );
}

function DemoPreview({ title, route }: { title: string; route: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <GlassContainer className="p-8 text-center max-w-md" border material="thin">
                <Bot size={48} className="text-accent-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-secondary mb-6">
                    Open the full demo to experience the AI-powered interface.
                </p>
                <Link to={route}>
                    <GlassButton>
                        <ArrowUpRight size={16} className="mr-2" />
                        Open Full Demo
                    </GlassButton>
                </Link>
            </GlassContainer>
        </div>
    );
}

export function ShowcaseAGUI() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">AG-UI Demos</h2>
                        <p className="text-sm text-secondary">
                            CopilotKit-inspired generative demos powered by Liquid Glass
                        </p>
                    </div>
                </div>
                <Link to="/docs/ag-ui-vs-copilotkit">
                    <GlassButton variant="secondary" size="sm">
                        <BookOpen size={16} className="mr-2" />
                        Technical Audit
                    </GlassButton>
                </Link>
            </div>

            {/* Tab Bar */}
            <GlassTabs value={activeTab} onValueChange={setActiveTab}>
                <GlassTabsList className="flex-wrap">
                    <GlassTabsTrigger value="overview">Overview</GlassTabsTrigger>
                    <GlassTabsTrigger value="form-copilot">Form Copilot</GlassTabsTrigger>
                    <GlassTabsTrigger value="dashboard">Dashboard</GlassTabsTrigger>
                    <GlassTabsTrigger value="state-machine">State Machine</GlassTabsTrigger>
                    <GlassTabsTrigger value="qa-agent">Q&A Agent</GlassTabsTrigger>
                    <GlassTabsTrigger value="research-canvas">Research Canvas</GlassTabsTrigger>
                    <GlassTabsTrigger value="travel-planner">Travel Planner</GlassTabsTrigger>
                    <GlassTabsTrigger value="ai-researcher">AI Researcher</GlassTabsTrigger>
                </GlassTabsList>

                {/* Tab Content */}
                <GlassTabsContent value="overview">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <DemoCard
                                title="Form-Filling Copilot"
                                description="AI-assisted form completion. Describe your data and watch the form fill itself."
                                icon={<FileWarning size={24} className="text-red-400" />}
                                route="/demos/copilot-form"
                                tags={['useLiquidReadable', 'useLiquidAction']}
                                color="red-500"
                            />
                            <DemoCard
                                title="Dynamic Dashboards"
                                description="AI creates, updates, and removes dashboard widgets on command."
                                icon={<LayoutDashboard size={24} className="text-blue-400" />}
                                route="/demos/dynamic-dashboard"
                                tags={['Widget Management', 'Live Updates']}
                                color="blue-500"
                            />
                            <DemoCard
                                title="State Machine Copilot"
                                description="Multi-step wizard flow with AI-guided navigation between stages."
                                icon={<Car size={24} className="text-purple-400" />}
                                route="/demos/state-machine"
                                tags={['useFlowState', 'Stage Navigation']}
                                color="purple-500"
                            />
                            <DemoCard
                                title="Q&A Agent"
                                description="AI-powered question answering with sources and feedback tracking."
                                icon={<Search size={24} className="text-cyan-400" />}
                                route="/demos/qa-agent"
                                tags={['Sources', 'Feedback']}
                                color="cyan-500"
                            />
                            <DemoCard
                                title="Research Canvas"
                                description="Build research documents with AI-assisted content blocks."
                                icon={<BookOpen size={24} className="text-amber-400" />}
                                route="/demos/research-canvas"
                                tags={['Text', 'Quotes', 'Sources']}
                                color="amber-500"
                            />
                            <DemoCard
                                title="Travel Planner"
                                description="Plan trips with AI-assisted itinerary building and map integration."
                                icon={<Plane size={24} className="text-emerald-400" />}
                                route="/demos/travel-planner"
                                tags={['Map', 'Itinerary']}
                                color="emerald-500"
                            />
                            <DemoCard
                                title="AI Researcher"
                                description="Web research interface with fact extraction and confidence levels."
                                icon={<Microscope size={24} className="text-indigo-400" />}
                                route="/demos/ai-researcher"
                                tags={['Search', 'Key Facts']}
                                color="indigo-500"
                            />
                        </div>

                        {/* Hooks Reference */}
                        <GlassContainer className="p-6" border material="thin">
                            <h3 className="text-lg font-semibold text-white mb-4">Foundation Hooks</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-white/5">
                                    <code className="text-sm text-accent-primary">useLiquidReadable</code>
                                    <p className="text-xs text-secondary mt-2">
                                        Exposes application state to the AI, allowing it to understand context.
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <code className="text-sm text-accent-primary">useLiquidAction</code>
                                    <p className="text-xs text-secondary mt-2">
                                        Registers functions that the AI can invoke to manipulate state.
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <code className="text-sm text-accent-primary">useFlowState</code>
                                    <p className="text-xs text-secondary mt-2">
                                        Manages multi-step conversational flows with stage transitions.
                                    </p>
                                </div>
                            </div>
                        </GlassContainer>
                    </div>
                </GlassTabsContent>

                <GlassTabsContent value="form-copilot">
                    <DemoPreview title="Form-Filling Copilot" route="/demos/copilot-form" />
                </GlassTabsContent>

                <GlassTabsContent value="dashboard">
                    <DemoPreview title="Dynamic Dashboards" route="/demos/dynamic-dashboard" />
                </GlassTabsContent>

                <GlassTabsContent value="state-machine">
                    <DemoPreview title="State Machine Copilot" route="/demos/state-machine" />
                </GlassTabsContent>

                <GlassTabsContent value="qa-agent">
                    <DemoPreview title="Q&A Agent" route="/demos/qa-agent" />
                </GlassTabsContent>

                <GlassTabsContent value="research-canvas">
                    <DemoPreview title="Research Canvas" route="/demos/research-canvas" />
                </GlassTabsContent>

                <GlassTabsContent value="travel-planner">
                    <DemoPreview title="Travel Planner" route="/demos/travel-planner" />
                </GlassTabsContent>

                <GlassTabsContent value="ai-researcher">
                    <DemoPreview title="AI Researcher" route="/demos/ai-researcher" />
                </GlassTabsContent>
            </GlassTabs>
        </div>
    );
}
