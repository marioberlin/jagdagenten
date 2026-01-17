import { useNavigate } from 'react-router-dom';
import { GlassContainer, GlassButton, GlassInput, GlassSelect } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider, useLiquidReadable, useLiquidAction, useFlowState } from '../../liquid-engine/react';
import { Car, User, CreditCard, Check, ArrowRight, ArrowLeft, CircleDot, Book } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Flow data type
interface CarPurchaseData {
    // Contact
    name: string;
    email: string;
    phone: string;
    // Car Selection
    model: string;
    color: string;
    trim: string;
    // Payment
    paymentMethod: string;
    cardNumber: string;
}

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
    const flow = useFlowState<CarPurchaseData>({
        stages: [
            { id: 'contact', name: 'Contact Info', description: 'Collect customer details', next: ['car'] },
            { id: 'car', name: 'Car Selection', description: 'Configure dream car', next: ['payment'] },
            { id: 'payment', name: 'Payment', description: 'Process payment', next: ['confirm'] },
            { id: 'confirm', name: 'Confirmation', description: 'Order complete', next: [] }
        ],
        initialStage: 'contact',
        initialData: {
            name: '', email: '', phone: '',
            model: '', color: '', trim: '',
            paymentMethod: '', cardNumber: ''
        }
    });

    // Make flow state readable to AI
    useLiquidReadable({
        description: "Car Purchase Flow - Current stage and collected data",
        value: {
            currentStage: flow.currentStage,
            stageName: flow.stage.name,
            stageDescription: flow.stage.description,
            data: flow.data,
            isComplete: flow.isComplete,
            availableNextStages: flow.nextStages.map(s => s.id)
        }
    });

    // Update data action
    useLiquidAction({
        name: "update_purchase_data",
        description: "Update the car purchase form data. Use this to fill in customer info, car selection, or payment details.",
        parameters: [
            { name: "name", type: "string", description: "Customer name", required: false },
            { name: "email", type: "string", description: "Customer email", required: false },
            { name: "phone", type: "string", description: "Customer phone", required: false },
            { name: "model", type: "string", description: "Car model: sedan, suv, truck, coupe", required: false },
            { name: "color", type: "string", description: "Car color: white, black, silver, blue, red", required: false },
            { name: "trim", type: "string", description: "Trim level: base, sport, luxury, performance", required: false },
            { name: "paymentMethod", type: "string", description: "Payment method: credit, debit, financing, cash", required: false },
            { name: "cardNumber", type: "string", description: "Card number (last 4 digits)", required: false }
        ],
        handler: (args: Partial<CarPurchaseData>) => {
            flow.updateData(args);
            return { success: true, updatedFields: Object.keys(args) };
        }
    });

    // Navigate between stages
    useLiquidAction({
        name: "navigate_stage",
        description: "Move to a different stage in the purchase flow",
        parameters: [
            { name: "targetStage", type: "string", description: "Stage to navigate to: contact, car, payment, confirm", required: true }
        ],
        handler: (args: { targetStage: string }) => {
            flow.goTo(args.targetStage);
            return { success: true, newStage: args.targetStage };
        }
    });

    const updateField = (field: keyof CarPurchaseData, value: string) => {
        flow.updateData({ [field]: value } as Partial<CarPurchaseData>);
    };

    return (
        <div className="space-y-6">
            {/* Flow Visualizer */}
            <div className="flex items-center justify-center gap-4 py-6">
                {['contact', 'car', 'payment', 'confirm'].map((stageId, i) => {
                    const isActive = flow.currentStage === stageId;
                    const isPast = flow.history.includes(stageId) && !isActive;

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
                {flow.currentStage === 'contact' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
                        <FormField label="Full Name">
                            <GlassInput
                                value={flow.data.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="John Doe"
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Email">
                                <GlassInput
                                    type="email"
                                    value={flow.data.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="john@example.com"
                                />
                            </FormField>
                            <FormField label="Phone">
                                <GlassInput
                                    value={flow.data.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                />
                            </FormField>
                        </div>
                    </div>
                )}

                {flow.currentStage === 'car' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Build Your Dream Car</h2>
                        <FormField label="Model">
                            <GlassSelect
                                value={flow.data.model}
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
                                    value={flow.data.color}
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
                                    value={flow.data.trim}
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

                {flow.currentStage === 'payment' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Payment Information</h2>
                        <FormField label="Payment Method">
                            <GlassSelect
                                value={flow.data.paymentMethod}
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
                        {(flow.data.paymentMethod === 'credit' || flow.data.paymentMethod === 'debit') && (
                            <FormField label="Card Number (Last 4)">
                                <GlassInput
                                    value={flow.data.cardNumber}
                                    onChange={(e) => updateField('cardNumber', e.target.value)}
                                    placeholder="1234"
                                    maxLength={4}
                                />
                            </FormField>
                        )}
                    </div>
                )}

                {flow.currentStage === 'confirm' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h2>
                        <p className="text-secondary mb-4">
                            Thank you, {flow.data.name}! Your {flow.data.color} {flow.data.model} ({flow.data.trim}) is being prepared.
                        </p>
                        <GlassButton onClick={flow.reset} variant="ghost">
                            Start Over
                        </GlassButton>
                    </div>
                )}

                {/* Navigation */}
                {flow.currentStage !== 'confirm' && (
                    <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
                        <GlassButton
                            variant="ghost"
                            onClick={flow.goBack}
                            disabled={flow.history.length <= 1}
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back
                        </GlassButton>
                        <GlassButton
                            onClick={() => flow.goTo(flow.nextStages[0]?.id || '')}
                            disabled={flow.nextStages.length === 0}
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
