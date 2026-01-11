import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { GlassContainer, GlassButton, GlassInput } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider, useLiquidReadable, useLiquidAction } from '../../liquid-engine/react';
import { BookOpen, Plus, FileText, Link, Quote, Trash2, GripVertical, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Get API Key from Vite env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

type ContentBlockType = 'text' | 'quote' | 'source';

interface ContentBlock {
    id: string;
    type: ContentBlockType;
    content: string;
    source?: string;
    url?: string;
}

// Inner component with hooks
function ResearchContent() {
    const [topic, setTopic] = useState('Artificial Intelligence in Healthcare');
    const [blocks, setBlocks] = useState<ContentBlock[]>([
        { id: '1', type: 'text', content: 'AI is transforming healthcare through early disease detection, personalized treatment plans, and improved diagnostic accuracy. Machine learning algorithms can analyze medical images, predict patient outcomes, and streamline administrative tasks.' },
        { id: '2', type: 'source', content: 'AI in Healthcare: A Comprehensive Review', source: 'Nature Medicine', url: 'https://nature.com/articles/ai-healthcare' }
    ]);

    // Make canvas state readable to AI
    useLiquidReadable({
        description: "Research Canvas - Current topic and content blocks",
        value: {
            topic,
            blockCount: blocks.length,
            blocks: blocks.map(b => ({
                id: b.id,
                type: b.type,
                preview: b.content.substring(0, 100) + '...'
            }))
        }
    });

    // Add content block action
    useLiquidAction({
        name: "add_content_block",
        description: "Add a new content block to the research canvas",
        parameters: [
            { name: "type", type: "string", description: "Block type: text, quote, or source", required: true },
            { name: "content", type: "string", description: "The main content or text", required: true },
            { name: "source", type: "string", description: "Source name (for source/quote types)", required: false },
            { name: "url", type: "string", description: "Source URL (for source type)", required: false }
        ],
        handler: (args: { type: ContentBlockType; content: string; source?: string; url?: string }) => {
            const newBlock: ContentBlock = {
                id: Date.now().toString(),
                type: args.type,
                content: args.content,
                source: args.source,
                url: args.url
            };
            setBlocks(prev => [...prev, newBlock]);
            return { success: true, blockId: newBlock.id };
        }
    });

    // Update topic action
    useLiquidAction({
        name: "set_research_topic",
        description: "Set or update the research topic",
        parameters: [
            { name: "topic", type: "string", description: "The research topic", required: true }
        ],
        handler: (args: { topic: string }) => {
            setTopic(args.topic);
            return { success: true };
        }
    });

    // Summarize action
    useLiquidAction({
        name: "summarize_sources",
        description: "Add a summary block synthesizing the current research",
        parameters: [
            { name: "summary", type: "string", description: "The synthesized summary of all sources", required: true }
        ],
        handler: (args: { summary: string }) => {
            const newBlock: ContentBlock = {
                id: Date.now().toString(),
                type: 'text',
                content: `📝 Summary: ${args.summary}`
            };
            setBlocks(prev => [...prev, newBlock]);
            return { success: true };
        }
    });

    // Clear canvas action
    useLiquidAction({
        name: "clear_canvas",
        description: "Clear all content from the canvas",
        parameters: [],
        handler: () => {
            setBlocks([]);
            return { success: true };
        }
    });

    const handleDeleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    }, []);

    const handleAddBlock = (type: ContentBlockType) => {
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: type === 'text' ? 'New text block...' :
                type === 'quote' ? 'Enter quote here...' :
                    'Source title',
            source: type !== 'text' ? 'Source name' : undefined
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const blockIcons = {
        text: FileText,
        quote: Quote,
        source: Link
    };

    return (
        <div className="flex flex-col h-full">
            {/* Topic Header */}
            <div className="mb-6">
                <label className="text-xs text-secondary mb-1 block">Research Topic</label>
                <GlassInput
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your research topic..."
                    className="text-lg font-medium"
                />
            </div>

            {/* Canvas Toolbar */}
            <div className="flex gap-2 mb-4">
                <GlassButton size="sm" variant="ghost" onClick={() => handleAddBlock('text')}>
                    <FileText size={14} className="mr-1" /> Text
                </GlassButton>
                <GlassButton size="sm" variant="ghost" onClick={() => handleAddBlock('quote')}>
                    <Quote size={14} className="mr-1" /> Quote
                </GlassButton>
                <GlassButton size="sm" variant="ghost" onClick={() => handleAddBlock('source')}>
                    <Link size={14} className="mr-1" /> Source
                </GlassButton>
            </div>

            {/* Content Blocks */}
            <div className="flex-1 space-y-3 overflow-auto">
                {blocks.map(block => {
                    const Icon = blockIcons[block.type];

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
                            {/* Drag handle & actions */}
                            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <GripVertical size={14} className="text-secondary cursor-grab" />
                            </div>
                            <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="absolute right-2 top-2 p-1 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            >
                                <Trash2 size={12} />
                            </button>

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
                            Add content blocks or ask Copilot to help research a topic.
                        </p>
                        <GlassButton onClick={() => handleAddBlock('text')}>
                            <Plus size={16} className="mr-2" />
                            Add First Block
                        </GlassButton>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResearchCanvasDemo() {
    const navigate = useNavigate();
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
                                    Build your research with AI-assisted content blocks.
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
                        <ResearchContent />
                    </main>
                </div >

                {/* Sidebar */}
                < AgSidebar apiKey={API_KEY} />
            </div >
        </LiquidProvider >
    );
}
