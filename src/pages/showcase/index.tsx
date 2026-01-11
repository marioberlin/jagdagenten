import { useState, useEffect } from 'react';
import { DocsLayout, NavSection } from '../../layouts/DocsLayout';
import { GlassPageHeader } from '@/components';
import { GlassBadge } from '@/components';
import { GlassSwitch } from '@/components';
import { TableOfContents, TOCItem } from '@/components';
import { ShowcaseTypography } from './ShowcaseTypography';
import { ShowcaseButtons } from './ShowcaseButtons';
import { ShowcaseForms } from './ShowcaseForms';
import { ShowcaseOverlays } from './ShowcaseOverlays';
import { ShowcaseDataDisplay } from './ShowcaseDataDisplay';
import { ShowcaseLayout } from './ShowcaseLayout';
import { ShowcaseMedia } from './ShowcaseMedia';
import { ShowcaseComplex } from './ShowcaseComplex';
import { ShowcaseTokens } from './ShowcaseTokens';
import { ShowcaseInspiration } from './ShowcaseInspiration';
import { ShowcaseAgentic } from './ShowcaseAgentic';
import { ShowcaseExtensions } from './ShowcaseExtensions';
import { ShowcaseAGUI } from './ShowcaseAGUI';
import { ShowCodeProvider } from '@/context/ShowCodeContext';
import { useShowCode } from '@/hooks/useShowCode';
import {
    Type, Palette, MousePointer2, FormInput, BarChart3,
    LayoutGrid, Layers, Image, Puzzle, Sparkles, Bot,
    Blocks, Grid2X2, Cpu
} from 'lucide-react';


// TOC items per section
const sectionTOC: Record<string, TOCItem[]> = {
    typography: [
        { id: 'display', label: 'Display Typography' },
        { id: 'headings', label: 'Headings' },
        { id: 'body', label: 'Body Text' },
    ],
    buttons: [
        { id: 'buttons', label: 'Button Variants' },
    ],
    forms: [
        { id: 'text-inputs', label: 'Text Inputs' },
        { id: 'selection', label: 'Selection Controls' },
        { id: 'rich-inputs', label: 'Rich Inputs' },
        { id: 'extended', label: 'Extended Inputs' },
    ],
    data: [
        { id: 'metrics', label: 'Metrics' },
        { id: 'charts', label: 'Charts' },
        { id: 'tables', label: 'Tables' },
        { id: 'scroll', label: 'Infinite Scroll' },
    ],
    layout: [
        { id: 'grids', label: 'Grid Systems' },
        { id: 'containers', label: 'Containers' },
    ],
    overlays: [
        { id: 'modals', label: 'Modals' },
        { id: 'popovers', label: 'Popovers' },
        { id: 'tooltips', label: 'Tooltips' },
    ],
    media: [
        { id: 'voice', label: 'Voice Visualizer' },
        { id: 'audio', label: 'Audio Player' },
        { id: 'video', label: 'Video Player' },
        { id: 'gallery', label: 'Image Gallery' },
        { id: 'effects', label: 'Visual Effects' },
        { id: 'stepper', label: 'Stepper' },
        { id: 'parallax', label: 'Parallax Text Image' },
        { id: 'utilities', label: 'Media Utilities' },
    ],
    complex: [
        { id: 'search', label: 'Search Bar' },
        { id: 'profiles', label: 'Profile Cards' },
        { id: 'products', label: 'Product Cards' },
        { id: 'chat', label: 'Chat Interface' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'calculator', label: 'Calculator' },
        { id: 'dnd', label: 'Drag & Drop' },
    ],
    agentic: [
        { id: 'agent', label: 'GlassAgent' },
        { id: 'prompt', label: 'GlassPrompt' },
        { id: 'copilot', label: 'GlassCopilot' },
        { id: 'dynamic-ui', label: 'Dynamic UI' },
    ],
    tokens: [
        { id: 'semantic-colors', label: 'Semantic Colors' },
        { id: 'glass-materials', label: 'Glass Materials' },
        { id: 'spacing', label: 'Spacing Scale' },
        { id: 'glass-shadows', label: 'Glass Shadows' },
    ],
    demos: [
        { id: 'featured', label: 'Featured Demos' },
        { id: 'ai-chat', label: 'AI Chat' },
        { id: 'restaurant', label: 'Restaurant' },
        { id: 'entertainment', label: 'Entertainment' },
        { id: 'smart-home', label: 'Smart Home' },
        { id: 'admin', label: 'Admin Dashboard' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'intro-animation', label: 'Intro Animation' },
        { id: 'quote-generator', label: 'Quote Generator' },
        { id: 'login-flip', label: 'Login Flip Card' },
    ],
    extensions: [
        { id: 'spreadsheet', label: 'Glass Spreadsheet' },
        { id: 'map', label: 'Glass Map' },
        { id: 'flow', label: 'Glass Flow' },
        { id: 'visualizer', label: 'Glass Visualizer' },
        { id: 'scanner', label: 'Glass Scanner' },
    ],
};

type Section = 'typography' | 'buttons' | 'forms' | 'overlays' | 'data' | 'layout' | 'media' | 'complex' | 'tokens' | 'demos' | 'agentic' | 'extensions' | 'agui';

const navSections: NavSection[] = [
    {
        title: 'Foundations',
        items: [
            { id: 'typography', label: 'Typography & Materials', icon: <Type size={16} /> },
            { id: 'tokens', label: 'Design Tokens', icon: <Palette size={16} />, badge: 'New', badgeVariant: 'outline' },
        ],
    },
    {
        title: 'Components',
        items: [
            { id: 'buttons', label: 'Buttons & Interactive', icon: <MousePointer2 size={16} /> },
            { id: 'forms', label: 'Forms & Inputs', icon: <FormInput size={16} /> },
            { id: 'data', label: 'Data & Charts', icon: <BarChart3 size={16} /> },
            { id: 'layout', label: 'Layout & Grids', icon: <LayoutGrid size={16} /> },
            { id: 'overlays', label: 'Overlays & Popovers', icon: <Layers size={16} /> },
            { id: 'media', label: 'Media & Visuals', icon: <Image size={16} /> },
            { id: 'complex', label: 'Complex Composites', icon: <Puzzle size={16} /> },
            { id: 'compound', label: 'Compound & Buttons', icon: <Grid2X2 size={16} />, badge: 'New', badgeVariant: 'default', href: '/showcase/compound' },
            { id: 'extensions', label: 'Extensions', icon: <Blocks size={16} />, badge: 'New', badgeVariant: 'default' },
        ],
    },
    {
        title: 'Examples',
        items: [
            { id: 'agentic', label: 'Agentic UI', icon: <Bot size={16} />, badge: 'New', badgeVariant: 'outline' },
            { id: 'generative', label: 'Generative UI', icon: <Sparkles size={16} />, badge: 'Beta', badgeVariant: 'default', href: '/demos/generative' },
            { id: 'generative-ext', label: 'Gen Extensions', icon: <Grid2X2 size={16} />, badge: 'New', badgeVariant: 'outline', href: '/demos/generative-extensions' },
            { id: 'agui', label: 'AG-UI Demos', icon: <Cpu size={16} />, badge: '7', badgeVariant: 'default' },
            { id: 'demos', label: 'Demos', icon: <Sparkles size={16} />, badge: '9', badgeVariant: 'default' },
        ],
    },
];

// Inner component that uses the ShowCode context
const ShowcaseContent = () => {
    const [activeSection, setActiveSection] = useState<Section>('typography');
    const { showCode, setShowCode } = useShowCode();

    // Handle hash-based navigation
    useEffect(() => {
        const hash = window.location.hash.replace('#', '') as Section;
        const validSections: Section[] = ['typography', 'buttons', 'forms', 'overlays', 'data', 'layout', 'media', 'complex', 'tokens', 'demos', 'agentic', 'extensions', 'agui'];
        if (hash && validSections.includes(hash)) {
            setActiveSection(hash);
        }
    }, []);

    const handleNavChange = (id: string) => {
        setActiveSection(id as Section);
        window.location.hash = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (_query: string) => {
        // Could implement search result navigation here
    };

    const header = (
        <GlassPageHeader
            title="Design System"
            subtitle="Liquid Glass UI Kit"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-sm text-secondary">
                        <span>Show Code</span>
                        <GlassSwitch
                            checked={showCode}
                            onCheckedChange={setShowCode}
                        />
                    </div>
                    <GlassBadge variant="glass" className="hidden sm:flex">
                        v3.0.0 - Modular
                    </GlassBadge>
                </div>
            }
        />
    );

    return (
        <DocsLayout
            navSections={navSections}
            activeItem={activeSection}
            onNavChange={handleNavChange}
            searchPlaceholder="Search components..."
            onSearch={handleSearch}
            header={header}
            rightSidebar={
                sectionTOC[activeSection] && sectionTOC[activeSection].length > 0 ? (
                    <TableOfContents items={sectionTOC[activeSection]} />
                ) : undefined
            }
        >
            {/* Content Sections */}
            <div className="space-y-12">
                {activeSection === 'typography' && <ShowcaseTypography />}
                {activeSection === 'buttons' && <ShowcaseButtons />}
                {activeSection === 'forms' && <ShowcaseForms />}
                {activeSection === 'data' && <ShowcaseDataDisplay />}
                {activeSection === 'layout' && <ShowcaseLayout />}
                {activeSection === 'overlays' && <ShowcaseOverlays />}
                {activeSection === 'media' && <ShowcaseMedia />}
                {activeSection === 'complex' && <ShowcaseComplex />}
                {activeSection === 'tokens' && <ShowcaseTokens />}
                {activeSection === 'agentic' && <ShowcaseAgentic />}
                {activeSection === 'extensions' && <ShowcaseExtensions />}
                {activeSection === 'agui' && <ShowcaseAGUI />}
                {activeSection === 'demos' && <ShowcaseInspiration />}
            </div>
        </DocsLayout>
    );
};

// Exported component wraps content in ShowCodeProvider
export const ShowcaseIndex = () => {
    return (
        <ShowCodeProvider>
            <ShowcaseContent />
        </ShowCodeProvider>
    );
};
