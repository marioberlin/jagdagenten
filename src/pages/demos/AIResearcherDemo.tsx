import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { GlassContainer } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';

import { LiquidProvider, useLiquidReadable, useLiquidAction } from '../../liquid-engine/react';
import { GlassButton } from '../../components/primitives/GlassButton';
import { Microscope, Search, ExternalLink, FileText, Lightbulb, Trash2, Globe, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';

import { liquidClient } from '../../services/liquid';

// Initialize the engine client
// Using singleton instance for global context sharing


// Get API Key from Vite env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: Date;
}

interface KeyFact {
    id: string;
    fact: string;
    confidence: 'high' | 'medium' | 'low';
}

// Inner component with hooks
function ResearcherContent() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [facts, setFacts] = useState<KeyFact[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Make researcher state readable to AI
    useLiquidReadable({
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
    });

    // Web search action
    useLiquidAction({
        name: "search_web",
        description: "Search the web for information on a topic and return results",
        parameters: [
            { name: "query", type: "string", description: "The search query", required: true },
            { name: "results", type: "array", description: "Array of search results with title, url, snippet, source", required: true, items: { type: 'object', properties: { title: { type: 'STRING' }, url: { type: 'STRING' }, snippet: { type: 'STRING' }, source: { type: 'STRING' } } } }
        ],
        handler: (args: { query: string; results: Array<{ title: string; url: string; snippet: string; source: string }> }) => {
            const newResults: SearchResult[] = args.results.map((r, i) => ({
                id: `${Date.now()}-${i}`,
                title: r.title,
                url: r.url,
                snippet: r.snippet,
                source: r.source,
                timestamp: new Date()
            }));
            setResults(prev => [...newResults, ...prev]);
            setQuery(args.query);
            setIsSearching(false);
            return { success: true, resultCount: newResults.length };
        }
    });

    // Extract facts action
    useLiquidAction({
        name: "extract_facts",
        description: "Extract key facts from the search results",
        parameters: [
            { name: "facts", type: "array", description: "Array of extracted facts with fact text and confidence level", required: true, items: { type: 'object', properties: { fact: { type: 'STRING' }, confidence: { type: 'STRING' } } } }
        ],
        handler: (args: { facts: Array<{ fact: string; confidence: 'high' | 'medium' | 'low' }> }) => {
            const newFacts: KeyFact[] = args.facts.map((f, i) => ({
                id: `${Date.now()}-${i}`,
                fact: f.fact,
                confidence: f.confidence
            }));
            setFacts(prev => [...prev, ...newFacts]);
            return { success: true, factCount: newFacts.length };
        }
    });

    // Summarize action
    useLiquidAction({
        name: "summarize_research",
        description: "Create a summary of all collected research",
        parameters: [
            { name: "summary", type: "string", description: "The research summary", required: true }
        ],
        handler: (args: { summary: string }) => {
            const summaryResult: SearchResult = {
                id: Date.now().toString(),
                title: "📝 Research Summary",
                url: "",
                snippet: args.summary,
                source: "AI Generated",
                timestamp: new Date()
            };
            setResults(prev => [summaryResult, ...prev]);
            return { success: true };
        }
    });

    const handleDeleteResult = useCallback((id: string) => {
        setResults(prev => prev.filter(r => r.id !== id));
    }, []);

    const handleDeleteFact = useCallback((id: string) => {
        setFacts(prev => prev.filter(f => f.id !== id));
    }, []);

    const confidenceColors = {
        high: 'bg-green-500/10 text-green-400 border-green-500/30',
        medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        low: 'bg-red-500/10 text-red-400 border-red-500/30'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left: Search Results */}
            <div className="lg:col-span-2 flex flex-col h-full">
                {/* Search Bar */}
                <div className="mb-4 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter a research topic..."
                        className={cn(
                            "w-full pl-11 pr-4 py-3 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "text-white placeholder:text-secondary",
                            "focus:outline-none focus:border-accent-primary/50",
                            "transition-all"
                        )}
                    />
                </div>

                {/* Results */}
                <div className="flex-1 space-y-3 overflow-auto">
                    {isSearching && (
                        <GlassContainer className="p-4" border material="thin">
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-accent-primary animate-spin" />
                                <span className="text-secondary">Searching the web...</span>
                            </div>
                        </GlassContainer>
                    )}

                    {results.map(result => (
                        <GlassContainer
                            key={result.id}
                            className="p-4 group relative"
                            border
                            material="thin"
                        >
                            <button
                                onClick={() => handleDeleteResult(result.id)}
                                className="absolute right-2 top-2 p-1 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            >
                                <Trash2 size={12} />
                            </button>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-white mb-1 pr-8">{result.title}</h3>
                                    <p className="text-sm text-secondary mb-2 line-clamp-3">{result.snippet}</p>
                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                        <span>{result.source}</span>
                                        {result.url && (
                                            <a
                                                href={result.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent-primary hover:underline flex items-center gap-1"
                                            >
                                                View Source <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </GlassContainer>
                    ))}

                    {/* Empty State */}
                    {results.length === 0 && !isSearching && (
                        <div className="text-center py-12">
                            <div className="p-4 rounded-full bg-white/5 inline-block mb-4">
                                <Globe size={32} className="text-secondary" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Start Researching</h3>
                            <p className="text-sm text-secondary">
                                Enter a topic above or ask Copilot to search for information.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Key Facts */}
            <div className="flex flex-col h-full">
                <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Lightbulb size={14} className="text-yellow-400" />
                    Key Facts
                </h2>

                <div className="flex-1 space-y-2 overflow-auto">
                    {facts.map(fact => (
                        <GlassContainer
                            key={fact.id}
                            className="p-3 group relative"
                            border
                            material="thin"
                        >
                            <button
                                onClick={() => handleDeleteFact(fact.id)}
                                className="absolute right-2 top-2 p-1 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            >
                                <Trash2 size={10} />
                            </button>

                            <p className="text-sm text-secondary pr-6 mb-2">{fact.fact}</p>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border",
                                confidenceColors[fact.confidence]
                            )}>
                                {fact.confidence} confidence
                            </span>
                        </GlassContainer>
                    ))}

                    {facts.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-secondary">
                                Ask Copilot to extract key facts from your research.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AIResearcherDemo() {
    const navigate = useNavigate();
    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'AI Researcher', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                <Microscope size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    AI Researcher
                                </h1>
                                <p className="text-sm text-white/50">
                                    AI-powered web research with fact extraction.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/ai-researcher')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Researcher Area */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden">
                        <ResearcherContent />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar apiKey={API_KEY} />
            </div>
        </LiquidProvider>
    );
}
