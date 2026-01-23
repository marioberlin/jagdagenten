import React from 'react';
import { Link } from 'react-router-dom';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { cn } from '@/utils/cn';
import {
    Rocket,
    FlaskConical,
    Sparkles,
    Box,
    FileText,
    BarChart3,
    Puzzle,
    Globe,
    PenSquare,
    Map,
    Cpu,
    Cloud
} from 'lucide-react';

interface DemoCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    tags?: string[];
    status?: 'stable' | 'beta' | 'experimental';
}

const DemoCard: React.FC<DemoCardProps> = ({
    title,
    description,
    href,
    icon: Icon,
    tags = [],
    status = 'stable'
}) => {
    const statusColors = {
        stable: 'bg-green-500/20 text-green-400 border-green-500/30',
        beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        experimental: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
        <Link to={href} className="group">
            <GlassContainer
                className={cn(
                    'p-6 h-full transition-all duration-300',
                    'hover:bg-white/[0.08] hover:border-white/20',
                    'hover:shadow-lg hover:shadow-white/5',
                    'hover:translate-y-[-2px]'
                )}
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                        <Icon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold group-hover:text-white transition-colors">
                                {title}
                            </h4>
                            {status !== 'stable' && (
                                <span className={cn(
                                    'px-2 py-0.5 text-xs rounded-full border',
                                    statusColors[status]
                                )}>
                                    {status}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-white/60 mb-3">
                            {description}
                        </p>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50 border border-white/10"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </GlassContainer>
        </Link>
    );
};

const DEMOS: DemoCardProps[] = [
    {
        title: 'Aurora Weather',
        description: 'Liquid Glass weather experience with material reactivity and semantic tinting',
        href: '/os/demos/aurora-weather',
        icon: Cloud,
        tags: ['Weather', 'A2A', 'Material Reactivity'],
        status: 'stable',
    },
    {
        title: 'AI Researcher',
        description: 'Autonomous research agent with multi-step reasoning and source synthesis',
        href: '/os/demos/ai-researcher',
        icon: FlaskConical,
        tags: ['Agent', 'Research', 'A2A'],
        status: 'stable',
    },
    {
        title: 'Copilot Form',
        description: 'AI-assisted form filling with natural language understanding',
        href: '/os/demos/copilot-form',
        icon: Sparkles,
        tags: ['Copilot', 'Forms', 'NLP'],
        status: 'stable',
    },
    {
        title: 'Dynamic Dashboard',
        description: 'Real-time dashboard with AI-generated insights and visualizations',
        href: '/os/demos/dynamic-dashboard',
        icon: BarChart3,
        tags: ['Dashboard', 'Charts', 'Real-time'],
        status: 'stable',
    },
    {
        title: 'Extension Demo',
        description: 'Browser extension integration and cross-context communication',
        href: '/os/demos/extension',
        icon: Puzzle,
        tags: ['Extension', 'Integration'],
        status: 'beta',
    },
    {
        title: 'Foundation',
        description: 'Core component library showcase with design tokens',
        href: '/os/demos/foundation',
        icon: Box,
        tags: ['Components', 'Design System'],
        status: 'stable',
    },
    {
        title: 'QA Agent',
        description: 'Question-answering agent with document retrieval and citations',
        href: '/os/demos/qa-agent',
        icon: FileText,
        tags: ['Agent', 'Q&A', 'RAG'],
        status: 'stable',
    },
    {
        title: 'Research Canvas',
        description: 'Collaborative research workspace with AI assistance',
        href: '/os/demos/research-canvas',
        icon: PenSquare,
        tags: ['Canvas', 'Collaboration'],
        status: 'beta',
    },
    {
        title: 'Signature Demo',
        description: 'Digital signature capture and verification component',
        href: '/os/demos/signature',
        icon: PenSquare,
        tags: ['Input', 'Signature'],
        status: 'stable',
    },
    {
        title: 'State Machine',
        description: 'Visual state machine editor and debugger',
        href: '/os/demos/state-machine',
        icon: Cpu,
        tags: ['XState', 'Debugging'],
        status: 'experimental',
    },
    {
        title: 'Travel Planner',
        description: 'AI-powered travel itinerary planning with map integration',
        href: '/os/demos/travel-planner',
        icon: Map,
        tags: ['Agent', 'Maps', 'Planning'],
        status: 'stable',
    },
    {
        title: 'Smart Sheets',
        description: 'AI-enhanced spreadsheet with formula generation and data insights',
        href: '/os/sheets',
        icon: Globe,
        tags: ['Spreadsheet', 'Google Integration'],
        status: 'stable',
    },
    {
        title: 'Remote Password',
        description: 'Connects to a remote A2A agent for secure password generation',
        href: '/os/demos/remote-password',
        icon: Globe,
        tags: ['Remote', 'A2A', 'Security'],
        status: 'stable',
    },
    {
        title: 'OneFlow Status',
        description: 'Connects to a remote A2A agent for workflow status checking',
        href: '/os/demos/oneflow-status',
        icon: Globe,
        tags: ['Remote', 'A2A', 'Status'],
        status: 'stable',
    },
    {
        title: 'Neon Tokyo',
        description: 'Hyper-personalized travel concierge with atmosphere-reactive UI',
        href: '/os/demos/neon-tokyo',
        icon: Sparkles,
        tags: ['Travel', 'Atmosphere', 'A2A'],
        status: 'experimental',
    },
];

export const DemosIndex: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <GlassContainer className="max-w-7xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
                            <Rocket className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                        Interactive Demos
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        Explore the capabilities of Liquid Glass through these interactive demonstrations.
                        Each demo showcases different features, from AI agents to data visualization.
                    </p>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-8 mb-12">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-1">
                            {DEMOS.length}
                        </h2>
                        <p className="text-sm text-white/50">
                            Demos
                        </p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-1">
                            {DEMOS.filter(d => d.status === 'stable').length}
                        </h2>
                        <p className="text-sm text-white/50">
                            Stable
                        </p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-1">
                            5
                        </h2>
                        <p className="text-sm text-white/50">
                            AI Agents
                        </p>
                    </div>
                </div>

                {/* Demo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {DEMOS.map((demo) => (
                        <DemoCard key={demo.title} {...demo} />
                    ))}
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link to="/os" className="text-white/50 hover:text-white transition-colors">
                            ← Back to OS
                        </Link>
                        <span className="text-white/20">|</span>
                        <Link to="/os/design" className="text-white/50 hover:text-white transition-colors">
                            Component Library
                        </Link>
                        <span className="text-white/20">|</span>
                        <Link to="/os/agents" className="text-white/50 hover:text-white transition-colors">
                            Agent Hub
                        </Link>
                        <span className="text-white/20">|</span>
                        <a
                            href="https://github.com/yourusername/LiquidCrypto"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};

export default DemosIndex;
