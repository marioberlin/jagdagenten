import { useRef } from 'react';
import {
    GlassContainer,
    GlassBadge,
    GlassVideo,
    GlassVoice,
    GlassSparkles,
    GlassStepper,
    GlassAudio,
    GlassMasonry,
    GlassCode,
    GlassParallaxTextImage,
    //     GlassImageEditor,
    //     GlassScreenshot,
    //     GlassDrawingCanvas,
} from '@/components';


export const ShowcaseMedia = () => {
    const screenshotRef = useRef<HTMLDivElement>(null);

    return (
        <div className="space-y-8" ref={screenshotRef}>
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                        <h3 className="text-xl font-bold text-primary">Media & Visuals</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="flex flex-col gap-10">
                    <div id="voice" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Voice Visualizer</span>
                        <GlassVoice className="min-h-[320px] w-full" />
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassVoice className="min-h-[320px]" />`}
                        />
                    </div>


                </div>
            </GlassContainer>

            {/* Audio Player */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="audio" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Audio Player</span>
                    <div className="max-w-2xl mx-auto">
                        <GlassAudio
                            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                            title="Sample Track"
                            artist="Sound Helix"
                        />
                    </div>
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassAudio
  src="/audio.mp3"
  title="Sample Track"
  artist="Artist Name"
/>`}
                    />
                </div>
            </GlassContainer>

            {/* Video Player */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="video" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Video Player</span>
                    <GlassVideo
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        poster="https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png"
                    />
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassVideo src="/video.mp4" poster="/poster.jpg" />`}
                    />
                </div>
            </GlassContainer>

            {/* Image Gallery */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="gallery" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Image Gallery</span>
                    <GlassMasonry columns={{ default: 1, sm: 2, md: 3 }} gap={16}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <GlassContainer key={i} className="overflow-hidden group" enableLiquid={false}>
                                <div
                                    className="w-full bg-white/5 transition-transform duration-500 group-hover:scale-110"
                                    style={{ height: `${180 + (i % 3) * 60}px` }}
                                >
                                    <img
                                        src={`https://picsum.photos/seed/${i + 42}/400/${300 + (i % 3) * 80}`}
                                        alt={`Gallery item ${i + 1}`}
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                                <div className="p-3">
                                    <h4 className="font-medium text-sm text-primary">Gallery Item {i + 1}</h4>
                                    <p className="text-xs text-tertiary mt-1">Masonry auto-sorts by height.</p>
                                </div>
                            </GlassContainer>
                        ))}
                    </GlassMasonry>
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassMasonry columns={{ default: 1, sm: 2, md: 3 }} gap={16}>
  {items.map(item => <GalleryItem key={item.id} />)}
</GlassMasonry>`}
                    />
                </div>
            </GlassContainer>

            {/* Visual Effects */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="effects" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Sparkle Effects</span>
                    <div className="h-40 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative">
                        <GlassSparkles>
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-cyan-400">
                                Magical Text
                            </h2>
                        </GlassSparkles>
                    </div>
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassSparkles>
  <h2>Magical Text</h2>
</GlassSparkles>`}
                    />
                </div>
            </GlassContainer>

            {/* Stepper */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="stepper" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Stepper Feedback</span>
                    <div className="flex flex-col gap-8">
                        <GlassStepper
                            currentStep={1}
                            steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
                        />
                        <GlassStepper
                            currentStep={2}
                            steps={[{ label: 'Design' }, { label: 'Code' }, { label: 'Test' }, { label: 'Launch' }]}
                        />
                    </div>
                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassStepper
  currentStep={1}
  steps={[{ label: 'Cart' }, { label: 'Shipping' }, { label: 'Payment' }]}
/>`}
                    />
                </div>
            </GlassContainer>

            {/* Parallax Text Image */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div id="parallax" className="space-y-4">
                    <div className="mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                    </div>
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Parallax Text Image</span>
                    <p className="text-secondary text-sm mb-6">Scroll-based parallax effect with layered text and decorative elements. Scroll up and down to see the effect.</p>

                    <div className="space-y-8">
                        <GlassParallaxTextImage
                            heading="Liquid Glass"
                            subheading="Beautiful scroll-driven parallax effects with glassmorphic overlay"
                            colorScheme="purple"
                            decorations="circles"
                            height={400}
                            intensity={0.6}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassParallaxTextImage
                                heading="Ocean"
                                colorScheme="blue"
                                decorations="lines"
                                height={280}
                                intensity={0.5}
                            />
                            <GlassParallaxTextImage
                                heading="Forest"
                                colorScheme="green"
                                decorations="grid"
                                height={280}
                                intensity={0.5}
                            />
                        </div>

                        <GlassParallaxTextImage
                            heading="Sunset Dreams"
                            subheading="Warm gradient with circular bokeh effects"
                            colorScheme="orange"
                            decorations="circles"
                            height={350}
                            intensity={0.7}
                        />
                    </div>

                    <GlassCode
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassParallaxTextImage
  heading="Liquid Glass"
  subheading="Beautiful scroll-driven parallax effects"
  colorScheme="purple" // blue, purple, green, orange, pink, rainbow
  decorations="circles" // circles, grid, lines, none
  height={400}
  intensity={0.6}
/>`}
                    />
                </div>
            </GlassContainer>

            {/* Media Utilities */}
            <GlassContainer id="utilities" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Media</span>
                        <h3 className="text-xl font-bold text-primary">Media Utilities</h3>
                    </div>
                    {/* <GlassScreenshot targetRef={screenshotRef} label="Capture Page" /> */}
                </div>

                <div className="flex flex-col gap-10">
                    {/* Image Editor */}
                    <div id="editor" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Image Editor</span>
                        {/* <GlassImageEditor
                            image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                            className="h-[500px]"
                        /> */}
                        <div className="p-4 rounded-xl border border-glass-border bg-glass-surface text-secondary text-center">
                            Component under development
                        </div>
                    </div>

                    {/* Canvas */}
                    <div id="canvas" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Drawing Canvas</span>
                        <div className="w-full">
                            {/* <GlassDrawingCanvas className="w-full h-[500px]" width={800} height={500} /> */}
                            <div className="p-4 rounded-xl border border-glass-border bg-glass-surface text-secondary text-center">
                                Component under development
                            </div>
                        </div>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
