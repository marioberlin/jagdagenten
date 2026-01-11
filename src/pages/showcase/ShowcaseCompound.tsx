import { useState } from 'react';
import {
    Clock,
    ChevronRight,
    Save,
    Trash2,
    MoreHorizontal,
    Upload,
    Download,
    Share2,
    Bell
} from 'lucide-react';
import { GlassButton } from '../../components/primitives/GlassButton';
import { GlassCard } from '../../components/data-display/GlassCard';
import { GlassContainer } from '../../components/primitives/GlassContainer';
import { GlassSplitButton } from '../../components/compound/GlassSplitButton';
import { GlassButtonDropdown } from '../../components/compound/GlassButtonDropdown';

export const ShowcaseCompound = () => {
    const [lastAction, setLastAction] = useState<string>('None');

    const handleAction = (action: string) => {
        setLastAction(action);
        // Simulate quick feedback reset
        setTimeout(() => setLastAction('None'), 2000);
    };

    const dropdownOptions = [
        { label: 'Save as Draft', onClick: () => handleAction('Save Draft'), icon: Save },
        { label: 'Export PDF', onClick: () => handleAction('Export PDF'), icon: Download },
        { label: 'Share Link', onClick: () => handleAction('Share Link'), icon: Share2 },
        { label: 'Delete', onClick: () => handleAction('Delete'), icon: Trash2, description: 'Permanent' },
    ];

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-secondary">
                    <span className="opacity-50">Showcase</span>
                    <ChevronRight size={14} />
                    <span>Compound Components</span>
                </div>
                <h1 className="text-4xl font-light tracking-tight text-primary">
                    Compound Components
                </h1>
                <p className="text-lg text-secondary max-w-2xl">
                    Advanced button compositions and enhanced primitives for complex interactions.
                </p>
            </div>

            {/* Action Feedback Log */}
            <div className="fixed bottom-4 right-4 z-50">
                <GlassContainer className="px-4 py-2 text-sm font-medium text-primary">
                    Last Action: <span className="text-accent">{lastAction}</span>
                </GlassContainer>
            </div>

            {/* GlassButton Enhancements */}
            <section className="space-y-6">
                <h2 className="text-xl font-medium text-primary border-b border-white/10 pb-2">
                    GlassButton Enhancements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <GlassCard className="p-8">
                        <div className="flex flex-col gap-12">
                            <h3 className="text-lg font-medium text-secondary">Tooltips</h3>
                            <div className="flex flex-wrap gap-4">
                                <GlassButton
                                    tooltip="I have a tooltip!"
                                    onClick={() => handleAction('Tooltip 1')}
                                >
                                    Hover Me
                                </GlassButton>

                                <GlassButton
                                    variant="secondary"
                                    tooltip={<span>Custom <b>JSX</b> Tooltip</span>}
                                    onClick={() => handleAction('Tooltip 2')}
                                >
                                    Complex Tooltip
                                </GlassButton>

                                <GlassButton
                                    variant="ghost"
                                    size="icon"
                                    tooltip="Edit Settings"
                                    onClick={() => handleAction('Tooltip Icon')}
                                >
                                    <Clock size={20} />
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8">
                        <div className="flex flex-col gap-12">
                            <h3 className="text-lg font-medium text-secondary">Badges</h3>
                            <div className="flex flex-wrap gap-6 items-center">
                                <GlassButton
                                    badge="3"
                                    onClick={() => handleAction('Badge 1')}
                                >
                                    Notifications
                                </GlassButton>

                                <GlassButton
                                    variant="secondary"
                                    badge="New"
                                    badgeVariant="default"
                                    onClick={() => handleAction('Badge 2')}
                                >
                                    Messages
                                </GlassButton>

                                <GlassButton
                                    variant="ghost"
                                    size="icon"
                                    badge="9+"
                                    badgeVariant="destructive"
                                    onClick={() => handleAction('Badge 3')}
                                >
                                    <Bell size={20} />
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </section>

            {/* Compound Components */}
            <section className="space-y-6">
                <h2 className="text-xl font-medium text-primary border-b border-white/10 pb-2">
                    Compound Buttons
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Split Buttons */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex flex-col gap-12">
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-secondary">Split Buttons</h3>
                                <p className="text-sm text-secondary/70">
                                    Combine a primary action with related secondary options.
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <GlassSplitButton
                                        label="Publish Post"
                                        onMainAction={() => handleAction('Publish')}
                                        options={dropdownOptions}
                                    />

                                    <GlassSplitButton
                                        variant="secondary"
                                        label="Save Changes"
                                        startContent={<Save size={16} />}
                                        onMainAction={() => handleAction('Save')}
                                        options={dropdownOptions}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4 items-center">
                                    <GlassSplitButton
                                        variant="destructive"
                                        label="Delete Account"
                                        onMainAction={() => handleAction('Delete Account')}
                                        options={[
                                            { label: 'Deactivate instead', onClick: () => handleAction('Deactivate') },
                                            { label: 'Archive data', onClick: () => handleAction('Archive') }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Button Dropdowns */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex flex-col gap-12">
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-secondary">Button Dropdowns</h3>
                                <p className="text-sm text-secondary/70">
                                    A button that serves purely as a trigger for a menu.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <GlassButtonDropdown
                                    label="Actions"
                                    options={dropdownOptions}
                                />

                                <GlassButtonDropdown
                                    variant="outline"
                                    label="Export Data"
                                    startContent={<Upload size={16} />}
                                    options={dropdownOptions}
                                />

                                <GlassButtonDropdown
                                    variant="ghost"
                                    size="icon"
                                    label={<MoreHorizontal size={20} />}
                                    options={dropdownOptions}
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </section>
        </div>
    );
};
