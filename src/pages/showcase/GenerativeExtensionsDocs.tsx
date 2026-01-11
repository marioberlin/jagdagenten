import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GenerativeExtensionsDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Generative Extensions Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Generative Extensions
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Heavy-duty components like Spreadsheets and Maps with deep AI integration.
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
                            Generative Extensions apply the Liquid Engine to complex, data-heavy components.
                            The <code>GlassSpreadsheet</code> and <code>GlassMap</code> components expose comprehensive
                            APIs to the AI, allowing for natural language manipulation of complex datasets and viewports.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/generative-extensions')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. Spreadsheet */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. AI-Driven Spreadsheet
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The spreadsheet exposes its grid data and registers actions for row manipulation,
                                sorting, and formula application.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`// Inside GlassSpreadsheet
useLiquidAction({
    name: "add_spreadsheet_row",
    description: "Add a new row of data to the sheet",
    parameters: [
        { name: "data", type: "object", description: "Key-value pairs for columns" }
    ],
    handler: ({ data }) => {
        gridApi.applyTransaction({ add: [data] });
        return { success: true };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Map Control */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Natural Language Map Control
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The map component allows the AI to control the viewport (fly to city)
                                and manage markers.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`// Inside GlassMap
useLiquidAction({
    name: "map_fly_to",
    description: "Move the map camera to a location",
    parameters: [
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
        { name: "zoom", type: "number" }
    ],
    handler: ({ lat, lng, zoom }) => {
        mapRef.current?.flyTo({ center: [lng, lat], zoom });
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
