import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { GlassContainer } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { GlassButton } from '../../components/primitives/GlassButton';
import { Search, MessageCircle, Lightbulb, Book, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { QAAgentService } from '../../services/a2a/QAAgentService';
import { v4 as uuidv4 } from 'uuid';

// Initialize the engine client
const liquidClient = new LiquidClient();

interface Answer {
    id: string;
    question: string;
    answer: string;
    sources?: string[];
    timestamp: Date;
    helpful?: boolean;
}

// Inner component with hooks
function QAContent() {
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => uuidv4());

    // Handle data updates from A2A agent
    const handleDataUpdate = useCallback((data: any) => {
        if (data.allAnswers) {
            setAnswers(data.allAnswers.map((a: any) => ({
                ...a,
                timestamp: new Date(a.timestamp)
            })));
        } else if (data.answer) {
            setAnswers(prev => {
                const exists = prev.find(a => a.id === data.answer.id);
                if (exists) return prev;
                return [...prev, {
                    ...data.answer,
                    timestamp: new Date(data.answer.timestamp)
                }];
            });
        }
    }, []);

    // Create A2A service
    const agentService = useMemo(
        () => new QAAgentService(sessionId, handleDataUpdate),
        [sessionId, handleDataUpdate]
    );

    const handleMarkHelpful = (id: string, helpful: boolean) => {
        setAnswers(prev => prev.map(a =>
            a.id === id ? { ...a, helpful } : a
        ));
    };

    const sampleQuestions = [
        "What is React Server Components?",
        "How does Gemini's context window work?",
        "Explain the difference between REST and GraphQL",
        "What are the best practices for TypeScript?"
    ];

    const handleQuickQuestion = async (q: string) => {
        setQuestion(q);
        setIsLoading(true);
        try {
            await agentService.sendMessage(q);
        } finally {
            setIsLoading(false);
            setQuestion('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && question.trim()) {
                                handleQuickQuestion(question);
                            }
                        }}
                        placeholder="Ask a question..."
                        className={cn(
                            "w-full pl-12 pr-4 py-4 rounded-xl",
                            "bg-white/5 border border-white/10",
                            "text-white placeholder:text-secondary",
                            "focus:outline-none focus:border-accent-primary/50",
                            "transition-all"
                        )}
                    />
                </div>

                {/* Sample Questions */}
                {answers.length === 0 && (
                    <div className="mt-4">
                        <p className="text-xs text-secondary mb-2">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                            {sampleQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickQuestion(q)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-secondary hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Answers */}
            <div className="flex-1 space-y-4 overflow-auto">
                {answers.map(answer => (
                    <GlassContainer key={answer.id} className="p-5" border material="thin">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                                <MessageCircle size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-white">{answer.question}</p>
                                <p className="text-xs text-secondary mt-1">
                                    {answer.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        <div className="pl-11">
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-secondary leading-relaxed whitespace-pre-wrap">
                                    {answer.answer}
                                </p>
                            </div>

                            {/* Sources */}
                            {answer.sources && answer.sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-secondary mb-2 flex items-center gap-1">
                                        <Book size={12} /> Sources
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {answer.sources.map((source, i) => (
                                            <a
                                                key={i}
                                                href={source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-accent-primary hover:bg-white/10 transition-colors"
                                            >
                                                {source.slice(0, 30)}...
                                                <ExternalLink size={10} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs text-secondary">Was this helpful?</span>
                                <button
                                    onClick={() => handleMarkHelpful(answer.id, true)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        answer.helpful === true
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-white/5 text-secondary hover:bg-white/10"
                                    )}
                                >
                                    <ThumbsUp size={14} />
                                </button>
                                <button
                                    onClick={() => handleMarkHelpful(answer.id, false)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        answer.helpful === false
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-white/5 text-secondary hover:bg-white/10"
                                    )}
                                >
                                    <ThumbsDown size={14} />
                                </button>
                            </div>
                        </div>
                    </GlassContainer>
                ))}

                {/* Loading State */}
                {isLoading && (
                    <GlassContainer className="p-5" border material="thin">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-primary/10">
                                <Lightbulb size={18} className="text-accent-primary animate-pulse" />
                            </div>
                            <p className="text-secondary">Thinking...</p>
                        </div>
                    </GlassContainer>
                )}

                {/* Empty State */}
                {answers.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <div className="p-4 rounded-full bg-white/5 inline-block mb-4">
                            <Search size={32} className="text-secondary" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Ask me anything</h3>
                        <p className="text-sm text-secondary">
                            Type your question above or use the Copilot sidebar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QAAgentDemo() {
    const navigate = useNavigate();
    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Q&A Agent', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <Search size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Q&A Agent
                                </h1>
                                <p className="text-sm text-white/50">
                                    Ask questions and get AI-powered answers with sources.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/qa-agent')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Q&A Area */}
                    <main className="flex-1 p-6 pt-0 overflow-hidden">
                        <QAContent />
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar />
            </div>
        </LiquidProvider>
    );
}
