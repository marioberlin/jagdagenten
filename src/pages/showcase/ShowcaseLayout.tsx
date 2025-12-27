
import { GlassContainer } from '@/components';
import { GlassResizable } from '@/components';
import { GlassPagination, GlassPaginationContent, GlassPaginationItem, GlassPaginationLink, GlassPaginationPrevious, GlassPaginationNext, GlassPaginationEllipsis } from '@/components';
import { GlassNavigationMenu } from '@/components';
import { GlassToggleGroup, GlassToggleGroupItem } from '@/components';
import { GlassCollapsible } from '@/components';
import { GlassScrollArea } from '@/components';
import { GlassBadge, GlassCode } from '@/components';
import { GlassBento, GlassBentoItem } from '@/components';
import { GlassNavbar } from '@/components';
import { GlassMasonry } from '@/components';
import { GlassBreadcrumb } from '@/components';

export const ShowcaseLayout = () => {
    return (
        <div className="space-y-8">
            {/* Grid Systems */}
            <GlassContainer id="grids" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Layout</span>
                        <h3 className="text-xl font-bold text-primary">Grid Systems</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="space-y-8">
                    {/* Bento Grid */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Bento Grid</span>
                        <GlassBento className="h-[400px]">
                            <GlassBentoItem colSpan={2} rowSpan={2} title="Main Focus">
                                <div className="w-full h-full bg-accent-muted flex items-center justify-center text-4xl font-bold text-accent/20">1</div>
                            </GlassBentoItem>
                            <GlassBentoItem title="Widget A">
                                <div className="w-full h-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-500/20">2</div>
                            </GlassBentoItem>
                            <GlassBentoItem title="Widget B">
                                <div className="w-full h-full bg-green-500/10 flex items-center justify-center font-bold text-green-500/20">3</div>
                            </GlassBentoItem>
                            <GlassBentoItem colSpan={2} title="Wide Widget">
                                <div className="w-full h-full bg-yellow-500/10 flex items-center justify-center font-bold text-yellow-500/20">4</div>
                            </GlassBentoItem>
                        </GlassBento>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassBento>
  <GlassBentoItem colSpan={2} rowSpan={2} title="Main">
    {/* content */}
  </GlassBentoItem>
  <GlassBentoItem title="Widget A" />
</GlassBento>`}
                        />
                    </div>

                    {/* Masonry */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Masonry Layout</span>
                        <GlassMasonry columns={{ default: 2, md: 3 }} gap={16}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <GlassContainer key={i} className="p-6 bg-glass-surface flex items-center justify-center overflow-hidden" style={{ height: `${120 + (i % 3) * 40}px` }}>
                                    <span className="text-label-glass-tertiary font-semibold text-lg">Item {i + 1}</span>
                                </GlassContainer>
                            ))}
                        </GlassMasonry>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassMasonry columns={{ default: 2, md: 3 }} gap={16}>
  {items.map(item => <Card key={item.id} />)}
</GlassMasonry>`}
                        />
                    </div>
                </div>
            </GlassContainer>

            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Layout</span>
                        <h3 className="text-xl font-bold text-primary">Interactive Overlays</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    {/* Application Header/Navbar */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Application Header</span>
                        <div className="h-[120px] relative rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-black/50">
                            {/* Mock background to show transparency */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
                            <GlassNavbar position="absolute" />
                        </div>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassNavbar position="sticky" />`}
                        />
                    </div>

                    {/* Breadcrumb Navigation */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Breadcrumb Navigation</span>
                        <div className="space-y-4">
                            <GlassBreadcrumb
                                items={[
                                    { label: 'Home', href: '/' },
                                    { label: 'Components', href: '/showcase' },
                                    { label: 'Layout', isActive: true }
                                ]}
                            />
                            <GlassBreadcrumb
                                items={[
                                    { label: 'Dashboard', href: '/' },
                                    { label: 'Projects', href: '/showcase' },
                                    { label: 'Design System', href: '/showcase' },
                                    { label: 'Breadcrumbs', isActive: true }
                                ]}
                                showHomeIcon={false}
                            />
                        </div>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassBreadcrumb 
  items={[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/showcase' },
    { label: 'Layout', isActive: true }
  ]}
/>`}
                        />
                    </div>
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Navigation Menu</span>
                        <div className="h-[200px] relative flex justify-center">
                            <GlassNavigationMenu
                                items={[
                                    { label: 'Overview', href: '#' },
                                    {
                                        label: 'Features',
                                        children: [
                                            { title: 'Liquid Physics', href: '#', description: 'Spring-based animations.' },
                                            { title: 'Glassmorphism', href: '#', description: 'Real-time backdrop filters.' },
                                            { title: 'Theming', href: '#', description: 'Dark and light mode support.' },
                                            { title: 'Accessibility', href: '#', description: 'Screen reader ready.' },
                                        ]
                                    },
                                    { label: 'Resources', href: '#' },
                                ]}
                            />
                        </div>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassNavigationMenu items={[
  { label: 'Overview', href: '#' },
  { label: 'Features', children: [...] },
]} />`}
                        />
                    </div>

                    {/* Resizable */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Resizable Panel</span>
                        <GlassResizable className="h-[200px] w-full rounded-2xl border border-[var(--glass-border)]">
                            <div className="flex items-center justify-center h-full bg-accent-muted text-accent font-bold">
                                Panel A
                            </div>
                            <div className="flex items-center justify-center h-full bg-purple-500/10 text-purple-300 font-bold">
                                Panel B
                            </div>
                        </GlassResizable>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassResizable>
  <PanelA />
  <PanelB />
</GlassResizable>`}
                        />
                    </div>

                    {/* Pagination */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Pagination</span>
                        <GlassPagination>
                            <GlassPaginationContent>
                                <GlassPaginationItem>
                                    <GlassPaginationPrevious />
                                </GlassPaginationItem>
                                <GlassPaginationItem>
                                    <GlassPaginationLink>1</GlassPaginationLink>
                                </GlassPaginationItem>
                                <GlassPaginationItem>
                                    <GlassPaginationLink isActive>2</GlassPaginationLink>
                                </GlassPaginationItem>
                                <GlassPaginationItem>
                                    <GlassPaginationLink>3</GlassPaginationLink>
                                </GlassPaginationItem>
                                <GlassPaginationItem>
                                    <GlassPaginationEllipsis />
                                </GlassPaginationItem>
                                <GlassPaginationItem>
                                    <GlassPaginationNext />
                                </GlassPaginationItem>
                            </GlassPaginationContent>
                        </GlassPagination>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassPagination>
  <GlassPaginationContent>
    <GlassPaginationPrevious />
    <GlassPaginationLink isActive>1</GlassPaginationLink>
    <GlassPaginationNext />
  </GlassPaginationContent>
</GlassPagination>`}
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* Parity & Extras */}
            <GlassContainer id="containers" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-pink-400">Layout</span>
                        <h3 className="text-xl font-bold text-primary">Parity & Extras</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Toggle Group */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Toggle Group</span>
                        <div className="flex flex-col gap-4">
                            <GlassToggleGroup type="single" value="bold">
                                <GlassToggleGroupItem value="bold">Bold</GlassToggleGroupItem>
                                <GlassToggleGroupItem value="italic">Italic</GlassToggleGroupItem>
                                <GlassToggleGroupItem value="underline">Underline</GlassToggleGroupItem>
                            </GlassToggleGroup>
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassToggleGroup type="single" value="bold">
  <GlassToggleGroupItem value="bold">Bold</GlassToggleGroupItem>
  <GlassToggleGroupItem value="italic">Italic</GlassToggleGroupItem>
</GlassToggleGroup>`}
                        />
                    </div>

                    {/* Collapsible */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Collapsible</span>
                        <GlassCollapsible
                            trigger={
                                <div className="flex items-center justify-between p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors">
                                    <span className="text-sm font-medium">@radix-ui/primitives</span>
                                    <span className="text-xs text-label-glass-secondary">Toggle</span>
                                </div>
                            }
                        >
                            <div className="space-y-2 px-2">
                                <div className="text-sm p-2 rounded bg-glass-surface">@radix-ui/colors</div>
                                <div className="text-sm p-2 rounded bg-glass-surface">@stitches/react</div>
                            </div>
                        </GlassCollapsible>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassCollapsible trigger={<Trigger />}>
  <Content />
</GlassCollapsible>`}
                        />
                    </div>

                    {/* Scroll Area */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Scroll Area</span>
                        <GlassScrollArea height={150} className="border border-[var(--glass-border)] rounded-xl p-4">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium leading-none">Tags</h4>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} className="text-sm pb-2 border-b border-[var(--glass-border)] last:border-0 text-label-glass-secondary">
                                        v1.2.0-beta.{i + 1}
                                    </div>
                                ))}
                            </div>
                        </GlassScrollArea>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassScrollArea height={150}>
  {items.map(item => <Row key={item.id} />)}
</GlassScrollArea>`}
                        />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
