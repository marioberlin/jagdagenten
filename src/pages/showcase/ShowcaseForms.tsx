
import { useState } from 'react';
import {
    GlassContainer,
    GlassInput,
    GlassSwitch,
    GlassBadge,
    GlassCheckbox,
    GlassRadio,
    GlassSlider,
    GlassTextarea,
    GlassSelect,
    GlassInputOTP,
    GlassCalendar,
    GlassCommand,
    GlassEditor,
    GlassUpload,
    GlassPayment,
    GlassDatePicker,
    GlassFormGroup,
    GlassButton,
    GlassCombobox,
    GlassToggle,
    GlassChip,
    GlassRadioGroup,
    GlassRadioGroupItem,
    GlassTimePicker,
    GlassNumberInput,
    GlassCode,
} from '@/components';
import { Mail, User, Bold, Italic, Underline, Chrome } from 'lucide-react';


export const ShowcaseForms = () => {
    const [framework, setFramework] = useState('');
    const [plan, setPlan] = useState('pro');
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [selectedTags, setSelectedTags] = useState(['React', 'TypeScript', 'Tailwind']);

    const removeTag = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    return (
        <div className="space-y-8">
            {/* Form Accessibility */}
            <GlassContainer id="text-inputs" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Form Accessibility</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Default State */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">With Labels & Helper Text</span>
                        <GlassFormGroup
                            label="Email Address"
                            required
                            helperText="We'll never share your email."
                        >
                            <GlassInput
                                type="email"
                                placeholder="you@example.com"
                                icon={<Mail size={18} />}
                            />
                        </GlassFormGroup>

                        <GlassFormGroup label="Username">
                            <GlassInput
                                placeholder="Enter username..."
                                icon={<User size={18} />}
                            />
                        </GlassFormGroup>
                    </div>

                    {/* Error State */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Error States</span>
                        <GlassFormGroup
                            label="Email Address"
                            required
                            error="Please enter a valid email address."
                        >
                            <GlassInput
                                type="email"
                                placeholder="you@example.com"
                                defaultValue="invalid-email"
                                icon={<Mail size={18} />}
                            />
                        </GlassFormGroup>

                        <GlassFormGroup
                            label="Bio"
                            error="Bio must be at least 10 characters."
                        >
                            <GlassTextarea
                                placeholder="Tell us about yourself..."
                                defaultValue="Hi"
                            />
                        </GlassFormGroup>
                    </div>

                    {/* Button States */}
                    <div className="md:col-span-2 space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Button Variants & States</span>
                        <div className="flex flex-wrap gap-4 items-center">
                            <GlassButton variant="primary">Primary</GlassButton>
                            <GlassButton variant="secondary">Secondary</GlassButton>
                            <GlassButton variant="outline">Outline</GlassButton>
                            <GlassButton variant="ghost">Ghost</GlassButton>
                            <GlassButton variant="destructive">Delete</GlassButton>
                            <GlassButton variant="primary" loading>Loading</GlassButton>
                            <GlassButton variant="primary" disabled>Disabled</GlassButton>
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Selection Controls */}
            <GlassContainer id="selection" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Selection Controls</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="space-y-8">
                    {/* Combobox - Own Row */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Combobox (Searchable Select)</span>
                        <div className="max-w-md">
                            <GlassCombobox
                                options={[
                                    { value: 'react', label: 'React', icon: <Chrome size={16} /> },
                                    { value: 'vue', label: 'Vue.js', description: 'Progressive framework' },
                                    { value: 'angular', label: 'Angular', description: 'Platform for building apps' },
                                    { value: 'svelte', label: 'Svelte', description: 'Cybernetically enhanced' },
                                    { value: 'solid', label: 'SolidJS', description: 'Simple and performant' },
                                ]}
                                value={framework}
                                onValueChange={setFramework}
                                placeholder="Select framework..."
                                searchPlaceholder="Search frameworks..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {/* Toggle Buttons - Larger size */}
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Toggle Buttons</span>
                            <div className="flex items-center gap-3">
                                <GlassToggle size="lg" pressed={isBold} onPressedChange={setIsBold}>
                                    <Bold size={20} />
                                </GlassToggle>
                                <GlassToggle size="lg" pressed={isItalic} onPressedChange={setIsItalic}>
                                    <Italic size={20} />
                                </GlassToggle>
                                <GlassToggle size="lg">
                                    <Underline size={20} />
                                </GlassToggle>
                            </div>
                            <p className="text-sm text-secondary">
                                Bold: {isBold ? 'On' : 'Off'} | Italic: {isItalic ? 'On' : 'Off'}
                            </p>
                        </div>

                        {/* Chips - Better spacing */}
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Chips / Tags</span>
                            <div className="flex flex-wrap gap-3">
                                {selectedTags.map(tag => (
                                    <GlassChip key={tag} onRemove={() => removeTag(tag)}>
                                        {tag}
                                    </GlassChip>
                                ))}
                                <GlassChip variant="primary">Primary</GlassChip>
                                <GlassChip variant="success">Success</GlassChip>
                                <GlassChip variant="warning">Warning</GlassChip>
                            </div>
                        </div>

                        {/* Radio Group */}
                        <div className="space-y-4">
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Radio Group</span>
                            <GlassRadioGroup value={plan} onValueChange={setPlan}>
                                <GlassRadioGroupItem value="free">Free Plan</GlassRadioGroupItem>
                                <GlassRadioGroupItem value="pro">Pro Plan</GlassRadioGroupItem>
                                <GlassRadioGroupItem value="enterprise">Enterprise</GlassRadioGroupItem>
                            </GlassRadioGroup>
                            <p className="text-sm text-secondary">Selected: {plan}</p>
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Form Primitives */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Form Primitives</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Switches */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Switches</span>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <GlassSwitch />
                                <span className="text-sm text-secondary">Off</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <GlassSwitch checked />
                                <span className="text-sm text-secondary">On</span>
                            </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Checkboxes</span>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <GlassCheckbox />
                                <span className="text-sm text-secondary">Accept terms</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <GlassCheckbox checked />
                                <span className="text-sm text-secondary">Selected</span>
                            </div>
                        </div>
                    </div>

                    {/* Radios */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Radios</span>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <GlassRadio />
                                <span className="text-sm text-secondary">Option A</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <GlassRadio checked />
                                <span className="text-sm text-secondary">Option B</span>
                            </div>
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="md:col-span-2 space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Slider</span>
                        <GlassSlider defaultValue={33} max={100} />
                        <div className="flex justify-between text-sm text-secondary px-1 mt-2">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Select */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Select</span>
                        <GlassSelect
                            options={[
                                { label: 'System Theme', value: 'system' },
                                { label: 'Light Mode', value: 'light' },
                                { label: 'Dark Mode', value: 'dark' },
                                { label: 'Liquid Glass', value: 'glass' },
                            ]}
                            defaultValue="glass"
                        />
                    </div>

                    {/* Textarea */}
                    <div className="md:col-span-2 space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Text Area</span>
                        <GlassTextarea placeholder="Type your message here..." />
                    </div>
                </div>
            </GlassContainer>

            {/* Advanced Inputs */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Advanced Inputs</h3>
                    </div>
                </div>

                {/* OTP - Own Row */}
                <div className="space-y-4 mb-10">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Input OTP</span>
                    <div className="p-6 rounded-2xl bg-black/20 flex flex-col items-center gap-5 max-w-md">
                        <span className="text-sm text-secondary">Enter verification code</span>
                        <GlassInputOTP length={4} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Calendar */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Calendar</span>
                        <div className="flex justify-center">
                            <GlassCalendar selected={new Date()} />
                        </div>
                    </div>

                    {/* Command */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Command Palette</span>
                        <GlassCommand />
                    </div>
                </div>
            </GlassContainer>

            {/* Rich Inputs & Specialized */}
            <GlassContainer id="rich-inputs" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Rich & Specialized Inputs</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Editor */}
                    <div className="space-y-4 lg:col-span-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Rich Text Editor</span>
                        <GlassEditor placeholder="Type some markdown here..." className="h-64" />
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Date Picker</span>
                        <div className="h-80 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
                            <GlassDatePicker />
                        </div>
                    </div>

                    {/* Upload */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">File Upload</span>
                        <GlassUpload />
                    </div>

                    {/* Payment */}
                    <div className="space-y-4 lg:col-span-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Payment Form</span>
                        <div className="flex justify-center">
                            <GlassPayment />
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Time & Numeric Inputs */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Time & Numeric Inputs</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Time Picker */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Time Picker</span>
                        <div className="flex flex-wrap gap-4">
                            <GlassTimePicker defaultValue="09:30" />
                            <GlassTimePicker defaultValue="14:00" use24Hour />
                        </div>
                        <p className="text-xs text-secondary">12-hour (with AM/PM) and 24-hour formats</p>
                    </div>

                    {/* Number Input */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Number Input</span>
                        <div className="flex flex-wrap gap-4 items-end">
                            <GlassNumberInput defaultValue={5} min={0} max={10} label="Quantity" />
                            <GlassNumberInput defaultValue={99} variant="stepper" suffix="kg" label="Weight" />
                        </div>
                    </div>

                    {/* Number Input Sizes */}
                    <div className="space-y-4 md:col-span-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Number Input Sizes</span>
                        <div className="flex flex-wrap gap-6 items-end">
                            <GlassNumberInput defaultValue={10} size="sm" prefix="$" label="Small" />
                            <GlassNumberInput defaultValue={50} size="md" prefix="$" label="Medium" />
                            <GlassNumberInput defaultValue={100} size="lg" prefix="$" label="Large" />
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Code Examples */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-blue-400">Forms</span>
                        <h3 className="text-xl font-bold text-primary">Usage Examples</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Form Group with Input</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassFormGroup label="Email" required>
  <GlassInput 
    type="email" 
    placeholder="you@example.com"
    icon={<Mail size={18} />}
  />
</GlassFormGroup>`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Selection Controls</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassSwitch checked={enabled} />
<GlassCheckbox label="Accept terms" />
<GlassSlider value={50} min={0} max={100} />`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Combobox</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassCombobox
  options={[{ value: 'react', label: 'React' }]}
  value={value}
  onValueChange={setValue}
  placeholder="Select..."
/>`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Date & Time Pickers</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassDatePicker />
<GlassTimePicker defaultValue="09:30" />
<GlassNumberInput min={0} max={10} />`}
                        />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
