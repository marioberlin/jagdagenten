import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    GlassContainer,
    GlassButton,
    GlassButtonGroup,
    GlassInput,
    GlassSelect,
    GlassTextarea,
    GlassForm,
    GlassFormField,
    GlassFormItem,
    GlassFormLabel,
    GlassFormControl,
    GlassFormMessage
} from '@/components';
import { ArrowLeft, ArrowRight, Copy, Check, X, Save, ExternalLink } from 'lucide-react';

/**
 * Demo page showcasing the new foundation components:
 * - Design Token System
 * - GlassButtonGroup
 * - GlassForm (New)
 * - Slot Pattern (asChild)
 */
export const FoundationDemo: React.FC = () => {
    const form = useForm({
        defaultValues: {
            email: '',
            username: '',
            password: '',
            bio: '',
            role: '',
        }
    });

    function onSubmit(data: any) {
        alert('Form submitted successfully: ' + JSON.stringify(data));
    }

    return (
        <div className="min-h-screen p-8 space-y-12">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-primary mb-3">
                    Design System Foundation
                </h1>
                <p className="text-lg text-secondary">
                    Showcasing design tokens, button groups, and form fields
                </p>
            </div>

            {/* Design Tokens Section */}
            <section className="max-w-4xl mx-auto">
                <GlassContainer material="regular" className="p-8">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-primary">
                            Design Tokens
                        </h2>

                        {/* Typography Scale */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Typography Scale</h3>
                            <div className="space-y-2">
                                <p className="text-xs">Extra Small (12px) - Labels, captions</p>
                                <p className="text-sm">Small (14px) - Secondary text, inputs</p>
                                <p className="text-base">Base (16px) - Body text</p>
                                <p className="text-lg">Large (18px) - Subheadings</p>
                                <p className="text-xl">XL (20px) - Headings</p>
                                <p className="text-2xl">2XL (24px) - Large headings</p>
                                <p className="text-3xl">3XL (30px) - Hero text</p>
                            </div>
                        </div>

                        {/* Spacing Scale */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Spacing Scale (4px base)</h3>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 6, 8, 12, 16].map(size => (
                                    <div key={size} className="flex flex-col items-center gap-1">
                                        <div
                                            className="bg-accent/30 border border-accent/50 rounded"
                                            style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                                        />
                                        <span className="text-xs text-tertiary">{size}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Border Radius */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Border Radius</h3>
                            <div className="flex flex-wrap gap-4">
                                {['sm', 'md', 'lg', 'xl', '2xl'].map(radius => (
                                    <div key={radius} className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-16 h-16 bg-accent/30 border border-accent/50 rounded-${radius}`}
                                        />
                                        <span className="text-xs text-tertiary">{radius}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassContainer>
            </section>

            {/* Button Group Section */}
            <section className="max-w-4xl mx-auto">
                <GlassContainer material="regular" className="p-8">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold text-primary">
                            GlassButtonGroup
                        </h2>

                        {/* Horizontal Attached */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Horizontal - Attached</h3>
                            <div className="flex flex-wrap gap-4">
                                <GlassButtonGroup variant="attached">
                                    <GlassButton variant="outline">
                                        <ArrowLeft className="w-4 h-4" />
                                        Previous
                                    </GlassButton>
                                    <GlassButton variant="primary">
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </GlassButton>
                                </GlassButtonGroup>

                                <GlassButtonGroup variant="attached" size="sm">
                                    <GlassButton variant="outline">
                                        <Copy className="w-3.5 h-3.5" />
                                    </GlassButton>
                                    <GlassButton variant="outline">
                                        <Check className="w-3.5 h-3.5" />
                                    </GlassButton>
                                    <GlassButton variant="destructive">
                                        <X className="w-3.5 h-3.5" />
                                    </GlassButton>
                                </GlassButtonGroup>
                            </div>
                        </div>

                        {/* Horizontal Separated */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Horizontal - Separated</h3>
                            <GlassButtonGroup variant="separated">
                                <GlassButton variant="secondary">Cancel</GlassButton>
                                <GlassButton variant="outline">Save Draft</GlassButton>
                                <GlassButton variant="primary">
                                    <Save className="w-4 h-4" />
                                    Publish
                                </GlassButton>
                            </GlassButtonGroup>
                        </div>

                        {/* Vertical */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Vertical - Attached</h3>
                            <GlassButtonGroup orientation="vertical" variant="attached" className="max-w-xs">
                                <GlassButton variant="outline">Dashboard</GlassButton>
                                <GlassButton variant="outline">Analytics</GlassButton>
                                <GlassButton variant="outline">Settings</GlassButton>
                            </GlassButtonGroup>
                        </div>

                        {/* Full Width */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-secondary">Full Width</h3>
                            <GlassButtonGroup variant="separated" fullWidth>
                                <GlassButton variant="outline">Option A</GlassButton>
                                <GlassButton variant="outline">Option B</GlassButton>
                                <GlassButton variant="primary">Option C</GlassButton>
                            </GlassButtonGroup>
                        </div>
                    </div>
                </GlassContainer>
            </section>

            {/* Slot Pattern Section */}
            <section className="max-w-4xl mx-auto">
                <GlassContainer material="regular" className="p-8">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-primary">
                            Slot Pattern (Composition)
                        </h2>
                        <p className="text-secondary">
                            Use the <code className="text-accent bg-accent/10 px-1 rounded">asChild</code> prop to merge GlassButton styles and behavior onto your own elements (like React Router Links).
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {/* Standard Link */}
                            <GlassButton asChild variant="primary">
                                <Link to="/trading/bots">
                                    Go to Trading Bots (Link)
                                </Link>
                            </GlassButton>

                            {/* External Anchor */}
                            <GlassButton asChild variant="outline">
                                <a href="https://google.com" target="_blank" rel="noopener noreferrer">
                                    External Site (Anchor)
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            </GlassButton>
                        </div>
                    </div>
                </GlassContainer>
            </section>

            {/* Form Field Section */}
            <section className="max-w-4xl mx-auto">
                <GlassContainer material="regular" className="p-8">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold text-primary">
                            GlassForm (React Hook Form)
                        </h2>

                        <GlassForm {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <GlassFormField
                                    control={form.control}
                                    name="email"
                                    rules={{ required: 'Email is required' }}
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Email</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    {...field}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="username"
                                    rules={{
                                        required: 'Username is required',
                                        minLength: { value: 3, message: 'Must be 3+ chars' }
                                    }}
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Username</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput placeholder="johndoe" {...field} />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="password"
                                    rules={{ required: 'Password is required' }}
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Password</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput type="password" placeholder="••••••••" {...field} />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Bio</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassTextarea
                                                    placeholder="I'm a developer who loves..."
                                                    rows={4}
                                                    {...field}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Role</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassSelect
                                                    options={[
                                                        { label: 'Developer', value: 'developer' },
                                                        { label: 'Designer', value: 'designer' },
                                                        { label: 'Manager', value: 'manager' },
                                                    ]}
                                                    placeholder="Select a role"
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <div className="pt-6 border-t border-white/10">
                                    <GlassButtonGroup variant="separated">
                                        <GlassButton variant="secondary" type="button">Cancel</GlassButton>
                                        <GlassButton variant="primary" type="submit">Submit</GlassButton>
                                    </GlassButtonGroup>
                                </div>
                            </form>
                        </GlassForm>
                    </div>
                </GlassContainer>
            </section>
        </div >
    );
};

export default FoundationDemo;
