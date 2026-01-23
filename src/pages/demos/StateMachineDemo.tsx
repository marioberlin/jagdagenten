import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { GlassContainer, GlassButton, GlassInput, GlassSelect } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider } from '../../liquid-engine/react';
import { Car, User, CreditCard, Check, ArrowRight, ArrowLeft, CircleDot, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';
import { StateMachineService } from '../../services/a2a/StateMachineService';
import { v4 as uuidv4 } from 'uuid';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Flow data type
interface CarPurchaseData {
    name: string;
    email: string;
    phone: string;
    model: string;
    color: string;
    trim: string;
    paymentMethod: string;
    cardNumber: string;
}

interface FlowStage {
    id: string;
    name: string;
    description: string;
    next: string[];
}

const STAGES: FlowStage[] = [
    { id: 'contact', name: 'Contact Info', description: 'Collect customer details', next: ['car'] },
    { id: 'car', name: 'Car Selection', description: 'Configure dream car', next: ['payment'] },
    { id: 'payment', name: 'Payment', description: 'Process payment', next: ['confirm'] },
    { id: 'confirm', name: 'Confirmation', description: 'Order complete', next: [] }
];

// Reusable field wrapper
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">{label}</label>
            {children}
        </div>
    );
}

// Inner component with hooks
function StateMachineContent() {
    const [currentStage, setCurrentStage] = useState('contact');
    const [history, setHistory] = useState<string[]>(['contact']);
    const [data, setData] = useState<CarPurchaseData>({
        name: '', email: '', phone: '',
        model: '', color: '', trim: '',
        paymentMethod: '', cardNumber: ''
    });
    const [sessionId] = useState(() => uuidv4());

    // Handle data updates from A2A agent
    const handleDataUpdate = useCallback((agentData: any) => {
        if (agentData.data) {
            setData(prev => ({ ...prev, ...agentData.data }));
        }
        if (agentData.updates) {
            setData(prev => ({ ...prev, ...agentData.updates }));
        }
        if (agentData.currentStage) {
            setCurrentStage(agentData.currentStage);
        }
        if (agentData.history) {
            setHistory(agentData.history);
        }
    }, []);

    // Create A2A service (instantiated for side effects)
    useMemo(
        () => new StateMachineService(sessionId, handleDataUpdate),
        [sessionId, handleDataUpdate]
    );

    const stage = STAGES.find(s => s.id === currentStage)!;
    const nextStages = STAGES.filter(s => stage.next.includes(s.id));

    const updateField = (field: keyof CarPurchaseData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const goTo = (stageId: string) => {
        setCurrentStage(stageId);
        if (!history.includes(stageId)) {
            setHistory(prev => [...prev, stageId]);
        }
    };

    const goBack = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            setHistory(newHistory);
            setCurrentStage(newHistory[newHistory.length - 1]);
        }
    };

    const reset = () => {
        setCurrentStage('contact');
        setHistory(['contact']);
        setData({
            name: '', email: '', phone: '',
            model: '', color: '', trim: '',
            paymentMethod: '', cardNumber: ''
        });
    };

    return (
        <div className="space-y-6">
            {/* Flow Visualizer */}
            <div className="flex items-center justify-center gap-4 py-6">
                {['contact', 'car', 'payment', 'confirm'].map((stageId, i) => {
                    const isActive = currentStage === stageId;
                    const isPast = history.includes(stageId) && !isActive;

                    return (
                        <div key={stageId} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                                    isActive ? "bg-accent-primary text-white scale-110" :
                                        isPast ? "bg-green-500/20 text-green-400" :
                                            "bg-white/10 text-secondary"
                                )}>
                                    {isPast ? <Check size={18} /> :
                                        stageId === 'contact' ? <User size={18} /> :
                                            stageId === 'car' ? <Car size={18} /> :
                                                stageId === 'payment' ? <CreditCard size={18} /> :
                                                    <CircleDot size={18} />}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium capitalize",
                                    isActive ? "text-accent-primary" : "text-secondary"
                                )}>
                                    {stageId}
                                </span>
                            </div>
                            {i < 3 && (
                                <ArrowRight className={cn(
                                    "mx-2 mt-[-16px]",
                                    isPast ? "text-green-400" : "text-secondary"
                                )} size={16} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stage Content */}
            <GlassContainer className="p-6" border material="thin">
                {currentStage === 'contact' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
                        <FormField label="Full Name">
                            <GlassInput
                                value={data.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="John Doe"
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Email">
                                <GlassInput
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="john@example.com"
                                />
                            </FormField>
                            <FormField label="Phone">
                                <GlassInput
                                    value={data.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                />
                            </FormField>
                        </div>
                    </div>
                )}

                {currentStage === 'car' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Build Your Dream Car</h2>
                        <FormField label="Model">
                            <GlassSelect
                                value={data.model}
                                onValueChange={(v) => updateField('model', v)}
                                placeholder="Select model..."
                                options={[
                                    { value: 'sedan', label: 'Quantum Sedan' },
                                    { value: 'suv', label: 'Nebula SUV' },
                                    { value: 'truck', label: 'Titan Truck' },
                                    { value: 'coupe', label: 'Pulse Coupe' }
                                ]}
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Color">
                                <GlassSelect
                                    value={data.color}
                                    onValueChange={(v) => updateField('color', v)}
                                    placeholder="Select color..."
                                    options={[
                                        { value: 'white', label: 'Pearl White' },
                                        { value: 'black', label: 'Obsidian Black' },
                                        { value: 'silver', label: 'Lunar Silver' },
                                        { value: 'blue', label: 'Ocean Blue' },
                                        { value: 'red', label: 'Crimson Red' }
                                    ]}
                                />
                            </FormField>
                            <FormField label="Trim">
                                <GlassSelect
                                    value={data.trim}
                                    onValueChange={(v) => updateField('trim', v)}
                                    placeholder="Select trim..."
                                    options={[
                                        { value: 'base', label: 'Base' },
                                        { value: 'sport', label: 'Sport' },
                                        { value: 'luxury', label: 'Luxury' },
                                        { value: 'performance', label: 'Performance' }
                                    ]}
                                />
                            </FormField>
                        </div>
                    </div>
                )}

                {currentStage === 'payment' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Payment Information</h2>
                        <FormField label="Payment Method">
                            <GlassSelect
                                value={data.paymentMethod}
                                onValueChange={(v) => updateField('paymentMethod', v)}
                                placeholder="Select payment method..."
                                options={[
                                    { value: 'credit', label: 'Credit Card' },
                                    { value: 'debit', label: 'Debit Card' },
                                    { value: 'financing', label: 'Financing' },
                                    { value: 'cash', label: 'Cash' }
                                ]}
                            />
                        </FormField>
                        {(data.paymentMethod === 'credit' || data.paymentMethod === 'debit') && (
                            <FormField label="Card Number (Last 4)">
                                <GlassInput
                                    value={data.cardNumber}
                                    onChange={(e) => updateField('cardNumber', e.target.value)}
                                    placeholder="1234"
                                    maxLength={4}
                                />
                            </FormField>
                        )}
                    </div>
                )}

                {currentStage === 'confirm' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h2>
                        <p className="text-secondary mb-4">
                            Thank you, {data.name}! Your {data.color} {data.model} ({data.trim}) is being prepared.
                        </p>
                        <GlassButton onClick={reset} variant="ghost">
                            Start Over
                        </GlassButton>
                    </div>
                )}

                {/* Navigation */}
                {currentStage !== 'confirm' && (
                    <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
                        <GlassButton
                            variant="ghost"
                            onClick={goBack}
                            disabled={history.length <= 1}
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back
                        </GlassButton>
                        <GlassButton
                            onClick={() => goTo(nextStages[0]?.id || '')}
                            disabled={nextStages.length === 0}
                        >
                            Continue
                            <ArrowRight size={16} className="ml-2" />
                        </GlassButton>
                    </div>
                )}
            </GlassContainer>
        </div>
    );
}

export default function StateMachineDemo() {
    const navigate = useNavigate();

    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'State Machine', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                <Car size={24} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    State Machine
                                </h1>
                                <p className="text-sm text-white/50">
                                    Guided car purchase wizard with AI.
                                </p>
                            </div>
                            <GlassButton
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate('/docs/state-machine')}
                            >
                                <Book size={16} className="mr-2" />
                                Documentation
                            </GlassButton>
                        </div>
                    </header>

                    {/* Flow Area */}
                    <main className="flex-1 p-6 pt-0 overflow-auto">
                        <div className="max-w-2xl mx-auto">
                            <StateMachineContent />
                        </div>
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar />
            </div>
        </LiquidProvider>
    );
}
