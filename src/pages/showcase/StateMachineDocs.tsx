import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StateMachineDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'State Machine Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            State Machine Flow
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Guided multi-step workflows managed by `useFlowState`.
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
                            This demo introduces a higher-order hook <code>useFlowState</code> to manage complex,
                            multi-stage processes like a car purchase wizard. The AI understands the current stage,
                            the data collected so far, and the valid transitions to next stages.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/state-machine')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. useFlowState */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Defining the Flow
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                We define the stages and their connections. The hook manages the current active stage.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`const flow = useFlowState<CarPurchaseData>({
    stages: [
        { id: 'contact', name: 'Contact Info', next: ['car'] },
        { id: 'car', name: 'Car Selection', next: ['payment'] },
        { id: 'payment', name: 'Payment', next: ['confirm'] },
        { id: 'confirm', name: 'Confirmation', next: [] }
    ],
    initialStage: 'contact',
    initialData: { ... }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Flow Context */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Exposing Flow Context
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                We explicitly tell the AI where the user is in the process and what moves are legal.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
    description: "Car Purchase Flow - Current stage and collected data",
    value: {
        currentStage: flow.currentStage,
        stageName: flow.stage.name,
        data: flow.data,
        availableNextStages: flow.nextStages.map(s => s.id)
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Navigation Actions */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. AI Navigation
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The AI can fill data AND navigate the user through the wizard.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`// Fill data action
useLiquidAction({
    name: "update_purchase_data",
    handler: (args) => {
        flow.updateData(args);
        return { success: true };
    }
});

// Navigation action
useLiquidAction({
    name: "navigate_stage",
    description: "Move to a different stage",
    parameters: [
        { name: "targetStage", type: "string", required: true }
    ],
    handler: ({ targetStage }) => {
        flow.goTo(targetStage);
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
