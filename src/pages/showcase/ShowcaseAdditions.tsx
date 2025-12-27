import { useState, useRef } from 'react';
import { GlassContainer } from '../../components/primitives/GlassContainer';
import { GlassInfiniteScroll } from '../../components/data-display/GlassInfiniteScroll';
import { GlassSticky } from '../../components/layout/GlassSticky';
import { GlassColorPicker } from '../../components/forms/GlassColorPicker';
import { GlassEmojiPicker } from '../../components/forms/GlassEmojiPicker';
import { GlassAutosizeTextarea } from '../../components/forms/GlassAutosizeTextarea';
import { GlassRating } from '../../components/forms/GlassRating';
import { GlassSortableList, GlassSortableItem, GlassDragHandle } from '../../components/layout/GlassDragDrop';
import { GlassImageEditor } from '../../components/media/GlassImageEditor';
import { GlassScreenshot } from '../../components/media/GlassScreenshot';
import { GlassCaptcha } from '../../components/forms/GlassCaptcha';
import { GlassDrawingCanvas } from '../../components/media/GlassDrawingCanvas';
import { GlassCard } from '../../components/data-display/GlassCard';

export const ShowcaseAdditions = () => {
    // Infinite Scroll State
    const [items, setItems] = useState(Array.from({ length: 10 }));
    const [hasMore, setHasMore] = useState(true);

    const loadMore = async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setItems(prev => [...prev, ...Array.from({ length: 5 })]);
        if (items.length > 30) setHasMore(false);
    };

    // Color & Emoji State
    const [color, setColor] = useState('#3B82F6');
    const [emoji, setEmoji] = useState('👋');

    // Drag Drop State
    const [sortItems, setSortItems] = useState([
        { id: 1, text: 'Research AI Models' },
        { id: 2, text: 'Design Glass Interface' },
        { id: 3, text: 'Implement Physics Engine' },
        { id: 4, text: 'User Testing' },
    ]);

    // Screenshot Ref
    const screenshotRef = useRef<HTMLDivElement>(null);

    return (
        <div className="space-y-16 pb-20" ref={screenshotRef}>
            <div className="flex items-center justify-between pb-4 border-b border-glass-border">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">New Components</h1>
                    <p className="text-secondary">Recently implemented extensions to the Liquid Glass System.</p>
                </div>
                <GlassScreenshot targetRef={screenshotRef} label="Capture Page" />
            </div>

            {/* Infinite Scroll & Sticky */}
            <section id="scroll" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Infinite Scroll & Sticky</h2>
                <div className="text-sm text-secondary mb-4">
                    Demonstrates a scrollable container with a sticky header and infinite loading capabilities.
                </div>
                <div className="relative h-[400px] overflow-auto border border-glass-border rounded-xl">
                    <GlassSticky offsetTop={0} className="w-full z-10">
                        <div className="p-4 bg-glass-layer-2 backdrop-blur-md border-b border-glass-border font-bold text-primary">
                            Sticky Header (Scroll down)
                        </div>
                    </GlassSticky>

                    <GlassInfiniteScroll
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        className="p-4 space-y-4"
                    >
                        {items.map((_, i) => (
                            <GlassCard key={i} className="p-4 hover:scale-[1.01] transition-transform">
                                Item {i + 1}
                            </GlassCard>
                        ))}
                    </GlassInfiniteScroll>
                </div>
            </section>

            {/* Color Picker */}
            <section id="color" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Color Picker</h2>
                <GlassContainer className="p-8">
                    <div className="flex flex-col gap-4 max-w-sm">
                        <label className="text-sm font-medium text-secondary">Select an accent color</label>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full border border-glass-border shadow-lg"
                                style={{ backgroundColor: color }}
                            />
                            <GlassColorPicker color={color} onChange={setColor} />
                        </div>
                    </div>
                </GlassContainer>
            </section>

            {/* Emoji Picker */}
            <section id="emoji" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Emoji Picker</h2>
                <GlassContainer className="p-8">
                    <div className="flex flex-col gap-4 max-w-sm">
                        <label className="text-sm font-medium text-secondary">Pick a reaction</label>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl bg-glass-frame p-2 rounded-xl">{emoji}</span>
                            <GlassEmojiPicker onEmojiClick={(d) => setEmoji(d.emoji)} />
                        </div>
                    </div>
                </GlassContainer>
            </section>

            {/* Autosize Textarea */}
            <section id="textarea" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Autosize Textarea</h2>
                <GlassContainer className="p-8">
                    <div className="w-full max-w-2xl">
                        <label className="text-sm font-medium text-secondary block mb-2">Message</label>
                        <GlassAutosizeTextarea
                            minRows={3}
                            placeholder="Type multiple lines to see me grow automatically..."
                            className="text-lg"
                        />
                    </div>
                </GlassContainer>
            </section>

            {/* Rating */}
            <section id="rating" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Star Rating</h2>
                <GlassContainer className="p-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Rate your experience</label>
                        <GlassRating value={4} onChange={() => { }} size={32} />
                    </div>
                </GlassContainer>
            </section>

            {/* Drag and Drop */}
            <section id="dnd" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Drag & Drop Sortable</h2>
                <GlassContainer className="p-8">
                    <div className="max-w-md">
                        <GlassSortableList
                            items={sortItems}
                            keyField="id"
                            onReorder={setSortItems}
                            className="space-y-3"
                            renderItem={(item) => (
                                <GlassSortableItem id={item.id} enableDragOnItem={false}>
                                    <div className="flex items-center gap-4 p-4 bg-glass-surface rounded-xl border border-glass-border shadow-sm group hover:border-primary/30 transition-colors">
                                        <GlassDragHandle className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-primary font-medium">{item.text}</span>
                                    </div>
                                </GlassSortableItem>
                            )}
                        />
                    </div>
                </GlassContainer>
            </section>

            {/* Image Editor */}
            <section id="editor" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Image Editor</h2>
                <GlassImageEditor
                    image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                    className="h-[600px]"
                />
            </section>

            {/* Captcha */}
            <section id="captcha" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Slide Captcha</h2>
                <GlassContainer className="p-8">
                    <div className="max-w-md mx-auto">
                        <GlassCaptcha onVerify={(success) => console.log('Verified:', success)} />
                    </div>
                </GlassContainer>
            </section>

            {/* Canvas */}
            <section id="canvas" className="space-y-4">
                <h2 className="text-xl font-bold text-primary">Drawing Canvas</h2>
                <div className="w-full">
                    <GlassDrawingCanvas className="w-full h-[500px]" width={800} height={500} />
                </div>
            </section>
        </div>
    );
};
