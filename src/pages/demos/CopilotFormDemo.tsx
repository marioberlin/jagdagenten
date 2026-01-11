import { useState } from 'react';
import { GlassContainer, GlassButton, GlassInput, GlassSelect, GlassTextarea } from '@/components';
import { AgSidebar } from '../../components/generative/AgSidebar';
import { LiquidClient } from '../../liquid-engine/client';
import { LiquidProvider, useLiquidReadable, useLiquidAction } from '../../liquid-engine/react';
import { FileWarning, Send, CheckCircle2, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassBreadcrumb } from '../../components/layout/GlassBreadcrumb';

// Initialize the engine client
const liquidClient = new LiquidClient();

// Get API Key from Vite env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Form data type
interface IncidentFormData {
    reporterName: string;
    reporterEmail: string;
    incidentDate: string;
    incidentType: string;
    severity: string;
    description: string;
    affectedSystems: string;
    actionsTaken: string;
}

const initialFormData: IncidentFormData = {
    reporterName: '',
    reporterEmail: '',
    incidentDate: '',
    incidentType: '',
    severity: '',
    description: '',
    affectedSystems: '',
    actionsTaken: ''
};

// Reusable field wrapper with label
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

// Inner component that uses the hooks
function FormContent() {
    const [formData, setFormData] = useState<IncidentFormData>(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Make form data readable to AI
    useLiquidReadable({
        description: "Security Incident Report Form - Current field values",
        value: formData
    });

    // Register action for AI to fill form
    useLiquidAction({
        name: "fill_incident_form",
        description: "Fill out the security incident report form with the provided information. Use this when the user describes an incident.",
        parameters: [
            { name: "reporterName", type: "string", description: "Name of the person reporting", required: true },
            { name: "reporterEmail", type: "string", description: "Email of the reporter", required: true },
            { name: "incidentDate", type: "string", description: "Date of the incident (YYYY-MM-DD format)", required: true },
            { name: "incidentType", type: "string", description: "Type of incident: data_breach, phishing, malware, unauthorized_access, other", required: true },
            { name: "severity", type: "string", description: "Severity level: low, medium, high, critical", required: true },
            { name: "description", type: "string", description: "Detailed description of the incident", required: true },
            { name: "affectedSystems", type: "string", description: "Systems affected by the incident", required: false },
            { name: "actionsTaken", type: "string", description: "Immediate actions taken to address the incident", required: false }
        ],
        handler: (args: Partial<IncidentFormData>) => {
            setFormData(prev => ({
                ...prev,
                ...args
            }));
            return { success: true, message: "Form filled successfully" };
        }
    });

    const updateField = (field: keyof IncidentFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        console.log("Form submitted:", formData);
    };

    const handleReset = () => {
        setFormData(initialFormData);
        setIsSubmitted(false);
    };

    if (isSubmitted) {
        return (
            <GlassContainer className="p-8 text-center" border material="thin">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Report Submitted</h2>
                <p className="text-secondary mb-6">Your security incident report has been filed.</p>
                <GlassButton onClick={handleReset}>File Another Report</GlassButton>
            </GlassContainer>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Info */}
            <GlassContainer className="p-6 space-y-4" border material="thin">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center">1</span>
                    Reporter Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Your Name" required>
                        <GlassInput
                            value={formData.reporterName}
                            onChange={(e) => updateField('reporterName', e.target.value)}
                            placeholder="John Doe"
                        />
                    </FormField>
                    <FormField label="Email" required>
                        <GlassInput
                            type="email"
                            value={formData.reporterEmail}
                            onChange={(e) => updateField('reporterEmail', e.target.value)}
                            placeholder="john@company.com"
                        />
                    </FormField>
                </div>
            </GlassContainer>

            {/* Incident Details */}
            <GlassContainer className="p-6 space-y-4" border material="thin">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center">2</span>
                    Incident Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Incident Date" required>
                        <GlassInput
                            type="date"
                            value={formData.incidentDate}
                            onChange={(e) => updateField('incidentDate', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Incident Type" required>
                        <GlassSelect
                            value={formData.incidentType}
                            onValueChange={(v) => updateField('incidentType', v)}
                            placeholder="Select type..."
                            options={[
                                { value: 'data_breach', label: 'Data Breach' },
                                { value: 'phishing', label: 'Phishing Attack' },
                                { value: 'malware', label: 'Malware/Ransomware' },
                                { value: 'unauthorized_access', label: 'Unauthorized Access' },
                                { value: 'other', label: 'Other' }
                            ]}
                        />
                    </FormField>
                    <FormField label="Severity" required>
                        <GlassSelect
                            value={formData.severity}
                            onValueChange={(v) => updateField('severity', v)}
                            placeholder="Select severity..."
                            options={[
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'critical', label: 'Critical' }
                            ]}
                        />
                    </FormField>
                </div>
                <FormField label="Description" required>
                    <GlassTextarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Describe what happened in detail..."
                        rows={4}
                    />
                </FormField>
            </GlassContainer>

            {/* Impact & Response */}
            <GlassContainer className="p-6 space-y-4" border material="thin">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary text-xs flex items-center justify-center">3</span>
                    Impact & Response
                </h3>
                <FormField label="Affected Systems">
                    <GlassTextarea
                        value={formData.affectedSystems}
                        onChange={(e) => updateField('affectedSystems', e.target.value)}
                        placeholder="List any affected systems, databases, or services..."
                        rows={2}
                    />
                </FormField>
                <FormField label="Actions Taken">
                    <GlassTextarea
                        value={formData.actionsTaken}
                        onChange={(e) => updateField('actionsTaken', e.target.value)}
                        placeholder="Describe any immediate actions taken to contain or resolve the incident..."
                        rows={2}
                    />
                </FormField>
            </GlassContainer>

            {/* Submit */}
            <div className="flex gap-4">
                <GlassButton type="submit" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                </GlassButton>
                <GlassButton type="button" variant="ghost" onClick={handleReset}>
                    Clear Form
                </GlassButton>
            </div>
        </form>
    );
}

export default function CopilotFormDemo() {
    const navigate = useNavigate();
    return (
        <LiquidProvider client={liquidClient}>
            <div className="h-screen bg-glass-base flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <header className="p-6 pb-4 z-10">
                        <GlassBreadcrumb
                            className="mb-4"
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'AG-UI Demos', href: '/showcase#agui' },
                                { label: 'Form Copilot', isActive: true }
                            ]}
                        />
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                                <FileWarning size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Security Incident Report
                                </h1>
                                <p className="text-sm text-white/50">
                                    Describe the incident to Copilot and let AI fill the form for you.
                                </p>
                            </div>
                            <div className="ml-auto">
                                <GlassButton
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2"
                                    onClick={() => navigate('/docs/copilot')}
                                >
                                    <Book className="w-4 h-4" />
                                    Documentation
                                </GlassButton>
                            </div>
                        </div>
                    </header>

                    {/* Form Area */}
                    <main className="flex-1 p-6 pt-0 overflow-auto">
                        <div className="max-w-3xl">
                            <FormContent />
                        </div>
                    </main>
                </div>

                {/* Sidebar */}
                <AgSidebar apiKey={API_KEY} />
            </div>
        </LiquidProvider>
    );
}
