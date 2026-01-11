import { GlassContainer, GlassButton, GlassCode } from '@/components';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TravelPlannerDocs() {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-glass-base flex flex-col overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />

            <header className="p-6 pb-4 z-10 shrink-0">
                <GlassBreadcrumb
                    className="mb-4"
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Showcase', href: '/showcase' },
                        { label: 'Travel Planner Docs', isActive: true }
                    ]}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--glass-text-primary)]">
                            Travel Planner
                        </h1>
                        <p className="text-[var(--glass-text-secondary)] mt-1">
                            Geospatial planning and itinerary generation with integrated maps.
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
                            The Travel Planner demo combines list management with geospatial data.
                            Users can ask Copilot to "Plan a 3-day trip to Paris starting next Friday", and the AI
                            will construct an itinerary complete with dates, lat/long coordinates for the map, and weather forecasts.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <GlassButton onClick={() => navigate('/demos/travel-planner')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Running Demo
                            </GlassButton>
                        </div>
                    </GlassContainer>

                    {/* Core Features */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">Implementation Details</h2>

                        {/* 1. Complex State */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                1. Itinerary State
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The readable state includes the full list of destinations, their dates, durations, and activities.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidReadable({
    description: "Travel Planner - Current trip itinerary",
    value: {
        tripName,
        destinationCount: destinations.length,
        destinations: destinations.map(d => ({
            id: d.id,
            name: d.name,
            date: d.date,
            duration: d.duration,
            activities: d.activities
        }))
    }
});`}
                            />
                        </GlassContainer>

                        {/* 2. Structured Destinations */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                2. Generating Structured Data
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                The `add_destination` action requires the AI to infer or look up coordinates (lat/lng)
                                and weather, in addition to the standard name and date.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "add_destination",
    description: "Add a new destination to the itinerary",
    parameters: [
        { name: "name", type: "string", required: true },
        { name: "date", type: "string", required: true },
        { name: "duration", type: "string", required: true },
        { name: "activities", type: "array", required: false },
        { name: "lat", type: "number", description: "Latitude", required: false },
        { name: "lng", type: "number", description: "Longitude", required: false }
    ],
    handler: (args) => {
        const newDest = {
            id: Date.now().toString(),
            ...args,
            activities: args.activities || []
        };
        setDestinations(prev => [...prev, newDest]);
        return { success: true };
    }
});`}
                            />
                        </GlassContainer>

                        {/* 3. Nested Activities */}
                        <GlassContainer className="p-6 space-y-4" border material="thin">
                            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                3. Modifying Nested Lists
                            </h3>
                            <p className="text-[var(--glass-text-secondary)]">
                                Actions can also target specific items in the list, such as adding an activity to a specific destination.
                            </p>
                            <GlassCode
                                language="tsx"
                                code={`useLiquidAction({
    name: "add_activity",
    description: "Add an activity to a destination",
    parameters: [
        { name: "destinationId", type: "string", required: true },
        { name: "activity", type: "string", required: true }
    ],
    handler: ({ destinationId, activity }) => {
        setDestinations(prev => prev.map(d =>
            d.id === destinationId
                ? { ...d, activities: [...d.activities, activity] }
                : d
        ));
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
