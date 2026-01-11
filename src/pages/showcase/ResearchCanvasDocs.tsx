import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResearchCanvasDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Research Canvas Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Research Canvas
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Collaborative content creation and organization with AI assistance.
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6 pt-0">
                <div className="max-w-4xl mx-auto space-y-8 pb-10">

                    {/* Introduction */}
                    <GlassContainer className="p-8 space-y-4" border material="thin">
                        <h2 className="text-xl font-bold text-[var(--glass-text-primary)]">Overview</h2>
                        <p className="text-[var(--glass-text-secondary)] leading-relaxed">
                            The Research Canvas demo allows users to build a collection of notes, quotes, and sources.
                            The AI acts as a collaborator, capable of adding new blocks, updating the main topic,
                            and summarizing the existing content on the canvas.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/research-canvas')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. Canvas State */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Canvas Context
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The entire state of the canvas (topic + blocks) is readable by Liquid Engine.
                                This allows the AI to "read" what's on the board.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
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
});`}
                            />
                        </GlassContainer>

                        {/* 2. Content Blocks */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Dynamic Content Blocks
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The `add_content_block` action is polymorphic - it can create text, quotes, or source blocks
                                based on the AI's decision.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "add_content_block",
    description: "Add a new content block to the canvas",
    parameters: [
        { name: "type", type: "string", description: "text, quote, or source", required: true },
        { name: "content", type: "string", required: true },
        { name: "source", type: "string", required: false },
        { name: "url", type: "string", required: false }
    ],
    handler: (args) => {
        const newBlock = {
            id: Date.now().toString(),
            ...args
        };
        setBlocks(prev => [...prev, newBlock]);
        return { success: true };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Summarization */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. Synthesis & Summary
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Since the AI can read all blocks, it can easily perform meta-tasks like
                                summarizing all sources on the canvas into a new block.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "summarize_sources",
    description: "Add a summary block synthesizing the research",
    parameters: [
        { name: "summary", type: "string", required: true }
    ],
    handler: (args) => {
        const newBlock = {
            id: Date.now().toString(),
            type: 'text',
            content: "📝 Summary: " + args.summary
        };
        setBlocks(prev => [...prev, newBlock]);
        return { success: true };
    }
});`}
                            />
                        </GlassContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
