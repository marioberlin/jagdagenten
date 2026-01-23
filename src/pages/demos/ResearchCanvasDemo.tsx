import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { BookOpen, FileText, Link, Quote, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ResearchAgentService } from '@/services/a2a/ResearchAgentService';

// Initialize the engine client
const liquidClient = new LiquidClient();

type ContentBlockType = 'text' | 'quote' | 'source';

interface ContentBlock {
    id: string;
    type: ContentBlockType;
    content: string;
    source?: string;
    url?: string;
}

export default function ResearchCanvasDemo() {
    const navigate = useNavigate();

    // We need to pass the SAME service instance to the Sidebar so they share context/history
    // But AgSidebar uses the global context or props. 
    // For this refactor, we'll use a local instance passed via context if possible, 
    // OR just instantiate it here and pass it down if AgSidebar accepts it.
    // Looking at AgSidebar implementation (from memory/previous context), it likely usually uses a global service or one from context.
    // To make this robust, we should probably wrap this in a ContextProvider that provides the service depending on the route?
    // OR simplified: Just pass the `agentService` we created in `ResearchContent` UP to here?

    // BETTER APPROACH: Instantiate service at top level, pass to Sidebar and Content.

    const [topic, setTopic] = useState('');
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);

    const agentService = useMemo(() => new ResearchAgentService('demo-session', (data: any) => {
        if (data.topic) setTopic(data.topic);
        if (data.blocks) setBlocks(data.blocks);
    }), []);

    useEffect(() => {
        agentService.sendMessage("Load the current research canvas state.");
    }, [agentService]);

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Research Canvas', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                <BookOpen size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    Research Canvas
                                </h1>
                                <p className="text-sm text-white/50">
                                    AI Agent • A2A Enabled
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/research-canvas')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Canvas Area */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden">
                        <div className="flex flex-col h-full">
                            {/* Topic Header */}
                            <div className="mb-6">
                                <label className="text-xs text-secondary mb-1 block">Research Topic</label>
                                <div className="text-lg font-medium text-white">{topic || "Loading..."}</div>
                            </div>

                            {/* Content Blocks */}
                            <div className="flex-1 space-y-3 overflow-auto">
                                {blocks.map(block => {
                                    const Icon = block.type === 'quote' ? Quote : block.type === 'source' ? Link : FileText;

                                    return (
                                        <GlassContainer
                                            key={block.id}
                                            className={cn(
                                                "p-4 group relative",
                                                block.type === 'quote' && "border-l-4 border-l-amber-500/50",
                                                block.type === 'source' && "border-l-4 border-l-blue-500/50"
                                            )}
                                            border
                                            material="thin"
                                        >
                                            <div className="flex gap-3 pl-4">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg h-fit",
                                                    block.type === 'text' && "bg-white/10 text-secondary",
                                                    block.type === 'quote' && "bg-amber-500/10 text-amber-400",
                                                    block.type === 'source' && "bg-blue-500/10 text-blue-400"
                                                )}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "text-sm leading-relaxed",
                                                        block.type === 'quote' ? "italic text-amber-100/80" : "text-secondary"
                                                    )}>
                                                        {block.content}
                                                    </p>
                                                    {block.source && (
                                                        <p className="text-xs text-white/40 mt-2">
                                                            — {block.source}
                                                            {block.url && (
                                                                <a
                                                                    href={block.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="ml-2 text-accent-primary hover:underline"
                                                                >
                                                                    View →
                                                                </a>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-white/20 mt-2 pl-4">ID: {block.id}</div>
                                        </GlassContainer>
                                    );
                                })}

                                {/* Empty State */}
                                {blocks.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="p-4 rounded-full bg-white/5 inline-block mb-4">
                                            <BookOpen size={32} className="text-secondary" />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Start your research</h3>
                                        <p className="text-sm text-secondary mb-4">
                                            Ask the AI to "Add a note about..." or "Search for sources on..."
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div >

                {/* Sidebar - Injecting our specific agent service */}
                <AgSidebar initialService={agentService} />
            </div >
        </LiquidProvider >
    );
}
