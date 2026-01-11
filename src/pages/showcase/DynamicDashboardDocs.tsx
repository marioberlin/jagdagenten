import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DynamicDashboardDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Dashboard Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Dynamic Dashboard
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Generative dashboard management using Liquid Engine actions.
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
                            The Dynamic Dashboard demo illustrates how to give AI control over a React state array.
                            Users can ask to "add a revenue chart" or "remove the user metric", and the AI translates
                            these natural language requests into specific CRUD operations.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/dynamic-dashboard')}>
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
                                1. Exposing Dashboard State
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The AI always receives the current list of widgets, allowing it to understand what's already on screen.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
    description: "SaaS Dashboard Widgets - Current dashboard configuration",
    value: { widgets, widgetCount: widgets.length }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Create Widget */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Creating Widgets
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The <code>create_widget</code> action defines all the properties a widget can have.
                                The AI infers missing properties (like icons or colors) based on the user's intent.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "create_widget",
    description: "Create a new dashboard widget",
    parameters: [
        { name: "type", type: "string", description: "metric, chart, or list", required: true },
        { name: "title", type: "string", description: "Widget title", required: true },
        { name: "value", type: "string", description: "Display value", required: false },
        { name: "change", type: "number", description: "Percentage change", required: false },
        { name: "icon", type: "string", description: "users, dollar, cart, etc.", required: false },
        { name: "color", type: "string", description: "Theme color", required: false }
    ],
    handler: (args) => {
        const newWidget = {
            id: Date.now().toString(),
            ...args,
            icon: args.icon || 'activity',
            color: args.color || 'blue'
        };
        setWidgets(prev => [...prev, newWidget]);
        return { success: true, widgetId: newWidget.id };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Update & Delete */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. Modifying Existing Widgets
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                We also register actions for updating and deleting widgets by ID.
                                The AI finds the correct ID from the readable state.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "delete_widget",
    description: "Remove a widget from the dashboard",
    parameters: [
        { name: "widgetId", type: "string", required: true }
    ],
    handler: ({ widgetId }) => {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
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
