
import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CopilotDocs() {
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
                        { label: 'Form Copilot Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Form-Filling Copilot
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Transform tedious form-filling into natural conversations using Liquid Engine.
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
                            The Form-Filling Copilot demonstrates how to make your application's forms intelligent.
                            By integrating <strong>Liquid Engine</strong> hooks, you can allow users to fill out complex forms
                            simply by describing their intent in natural language.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/copilot-form')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Concepts */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">How It Works</h2>

                        {/* 1. Provider */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center">1</span>
                                Liquid Provider
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Wrap your application or feature with the <code>LiquidProvider</code> to enable AI capabilities.
                                This provides the chat context to all child components.
                            </p>
                            <GlassCode
                                language="tsx"
                                filename="App.tsx"
                                code={`import { LiquidClient } from '@/liquid-engine/client'; \nimport { LiquidProvider } from '@/liquid-engine/react'; \n\nconst liquidClient = new LiquidClient(); \n\nexport default function App() { \n    return (\n < LiquidProvider client = { liquidClient } >\n < YourApp />\n        </LiquidProvider >\n    ); \n } `}
                            />
                        </GlassContainer>

                        {/* 2. Readable State */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center">2</span>
                                Making State Readable
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Use the <code>useLiquidReadable</code> hook to expose your form's state to the AI.
                                This allows the copilot to understand what fields differ from the user's intent
                                and what information is already filled.
                            </p>
                            <GlassCode
                                language="tsx"
                                filename="Form.tsx"
                                code={`import { useLiquidReadable } from '@/liquid-engine/react'; \n\nfunction Form() {
\n    const [formData, setFormData] = useState(initialData); \n\n    // Provide context to the AI\n    useLiquidReadable({\n        description: "Current form values",\n        value: formData\n    });\n\n    // ... rest of component\n}`}
                            />
                        </GlassContainer >

                        {/* 3. Actions */}
                        < GlassContainer className="p-6 space-y-4" border material="thin" >
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center">3</span>
                                Registering Actions
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Use the <code>useLiquidAction</code> hook to give the AI the ability to modify your state.
                                Define the parameters the AI should extract from the conversation.
                            </p>
                            <GlassCode
                                language="tsx"
                                filename="Form.tsx"
                                code={`import { useLiquidAction } from '@/liquid-engine/react';\n\n// Register action for AI to update the form\nuseLiquidAction({\n    name: "fill_form",\n    description: "Fill out the form with provided details",\n    parameters: [\n        { \n            name: "fullName", \n            type: "string", \n            description: "User's full name", \n            required: true \n        },\n        { \n            name: "email", \n            type: "string", \n            description: "User's email address", \n            required: true \n        }\n    ],\n    handler: (args) => {\n        setFormData(prev => ({ ...prev, ...args }));\n        return { success: true };\n    }\n});`}
                            />
                        </GlassContainer >
                    </div >

                    {/* Example Implementation */}
                    < GlassContainer className="p-6 overflow-hidden" border material="thin" >
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-[var(--glass-text-primary)]">Complete Example</h2>
                            <p className="text-[var(--glass-text-secondary)] mt-1">
                                Here is the core logic from the Security Incident Report demo.
                            </p>
                        </div>
                        <GlassCode
                            language="tsx"
                            filename="IncidentReportForm.tsx"
                            code={`function FormContent() {\n    const [formData, setFormData] = useState(initialFormData);\n\n    // 1. Make state readable\n    useLiquidReadable({\n        description: "Security Incident Report Form - Current values",\n        value: formData\n    });\n\n    // 2. Define action to update state\n    useLiquidAction({\n        name: "fill_incident_form",\n        description: "Fill out the incident report form",\n        parameters: [\n            { name: "reporterName", type: "string", description: "Name of reporter", required: true },\n            { name: "incidentDate", type: "string", description: "Date (YYYY-MM-DD)", required: true },\n            { name: "incidentType", type: "string", description: "Type of incident", required: true },\n            { name: "severity", type: "string", description: "Severity level", required: true },\n            { name: "description", type: "string", description: "Detailed description", required: true }\n        ],\n        handler: (args) => {\n            setFormData(prev => ({\n                ...prev,\n                ...args\n            }));\n            return { success: true, message: "Form updated" };\n        }\n    });\n\n    return (\n        <form>\n            {/* Form fields bound to formData state */}\n        </form>\n    );\n}`}
                        />
                    </GlassContainer >

                </div >
            </main >
        </div >
    );
}
