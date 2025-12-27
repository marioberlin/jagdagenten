
import { GlassContainer, GlassCode } from '@/components';
import { VibrantText } from '@/components';

export const ShowcaseTypography = () => {
    return (
        <GlassContainer className="p-8 rounded-3xl" border material="regular">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-orange-400">Foundations</span>
                    <span className="text-xs font-bold text-accent uppercase tracking-widest block">Typography</span>
                </div>
            </div>
            <div className="space-y-6">
                <div id="display">
                    <VibrantText intensity="high" className="text-5xl font-bold leading-tight mb-2">Display</VibrantText>
                    <p className="text-secondary text-sm">SF Pro Display • Bold • Tracking Tight</p>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div id="headings">
                    <h2 className="text-2xl font-semibold text-primary mb-1">Heading Large</h2>
                    <p className="text-secondary text-sm">SF Pro • Semibold</p>
                </div>
                <div id="body">
                    <h3 className="text-lg font-medium text-primary mb-1">Body Text</h3>
                    <p className="text-secondary leading-relaxed">
                        The liquid glass interface relies on high legibility against complex blurry backgrounds. We use semantic colors like <span className="text-primary font-bold">text-primary</span> and <span className="text-secondary font-bold">text-secondary</span>.
                    </p>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Usage</span>
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<VibrantText intensity="high" className="text-5xl font-bold">
  Display Text
</VibrantText>

<h2 className="text-2xl font-semibold text-primary">Heading</h2>
<p className="text-secondary">Body text with semantic color</p>`}
                    />
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-xl font-bold text-primary mb-4">Apple HIG Guidelines Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-1">Font Family</span>
                            <p className="text-sm text-secondary">
                                <span className="font-semibold text-primary">San Francisco (SF Pro)</span> is the system typeface.
                                iOS/macOS automatically switch between <span className="italic">Text</span> and <span className="italic">Display</span> optical sizes.
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-1">Hierarchy</span>
                            <p className="text-sm text-secondary">
                                Use <span className="font-semibold text-primary">Font Weight</span> and <span className="font-semibold text-primary">Size</span> to establish hierarchy.
                                Avoid adding too many custom styles; rely on semantic weights (Regular, Semibold, Bold).
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-1">Tracking</span>
                            <p className="text-sm text-secondary">
                                San Francisco automatically adjusts letter spacing.
                                <br />
                                • <span className="text-primary">Body text</span> has looser tracking for legibility.
                                <br />
                                • <span className="text-primary">Headlines</span> have tighter tracking.
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-1">Leading</span>
                            <p className="text-sm text-secondary">
                                Use relaxed line-height for body text to improve readability on glass surfaces.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GlassContainer>
    );
};

