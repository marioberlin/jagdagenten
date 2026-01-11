import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIResearcherDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'AI Researcher Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            AI Researcher
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Autonomous web research and fact extraction using Liquid Engine.
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
                            The AI Researcher demo shows how to build an agent that can search the web,
                            process results, and extract key facts. It demonstrates chaining multiple AI actions
                            and maintaining a complex context of search results.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/ai-researcher')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. Readable State */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Context Awareness
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The agent needs to know what has already been found to avoid duplicate searches
                                and to synthesize new information.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
    description: "AI Researcher - Current query and search results",
    value: {
        currentQuery: query,
        resultCount: results.length,
        factCount: facts.length,
        results: results.map(r => ({
            title: r.title,
            source: r.source,
            snippet: r.snippet.substring(0, 150) + '...'
        }))
    }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Web Search Action */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Web Search Capability
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                This action allows the AI to simulate a web search and return structured results.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "search_web",
    description: "Search the web for information on a topic",
    parameters: [
        { name: "query", type: "string", description: "The search query", required: true },
        { 
            name: "results", 
            type: "array", 
            description: "Array of search results", 
            required: true, 
            items: { 
                type: 'object', 
                properties: { 
                    title: { type: 'STRING' }, 
                    url: { type: 'STRING' }, 
                    snippet: { type: 'STRING' }, 
                    source: { type: 'STRING' } 
                } 
            } 
        }
    ],
    handler: (args) => {
        // In a real app, you might call a real search API here
        // For this demo, the AI hallucinating the search results simulates the agent
        const newResults = args.results.map(createResultObject);
        setResults(prev => [...newResults, ...prev]);
        return { success: true, resultCount: newResults.length };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Fact Extraction */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. Knowledge Extraction
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                A separate action allows the AI to identify and save specific facts with confidence scores.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "extract_facts",
    description: "Extract key facts from the search results",
    parameters: [
        { 
            name: "facts", 
            type: "array", 
            description: "Array of extracted facts", 
            required: true, 
            items: { 
                type: 'object', 
                properties: { 
                    fact: { type: 'STRING' }, 
                    confidence: { type: 'STRING' } 
                } 
            } 
        }
    ],
    handler: (args) => {
        const newFacts = args.facts.map(createFactObject);
        setFacts(prev => [...prev, ...newFacts]);
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
