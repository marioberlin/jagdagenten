/**
 * Trip Planning Flow
 * 
 * Multi-step wizard for creating and editing trips.
 * Steps: Name → Destinations → Dates → Review
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    X,
    MapPin,
    Calendar,
    Check,
    Search,
    Trash2,
    GripVertical,
    Sun,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton, GlassInput } from '@/components';
import { useAuroraTravelStore, type TripDestination, type Trip } from '@/stores/auroraTravelStore';

// ============================================================================
// Types
// ============================================================================

type WizardStep = 'name' | 'destinations' | 'dates' | 'review';

const STEPS: WizardStep[] = ['name', 'destinations', 'dates', 'review'];

interface TripFormData {
    name: string;
    description?: string;
    destinations: Omit<TripDestination, 'id'>[];
    departureDate?: string;
    returnDate?: string;
}

export interface TripPlanningFlowProps {
    /** Initial trip data for editing */
    initialTrip?: Trip;
    /** Called when wizard is closed */
    onClose: () => void;
    /** Called when trip is saved */
    onSave?: (tripId: string) => void;
}

// ============================================================================
// Step Indicator
// ============================================================================

interface StepIndicatorProps {
    steps: WizardStep[];
    currentStep: WizardStep;
    onStepClick?: (step: WizardStep) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
    const currentIndex = steps.indexOf(currentStep);

    const stepLabels: Record<WizardStep, string> = {
        name: 'Name',
        destinations: 'Destinations',
        dates: 'Dates',
        review: 'Review',
    };

    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = step === currentStep;

                return (
                    <React.Fragment key={step}>
                        <button
                            onClick={() => isCompleted && onStepClick?.(step)}
                            disabled={!isCompleted}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                isCurrent && 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]',
                                isCompleted && 'bg-green-500/20 text-green-400 cursor-pointer hover:bg-green-500/30',
                                !isCurrent && !isCompleted && 'bg-[var(--glass-bg-subtle)] text-tertiary'
                            )}
                        >
                            {isCompleted ? (
                                <Check size={12} />
                            ) : (
                                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                                    {index + 1}
                                </span>
                            )}
                            {stepLabels[step]}
                        </button>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                'w-8 h-0.5 rounded-full',
                                index < currentIndex ? 'bg-green-500/50' : 'bg-[var(--glass-border)]'
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ============================================================================
// Step 1: Name
// ============================================================================

interface NameStepProps {
    name: string;
    description?: string;
    onChange: (name: string, description?: string) => void;
}

const NameStep: React.FC<NameStepProps> = ({ name, description, onChange }) => (
    <div className="space-y-4">
        <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Name your trip</h2>
            <p className="text-sm text-secondary mt-1">Give your adventure a memorable name</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
            <div>
                <label className="block text-sm font-medium text-secondary mb-2">Trip Name</label>
                <GlassInput
                    value={name}
                    onChange={(e) => onChange(e.target.value, description)}
                    placeholder="e.g., Summer Road Trip to the Baltic Sea"
                    className="text-lg"
                    autoFocus
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary mb-2">Description (optional)</label>
                <textarea
                    value={description || ''}
                    onChange={(e) => onChange(name, e.target.value || undefined)}
                    placeholder="Add some notes about your trip..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-primary placeholder:text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50"
                    rows={3}
                />
            </div>
        </div>
    </div>
);

// ============================================================================
// Step 2: Destinations
// ============================================================================

interface DestinationsStepProps {
    destinations: Omit<TripDestination, 'id'>[];
    onAddDestination: (name: string, lat: number, lng: number) => void;
    onRemoveDestination: (index: number) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

const DestinationsStep: React.FC<DestinationsStepProps> = ({
    destinations,
    onAddDestination,
    onRemoveDestination,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Mock search - in production, this would use Google Places API
    const handleSearch = useCallback(() => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        // Mock geocoding - simulate API response
        setTimeout(() => {
            // Simple mock coordinates based on common cities
            const mockLocations: Record<string, { lat: number; lng: number }> = {
                'berlin': { lat: 52.52, lng: 13.405 },
                'munich': { lat: 48.1351, lng: 11.582 },
                'hamburg': { lat: 53.5511, lng: 9.9937 },
                'usedom': { lat: 53.95, lng: 14.05 },
                'leipzig': { lat: 51.3397, lng: 12.3731 },
                'dresden': { lat: 51.0504, lng: 13.7373 },
            };

            const key = searchQuery.toLowerCase().trim();
            const coords = mockLocations[key] || { lat: 52.52 + Math.random() * 2, lng: 13.4 + Math.random() * 2 };

            onAddDestination(searchQuery.trim(), coords.lat, coords.lng);
            setSearchQuery('');
            setIsSearching(false);
        }, 500);
    }, [searchQuery, onAddDestination]);

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-primary">Add destinations</h2>
                <p className="text-sm text-secondary mt-1">Where will your journey take you?</p>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto">
                <div className="relative">
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search for a city or place..."
                        className="pl-10 pr-24"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                    <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={handleSearch}
                        disabled={!searchQuery.trim() || isSearching}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                        {isSearching ? '...' : 'Add'}
                    </GlassButton>
                </div>
            </div>

            {/* Destinations List */}
            <div className="space-y-2 max-w-md mx-auto mt-6">
                {destinations.length === 0 ? (
                    <div className="text-center py-8 text-tertiary">
                        <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No destinations added yet</p>
                        <p className="text-xs">Search above to add your first stop</p>
                    </div>
                ) : (
                    destinations.map((dest, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] group"
                        >
                            <GripVertical size={16} className="text-tertiary cursor-grab" />
                            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-primary">{dest.place.name}</div>
                                <div className="text-xs text-tertiary">
                                    {dest.place.lat.toFixed(2)}, {dest.place.lng.toFixed(2)}
                                </div>
                            </div>
                            <button
                                onClick={() => onRemoveDestination(index)}
                                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-tertiary hover:text-red-400 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {destinations.length > 0 && (
                <p className="text-xs text-tertiary text-center mt-4">
                    Drag to reorder • {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};

// ============================================================================
// Step 3: Dates
// ============================================================================

interface DatesStepProps {
    departureDate?: string;
    returnDate?: string;
    onChange: (departure?: string, returnDate?: string) => void;
}

const DatesStep: React.FC<DatesStepProps> = ({ departureDate, returnDate, onChange }) => (
    <div className="space-y-4">
        <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary">When are you traveling?</h2>
            <p className="text-sm text-secondary mt-1">Select your travel dates</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Departure
                </label>
                <input
                    type="date"
                    value={departureDate || ''}
                    onChange={(e) => onChange(e.target.value || undefined, returnDate)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Return
                </label>
                <input
                    type="date"
                    value={returnDate || ''}
                    onChange={(e) => onChange(departureDate, e.target.value || undefined)}
                    min={departureDate}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--glass-bg-subtle)] border border-[var(--glass-border)] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50"
                />
            </div>
        </div>

        <p className="text-xs text-tertiary text-center mt-4">
            Optional — leave blank for open-ended trips
        </p>
    </div>
);

// ============================================================================
// Step 4: Review
// ============================================================================

interface ReviewStepProps {
    formData: TripFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-primary">Review your trip</h2>
                <p className="text-sm text-secondary mt-1">Everything look good?</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                {/* Trip Name */}
                <GlassContainer className="p-4" border>
                    <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Trip Name</div>
                    <div className="text-lg font-semibold text-primary">{formData.name || 'Untitled Trip'}</div>
                    {formData.description && (
                        <div className="text-sm text-secondary mt-1">{formData.description}</div>
                    )}
                </GlassContainer>

                {/* Dates */}
                <GlassContainer className="p-4" border>
                    <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Dates</div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                        <Calendar size={14} className="text-tertiary" />
                        {formatDate(formData.departureDate)} → {formatDate(formData.returnDate)}
                    </div>
                </GlassContainer>

                {/* Destinations */}
                <GlassContainer className="p-4" border>
                    <div className="text-xs text-tertiary uppercase tracking-wide mb-2">
                        Destinations ({formData.destinations.length})
                    </div>
                    <div className="space-y-2">
                        {formData.destinations.map((dest, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                                    {index + 1}
                                </div>
                                <span className="text-sm text-primary">{dest.place.name}</span>
                                {index < formData.destinations.length - 1 && (
                                    <ArrowRight size={12} className="text-tertiary ml-auto" />
                                )}
                            </div>
                        ))}
                    </div>
                </GlassContainer>

                {/* Weather Preview (placeholder) */}
                <GlassContainer className="p-4 bg-gradient-to-r from-sky-500/10 to-blue-500/10" border>
                    <div className="flex items-center gap-3">
                        <Sun size={24} className="text-yellow-400" />
                        <div>
                            <div className="text-sm font-medium text-primary">Weather forecast available</div>
                            <div className="text-xs text-secondary">
                                We'll fetch weather for each destination after you save
                            </div>
                        </div>
                    </div>
                </GlassContainer>
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const TripPlanningFlow: React.FC<TripPlanningFlowProps> = ({
    initialTrip,
    onClose,
    onSave,
}) => {
    const createTrip = useAuroraTravelStore(state => state.createTrip);
    const updateTrip = useAuroraTravelStore(state => state.updateTrip);

    const [currentStep, setCurrentStep] = useState<WizardStep>('name');
    const [formData, setFormData] = useState<TripFormData>(() => ({
        name: initialTrip?.name || '',
        description: initialTrip?.description,
        destinations: initialTrip?.destinations.map(d => ({
            position: d.position,
            place: d.place,
            arrivalDate: d.arrivalDate,
            departureDate: d.departureDate,
            stayDuration: d.stayDuration,
        })) || [],
        departureDate: initialTrip?.departureDate,
        returnDate: initialTrip?.returnDate,
    }));

    const currentStepIndex = STEPS.indexOf(currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    const canProceed = () => {
        switch (currentStep) {
            case 'name':
                return formData.name.trim().length > 0;
            case 'destinations':
                return formData.destinations.length > 0;
            case 'dates':
                return true; // Dates are optional
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (isLastStep) {
            handleSave();
        } else {
            setCurrentStep(STEPS[currentStepIndex + 1]);
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStep(STEPS[currentStepIndex - 1]);
        }
    };

    const handleSave = () => {
        if (initialTrip) {
            // Update existing trip
            updateTrip(initialTrip.id, {
                name: formData.name,
                description: formData.description,
                destinations: formData.destinations.map((d, i) => ({
                    ...d,
                    id: initialTrip.destinations[i]?.id || crypto.randomUUID(),
                })),
                departureDate: formData.departureDate,
                returnDate: formData.returnDate,
                status: 'planned',
            });
            onSave?.(initialTrip.id);
        } else {
            // Create new trip
            const tripId = createTrip({
                name: formData.name,
                description: formData.description,
                destinations: formData.destinations.map((d, i) => ({
                    ...d,
                    id: crypto.randomUUID(),
                    position: i + 1,
                })),
                departureDate: formData.departureDate,
                returnDate: formData.returnDate,
                status: 'planned',
            });
            onSave?.(tripId);
        }
        onClose();
    };

    const handleAddDestination = (name: string, lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            destinations: [
                ...prev.destinations,
                {
                    position: prev.destinations.length + 1,
                    place: { name, lat, lng },
                },
            ],
        }));
    };

    const handleRemoveDestination = (index: number) => {
        setFormData(prev => ({
            ...prev,
            destinations: prev.destinations
                .filter((_, i) => i !== index)
                .map((d, i) => ({ ...d, position: i + 1 })),
        }));
    };

    const handleReorderDestinations = (fromIndex: number, toIndex: number) => {
        setFormData(prev => {
            const newDests = [...prev.destinations];
            const [moved] = newDests.splice(fromIndex, 1);
            newDests.splice(toIndex, 0, moved);
            return {
                ...prev,
                destinations: newDests.map((d, i) => ({ ...d, position: i + 1 })),
            };
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg"
            >
                <GlassContainer className="p-6" border>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Step Indicator */}
                    <StepIndicator
                        steps={STEPS}
                        currentStep={currentStep}
                        onStepClick={setCurrentStep}
                    />

                    {/* Step Content */}
                    <div className="min-h-[300px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 'name' && (
                                    <NameStep
                                        name={formData.name}
                                        description={formData.description}
                                        onChange={(name, description) =>
                                            setFormData(prev => ({ ...prev, name, description }))
                                        }
                                    />
                                )}
                                {currentStep === 'destinations' && (
                                    <DestinationsStep
                                        destinations={formData.destinations}
                                        onAddDestination={handleAddDestination}
                                        onRemoveDestination={handleRemoveDestination}
                                        onReorder={handleReorderDestinations}
                                    />
                                )}
                                {currentStep === 'dates' && (
                                    <DatesStep
                                        departureDate={formData.departureDate}
                                        returnDate={formData.returnDate}
                                        onChange={(departure, ret) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                departureDate: departure,
                                                returnDate: ret
                                            }))
                                        }
                                    />
                                )}
                                {currentStep === 'review' && (
                                    <ReviewStep formData={formData} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--glass-border)]">
                        <GlassButton
                            variant="ghost"
                            onClick={handleBack}
                            disabled={isFirstStep}
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back
                        </GlassButton>

                        <GlassButton
                            variant="primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            {isLastStep ? (
                                <>
                                    <Check size={16} className="mr-1" />
                                    Save Trip
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight size={16} className="ml-1" />
                                </>
                            )}
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
};

export default TripPlanningFlow;
