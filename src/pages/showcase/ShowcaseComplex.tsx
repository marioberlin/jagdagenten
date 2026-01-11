import {
    GlassContainer,
    GlassCode,
    GlassBadge,
    GlassTerminal,
    GlassCalculator,
    GlassSearchBar,
    GlassProfileCard,
    GlassProductCard,
    GlassCollaborativeChatWindow
} from '@/components';
import { useState } from 'react';

// type ChatRole = 'user' | 'assistant' | 'system';

export const ShowcaseComplex = () => {
    /*
    const [messages, setMessages] = useState<{ role: ChatRole; content: string }[]>([
        { role: 'system', content: 'Welcome to Liquid Glass UI AI.' },
        { role: 'assistant', content: 'Hello! I am your sophisticated AI assistant. How can I help you today?' }
    ]);
    */
    // const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    // const [sortItems, setSortItems] = useState([
    // { id: 1, text: 'Research AI Models' },
    // { id: 2, text: 'Design Glass Interface' },
    // { id: 3, text: 'Implement Physics Engine' },
    // { id: 4, text: 'User Testing' },
    // ]);

    /*
    const handleSend = (text: string) => {
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I received your message: "${text}". This is a simulated response in the Liquid Glass chat interface.`
            }]);
        }, 1500);
    };
    */

    const handleSearch = (query: string) => {
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 1000);
        console.log('Searching:', query);
    };

    return (
        <div className="space-y-8">
            {/* Real-World Patterns Section */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Complex</span>
                        <h3 className="text-xl font-bold text-primary">Real-World Patterns</h3>
                    </div>
                    <GlassBadge variant="default">New</GlassBadge>
                </div>

                <div className="space-y-8">
                    <div id="search" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Search Bar</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassSearchBar
                                placeholder="Search anything..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSearch={handleSearch}
                                loading={isSearching}
                            />
                            <GlassSearchBar
                                placeholder="AI-powered search..."
                                aiEnabled
                                size="lg"
                                onSearch={handleSearch}
                            />
                        </div>
                        <div className="flex gap-4">
                            <GlassSearchBar placeholder="Small" size="sm" className="w-48" />
                            <GlassSearchBar placeholder="Expandable" expandable size="md" />
                        </div>
                    </div>

                    <div id="profiles" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Profile Cards</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <GlassProfileCard
                                avatar="https://i.pravatar.cc/150?img=1"
                                name="Sarah Chen"
                                role="Product Designer"
                                status="online"
                                showActions
                            />
                            <GlassProfileCard
                                avatar="https://i.pravatar.cc/150?img=3"
                                name="Alex Rivera"
                                role="Developer"
                                status="away"
                                showActions
                                primaryLabel="Connect"
                                secondaryLabel="View"
                            />
                            <GlassProfileCard
                                avatar="https://i.pravatar.cc/150?img=8"
                                name="Jordan Hayes"
                                role="AI Engineer"
                                status="busy"
                                showActions
                                primaryLabel="Chat"
                                secondaryLabel="Follow"
                            />
                        </div>
                    </div>

                    <div id="products" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Product Cards</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <GlassProductCard
                                image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                                title="Premium Headphones"
                                price="$299"
                                originalPrice="$399"
                                rating={4.8}
                                reviewCount={128}
                                badge="Sale"
                                badgeVariant="destructive"
                                onAddToCart={() => console.log('Added to cart')}
                                onWishlist={() => console.log('Wishlisted')}
                            />
                            <GlassProductCard
                                image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                                title="Smart Watch Pro"
                                price="$449"
                                description="Advanced fitness tracking with always-on display"
                                rating={4.5}
                                reviewCount={89}
                                badge="New"
                                badgeVariant="default"
                                onAddToCart={() => console.log('Added to cart')}
                            />
                            <GlassProductCard
                                image="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400"
                                title="Wireless Earbuds"
                                price="$179"
                                rating={4.2}
                                reviewCount={256}
                                onAddToCart={() => console.log('Added to cart')}
                                onWishlist={() => console.log('Wishlisted')}
                                inWishlist
                            />
                        </div>
                    </div>

                    <div id="dnd" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Drag & Drop Sortable</span>
                        <div className="max-w-md">
                            {/* <GlassSortableList
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
                            /> */}
                            <div className="p-4 rounded-xl border border-glass-border bg-glass-surface text-secondary text-center">
                                Component under development
                            </div>
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Original Complex Composites Section */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Complex</span>
                        <h3 className="text-xl font-bold text-primary">Complex Composites</h3>
                    </div>
                    <GlassBadge variant="glass">Core</GlassBadge>
                </div>

                <div className="space-y-8">
                    <div id="chat" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Chat Interface</span>
                        <div className="h-[500px]">
                            <GlassCollaborativeChatWindow
                                currentUserId="me"
                                title="Project Alpha"
                                participants={[
                                    { id: 'me', name: 'Mario', isActive: true },
                                    { id: 'ai', name: 'Liquid AI', isActive: true, isTyping: false, color: 'var(--system-purple)' }
                                ]}
                                messages={[
                                    { id: '1', senderId: 'ai', content: 'Hello! How can I help you build your Liquid UI today?', timestamp: '10:00 AM' }
                                ]}
                                onSend={(msg) => console.log('Sending:', msg)}
                                isLoading={false}
                            />
                        </div>
                    </div>

                    <div id="terminal" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Terminal Emulator</span>
                        <div className="h-[500px]">
                            <GlassTerminal />
                        </div>
                    </div>
                    <div id="calculator" className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Functional Calculator</span>
                        <div className="flex justify-center">
                            <GlassCalculator />
                        </div>
                    </div>
                </div>
            </GlassContainer>

            {/* Code Examples */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-purple-400">Complex</span>
                        <h3 className="text-xl font-bold text-primary">Usage Examples</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Chat Interface</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassChatContainer>
  {messages.map((msg, i) => (
    <GlassChatMessage key={i} role={msg.role}>
      {msg.content}
    </GlassChatMessage>
  ))}
</GlassChatContainer>`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Cards</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassProfileCard
  name="John Doe"
  role="Designer"
  avatar="/avatar.jpg"
/>

<GlassProductCard
  name="MacBook Pro"
  price={1999}
/>`}
                        />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
