import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QAAgentDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Q&A Agent Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Q&A Agent
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Context-aware question answering with citation support.
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
                            The Q&A Agent demo showcases how to build a basic chat interface powered by Liquid Engine.
                            Instead of just streaming text, this implementation uses structured actions to return
                            formal answers complete with source citations and references.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/qa-agent')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. History Context */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Conversation History
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                We provide recent Q&A pairs to the AI so it can maintain conversation context
                                and avoid repeating answers.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
    description: "Q&A Agent - Current question and answer history",
    value: {
        currentQuestion: question,
        answerCount: answers.length,
        recentAnswers: answers.slice(-5).map(a => ({
            question: a.question,
            answer: a.answer.substring(0, 200) + '...'
        }))
    }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Structured Answers */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Structured Answer Format
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Instead of raw text generation, we force the AI to use an action.
                                This ensures we always get separate fields for the answer body and the sources.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "answer_question",
    description: "Provide an answer with optional sources",
    parameters: [
        { name: "question", type: "string", required: true },
        { name: "answer", type: "string", required: true },
        { 
            name: "sources", 
            type: "array", 
            description: "List of source URLs or references", 
            required: false, 
            items: { type: 'string' } 
        }
    ],
    handler: (args) => {
        const newAnswer = {
            id: Date.now().toString(),
            question: args.question,
            answer: args.answer,
            sources: args.sources,
            timestamp: new Date()
        };
        setAnswers(prev => [...prev, newAnswer]);
        return { success: true };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Proactive Suggestions */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. Proactive Suggestions
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The agent can also suggest follow-up questions to guide the user deeper into the topic.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "suggest_questions",
    description: "Suggest related follow-up questions",
    parameters: [
        { name: "suggestions", type: "array", items: { type: 'string' } }
    ],
    handler: (args) => {
        // Implementation to display suggestions chips
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
