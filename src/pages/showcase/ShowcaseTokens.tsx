import { GlassContainer, GlassButton } from '@/components';
import { GlassBadge } from '@/components';
import { GlassCode } from '@/components';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

// Color swatch component with copy functionality
const ColorSwatch = ({ name, value, cssVar }: { name: string; value: string; cssVar: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(cssVar);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all w-full text-left"
        >
            <div
                className="w-10 h-10 rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                style={{ backgroundColor: value }}
            />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary">{name}</div>
                <div className="text-xs text-secondary font-mono truncate">{cssVar}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-secondary" />}
            </div>
        </button>
    );
};

// Glass material demo
const GlassMaterialDemo = ({ material, label }: { material: 'thin' | 'regular' | 'thick'; label: string }) => (
    <GlassContainer material={material} border className="p-6 rounded-2xl text-center">
        <div className="text-sm font-medium text-primary">{label}</div>
        <div className="text-xs text-secondary mt-1">material="{material}"</div>
    </GlassContainer>
);

// Spacing scale item
const SpacingItem = ({ size, value, tailwind }: { size: string; value: string; tailwind: string }) => (
    <div className="flex items-center gap-4 py-2">
        <div className="w-16 text-xs font-mono text-secondary">{size}</div>
        <div
            className="h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
            style={{ width: value }}
        />
        <div className="text-xs text-secondary">{value}</div>
        <div className="text-xs font-mono text-label-tertiary">{tailwind}</div>
    </div>
);

export const ShowcaseTokens = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                        <h3 className="text-xl font-bold text-primary">Design Tokens</h3>
                    </div>
                    <GlassBadge variant="glass">System</GlassBadge>
                </div>
                <p className="text-secondary">
                    Design tokens are the foundational values that define the Liquid Glass design system.
                    Click any token to copy its CSS variable to your clipboard.
                </p>
            </GlassContainer>

            {/* Color Palette */}
            <GlassContainer id="semantic-colors" className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Color Palette</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Semantic Colors */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Text Colors</span>
                        <ColorSwatch name="Primary" value="var(--text-primary)" cssVar="var(--text-primary)" />
                        <ColorSwatch name="Secondary" value="var(--text-secondary)" cssVar="var(--text-secondary)" />
                        <ColorSwatch name="Tertiary" value="rgba(255,255,255,0.65)" cssVar="var(--glass-text-tertiary)" />
                    </div>

                    {/* Glass Colors */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Glass Backgrounds</span>
                        <ColorSwatch name="Glass Thin" value="rgba(255,255,255,0.05)" cssVar="var(--glass-bg-thin)" />
                        <ColorSwatch name="Glass Regular" value="rgba(255,255,255,0.08)" cssVar="var(--glass-bg-regular)" />
                        <ColorSwatch name="Glass Thick" value="rgba(255,255,255,0.12)" cssVar="var(--glass-bg-thick)" />
                    </div>

                    {/* Status Colors */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Status Colors</span>
                        <ColorSwatch name="Success" value="#22c55e" cssVar="text-green-500" />
                        <ColorSwatch name="Warning" value="#eab308" cssVar="text-yellow-500" />
                        <ColorSwatch name="Error" value="#ef4444" cssVar="text-red-500" />
                        <ColorSwatch name="Info" value="#3b82f6" cssVar="text-blue-500" />
                    </div>
                </div>
            </GlassContainer>

            {/* Glass Materials */}
            <GlassContainer id="glass-materials" className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Glass Materials</h4>
                </div>
                <p className="text-sm text-secondary mb-6">
                    Three material depths provide visual hierarchy. Each adjusts opacity, blur, and border visibility.
                </p>

                <div className="mb-6 bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-white">Dynamic Material Registry (New)</h5>
                        <p className="text-xs text-white/60 mt-1">
                            Create and register custom materials at runtime using Tailwind classes.
                        </p>
                    </div>
                    <GlassButton asChild size="sm" variant="primary">
                        <a href="/demos/extension">View Demo</a>
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassMaterialDemo material="thin" label="Thin" />
                    <GlassMaterialDemo material="regular" label="Regular" />
                    <GlassMaterialDemo material="thick" label="Thick" />
                </div>

                <div className="mt-6">
                    <GlassCode
                        code={`<GlassContainer material="thin">Subtle overlay</GlassContainer>
<GlassContainer material="regular">Default depth</GlassContainer>
<GlassContainer material="thick">Maximum blur</GlassContainer>`}
                        language="tsx"
                        filename="example.tsx"
                    />
                </div>
            </GlassContainer>

            {/* Glass Intensity */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Glass Intensity</h4>
                </div>
                <p className="text-sm text-secondary mb-6">
                    Fine-grained control over glass effect strength. Use lower intensity for busy backgrounds or secondary elements,
                    higher intensity for focus areas and hero sections.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <GlassContainer intensity="subtle" border className="p-6 rounded-2xl text-center">
                        <div className="text-sm font-medium text-primary">Subtle</div>
                        <div className="text-xs text-secondary mt-1">intensity="subtle"</div>
                        <div className="text-[10px] text-label-tertiary mt-2">4px blur • 0.3 opacity</div>
                    </GlassContainer>
                    <GlassContainer intensity="medium" border className="p-6 rounded-2xl text-center">
                        <div className="text-sm font-medium text-primary">Medium</div>
                        <div className="text-xs text-secondary mt-1">intensity="medium"</div>
                        <div className="text-[10px] text-label-tertiary mt-2">16px blur • 0.5 opacity</div>
                    </GlassContainer>
                    <GlassContainer intensity="heavy" border className="p-6 rounded-2xl text-center">
                        <div className="text-sm font-medium text-primary">Heavy</div>
                        <div className="text-xs text-secondary mt-1">intensity="heavy"</div>
                        <div className="text-[10px] text-label-tertiary mt-2">32px blur • 0.7 opacity</div>
                    </GlassContainer>
                </div>

                <div className="bg-black/20 rounded-xl p-4">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-2">When to Use</span>
                    <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                        <li><strong className="text-primary">Subtle:</strong> Busy backgrounds, secondary elements, dense UIs</li>
                        <li><strong className="text-primary">Medium:</strong> Default for cards, modals, primary containers</li>
                        <li><strong className="text-primary">Heavy:</strong> Hero sections, focus areas, emphasis overlays</li>
                    </ul>
                </div>
            </GlassContainer>

            {/* Spacing Scale */}
            <GlassContainer id="spacing" className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Spacing Scale</h4>
                </div>
                <p className="text-sm text-secondary mb-6">
                    Consistent spacing based on 4px grid. Use Tailwind's spacing utilities.
                </p>

                <div className="space-y-1">
                    <SpacingItem size="1" value="4px" tailwind="p-1, m-1, gap-1" />
                    <SpacingItem size="2" value="8px" tailwind="p-2, m-2, gap-2" />
                    <SpacingItem size="3" value="12px" tailwind="p-3, m-3, gap-3" />
                    <SpacingItem size="4" value="16px" tailwind="p-4, m-4, gap-4" />
                    <SpacingItem size="6" value="24px" tailwind="p-6, m-6, gap-6" />
                    <SpacingItem size="8" value="32px" tailwind="p-8, m-8, gap-8" />
                    <SpacingItem size="12" value="48px" tailwind="p-12, m-12, gap-12" />
                </div>
            </GlassContainer>

            {/* Typography Scale */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Typography Scale</h4>
                </div>

                <div className="space-y-4">
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-xs</span>
                        <span className="text-xs text-primary">12px / 16px</span>
                    </div>
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-sm</span>
                        <span className="text-sm text-primary">14px / 20px</span>
                    </div>
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-base</span>
                        <span className="text-base text-primary">16px / 24px</span>
                    </div>
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-lg</span>
                        <span className="text-lg text-primary">18px / 28px</span>
                    </div>
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-xl</span>
                        <span className="text-xl text-primary">20px / 28px</span>
                    </div>
                    <div className="flex items-baseline gap-4 border-b border-white/5 pb-4">
                        <span className="w-20 text-xs text-secondary">text-2xl</span>
                        <span className="text-2xl text-primary">24px / 32px</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <span className="w-20 text-xs text-secondary">text-4xl</span>
                        <span className="text-4xl text-primary">36px / 40px</span>
                    </div>
                </div>
            </GlassContainer>

            {/* Border Radius */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Border Radius</h4>
                </div>

                <div className="flex flex-wrap gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] rounded-lg mx-auto mb-2" />
                        <span className="text-xs text-secondary">rounded-lg</span>
                        <div className="text-[10px] text-label-tertiary">8px</div>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] rounded-xl mx-auto mb-2" />
                        <span className="text-xs text-secondary">rounded-xl</span>
                        <div className="text-[10px] text-label-tertiary">12px</div>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] rounded-2xl mx-auto mb-2" />
                        <span className="text-xs text-secondary">rounded-2xl</span>
                        <div className="text-[10px] text-label-tertiary">16px</div>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] rounded-3xl mx-auto mb-2" />
                        <span className="text-xs text-secondary">rounded-3xl</span>
                        <div className="text-[10px] text-label-tertiary">24px</div>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] rounded-full mx-auto mb-2" />
                        <span className="text-xs text-secondary">rounded-full</span>
                        <div className="text-[10px] text-label-tertiary">9999px</div>
                    </div>
                </div>
            </GlassContainer>

            {/* Animation Timing */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">Animation & Transitions</h4>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Standard Durations</span>
                        <div className="flex flex-wrap gap-4">
                            <GlassBadge variant="glass">150ms - Micro</GlassBadge>
                            <GlassBadge variant="glass">300ms - Default</GlassBadge>
                            <GlassBadge variant="glass">500ms - Emphasis</GlassBadge>
                        </div>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Easing Functions</span>
                        <GlassCode
                            code={`// Glass transition easing
--glass-ease: cubic-bezier(0.4, 0, 0.2, 1);

// Spring-like motion
--glass-spring: cubic-bezier(0.34, 1.56, 0.64, 1);`}
                            language="css"
                            filename="transitions.css"
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* CSS Variables Reference */}
            <GlassContainer id="glass-shadows" className="p-8 rounded-3xl" border material="regular">
                <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <h4 className="text-lg font-bold text-primary">CSS Variables Reference</h4>
                </div>

                <GlassCode
                    code={`:root {
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  
  /* Glass Backgrounds */
  --glass-bg-thin: rgba(255, 255, 255, 0.05);
  --glass-bg-regular: rgba(255, 255, 255, 0.08);
  --glass-bg-thick: rgba(255, 255, 255, 0.12);
  
  /* Glass Borders */
  --glass-border: rgba(255, 255, 255, 0.15);
  
  /* Shadow Scale - Apple HIG Aligned */
  --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-glow: 0 0 40px rgba(255, 255, 255, 0.1);
  
  /* Motion Durations */
  --duration-micro: 150ms;
  --duration-standard: 300ms;
  --duration-emphasis: 500ms;
  --duration-ambient: 1000ms;
  
  /* Easing Functions */
  --ease-glass: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}`}
                    language="css"
                    filename="src/styles/tailwind.css"
                />
            </GlassContainer>
        </div>
    );
};
