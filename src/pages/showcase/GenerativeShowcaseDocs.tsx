import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GenerativeShowcaseDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pink-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Generative UI Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Generative Patterns
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Building self-rendering, AI-driven components.
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
                            The Generative Showcase demonstrates "Smart Components" - UI elements that manage their own
                            AI interactions. Unlike the other demos where a parent page manages state, smart components
                            encapsulate both their UI and their Liquid Engine hooks.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/generative')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. Component Encapsulation */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Encapsulated Logic
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                A Smart Component, like <code>GlassSmartWeather</code>, registers its own actions.
                                It can sit anywhere in the app and "listen" for relevant user intents.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`// Inside GlassSmartWeather.tsx
export function GlassSmartWeather() {
    const [weather, setWeather] = useState(null);

    useLiquidAction({
        name: "show_weather",
        description: "Display weather for a location",
        parameters: [{ name: "location", type: "string" }],
        handler: async ({ location }) => {
            // Fetch weather...
            setWeather(data);
            return { success: true };
        }
    });

    if (!weather) return null; // Invisible until activated

    return <WeatherCard data={weather} />;
}`}
                            />
                        </GlassContainer>

                        {/* 2. Composition */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Composition
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                You can compose multiple smart components on a single page. The Liquid Engine
                                routers the user's intent to the most relevant component action.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`// GenerativeShowcase.tsx
export default function GenerativeShowcase() {
    return (
        <LiquidProvider>
            <div className="grid">
                {/* These components are dormant until triggered */}
                <GlassSmartWeather />
                <GlassSmartList />
                <GlassSmartCard />
            </div>
            <AgSidebar />
        </LiquidProvider>
    );
}`}
                            />
                        </GlassContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
