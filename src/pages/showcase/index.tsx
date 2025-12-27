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
import { ShowcaseAdditions } from './ShowcaseAdditions'; // New Import
import { ShowCodeProvider } from '@/context/ShowCodeContext';
import { useShowCode } from '@/hooks/useShowCode';


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
    ],
    data: [
        { id: 'metrics', label: 'Metrics' },
        { id: 'charts', label: 'Charts' },
        { id: 'tables', label: 'Tables' },
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
    ],
    complex: [
        { id: 'search', label: 'Search Bar' },
        { id: 'profiles', label: 'Profile Cards' },
        { id: 'products', label: 'Product Cards' },
        { id: 'chat', label: 'Chat Interface' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'calculator', label: 'Calculator' },
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
    additions: [
        { id: 'scroll', label: 'Infinite Scroll' },
        { id: 'inputs', label: 'Advanced Inputs' },
        { id: 'dnd', label: 'Drag & Drop' },
        { id: 'media', label: 'Media Utilities' },
    ]
};

type Section = 'typography' | 'buttons' | 'forms' | 'overlays' | 'data' | 'layout' | 'media' | 'complex' | 'tokens' | 'demos' | 'agentic' | 'extensions' | 'additions';

const navSections: NavSection[] = [
    {
        title: 'Foundations',
        items: [
            { id: 'typography', label: 'Typography & Materials' },
            { id: 'tokens', label: 'Design Tokens', badge: 'New', badgeVariant: 'outline' },
        ],
    },
    {
        title: 'Components',
        items: [
            { id: 'buttons', label: 'Buttons & Interactive' },
            { id: 'forms', label: 'Forms & Inputs' },
            { id: 'data', label: 'Data & Charts' },
            { id: 'layout', label: 'Layout & Grids' },
            { id: 'overlays', label: 'Overlays & Popovers' },
            { id: 'media', label: 'Media & Visuals' },
            { id: 'complex', label: 'Complex Composites' },
            { id: 'extensions', label: 'Extensions', badge: 'New', badgeVariant: 'default' },
            { id: 'additions', label: 'New Components', badge: 'Beta', badgeVariant: 'outline' }, // New Item
        ],
    },
    {
        title: 'Examples',
        items: [
            { id: 'agentic', label: 'Agentic UI', badge: 'New', badgeVariant: 'outline' },
            { id: 'demos', label: 'Demos', badge: '9', badgeVariant: 'default' },
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
        const validSections: Section[] = ['typography', 'buttons', 'forms', 'overlays', 'data', 'layout', 'media', 'complex', 'tokens', 'demos', 'agentic', 'extensions', 'additions'];
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
                {activeSection === 'additions' && <ShowcaseAdditions />}
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
