import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, MousePointer2, FormInput, BarChart3,
    LayoutGrid, Layers, Image, Puzzle, Bot, Blocks,
    Search, X, Code2, Eye, Copy, Check, ChevronRight,
    Sparkles, Settings2, Grid2X2, ExternalLink,
    BookOpen, Filter, TrendingUp,
    Heart, Share2, MoreHorizontal, Mail, User, Lock,
    Bold, Italic, Underline, ChevronDown, LogOut, Settings,
    Zap, Moon, Sun,
    MapPin, Plus, Minus,
    Send, Loader2, AlertCircle, CheckCircle,
    Info,
    Cpu, Layers2,
    Wifi, Download, Command, Shield,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// Import ALL Glass Components (162 total)
// ============================================

// === PRIMITIVES (7) ===
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassButtonGroup } from '@/components/primitives/GlassButtonGroup';
import { GlassChip } from '@/components/primitives/GlassChip';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassFullscreenButton } from '@/components/primitives/GlassFullscreenButton';
import { GlassLabel } from '@/components/primitives/GlassLabel';
import { GlassShareButton } from '@/components/primitives/GlassShareButton';

// === FORMS (22) ===
import { GlassInput } from '@/components/forms/GlassInput';
import { GlassSwitch } from '@/components/forms/GlassSwitch';
import { GlassSlider } from '@/components/forms/GlassSlider';
import { GlassSelect } from '@/components/forms/GlassSelect';
import { GlassCheckbox } from '@/components/forms/GlassCheckbox';
import { GlassTextarea } from '@/components/forms/GlassTextarea';
import { GlassRadioGroup, GlassRadioGroupItem } from '@/components/forms/GlassRadioGroup';
import { GlassRadio } from '@/components/forms/GlassRadio';
import { GlassAutosizeTextarea } from '@/components/forms/GlassAutosizeTextarea';
import { GlassCalendar } from '@/components/forms/GlassCalendar';
import { GlassCaptcha } from '@/components/forms/GlassCaptcha';
import { GlassColorPicker } from '@/components/forms/GlassColorPicker';
import { GlassCombobox } from '@/components/forms/GlassCombobox';
import { GlassDatePicker } from '@/components/forms/GlassDatePicker';
import { GlassEmojiPicker } from '@/components/forms/GlassEmojiPicker';
import { GlassForm, GlassFormField, GlassFormItem, GlassFormLabel, GlassFormControl, GlassFormDescription, GlassFormMessage } from '@/components/forms/GlassForm';
import { GlassInputOTP } from '@/components/forms/GlassInputOTP';
import { GlassNumberInput } from '@/components/forms/GlassNumberInput';
import { GlassRating } from '@/components/forms/GlassRating';
import { GlassSearchBar } from '@/components/forms/GlassSearchBar';
import { GlassTimePicker } from '@/components/forms/GlassTimePicker';
import { GlassUpload } from '@/components/forms/GlassUpload';

// === DATA DISPLAY (39) ===
import { GlassAvatar } from '@/components/data-display/GlassAvatar';
import { GlassBadge } from '@/components/data-display/GlassBadge';
import { GlassCalculator } from '@/components/data-display/GlassCalculator';
import { GlassCandlestickChart } from '@/components/data-display/GlassCandlestickChart';
import { GlassCard } from '@/components/data-display/GlassCard';
import { GlassCarousel } from '@/components/data-display/GlassCarousel';
import { GlassChart } from '@/components/data-display/GlassChart';
import { GlassCode } from '@/components/data-display/GlassCode';
import { GlassCompare } from '@/components/data-display/GlassCompare';
import { GlassDataTable } from '@/components/data-display/GlassDataTable';
import { GlassDonutChart } from '@/components/data-display/GlassDonutChart';
import { GlassFunnelChart } from '@/components/data-display/GlassFunnelChart';
import { GlassGauge } from '@/components/data-display/GlassGauge';
import { GlassHeatmap } from '@/components/data-display/GlassHeatmap';
import { GlassInfiniteScroll } from '@/components/data-display/GlassInfiniteScroll';
import { GlassKPICard } from '@/components/data-display/GlassKPICard';
import { GlassLineChartOptimized } from '@/components/data-display/GlassLineChartOptimized';
import { GlassMediaCard } from '@/components/data-display/GlassMediaCard';
import { GlassMediaList } from '@/components/data-display/GlassMediaList';
import { GlassMetric } from '@/components/data-display/GlassMetric';
import { GlassParallax } from '@/components/data-display/GlassParallax';
import { GlassPolarAreaChart } from '@/components/data-display/GlassPolarAreaChart';
import { GlassProductCard } from '@/components/data-display/GlassProductCard';
import { GlassProfileCard } from '@/components/data-display/GlassProfileCard';
import { GlassRadarChart } from '@/components/data-display/GlassRadarChart';
import { GlassSankey } from '@/components/data-display/GlassSankey';
import { GlassScatterChart } from '@/components/data-display/GlassScatterChart';
import { GlassStackedBarChart } from '@/components/data-display/GlassStackedBarChart';
import { GlassStatsBar } from '@/components/data-display/GlassStatsBar';
import { GlassTable } from '@/components/data-display/GlassTable';
import { GlassTimeline } from '@/components/data-display/GlassTimeline';
import { GlassTreemap } from '@/components/data-display/GlassTreemap';
import { GlassWeather } from '@/components/data-display/GlassWeather';

// === FEEDBACK (7) ===
import { GlassAlert } from '@/components/feedback/GlassAlert';
import { GlassProgress } from '@/components/feedback/GlassProgress';
import { GlassSkeleton } from '@/components/feedback/GlassSkeleton';
import { GlassSparkles } from '@/components/feedback/GlassSparkles';
import { GlassStatus } from '@/components/feedback/GlassStatus';
import { GlassStepper } from '@/components/feedback/GlassStepper';
import { GlassToastProvider, useToast } from '@/components/feedback/GlassToast';

// === LAYOUT (23) ===
import { GlassAccordion } from '@/components/layout/GlassAccordion';
import { GlassBento, GlassBentoItem } from '@/components/layout/GlassBento';
import { GlassBreadcrumb } from '@/components/layout/GlassBreadcrumb';
import { GlassCollapsible } from '@/components/layout/GlassCollapsible';
import { GlassSortableList, GlassSortableItem, GlassDragHandle } from '@/components/layout/GlassDragDrop';
import { GlassFloatingAction } from '@/components/layout/GlassFloatingAction';
import { GlassMasonry } from '@/components/layout/GlassMasonry';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { GlassNavigationMenu } from '@/components/layout/GlassNavigationMenu';
import { GlassPageHeader } from '@/components/layout/GlassPageHeader';
import { GlassPagination, GlassPaginationContent, GlassPaginationItem, GlassPaginationLink, GlassPaginationPrevious, GlassPaginationNext, GlassPaginationEllipsis } from '@/components/layout/GlassPagination';
import { GlassResizable } from '@/components/layout/GlassResizable';
import { GlassScrollArea } from '@/components/layout/GlassScrollArea';
import { GlassSeparator } from '@/components/layout/GlassSeparator';
import { GlassSidebar } from '@/components/layout/GlassSidebar';
import { GlassSticky } from '@/components/layout/GlassSticky';
import { GlassTabs, GlassTabsList, GlassTabsTrigger, GlassTabsContent } from '@/components/layout/GlassTabs';
import { GlassToggle } from '@/components/layout/GlassToggle';
import { GlassToggleGroup, GlassToggleGroupItem } from '@/components/layout/GlassToggleGroup';

// === OVERLAYS (13) ===
import { GlassAlertDialog } from '@/components/overlays/GlassAlertDialog';
import { GlassCommand } from '@/components/overlays/GlassCommand';
import { GlassCommandPalette } from '@/components/overlays/GlassCommandPalette';
import { GlassContextMenu } from '@/components/overlays/GlassContextMenu';
import { GlassDrawer } from '@/components/overlays/GlassDrawer';
import { GlassDropdown, GlassDropdownItem } from '@/components/overlays/GlassDropdown';
import { GlassHoverCard } from '@/components/overlays/GlassHoverCard';
import { GlassModal } from '@/components/overlays/GlassModal';
import { GlassPopover } from '@/components/overlays/GlassPopover';
import { GlassSheet } from '@/components/overlays/GlassSheet';
import { GlassTooltip } from '@/components/overlays/GlassTooltip';
import { GlassTour } from '@/components/overlays/GlassTour';

// === MEDIA (8) ===
import { GlassAudio } from '@/components/media/GlassAudio';
import { GlassDrawingCanvas } from '@/components/media/GlassDrawingCanvas';
import { GlassImageEditor } from '@/components/media/GlassImageEditor';
import { GlassMiniPlayer } from '@/components/media/GlassMiniPlayer';
import { GlassScanner } from '@/components/media/GlassScanner';
import { GlassVideo } from '@/components/media/GlassVideo';
import { GlassVisualizer } from '@/components/media/GlassVisualizer';

// === FEATURES (11) ===
import { GlassChatContainer, GlassChatMessage, GlassChatInput, GlassChatWindow } from '@/components/features/GlassChat';
import { GlassEditor } from '@/components/features/GlassEditor';
import { GlassFilePreview } from '@/components/features/GlassFilePreview';
import { GlassFileTree } from '@/components/features/GlassFileTree';
import { GlassFlow } from '@/components/features/GlassFlow';
import { GlassKanban } from '@/components/features/GlassKanban';
import { GlassPayment } from '@/components/features/GlassPayment';
import { GlassSpreadsheet } from '@/components/features/GlassSpreadsheet';
import { GlassTerminal } from '@/components/features/GlassTerminal';
import { GlassVoice } from '@/components/features/GlassVoice';

// === AGENTIC (5) ===
import { GlassAgent } from '@/components/agentic/GlassAgent';
import { GlassCopilot } from '@/components/agentic/GlassCopilot';
import { GlassDynamicUI } from '@/components/agentic/GlassDynamicUI';
import { GlassPrompt } from '@/components/agentic/GlassPrompt';

// === GENERATIVE (11) ===
import { GlassSmartBadge } from '@/components/generative/GlassSmartBadge';
import { GlassSmartCard } from '@/components/generative/GlassSmartCard';
import { GlassSmartChart } from '@/components/generative/GlassSmartChart';
import { GlassSmartList } from '@/components/generative/GlassSmartList';
import { GlassThinking } from '@/components/generative/GlassThinking';

// === COMPOUND (2) ===
import { GlassButtonDropdown } from '@/components/compound/GlassButtonDropdown';
import { GlassSplitButton } from '@/components/compound/GlassSplitButton';

// === CONTAINERS (1) ===
import { GlassWindow } from '@/components/containers/GlassWindow';

// === TRADING (6) ===
import { GlassMarketTicker } from '@/components/trading/GlassMarketTicker';
import { GlassOrderEntry } from '@/components/trading/GlassOrderEntry';
import { GlassPositionsList } from '@/components/trading/GlassPositionsList';

// ============================================
// Types & Interfaces
// ============================================

interface ComponentExample {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    tags: string[];
    isNew?: boolean;
    isBeta?: boolean;
    isPopular?: boolean;
    component: React.ReactNode;
    code: string;
    props?: PropDefinition[];
}

interface PropDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    default: string | number | boolean;
    options?: string[];
    description?: string;
}

interface Category {
    id: string;
    label: string;
    icon: React.ElementType;
    description: string;
    badge?: string;
    badgeVariant?: 'new' | 'beta' | 'count';
    subcategories?: string[];
}

// ============================================
// Category Configuration - 13 Categories
// ============================================

const CATEGORIES: Category[] = [
    {
        id: 'foundations',
        label: 'Foundations',
        icon: Palette,
        description: 'Typography, colors, tokens',
        subcategories: ['Typography', 'Design Tokens', 'Colors', 'Materials']
    },
    {
        id: 'buttons',
        label: 'Buttons & Actions',
        icon: MousePointer2,
        description: 'Interactive button elements',
        subcategories: ['Basic', 'Variants', 'Sizes', 'States', 'Compound']
    },
    {
        id: 'forms',
        label: 'Forms & Inputs',
        icon: FormInput,
        description: 'User input components',
        subcategories: ['Text Inputs', 'Selection', 'Rich Inputs', 'Extended'],
        badge: '16+',
        badgeVariant: 'count'
    },
    {
        id: 'data',
        label: 'Data Display',
        icon: BarChart3,
        description: 'Charts, tables, metrics',
        subcategories: ['Metrics', 'Charts', 'Tables', 'Lists'],
        badge: 'New',
        badgeVariant: 'new'
    },
    {
        id: 'layout',
        label: 'Layout & Grids',
        icon: LayoutGrid,
        description: 'Structural components',
        subcategories: ['Grids', 'Navigation', 'Containers']
    },
    {
        id: 'overlays',
        label: 'Overlays & Popovers',
        icon: Layers,
        description: 'Modals, tooltips, sheets',
        subcategories: ['Modals', 'Popovers', 'Tooltips', 'Menus']
    },
    {
        id: 'media',
        label: 'Media & Visuals',
        icon: Image,
        description: 'Audio, video, galleries',
        subcategories: ['Audio', 'Video', 'Gallery', 'Effects']
    },
    {
        id: 'complex',
        label: 'Complex Composites',
        icon: Puzzle,
        description: 'Multi-component patterns',
        subcategories: ['Cards', 'Search', 'Chat', 'Tools']
    },
    {
        id: 'agentic',
        label: 'Agentic UI',
        icon: Bot,
        description: 'AI-powered components',
        badge: 'Beta',
        badgeVariant: 'beta',
        subcategories: ['Agent', 'Prompt', 'Dynamic UI', 'Copilot']
    },
    {
        id: 'extensions',
        label: 'Extensions',
        icon: Blocks,
        description: 'Advanced integrations',
        badge: '5',
        badgeVariant: 'count',
        subcategories: ['Spreadsheet', 'Map', 'Flow', 'Visualizer']
    },
    {
        id: 'compound',
        label: 'Compound Components',
        icon: Layers2,
        description: 'Enhanced compositions',
        badge: 'New',
        badgeVariant: 'new'
    },
    {
        id: 'demos',
        label: 'Demo Examples',
        icon: Sparkles,
        description: 'Full-page showcases',
        badge: '9',
        badgeVariant: 'count',
        subcategories: ['AI Chat', 'Dashboard', 'E-commerce', 'Portfolio']
    },
    {
        id: 'agui',
        label: 'AG-UI Patterns',
        icon: Cpu,
        description: 'Agent UI patterns',
        badge: '7',
        badgeVariant: 'count'
    },
];

// ============================================
// Helper Components (must be defined before COMPONENT_EXAMPLES)
// ============================================

// Modal Demo Component
const ModalDemo: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <GlassButton variant="secondary" onClick={() => setIsOpen(true)}>
                Open Modal
            </GlassButton>
            <GlassModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Modal Title"
            >
                <div className="space-y-4">
                    <p className="text-white/70">This is the modal content. You can put anything here.</p>
                    <div className="flex gap-2 justify-end">
                        <GlassButton variant="ghost" onClick={() => setIsOpen(false)}>Cancel</GlassButton>
                        <GlassButton variant="primary" onClick={() => setIsOpen(false)}>Confirm</GlassButton>
                    </div>
                </div>
            </GlassModal>
        </>
    );
};

// ============================================
// TypeScript Import Usage - Components that can't be demoed inline
// These are portal-based, require external state, or need real resources
// ============================================

// The following components are documented with code examples only:
// - GlassForm/GlassFormField/etc: Requires react-hook-form FormProvider setup
// - GlassToastProvider/useToast: Provider pattern, wraps entire app
// - GlassAlertDialog/GlassSheet/GlassDrawer: Portal-based controlled modals
// - GlassCommandPalette: Portal-based, requires useNavigate
// - GlassTour: Portal-based onboarding overlay
// - GlassScanner: Requires camera access
// - GlassImageEditor: Requires image file upload
// We mark them as referenced to satisfy TypeScript:
const _portalComponents = {
    GlassForm, GlassFormField, GlassFormItem, GlassFormLabel, GlassFormControl,
    GlassFormDescription, GlassFormMessage,
    GlassToastProvider, useToast,
    GlassAlertDialog, GlassSheet, GlassDrawer, GlassCommandPalette, GlassTour,
    GlassScanner, GlassImageEditor,
    // Smart components require LiquidProvider - using placeholders in showcase
    GlassSmartBadge, GlassSmartCard, GlassSmartChart, GlassSmartList,
};
void _portalComponents; // Prevents unused variable warning

// ============================================
// COMPREHENSIVE Component Examples - ALL 80+
// ============================================

const COMPONENT_EXAMPLES: ComponentExample[] = [
    // ========================================
    // FOUNDATIONS - Typography & Design Tokens
    // ========================================
    {
        id: 'typography-display',
        name: 'Display Typography',
        description: 'Large, impactful text for hero sections',
        category: 'foundations',
        subcategory: 'Typography',
        tags: ['typography', 'display', 'heading', 'hero'],
        component: (
            <div className="space-y-2 text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Display Text</p>
                <p className="text-white/50 text-sm">SF Pro Display • Bold • 48px</p>
            </div>
        ),
        code: `<h1 className="text-5xl font-bold">Display Text</h1>`,
    },
    {
        id: 'typography-headings',
        name: 'Heading Hierarchy',
        description: 'Consistent heading scale from H1 to H6',
        category: 'foundations',
        subcategory: 'Typography',
        tags: ['typography', 'headings', 'h1', 'h2', 'h3'],
        isPopular: true,
        component: (
            <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white">Heading 1</h1>
                <h2 className="text-3xl font-semibold text-white">Heading 2</h2>
                <h3 className="text-2xl font-semibold text-white">Heading 3</h3>
                <h4 className="text-xl font-medium text-white/90">Heading 4</h4>
                <h5 className="text-lg font-medium text-white/80">Heading 5</h5>
                <h6 className="text-base font-medium text-white/70">Heading 6</h6>
            </div>
        ),
        code: `<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<h4 className="text-xl font-medium">Heading 4</h4>
<h5 className="text-lg font-medium">Heading 5</h5>
<h6 className="text-base font-medium">Heading 6</h6>`,
    },
    {
        id: 'typography-body',
        name: 'Body Text',
        description: 'Readable body text with various sizes',
        category: 'foundations',
        subcategory: 'Typography',
        tags: ['typography', 'body', 'paragraph', 'text'],
        component: (
            <div className="space-y-4 max-w-md">
                <p className="text-lg text-white/90">Large body text for emphasis and introductions.</p>
                <p className="text-base text-white/80">Regular body text for main content. The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-white/60">Small text for captions and secondary information.</p>
                <p className="text-xs text-white/40">Extra small for labels and metadata.</p>
            </div>
        ),
        code: `<p className="text-lg">Large body text</p>
<p className="text-base">Regular body text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Extra small</p>`,
    },
    {
        id: 'colors-semantic',
        name: 'Semantic Colors',
        description: 'Color system with semantic meaning',
        category: 'foundations',
        subcategory: 'Colors',
        tags: ['colors', 'semantic', 'tokens', 'palette'],
        isNew: true,
        component: (
            <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25" />
                    <p className="text-xs text-white/60 text-center">Primary</p>
                </div>
                <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25" />
                    <p className="text-xs text-white/60 text-center">Success</p>
                </div>
                <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/25" />
                    <p className="text-xs text-white/60 text-center">Warning</p>
                </div>
                <div className="space-y-2">
                    <div className="h-16 rounded-xl bg-red-500 shadow-lg shadow-red-500/25" />
                    <p className="text-xs text-white/60 text-center">Error</p>
                </div>
            </div>
        ),
        code: `// Semantic color tokens
--color-primary: var(--blue-500);
--color-success: var(--emerald-500);
--color-warning: var(--amber-500);
--color-error: var(--red-500);`,
    },
    {
        id: 'colors-text',
        name: 'Text Colors',
        description: 'Hierarchical text color system',
        category: 'foundations',
        subcategory: 'Colors',
        tags: ['colors', 'text', 'hierarchy'],
        component: (
            <div className="space-y-2">
                <p className="text-white font-medium">Primary Text (100%)</p>
                <p className="text-white/80">Secondary Text (80%)</p>
                <p className="text-white/60">Tertiary Text (60%)</p>
                <p className="text-white/40">Disabled Text (40%)</p>
            </div>
        ),
        code: `<p className="text-white">Primary</p>
<p className="text-white/80">Secondary</p>
<p className="text-white/60">Tertiary</p>
<p className="text-white/40">Disabled</p>`,
    },
    {
        id: 'glass-materials',
        name: 'Glass Materials',
        description: 'Three material depth variants',
        category: 'foundations',
        subcategory: 'Materials',
        tags: ['glass', 'materials', 'blur', 'frosted'],
        isPopular: true,
        component: (
            <div className="flex gap-4">
                <div className="w-28 h-28 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center">
                    <span className="text-white/80 font-medium">Thin</span>
                    <span className="text-[10px] text-white/40">5% • blur-sm</span>
                </div>
                <div className="w-28 h-28 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center">
                    <span className="text-white/90 font-medium">Regular</span>
                    <span className="text-[10px] text-white/50">10% • blur-md</span>
                </div>
                <div className="w-28 h-28 rounded-xl bg-white/15 backdrop-blur-lg border border-white/30 flex flex-col items-center justify-center">
                    <span className="text-white font-medium">Thick</span>
                    <span className="text-[10px] text-white/60">15% • blur-lg</span>
                </div>
            </div>
        ),
        code: `<GlassContainer material="thin">Thin</GlassContainer>
<GlassContainer material="regular">Regular</GlassContainer>
<GlassContainer material="thick">Thick</GlassContainer>`,
    },
    {
        id: 'glass-intensity',
        name: 'Glass Intensity',
        description: 'Intensity levels for glass effects',
        category: 'foundations',
        subcategory: 'Materials',
        tags: ['glass', 'intensity', 'blur', 'opacity'],
        component: (
            <div className="flex gap-4">
                <div className="w-28 h-28 rounded-xl bg-white/5 backdrop-blur-[4px] border border-white/10 flex flex-col items-center justify-center">
                    <span className="text-white/70 font-medium">Subtle</span>
                    <span className="text-[10px] text-white/40">4px blur</span>
                </div>
                <div className="w-28 h-28 rounded-xl bg-white/10 backdrop-blur-[16px] border border-white/20 flex flex-col items-center justify-center">
                    <span className="text-white/80 font-medium">Medium</span>
                    <span className="text-[10px] text-white/50">16px blur</span>
                </div>
                <div className="w-28 h-28 rounded-xl bg-white/15 backdrop-blur-[32px] border border-white/30 flex flex-col items-center justify-center">
                    <span className="text-white/90 font-medium">Heavy</span>
                    <span className="text-[10px] text-white/60">32px blur</span>
                </div>
            </div>
        ),
        code: `intensity="subtle"  // 4px blur, 0.3 opacity
intensity="medium"  // 16px blur, 0.5 opacity
intensity="heavy"   // 32px blur, 0.7 opacity`,
    },
    {
        id: 'spacing-scale',
        name: 'Spacing Scale',
        description: '4px grid-based spacing system',
        category: 'foundations',
        subcategory: 'Design Tokens',
        tags: ['spacing', 'tokens', 'grid', 'layout'],
        component: (
            <div className="flex items-end gap-2">
                {[1, 2, 3, 4, 6, 8, 10, 12].map((n) => (
                    <div key={n} className="flex flex-col items-center gap-1">
                        <div
                            className="bg-blue-500/50 rounded"
                            style={{ width: n * 4, height: n * 4 }}
                        />
                        <span className="text-[10px] text-white/40">{n * 4}px</span>
                    </div>
                ))}
            </div>
        ),
        code: `// 4px grid spacing scale
p-1  = 4px    p-2  = 8px
p-3  = 12px   p-4  = 16px
p-6  = 24px   p-8  = 32px
p-10 = 40px   p-12 = 48px`,
    },
    {
        id: 'border-radius',
        name: 'Border Radius Scale',
        description: 'Consistent corner radius tokens',
        category: 'foundations',
        subcategory: 'Design Tokens',
        tags: ['radius', 'corners', 'tokens'],
        component: (
            <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-[10px] text-white/60">lg (8)</div>
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-[10px] text-white/60">xl (12)</div>
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-[10px] text-white/60">2xl (16)</div>
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center text-[10px] text-white/60">3xl (24)</div>
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-[10px] text-white/60">full</div>
            </div>
        ),
        code: `rounded-lg   = 8px
rounded-xl   = 12px
rounded-2xl  = 16px
rounded-3xl  = 24px
rounded-full = 9999px`,
    },
    {
        id: 'animation-timing',
        name: 'Animation Timing',
        description: 'Standard animation durations',
        category: 'foundations',
        subcategory: 'Design Tokens',
        tags: ['animation', 'timing', 'transitions', 'motion'],
        component: (
            <div className="flex gap-4">
                {[
                    { label: 'Micro', duration: '150ms' },
                    { label: 'Standard', duration: '300ms' },
                    { label: 'Emphasis', duration: '500ms' },
                    { label: 'Dramatic', duration: '1000ms' },
                ].map((item) => (
                    <div key={item.label} className="text-center">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-2 hover:scale-110" style={{ transition: `transform ${item.duration}` }} />
                        <p className="text-xs text-white/60">{item.label}</p>
                        <p className="text-[10px] text-white/40">{item.duration}</p>
                    </div>
                ))}
            </div>
        ),
        code: `// Animation durations
150ms  - Micro interactions
300ms  - Standard transitions
500ms  - Emphasis animations
1000ms - Dramatic effects`,
    },

    // ========================================
    // BUTTONS - All Variants
    // ========================================
    {
        id: 'button-primary',
        name: 'Primary Button',
        description: 'Main call-to-action with thick glass effect',
        category: 'buttons',
        subcategory: 'Basic',
        tags: ['button', 'action', 'primary', 'cta'],
        isPopular: true,
        component: (
            <div className="flex gap-3">
                <GlassButton variant="primary" size="lg">Get Started</GlassButton>
                <GlassButton variant="primary">Confirm</GlassButton>
                <GlassButton variant="primary" size="sm">Add</GlassButton>
            </div>
        ),
        code: `<GlassButton variant="primary" size="lg">Get Started</GlassButton>
<GlassButton variant="primary">Confirm</GlassButton>
<GlassButton variant="primary" size="sm">Add</GlassButton>`,
        props: [
            { name: 'variant', type: 'select', default: 'primary', options: ['primary', 'secondary', 'ghost', 'outline', 'destructive'] },
            { name: 'size', type: 'select', default: 'md', options: ['sm', 'md', 'lg'] },
            { name: 'loading', type: 'boolean', default: false },
            { name: 'disabled', type: 'boolean', default: false },
        ],
    },
    {
        id: 'button-secondary',
        name: 'Secondary Button',
        description: 'Secondary actions with regular glass',
        category: 'buttons',
        subcategory: 'Variants',
        tags: ['button', 'action', 'secondary'],
        component: (
            <div className="flex gap-3">
                <GlassButton variant="secondary" size="lg">View Profile</GlassButton>
                <GlassButton variant="secondary">Edit</GlassButton>
                <GlassButton variant="secondary" size="sm">Cancel</GlassButton>
            </div>
        ),
        code: `<GlassButton variant="secondary">View Profile</GlassButton>
<GlassButton variant="secondary">Edit</GlassButton>
<GlassButton variant="secondary" size="sm">Cancel</GlassButton>`,
    },
    {
        id: 'button-ghost',
        name: 'Ghost Button',
        description: 'Subtle button for tertiary actions',
        category: 'buttons',
        subcategory: 'Variants',
        tags: ['button', 'action', 'ghost', 'subtle'],
        component: (
            <div className="flex gap-3 items-center">
                <GlassButton variant="ghost">Skip</GlassButton>
                <GlassButton variant="ghost" className="rounded-full !p-3"><Heart size={20} /></GlassButton>
                <GlassButton variant="ghost" className="rounded-full !p-3"><Share2 size={20} /></GlassButton>
                <GlassButton variant="ghost" className="rounded-full !p-3"><MoreHorizontal size={20} /></GlassButton>
            </div>
        ),
        code: `<GlassButton variant="ghost">Skip</GlassButton>
<GlassButton variant="ghost" className="rounded-full !p-3">
    <Heart size={20} />
</GlassButton>`,
    },
    {
        id: 'button-outline',
        name: 'Outline Button',
        description: 'Bordered button with transparent fill',
        category: 'buttons',
        subcategory: 'Variants',
        tags: ['button', 'action', 'outline', 'bordered'],
        component: (
            <div className="flex gap-3">
                <GlassButton variant="outline" size="lg">Learn More</GlassButton>
                <GlassButton variant="outline">Details</GlassButton>
                <GlassButton variant="outline" size="sm">View</GlassButton>
            </div>
        ),
        code: `<GlassButton variant="outline">Learn More</GlassButton>
<GlassButton variant="outline">Details</GlassButton>`,
    },
    {
        id: 'button-destructive',
        name: 'Destructive Button',
        description: 'For dangerous or irreversible actions',
        category: 'buttons',
        subcategory: 'Variants',
        tags: ['button', 'action', 'destructive', 'danger', 'delete'],
        component: (
            <div className="flex gap-3">
                <GlassButton variant="destructive">Delete Account</GlassButton>
                <GlassButton variant="destructive" size="sm">Remove</GlassButton>
            </div>
        ),
        code: `<GlassButton variant="destructive">Delete Account</GlassButton>
<GlassButton variant="destructive" size="sm">Remove</GlassButton>`,
    },
    {
        id: 'button-loading',
        name: 'Loading States',
        description: 'Buttons with loading indicators',
        category: 'buttons',
        subcategory: 'States',
        tags: ['button', 'loading', 'spinner', 'async'],
        component: (
            <div className="flex gap-3">
                <GlassButton variant="primary" disabled className="opacity-70">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                </GlassButton>
                <GlassButton variant="secondary" disabled className="opacity-70">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading
                </GlassButton>
            </div>
        ),
        code: `<GlassButton variant="primary" loading>Saving...</GlassButton>
<GlassButton variant="secondary" loading>Loading</GlassButton>`,
    },
    {
        id: 'button-sizes',
        name: 'Button Sizes',
        description: 'Small, medium, and large variants',
        category: 'buttons',
        subcategory: 'Sizes',
        tags: ['button', 'sizes', 'sm', 'md', 'lg'],
        component: (
            <div className="flex items-center gap-3">
                <GlassButton size="sm">Small</GlassButton>
                <GlassButton size="md">Medium</GlassButton>
                <GlassButton size="lg">Large</GlassButton>
            </div>
        ),
        code: `<GlassButton size="sm">Small</GlassButton>
<GlassButton size="md">Medium</GlassButton>
<GlassButton size="lg">Large</GlassButton>`,
    },
    {
        id: 'button-icons',
        name: 'Buttons with Icons',
        description: 'Icon placement variations',
        category: 'buttons',
        subcategory: 'Compound',
        tags: ['button', 'icon', 'left', 'right'],
        isNew: true,
        component: (
            <div className="flex gap-3">
                <GlassButton variant="primary">
                    <Plus size={16} className="mr-2" />
                    Add Item
                </GlassButton>
                <GlassButton variant="secondary">
                    Download
                    <Download size={16} className="ml-2" />
                </GlassButton>
                <GlassButton variant="ghost" className="!p-3 rounded-full">
                    <Settings size={20} />
                </GlassButton>
            </div>
        ),
        code: `<GlassButton>
    <Plus size={16} className="mr-2" />
    Add Item
</GlassButton>
<GlassButton>
    Download
    <Download size={16} className="ml-2" />
</GlassButton>`,
    },

    // ========================================
    // FORMS - All Input Types
    // ========================================
    {
        id: 'input-text',
        name: 'Text Input',
        description: 'Standard text input with glass styling',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['input', 'text', 'form', 'field'],
        isPopular: true,
        component: (
            <div className="space-y-3 w-72">
                <GlassInput placeholder="Enter your name..." />
                <GlassInput type="email" placeholder="Email address" />
            </div>
        ),
        code: `<GlassInput placeholder="Enter your name..." />
<GlassInput type="email" placeholder="Email address" />`,
        props: [
            { name: 'placeholder', type: 'string', default: 'Enter text...' },
            { name: 'type', type: 'select', default: 'text', options: ['text', 'email', 'password', 'number'] },
            { name: 'disabled', type: 'boolean', default: false },
        ],
    },
    {
        id: 'input-with-icon',
        name: 'Input with Icon',
        description: 'Text input with leading icon',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['input', 'icon', 'form'],
        component: (
            <div className="space-y-3 w-72">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <GlassInput className="pl-10" placeholder="Email address" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <GlassInput className="pl-10" type="password" placeholder="Password" />
                </div>
            </div>
        ),
        code: `<div className="relative">
    <Mail className="absolute left-3 top-1/2 -translate-y-1/2" />
    <GlassInput className="pl-10" placeholder="Email" />
</div>`,
    },
    {
        id: 'input-validation',
        name: 'Input Validation',
        description: 'Error and success states',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['input', 'validation', 'error', 'success'],
        component: (
            <div className="space-y-3 w-72">
                <div>
                    <GlassInput className="border-red-500/50 focus:ring-red-500" placeholder="Invalid input" />
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> This field is required
                    </p>
                </div>
                <div>
                    <GlassInput className="border-emerald-500/50 focus:ring-emerald-500" defaultValue="Valid input" />
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Looks good!
                    </p>
                </div>
            </div>
        ),
        code: `<GlassInput className="border-red-500/50" />
<p className="text-red-400">Error message</p>

<GlassInput className="border-emerald-500/50" />
<p className="text-emerald-400">Success!</p>`,
    },
    {
        id: 'textarea',
        name: 'Textarea',
        description: 'Multi-line text input',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['textarea', 'multiline', 'form'],
        component: (
            <GlassTextarea
                placeholder="Enter your message..."
                className="w-72 min-h-[100px]"
            />
        ),
        code: `<GlassTextarea
    placeholder="Enter your message..."
    className="min-h-[100px]"
/>`,
    },
    {
        id: 'switch-toggle',
        name: 'Switch Toggle',
        description: 'Binary toggle switch',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['switch', 'toggle', 'boolean', 'form'],
        isPopular: true,
        component: (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between w-64">
                    <span className="text-sm text-white/80">Notifications</span>
                    <GlassSwitch defaultChecked />
                </div>
                <div className="flex items-center justify-between w-64">
                    <span className="text-sm text-white/80">Dark Mode</span>
                    <GlassSwitch />
                </div>
            </div>
        ),
        code: `<GlassSwitch checked={value} onCheckedChange={setValue} />`,
    },
    {
        id: 'checkbox',
        name: 'Checkbox',
        description: 'Multi-select option control',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['checkbox', 'form', 'selection'],
        component: (
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                    <GlassCheckbox defaultChecked />
                    <span className="text-sm text-white/80">Accept terms and conditions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <GlassCheckbox />
                    <span className="text-sm text-white/80">Subscribe to newsletter</span>
                </label>
            </div>
        ),
        code: `<GlassCheckbox checked={value} onCheckedChange={setValue} />`,
    },
    {
        id: 'radio-group',
        name: 'Radio Group',
        description: 'Single selection from options',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['radio', 'form', 'selection', 'group'],
        component: (
            <GlassRadioGroup defaultValue="option-1" className="space-y-2">
                <GlassRadioGroupItem value="option-1">Option A</GlassRadioGroupItem>
                <GlassRadioGroupItem value="option-2">Option B</GlassRadioGroupItem>
                <GlassRadioGroupItem value="option-3">Option C</GlassRadioGroupItem>
            </GlassRadioGroup>
        ),
        code: `<GlassRadioGroup value={value} onValueChange={setValue}>
    <GlassRadioGroupItem value="option-1">Option A</GlassRadioGroupItem>
    <GlassRadioGroupItem value="option-2">Option B</GlassRadioGroupItem>
</GlassRadioGroup>`,
    },
    {
        id: 'slider-range',
        name: 'Range Slider',
        description: 'Adjustable value slider',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['slider', 'range', 'form', 'number'],
        component: (
            <div className="w-64 space-y-4">
                <div>
                    <label className="text-sm text-white/60 mb-2 block">Volume</label>
                    <GlassSlider defaultValue={50} max={100} />
                </div>
                <div>
                    <label className="text-sm text-white/60 mb-2 block">Brightness</label>
                    <GlassSlider defaultValue={75} max={100} />
                </div>
            </div>
        ),
        code: `<GlassSlider defaultValue={50} max={100} />`,
    },
    {
        id: 'select-dropdown',
        name: 'Select Dropdown',
        description: 'Single selection dropdown',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['select', 'dropdown', 'form'],
        component: (
            <GlassSelect
                options={[
                    { value: 'react', label: 'React' },
                    { value: 'vue', label: 'Vue' },
                    { value: 'angular', label: 'Angular' },
                    { value: 'svelte', label: 'Svelte' },
                ]}
                placeholder="Select framework..."
                className="w-64"
            />
        ),
        code: `<GlassSelect
    options={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
    ]}
    placeholder="Select framework..."
/>`,
    },
    {
        id: 'toggle-buttons',
        name: 'Toggle Buttons',
        description: 'Single or multi-select toggle group',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['toggle', 'button', 'group'],
        component: (
            <div className="flex gap-1 p-1 rounded-lg bg-white/5">
                <GlassToggle size="sm" className="data-[state=on]:bg-white/10">
                    <Bold size={16} />
                </GlassToggle>
                <GlassToggle size="sm" className="data-[state=on]:bg-white/10">
                    <Italic size={16} />
                </GlassToggle>
                <GlassToggle size="sm" className="data-[state=on]:bg-white/10">
                    <Underline size={16} />
                </GlassToggle>
            </div>
        ),
        code: `<GlassToggle pressed={bold} onPressedChange={setBold}>
    <Bold size={16} />
</GlassToggle>`,
    },

    // ========================================
    // DATA DISPLAY - Metrics, Charts, Tables
    // ========================================
    {
        id: 'badge-variants',
        name: 'Badges',
        description: 'Status and label indicators',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['badge', 'status', 'label', 'tag'],
        isPopular: true,
        component: (
            <div className="flex flex-wrap items-center gap-2">
                <GlassBadge>Default</GlassBadge>
                <GlassBadge variant="secondary">Secondary</GlassBadge>
                <GlassBadge variant="outline">Outline</GlassBadge>
                <GlassBadge variant="destructive">Error</GlassBadge>
                <GlassBadge variant="glass">Glass</GlassBadge>
            </div>
        ),
        code: `<GlassBadge>Default</GlassBadge>
<GlassBadge variant="secondary">Secondary</GlassBadge>
<GlassBadge variant="outline">Outline</GlassBadge>
<GlassBadge variant="destructive">Error</GlassBadge>`,
    },
    {
        id: 'avatar-sizes',
        name: 'Avatar',
        description: 'User profile images with fallback',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['avatar', 'user', 'profile', 'image'],
        component: (
            <div className="flex items-center gap-4">
                <GlassAvatar size="sm" fallback="SM" />
                <GlassAvatar size="md" fallback="MD" />
                <GlassAvatar size="lg" fallback="LG" />
                <div className="flex -space-x-2">
                    <GlassAvatar size="sm" fallback="A" className="border-2 border-black" />
                    <GlassAvatar size="sm" fallback="B" className="border-2 border-black" />
                    <GlassAvatar size="sm" fallback="C" className="border-2 border-black" />
                    <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-xs text-white/60">+3</div>
                </div>
            </div>
        ),
        code: `<GlassAvatar size="sm" fallback="JD" />
<GlassAvatar size="md" fallback="AB" />
<GlassAvatar size="lg" fallback="XY" />`,
    },
    {
        id: 'progress-bar',
        name: 'Progress Bar',
        description: 'Visual progress indicator',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['progress', 'loading', 'bar', 'percentage'],
        component: (
            <div className="w-72 space-y-4">
                <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Uploading...</span>
                        <span>25%</span>
                    </div>
                    <GlassProgress value={25} />
                </div>
                <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Processing</span>
                        <span>60%</span>
                    </div>
                    <GlassProgress value={60} />
                </div>
                <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Almost done</span>
                        <span>90%</span>
                    </div>
                    <GlassProgress value={90} />
                </div>
            </div>
        ),
        code: `<GlassProgress value={60} />`,
    },
    {
        id: 'status-indicators',
        name: 'Status Indicators',
        description: 'Online, offline, busy states',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['status', 'online', 'offline', 'indicator'],
        isNew: true,
        component: (
            <div className="flex gap-6">
                {[
                    { status: 'online', color: 'bg-emerald-500' },
                    { status: 'busy', color: 'bg-red-500' },
                    { status: 'away', color: 'bg-amber-500' },
                    { status: 'offline', color: 'bg-gray-500' },
                ].map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                        <div className="relative">
                            <GlassAvatar size="sm" fallback="U" />
                            <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black", item.color)} />
                        </div>
                        <span className="text-sm text-white/70 capitalize">{item.status}</span>
                    </div>
                ))}
            </div>
        ),
        code: `<GlassStatus status="online" label="Online" />
<GlassStatus status="busy" label="Busy" />
<GlassStatus status="away" label="Away" />
<GlassStatus status="offline" label="Offline" />`,
    },
    {
        id: 'metric-card-grid',
        name: 'Metric Cards (Grid)',
        description: 'KPI display with trend indicators',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['metric', 'kpi', 'card', 'dashboard', 'grid'],
        isNew: true,
        component: (
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <GlassContainer className="p-4" border>
                    <p className="text-xs text-white/50 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">$45,231</p>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400">+12.5%</span>
                        <span className="text-xs text-white/40">vs last month</span>
                    </div>
                </GlassContainer>
                <GlassContainer className="p-4" border>
                    <p className="text-xs text-white/50 mb-1">Active Users</p>
                    <p className="text-2xl font-bold text-white">2,543</p>
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400">+8.2%</span>
                        <span className="text-xs text-white/40">vs last week</span>
                    </div>
                </GlassContainer>
            </div>
        ),
        code: `<GlassMetric
    title="Total Revenue"
    value="$45,231"
    trend={{ value: "+12.5%", isPositive: true }}
/>`,
    },
    {
        id: 'glass-table-basic',
        name: 'Glass Table',
        description: 'Structured data display with sorting',
        category: 'data',
        subcategory: 'Tables',
        tags: ['table', 'data', 'grid', 'list'],
        isPopular: true,
        component: (
            <div className="w-full max-w-lg">
                <GlassTable
                    data={[
                        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
                        { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Editor' },
                    ]}
                    columns={[
                        { header: 'Name', accessor: 'name' },
                        { header: 'Email', accessor: 'email' },
                        { header: 'Role', accessor: 'role' },
                    ]}
                    keyField="id"
                />
            </div>
        ),
        code: `<GlassTable
    data={users}
    columns={[
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role' },
    ]}
/>`,
    },
    {
        id: 'carousel',
        name: 'Carousel',
        description: 'Horizontal scrolling content slider',
        category: 'data',
        subcategory: 'Lists',
        tags: ['carousel', 'slider', 'gallery'],
        component: (
            <div className="w-full max-w-md">
                <GlassCarousel
                    items={[
                        <div key={1} className="w-full h-32 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-white/60">Slide 1</div>,
                        <div key={2} className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-white/60">Slide 2</div>,
                        <div key={3} className="w-full h-32 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-white/60">Slide 3</div>,
                    ]}
                />
            </div>
        ),
        code: `<GlassCarousel items={slides} />`,
    },

    // ========================================
    // LAYOUT - Grids, Navigation, Containers
    // ========================================
    {
        id: 'container-glass',
        name: 'Glass Container',
        description: 'Base container with glass material',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['container', 'glass', 'card', 'panel'],
        isPopular: true,
        component: (
            <div className="flex gap-4">
                <GlassContainer className="p-6 w-48" material="thin" border>
                    <p className="text-sm text-white/70">Thin material</p>
                </GlassContainer>
                <GlassContainer className="p-6 w-48" material="regular" border>
                    <p className="text-sm text-white/80">Regular material</p>
                </GlassContainer>
                <GlassContainer className="p-6 w-48" material="thick" border>
                    <p className="text-sm text-white/90">Thick material</p>
                </GlassContainer>
            </div>
        ),
        code: `<GlassContainer material="thin" border>
    Thin material
</GlassContainer>
<GlassContainer material="regular" border>
    Regular material
</GlassContainer>`,
        props: [
            { name: 'material', type: 'select', default: 'regular', options: ['thin', 'regular', 'thick'] },
            { name: 'border', type: 'boolean', default: true },
        ],
    },
    {
        id: 'breadcrumb-nav',
        name: 'Breadcrumb',
        description: 'Navigation hierarchy indicator',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['breadcrumb', 'navigation', 'path'],
        component: (
            <GlassBreadcrumb
                items={[
                    { label: 'Home', href: '#' },
                    { label: 'Products', href: '#' },
                    { label: 'Electronics', href: '#' },
                    { label: 'Phones', isActive: true },
                ]}
            />
        ),
        code: `<GlassBreadcrumb
    items={[
        { label: 'Home', href: '#' },
        { label: 'Products', href: '#' },
        { label: 'Current', isActive: true },
    ]}
/>`,
    },
    {
        id: 'separator',
        name: 'Separator',
        description: 'Visual divider line',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['separator', 'divider', 'line'],
        component: (
            <div className="w-64 space-y-4">
                <p className="text-sm text-white/70">Content above</p>
                <GlassSeparator />
                <p className="text-sm text-white/70">Content below</p>
            </div>
        ),
        code: `<GlassSeparator />`,
    },
    {
        id: 'bento-grid',
        name: 'Bento Grid',
        description: 'Asymmetric grid layout',
        category: 'layout',
        subcategory: 'Grids',
        tags: ['bento', 'grid', 'layout', 'masonry'],
        isNew: true,
        component: (
            <GlassBento columns={4} gap="sm" className="w-full max-w-lg">
                <GlassBentoItem colSpan={2} rowSpan={2} title="Featured" description="Main content area">
                    <div className="h-full min-h-[80px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded" />
                </GlassBentoItem>
                <GlassBentoItem title="Item 1">Content</GlassBentoItem>
                <GlassBentoItem title="Item 2">Content</GlassBentoItem>
                <GlassBentoItem colSpan={2} title="Item 3">Wide content</GlassBentoItem>
            </GlassBento>
        ),
        code: `<GlassBento columns={4} gap="sm">
    <GlassBentoItem colSpan={2} rowSpan={2} title="Featured">
        Content
    </GlassBentoItem>
    <GlassBentoItem title="Item 1">Content</GlassBentoItem>
    <GlassBentoItem title="Item 2">Content</GlassBentoItem>
</GlassBento>`,
    },

    // ========================================
    // OVERLAYS - Modals, Tooltips, Popovers
    // ========================================
    {
        id: 'tooltip',
        name: 'Tooltip',
        description: 'Contextual information on hover',
        category: 'overlays',
        subcategory: 'Tooltips',
        tags: ['tooltip', 'hover', 'hint', 'help'],
        isPopular: true,
        component: (
            <div className="flex gap-4">
                <GlassTooltip content="This is a tooltip">
                    <GlassButton variant="secondary">Hover me</GlassButton>
                </GlassTooltip>
                <GlassTooltip content="Another tooltip with more text">
                    <GlassButton variant="ghost" className="!p-3 rounded-full">
                        <Info size={20} />
                    </GlassButton>
                </GlassTooltip>
            </div>
        ),
        code: `<GlassTooltip content="This is a tooltip">
    <GlassButton>Hover me</GlassButton>
</GlassTooltip>`,
    },
    {
        id: 'modal-dialog',
        name: 'Modal Dialog',
        description: 'Focused content overlay',
        category: 'overlays',
        subcategory: 'Modals',
        tags: ['modal', 'dialog', 'popup', 'overlay'],
        isPopular: true,
        component: (
            <ModalDemo />
        ),
        code: `<GlassModal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Modal Title"
>
    <p>Modal content goes here</p>
</GlassModal>`,
    },
    {
        id: 'dropdown-menu',
        name: 'Dropdown Menu',
        description: 'Action menu with items',
        category: 'overlays',
        subcategory: 'Menus',
        tags: ['dropdown', 'menu', 'actions'],
        component: (
            <GlassDropdown
                trigger={
                    <GlassButton variant="secondary">
                        Options
                        <ChevronDown size={16} className="ml-2" />
                    </GlassButton>
                }
            >
                <GlassDropdownItem icon={User}>Profile</GlassDropdownItem>
                <GlassDropdownItem icon={Settings}>Settings</GlassDropdownItem>
                <GlassDropdownItem icon={LogOut}>Sign out</GlassDropdownItem>
            </GlassDropdown>
        ),
        code: `<GlassDropdown trigger={<GlassButton>Options</GlassButton>}>
    <GlassDropdownItem icon={User}>Profile</GlassDropdownItem>
    <GlassDropdownItem icon={Settings}>Settings</GlassDropdownItem>
    <GlassDropdownItem icon={LogOut}>Sign out</GlassDropdownItem>
</GlassDropdown>`,
    },

    // ========================================
    // MEDIA - Audio, Video, Effects
    // ========================================
    {
        id: 'audio-player',
        name: 'Audio Player',
        description: 'Full-featured music playback interface with album art',
        category: 'media',
        subcategory: 'Audio',
        tags: ['audio', 'music', 'player', 'media'],
        component: (
            <div className="w-80">
                <GlassAudio
                    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                    title="Midnight Dreams"
                    artist="Neon Waves"
                    layout="horizontal"
                />
            </div>
        ),
        code: `<GlassAudio
    src="/tracks/song.mp3"
    title="Track Title"
    artist="Artist Name"
    layout="vertical" // or "horizontal"
/>`,
    },
    {
        id: 'video-player',
        name: 'Video Player',
        description: 'Video playback with full controls',
        category: 'media',
        subcategory: 'Video',
        tags: ['video', 'player', 'media'],
        component: (
            <div className="w-80">
                <GlassVideo
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    className="aspect-video"
                />
            </div>
        ),
        code: `<GlassVideo
    src="/videos/demo.mp4"
    poster="/images/poster.jpg"
/>`,
    },
    {
        id: 'sparkle-effect',
        name: 'Sparkle Effect',
        description: 'Magical sparkle animation wrapper',
        category: 'media',
        subcategory: 'Effects',
        tags: ['sparkle', 'effect', 'animation', 'magic'],
        isBeta: true,
        component: (
            <div className="relative inline-block">
                <GlassButton variant="primary" size="lg">
                    ✨ Magic Button ✨
                </GlassButton>
            </div>
        ),
        code: `<GlassSparkles>
    <GlassButton>Magic Button</GlassButton>
</GlassSparkles>`,
    },

    // ========================================
    // COMPLEX - Composite Components
    // ========================================
    {
        id: 'search-bar-complex',
        name: 'Search Bar (Advanced)',
        description: 'Full-featured search input with keyboard hint',
        category: 'complex',
        subcategory: 'Search',
        tags: ['search', 'input', 'filter', 'keyboard'],
        isPopular: true,
        component: (
            <div className="w-80">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/30">
                        <Command size={10} /> K
                    </div>
                </div>
            </div>
        ),
        code: `<GlassSearchBar
    placeholder="Search..."
    aiEnabled
    onSearch={handleSearch}
/>`,
    },
    {
        id: 'profile-card',
        name: 'Profile Card',
        description: 'User profile display component',
        category: 'complex',
        subcategory: 'Cards',
        tags: ['profile', 'user', 'card', 'social'],
        component: (
            <GlassProfileCard
                name="John Doe"
                role="Product Designer"
                status="online"
                showActions
            />
        ),
        code: `<GlassProfileCard
    avatar="/avatar.jpg"
    name="John Doe"
    role="Product Designer"
    status="online"
    showActions
/>`,
    },
    {
        id: 'product-card',
        name: 'Product Card',
        description: 'E-commerce product display',
        category: 'complex',
        subcategory: 'Cards',
        tags: ['product', 'ecommerce', 'card', 'shop'],
        component: (
            <GlassProductCard
                image="/placeholder-product.jpg"
                title="Premium Headphones"
                price="$79.99"
                originalPrice="$99.99"
                rating={4}
                reviewCount={128}
                badge="-20%"
                badgeVariant="destructive"
            />
        ),
        code: `<GlassProductCard
    image="/product.jpg"
    title="Product Name"
    price="$79.99"
    originalPrice="$99.99"
    rating={4}
    badge="-20%"
/>`,
    },
    {
        id: 'chat-message',
        name: 'Chat Interface',
        description: 'Message bubble components',
        category: 'complex',
        subcategory: 'Chat',
        tags: ['chat', 'message', 'conversation'],
        component: (
            <div className="w-80 space-y-3">
                {/* Received message */}
                <div className="flex gap-2">
                    <GlassAvatar size="sm" fallback="AI" />
                    <div className="flex-1 max-w-[80%]">
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/10">
                            <p className="text-sm text-white/80">Hello! How can I help you today?</p>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1 ml-2">2:34 PM</p>
                    </div>
                </div>
                {/* Sent message */}
                <div className="flex gap-2 justify-end">
                    <div className="flex-1 max-w-[80%] text-right">
                        <div className="bg-blue-500/20 rounded-2xl rounded-tr-none p-3 border border-blue-500/30 inline-block text-left">
                            <p className="text-sm text-white/90">I need help with my project</p>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1 mr-2">2:35 PM</p>
                    </div>
                </div>
            </div>
        ),
        code: `<GlassCollaborativeChatWindow
    messages={messages}
    onSend={handleSend}
/>`,
    },
    {
        id: 'terminal',
        name: 'Terminal',
        description: 'Command line interface',
        category: 'complex',
        subcategory: 'Tools',
        tags: ['terminal', 'cli', 'console', 'code'],
        component: (
            <div className="w-96 h-64">
                <GlassTerminal />
            </div>
        ),
        code: `<GlassTerminal />`,
    },

    // ========================================
    // AGENTIC UI - AI Components
    // ========================================
    {
        id: 'agent-orb',
        name: 'Agent Orb',
        description: 'AI agent visual indicator',
        category: 'agentic',
        subcategory: 'Agent',
        tags: ['agent', 'ai', 'orb', 'assistant'],
        isBeta: true,
        component: (
            <div className="flex items-center gap-8">
                <GlassAgent state="idle" size="md" label="Idle" />
                <GlassAgent state="listening" size="md" label="Listening" />
                <GlassAgent state="thinking" size="md" label="Thinking" />
                <GlassAgent state="replying" size="md" label="Replying" />
            </div>
        ),
        code: `<GlassAgent
    state="idle" // idle, listening, thinking, replying
    variant="orb"
    size="md"
/>`,
    },
    {
        id: 'prompt-input',
        name: 'Prompt Input',
        description: 'AI chat input with attachments',
        category: 'agentic',
        subcategory: 'Prompt',
        tags: ['prompt', 'input', 'ai', 'chat'],
        isBeta: true,
        component: (
            <div className="w-96">
                <GlassPrompt
                    placeholder="Ask me anything..."
                    variant="standard"
                    enableVoice
                    enableFiles
                />
            </div>
        ),
        code: `<GlassPrompt
    placeholder="Ask me anything..."
    onSubmit={handleSubmit}
    variant="standard"
    enableVoice
    enableFiles
/>`,
    },
    {
        id: 'dynamic-ui',
        name: 'Dynamic UI',
        description: 'Schema-driven UI generation',
        category: 'agentic',
        subcategory: 'Dynamic UI',
        tags: ['dynamic', 'schema', 'generative', 'ai'],
        isNew: true,
        isBeta: true,
        component: (
            <GlassDynamicUI
                schema={{
                    type: 'container',
                    props: { className: 'p-4 w-80 space-y-3' },
                    children: [
                        { type: 'text', children: 'Settings Panel', props: { className: 'text-lg font-semibold mb-2' } },
                        { type: 'slider', id: 'temp', props: { defaultValue: 72, max: 100 } },
                        { type: 'toggle', id: 'eco' },
                        { type: 'button', id: 'apply', props: { variant: 'primary', className: 'w-full' }, children: 'Apply' }
                    ]
                }}
            />
        ),
        code: `<GlassDynamicUI
    schema={{
        type: 'container',
        children: [
            { type: 'slider', id: 'temp' },
            { type: 'toggle', id: 'eco' },
            { type: 'button', id: 'apply', children: 'Apply' }
        ]
    }}
/>`,
    },
    {
        id: 'copilot-floating',
        name: 'Copilot Assistant',
        description: 'Floating AI assistant panel',
        category: 'agentic',
        subcategory: 'Copilot',
        tags: ['copilot', 'assistant', 'floating', 'ai'],
        isBeta: true,
        component: (
            <div className="relative w-80 h-80">
                <GlassCopilot
                    mode="sidebar"
                    state="listening"
                    context="Reviewing code..."
                    defaultExpanded
                />
            </div>
        ),
        code: `<GlassCopilot
    mode="floating"
    defaultExpanded
    state="listening"
    context={pageContext}
/>`,
    },

    // ========================================
    // EXTENSIONS - Advanced Integrations
    // ========================================
    {
        id: 'spreadsheet',
        name: 'Glass Spreadsheet',
        description: 'High-performance data grid',
        category: 'extensions',
        subcategory: 'Spreadsheet',
        tags: ['spreadsheet', 'grid', 'excel', 'data'],
        isNew: true,
        component: (
            <div className="w-[500px] h-64">
                <GlassSpreadsheet />
            </div>
        ),
        code: `<GlassSpreadsheet className="h-96" />`,
    },
    {
        id: 'flow-editor',
        name: 'Glass Flow',
        description: 'Node-based workflow editor',
        category: 'extensions',
        subcategory: 'Flow',
        tags: ['flow', 'nodes', 'workflow', 'diagram'],
        isNew: true,
        component: (
            <div className="w-[500px] h-64">
                <GlassFlow />
            </div>
        ),
        code: `<GlassFlow className="h-96" />`,
    },
    {
        id: 'map-view',
        name: 'Glass Map',
        description: 'Interactive map component',
        category: 'extensions',
        subcategory: 'Map',
        tags: ['map', 'location', 'geo', 'navigation'],
        component: (
            <GlassContainer className="w-96 h-48 relative overflow-hidden" border>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin size={32} className="text-red-400 mx-auto mb-2" />
                        <p className="text-xs text-white/60">San Francisco, CA</p>
                    </div>
                </div>
                <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                    <button className="p-1.5 rounded bg-white/10 text-white/60 hover:text-white">
                        <Plus size={14} />
                    </button>
                    <button className="p-1.5 rounded bg-white/10 text-white/60 hover:text-white">
                        <Minus size={14} />
                    </button>
                </div>
            </GlassContainer>
        ),
        code: `<GlassMap center={[37.7749, -122.4194]} zoom={12} />`,
    },

    // ========================================
    // DEMOS - Full Examples
    // ========================================
    {
        id: 'demo-ai-chat',
        name: 'AI Chat Demo',
        description: 'Complete AI assistant interface',
        category: 'demos',
        subcategory: 'AI Chat',
        tags: ['demo', 'ai', 'chat', 'assistant'],
        isPopular: true,
        component: (
            <GlassContainer className="w-80" border>
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Zap size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-white">Zap AI</p>
                        <p className="text-xs text-emerald-400">Online • Ready</p>
                    </div>
                </div>
                <div className="p-4 h-32 flex items-center justify-center">
                    <p className="text-sm text-white/40 text-center">Start a conversation with AI</p>
                </div>
                <div className="p-3 border-t border-white/10">
                    <div className="flex gap-2">
                        <GlassInput placeholder="Message Zap..." className="flex-1" />
                        <GlassButton variant="primary" className="!p-2">
                            <Send size={16} />
                        </GlassButton>
                    </div>
                </div>
            </GlassContainer>
        ),
        code: `// Full AI Chat Demo
// See: /demos/ai-chat`,
    },
    {
        id: 'demo-dashboard',
        name: 'Admin Dashboard',
        description: 'Analytics dashboard layout',
        category: 'demos',
        subcategory: 'Dashboard',
        tags: ['demo', 'dashboard', 'analytics', 'admin'],
        component: (
            <div className="w-full max-w-lg">
                <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                        { label: 'Users', value: '2,543', change: '+12%' },
                        { label: 'Revenue', value: '$45K', change: '+8%' },
                        { label: 'Orders', value: '1,234', change: '+23%' },
                    ].map((stat) => (
                        <GlassContainer key={stat.label} className="p-3" border>
                            <p className="text-xs text-white/50">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-emerald-400">{stat.change}</p>
                        </GlassContainer>
                    ))}
                </div>
                <GlassContainer className="p-4" border>
                    <p className="text-xs text-white/50 mb-2">Revenue Chart</p>
                    <div className="h-20 flex items-end gap-1">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/50 to-purple-500/50 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </GlassContainer>
            </div>
        ),
        code: `// Full Admin Dashboard Demo
// See: /demos/admin-dashboard`,
    },
    {
        id: 'demo-smart-home',
        name: 'Smart Home',
        description: 'IoT control interface',
        category: 'demos',
        subcategory: 'Dashboard',
        tags: ['demo', 'smart-home', 'iot', 'controls'],
        component: (
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                    { icon: Sun, label: 'Living Room', value: 'On', active: true },
                    { icon: Moon, label: 'Bedroom', value: 'Off', active: false },
                    { icon: Wifi, label: 'Thermostat', value: '72°F', active: true },
                    { icon: Shield, label: 'Security', value: 'Armed', active: true },
                ].map((device) => (
                    <GlassContainer
                        key={device.label}
                        className={cn("p-4 cursor-pointer transition-all", device.active && "border-blue-500/50")}
                        border
                    >
                        <device.icon size={24} className={device.active ? "text-blue-400" : "text-white/30"} />
                        <p className="text-sm font-medium text-white mt-2">{device.label}</p>
                        <p className="text-xs text-white/50">{device.value}</p>
                    </GlassContainer>
                ))}
            </div>
        ),
        code: `// Full Smart Home Demo
// See: /demos/smart-home`,
    },
    {
        id: 'demo-ecommerce',
        name: 'E-commerce',
        description: 'Online store interface',
        category: 'demos',
        subcategory: 'E-commerce',
        tags: ['demo', 'ecommerce', 'shop', 'store'],
        component: (
            <GlassContainer className="w-80" border>
                <div className="p-4 border-b border-white/10">
                    <p className="font-semibold text-white">Shopping Cart</p>
                    <p className="text-xs text-white/50">3 items</p>
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/5" />
                            <div className="flex-1">
                                <p className="text-sm text-white/80">Product {i}</p>
                                <p className="text-xs text-white/40">$29.99</p>
                            </div>
                            <button className="text-white/30 hover:text-red-400">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-3">
                        <span className="text-white/60">Total</span>
                        <span className="font-bold text-white">$89.97</span>
                    </div>
                    <GlassButton variant="primary" className="w-full">Checkout</GlassButton>
                </div>
            </GlassContainer>
        ),
        code: `// Full E-commerce Demo
// See: /demos/ecommerce`,
    },
    // ========================================
    // ADDITIONAL PRIMITIVES
    // ========================================
    {
        id: 'button-group',
        name: 'Button Group',
        description: 'Grouped action buttons',
        category: 'buttons',
        subcategory: 'Compound',
        tags: ['button', 'group', 'toolbar'],
        component: (
            <GlassButtonGroup>
                <GlassButton variant="secondary">Left</GlassButton>
                <GlassButton variant="secondary">Center</GlassButton>
                <GlassButton variant="secondary">Right</GlassButton>
            </GlassButtonGroup>
        ),
        code: `<GlassButtonGroup>
    <GlassButton>Left</GlassButton>
    <GlassButton>Center</GlassButton>
    <GlassButton>Right</GlassButton>
</GlassButtonGroup>`,
    },
    {
        id: 'chip',
        name: 'Chip',
        description: 'Compact tag or filter element',
        category: 'buttons',
        subcategory: 'Tags',
        tags: ['chip', 'tag', 'filter', 'badge'],
        isNew: true,
        component: (
            <div className="flex flex-wrap gap-2">
                <GlassChip>Default</GlassChip>
                <GlassChip variant="primary">Primary</GlassChip>
                <GlassChip variant="success">Success</GlassChip>
                <GlassChip onRemove={() => {}}>Removable</GlassChip>
            </div>
        ),
        code: `<GlassChip variant="primary">Label</GlassChip>
<GlassChip removable onRemove={handleRemove}>Removable</GlassChip>`,
    },
    {
        id: 'label',
        name: 'Label',
        description: 'Form field label component',
        category: 'forms',
        subcategory: 'Labels',
        tags: ['label', 'form', 'field'],
        component: (
            <div className="space-y-4 w-64">
                <div>
                    <GlassLabel htmlFor="demo-input">Email Address</GlassLabel>
                    <GlassInput id="demo-input" placeholder="Enter email" />
                </div>
                <div>
                    <GlassLabel required>Required Field</GlassLabel>
                    <GlassInput placeholder="This field is required" />
                </div>
            </div>
        ),
        code: `<GlassLabel htmlFor="email">Email</GlassLabel>
<GlassInput id="email" />`,
    },
    {
        id: 'share-button',
        name: 'Share Button',
        description: 'Social sharing button',
        category: 'buttons',
        subcategory: 'Actions',
        tags: ['share', 'social', 'button'],
        component: (
            <div className="flex gap-2">
                <GlassShareButton shareData={{ title: 'Share', url: 'https://example.com' }} />
                <GlassShareButton iconOnly />
                <GlassShareButton variant="ghost" iconOnly />
            </div>
        ),
        code: `<GlassShareButton platform="twitter" />
<GlassShareButton platform="copy" url={window.location.href} />`,
    },
    {
        id: 'fullscreen-button',
        name: 'Fullscreen Button',
        description: 'Toggle fullscreen mode',
        category: 'buttons',
        subcategory: 'Actions',
        tags: ['fullscreen', 'expand', 'button'],
        component: (
            <GlassFullscreenButton />
        ),
        code: `<GlassFullscreenButton />`,
    },
    // ========================================
    // ADDITIONAL FORMS
    // ========================================
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'Date selection calendar',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['calendar', 'date', 'picker'],
        isPopular: true,
        component: (
            <GlassCalendar />
        ),
        code: `<GlassCalendar
    selected={date}
    onSelect={setDate}
/>`,
    },
    {
        id: 'date-picker',
        name: 'Date Picker',
        description: 'Date input with calendar popup',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['date', 'picker', 'input'],
        isPopular: true,
        component: (
            <div className="w-64">
                <GlassDatePicker />
            </div>
        ),
        code: `<GlassDatePicker
    value={date}
    onChange={setDate}
    placeholder="Select date"
/>`,
    },
    {
        id: 'time-picker',
        name: 'Time Picker',
        description: 'Time selection input',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['time', 'picker', 'input'],
        component: (
            <div className="w-48">
                <GlassTimePicker />
            </div>
        ),
        code: `<GlassTimePicker value={time} onChange={setTime} />`,
    },
    {
        id: 'color-picker',
        name: 'Color Picker',
        description: 'Color selection tool',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['color', 'picker', 'design'],
        isNew: true,
        component: (
            <GlassColorPicker color="#3b82f6" onChange={() => {}} />
        ),
        code: `<GlassColorPicker value={color} onChange={setColor} />`,
    },
    {
        id: 'emoji-picker',
        name: 'Emoji Picker',
        description: 'Emoji selection popover',
        category: 'forms',
        subcategory: 'Rich Inputs',
        tags: ['emoji', 'picker', 'chat'],
        component: (
            <GlassEmojiPicker onEmojiClick={(data) => console.log(data.emoji)} />
        ),
        code: `<GlassEmojiPicker onSelect={handleEmojiSelect} />`,
    },
    {
        id: 'combobox',
        name: 'Combobox',
        description: 'Searchable dropdown select',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['combobox', 'autocomplete', 'search', 'select'],
        isPopular: true,
        component: (
            <div className="w-64">
                <GlassCombobox
                    options={[
                        { value: 'react', label: 'React' },
                        { value: 'vue', label: 'Vue' },
                        { value: 'angular', label: 'Angular' },
                        { value: 'svelte', label: 'Svelte' },
                    ]}
                    placeholder="Select framework..."
                />
            </div>
        ),
        code: `<GlassCombobox
    options={frameworks}
    value={value}
    onChange={setValue}
    placeholder="Select..."
/>`,
    },
    {
        id: 'input-otp',
        name: 'OTP Input',
        description: 'One-time password input',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['otp', 'pin', 'code', 'verification'],
        component: (
            <GlassInputOTP length={6} />
        ),
        code: `<GlassInputOTP
    maxLength={6}
    value={otp}
    onChange={setOtp}
/>`,
    },
    {
        id: 'number-input',
        name: 'Number Input',
        description: 'Numeric input with stepper',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['number', 'input', 'stepper'],
        component: (
            <div className="w-48">
                <GlassNumberInput defaultValue={10} min={0} max={100} />
            </div>
        ),
        code: `<GlassNumberInput
    value={count}
    onChange={setCount}
    min={0}
    max={100}
/>`,
    },
    {
        id: 'rating',
        name: 'Rating',
        description: 'Star rating input',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['rating', 'stars', 'review'],
        component: (
            <GlassRating value={3} max={5} />
        ),
        code: `<GlassRating value={rating} onChange={setRating} max={5} />`,
    },
    {
        id: 'search-bar',
        name: 'Search Bar',
        description: 'Enhanced search input',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['search', 'input', 'filter'],
        isPopular: true,
        component: (
            <div className="w-80">
                <GlassSearchBar placeholder="Search anything..." />
            </div>
        ),
        code: `<GlassSearchBar
    placeholder="Search..."
    onSearch={handleSearch}
/>`,
    },
    {
        id: 'upload',
        name: 'File Upload',
        description: 'Drag & drop file upload',
        category: 'forms',
        subcategory: 'Extended',
        tags: ['upload', 'file', 'drag-drop'],
        isPopular: true,
        component: (
            <div className="w-80">
                <GlassUpload accept="image/*" />
            </div>
        ),
        code: `<GlassUpload
    accept="image/*"
    onUpload={handleUpload}
/>`,
    },
    {
        id: 'autosize-textarea',
        name: 'Autosize Textarea',
        description: 'Auto-expanding text area',
        category: 'forms',
        subcategory: 'Text Inputs',
        tags: ['textarea', 'autosize', 'input'],
        component: (
            <div className="w-80">
                <GlassAutosizeTextarea placeholder="Start typing..." minRows={2} />
            </div>
        ),
        code: `<GlassAutosizeTextarea
    placeholder="Type here..."
    minRows={2}
    maxRows={10}
/>`,
    },
    {
        id: 'captcha',
        name: 'Captcha',
        description: 'Human verification component',
        category: 'forms',
        subcategory: 'Extended',
        tags: ['captcha', 'verification', 'security'],
        component: (
            <GlassCaptcha onVerify={(verified) => console.log('Verified:', verified)} />
        ),
        code: `<GlassCaptcha onVerify={handleVerify} />`,
    },
    {
        id: 'radio',
        name: 'Radio Button',
        description: 'Single radio button',
        category: 'forms',
        subcategory: 'Selection',
        tags: ['radio', 'input', 'selection'],
        component: (
            <div className="flex gap-4">
                <GlassRadio checked name="demo">Option A</GlassRadio>
                <GlassRadio name="demo">Option B</GlassRadio>
            </div>
        ),
        code: `<GlassRadio label="Option" name="group" checked={selected} onChange={setSelected} />`,
    },
    // ========================================
    // ADDITIONAL DATA DISPLAY - Charts
    // ========================================
    {
        id: 'basic-chart',
        name: 'Basic Chart',
        description: 'Simple line/bar chart',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'line', 'bar', 'graph'],
        component: (
            <div className="w-64 h-32">
                <GlassChart data={[20, 35, 28, 45, 38, 52]} type="line" height={120} />
            </div>
        ),
        code: `<GlassChart data={[20, 35, 28, 45, 38, 52]} type="line" height={120} />`,
    },
    {
        id: 'metric-card',
        name: 'Metric Card',
        description: 'Animated stat display with sparkline',
        category: 'data',
        subcategory: 'Stats',
        tags: ['metric', 'stat', 'kpi', 'number'],
        component: (
            <div className="w-64">
                <GlassMetric
                    label="Revenue"
                    value={42150}
                    prefix="$"
                    trend="up"
                    trendValue="+12.5%"
                />
            </div>
        ),
        code: `<GlassMetric label="Revenue" value={42150} prefix="$" trend="up" trendValue="+12.5%" />`,
    },
    {
        id: 'sparkles-text',
        name: 'Sparkles Effect',
        description: 'Magical sparkle animation',
        category: 'feedback',
        subcategory: 'Effects',
        tags: ['sparkles', 'magic', 'animation', 'effect'],
        component: (
            <GlassSparkles color="#ffcc00">
                <span className="text-2xl font-bold text-white">Magical Text</span>
            </GlassSparkles>
        ),
        code: `<GlassSparkles color="#ffcc00">
    <span>Magical Text</span>
</GlassSparkles>`,
    },
    {
        id: 'line-chart',
        name: 'Line Chart',
        description: 'Optimized line chart for time series',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'line', 'graph', 'time-series'],
        isPopular: true,
        component: (
            <div className="w-full h-48">
                <GlassLineChartOptimized
                    data={[20, 35, 28, 45, 38, 52]}
                    labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
                />
            </div>
        ),
        code: `<GlassLineChartOptimized data={timeSeriesData} />`,
    },
    {
        id: 'donut-chart',
        name: 'Donut Chart',
        description: 'Circular proportional chart',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'donut', 'pie', 'percentage'],
        isPopular: true,
        component: (
            <div className="w-48 h-48">
                <GlassDonutChart
                    data={[45, 30, 25]}
                    labels={['BTC', 'ETH', 'SOL']}
                    colors={['#f7931a', '#627eea', '#00ffa3']}
                />
            </div>
        ),
        code: `<GlassDonutChart data={portfolioData} />`,
    },
    {
        id: 'candlestick-chart',
        name: 'Candlestick Chart',
        description: 'OHLC trading chart',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'candlestick', 'trading', 'ohlc'],
        isNew: true,
        component: (
            <div className="w-full h-64">
                <GlassCandlestickChart
                    data={[
                        { timestamp: '2024-01-01', open: 100, high: 110, low: 95, close: 105 },
                        { timestamp: '2024-01-02', open: 105, high: 115, low: 100, close: 112 },
                        { timestamp: '2024-01-03', open: 112, high: 120, low: 108, close: 115 },
                    ]}
                />
            </div>
        ),
        code: `<GlassCandlestickChart data={ohlcData} />`,
    },
    {
        id: 'radar-chart',
        name: 'Radar Chart',
        description: 'Multi-axis comparison chart',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'radar', 'spider', 'comparison'],
        component: (
            <div className="w-64 h-64">
                <GlassRadarChart
                    data={[{ category: 'Player 1', Speed: 80, Power: 65, Range: 90, Efficiency: 75, Cost: 50 }]}
                    keys={['Speed', 'Power', 'Range', 'Efficiency', 'Cost']}
                    indexBy="category"
                />
            </div>
        ),
        code: `<GlassRadarChart data={comparisonData} />`,
    },
    {
        id: 'scatter-chart',
        name: 'Scatter Chart',
        description: 'Point distribution visualization',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'scatter', 'points', 'distribution'],
        component: (
            <div className="w-full h-48">
                <GlassScatterChart
                    data={[
                        { x: 10, y: 20 }, { x: 25, y: 45 }, { x: 40, y: 30 },
                        { x: 55, y: 60 }, { x: 70, y: 45 }, { x: 85, y: 75 },
                    ]}
                />
            </div>
        ),
        code: `<GlassScatterChart data={points} />`,
    },
    {
        id: 'stacked-bar-chart',
        name: 'Stacked Bar Chart',
        description: 'Grouped comparison bars',
        category: 'data',
        subcategory: 'Charts',
        tags: ['chart', 'bar', 'stacked', 'comparison'],
        component: (
            <div className="w-full h-48">
                <GlassStackedBarChart
                    data={[
                        { quarter: 'Q1', sales: 30, marketing: 20, support: 15 },
                        { quarter: 'Q2', sales: 35, marketing: 25, support: 20 },
                        { quarter: 'Q3', sales: 40, marketing: 30, support: 25 },
                    ]}
                    keys={['sales', 'marketing', 'support']}
                    indexBy="quarter"
                />
            </div>
        ),
        code: `<GlassStackedBarChart data={quarterlyData} />`,
    },
    {
        id: 'gauge',
        name: 'Gauge',
        description: 'Circular progress indicator',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['gauge', 'meter', 'progress', 'percentage'],
        component: (
            <GlassGauge value={72} max={100} />
        ),
        code: `<GlassGauge value={72} max={100} label="Performance" />`,
    },
    {
        id: 'heatmap',
        name: 'Heatmap',
        description: 'Color-coded data grid',
        category: 'data',
        subcategory: 'Charts',
        tags: ['heatmap', 'grid', 'intensity', 'visualization'],
        isNew: true,
        component: (
            <div className="w-full">
                <GlassHeatmap
                    data={[
                        { x: 'Mon', y: '9AM', value: 80 },
                        { x: 'Tue', y: '9AM', value: 60 },
                        { x: 'Wed', y: '9AM', value: 90 },
                    ]}
                    xLabels={['Mon', 'Tue', 'Wed']}
                    yLabels={['9AM']}
                />
            </div>
        ),
        code: `<GlassHeatmap data={activityData} xLabels={days} />`,
    },
    {
        id: 'treemap',
        name: 'Treemap',
        description: 'Hierarchical data visualization',
        category: 'data',
        subcategory: 'Charts',
        tags: ['treemap', 'hierarchy', 'proportional'],
        component: (
            <div className="w-full h-48">
                <GlassTreemap
                    data={{
                        name: 'Root',
                        value: 190,
                        children: [
                            { name: 'Large', value: 100 },
                            { name: 'Medium', value: 60 },
                            { name: 'Small', value: 30 },
                        ]
                    }}
                />
            </div>
        ),
        code: `<GlassTreemap data={hierarchyData} />`,
    },
    {
        id: 'funnel-chart',
        name: 'Funnel Chart',
        description: 'Conversion funnel visualization',
        category: 'data',
        subcategory: 'Charts',
        tags: ['funnel', 'conversion', 'stages'],
        component: (
            <div className="w-64">
                <GlassFunnelChart
                    data={[
                        { label: 'Visits', value: 10000 },
                        { label: 'Signups', value: 5000 },
                        { label: 'Trials', value: 2000 },
                        { label: 'Paid', value: 500 },
                    ]}
                />
            </div>
        ),
        code: `<GlassFunnelChart data={conversionData} />`,
    },
    {
        id: 'polar-area-chart',
        name: 'Polar Area Chart',
        description: 'Radial area comparison',
        category: 'data',
        subcategory: 'Charts',
        tags: ['polar', 'area', 'radial', 'chart'],
        component: (
            <div className="w-48 h-48">
                <GlassPolarAreaChart
                    data={[80, 60, 45, 70]}
                    labels={['Sales', 'Marketing', 'Support', 'R&D']}
                />
            </div>
        ),
        code: `<GlassPolarAreaChart data={departmentData} />`,
    },
    {
        id: 'sankey',
        name: 'Sankey Diagram',
        description: 'Flow visualization',
        category: 'data',
        subcategory: 'Charts',
        tags: ['sankey', 'flow', 'diagram', 'connections'],
        isNew: true,
        component: (
            <div className="w-full h-48">
                <GlassSankey
                    nodes={[
                        { id: 'a', label: 'Source A' },
                        { id: 'b', label: 'Source B' },
                        { id: 'c', label: 'Target' },
                    ]}
                    links={[
                        { source: 'a', target: 'c', value: 50 },
                        { source: 'b', target: 'c', value: 30 },
                    ]}
                />
            </div>
        ),
        code: `<GlassSankey nodes={nodes} links={links} />`,
    },
    // ========================================
    // ADDITIONAL DATA DISPLAY - Cards & Lists
    // ========================================
    {
        id: 'card',
        name: 'Card',
        description: 'Content container card',
        category: 'data',
        subcategory: 'Cards',
        tags: ['card', 'container', 'content'],
        component: (
            <GlassCard className="w-64 p-4">
                <h3 className="font-semibold text-white">Card Title</h3>
                <p className="text-sm text-white/60 mt-2">Card content goes here with some descriptive text.</p>
            </GlassCard>
        ),
        code: `<GlassCard>
    <h3>Title</h3>
    <p>Content</p>
</GlassCard>`,
    },
    {
        id: 'kpi-card',
        name: 'KPI Card',
        description: 'Key performance indicator display',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['kpi', 'metric', 'performance', 'card'],
        isPopular: true,
        component: (
            <GlassKPICard
                label="Monthly Revenue"
                value="$128,430"
                change="+12.5%"
                trend="up"
            />
        ),
        code: `<GlassKPICard
    title="Revenue"
    value="$128,430"
    change={12.5}
    trend="up"
/>`,
    },
    {
        id: 'media-card',
        name: 'Media Card',
        description: 'Card with media content',
        category: 'data',
        subcategory: 'Cards',
        tags: ['media', 'card', 'image', 'content'],
        component: (
            <GlassMediaCard
                image="https://picsum.photos/300/200"
                title="Featured Article"
                description="A brief description of the article content."
            />
        ),
        code: `<GlassMediaCard
    image={imageUrl}
    title="Title"
    description="Description"
/>`,
    },
    {
        id: 'media-list',
        name: 'Media List',
        description: 'List with media thumbnails',
        category: 'data',
        subcategory: 'Lists',
        tags: ['media', 'list', 'thumbnails'],
        component: (
            <div className="w-80">
                <GlassMediaList
                    items={[
                        { title: 'Item 1', description: 'Description', image: 'https://picsum.photos/50' },
                        { title: 'Item 2', description: 'Description', image: 'https://picsum.photos/51' },
                        { title: 'Item 3', description: 'Description', image: 'https://picsum.photos/52' },
                    ]}
                />
            </div>
        ),
        code: `<GlassMediaList items={mediaItems} />`,
    },
    {
        id: 'stats-bar',
        name: 'Stats Bar',
        description: 'Horizontal statistics display',
        category: 'data',
        subcategory: 'Metrics',
        tags: ['stats', 'bar', 'metrics', 'horizontal'],
        component: (
            <GlassStatsBar
                stats={[
                    { label: 'Users', value: '12.4K' },
                    { label: 'Revenue', value: '$84K' },
                    { label: 'Growth', value: '+23%' },
                ]}
            />
        ),
        code: `<GlassStatsBar stats={statsData} />`,
    },
    {
        id: 'timeline',
        name: 'Timeline',
        description: 'Chronological event display',
        category: 'data',
        subcategory: 'Lists',
        tags: ['timeline', 'events', 'history', 'chronological'],
        isPopular: true,
        component: (
            <GlassTimeline
                items={[
                    { id: '1', title: 'Order Placed', date: '10:30 AM', description: 'Order confirmed' },
                    { id: '2', title: 'Processing', date: '11:00 AM', description: 'Being prepared' },
                    { id: '3', title: 'Shipped', date: '2:00 PM', description: 'In transit' },
                    { id: '4', title: 'Delivered', date: 'Pending', description: 'Awaiting delivery' },
                ]}
            />
        ),
        code: `<GlassTimeline items={events} />`,
    },
    {
        id: 'data-table',
        name: 'Data Table',
        description: 'Advanced data table with features',
        category: 'data',
        subcategory: 'Tables',
        tags: ['table', 'data', 'grid', 'sorting'],
        isPopular: true,
        component: (
            <div className="w-full">
                <GlassDataTable
                    keyField="name"
                    columns={[
                        { header: 'Name', accessor: 'name' },
                        { header: 'Status', accessor: 'status' },
                        { header: 'Amount', accessor: 'amount' },
                    ]}
                    data={[
                        { name: 'John Doe', status: 'Active', amount: '$1,234' },
                        { name: 'Jane Smith', status: 'Pending', amount: '$2,345' },
                    ]}
                />
            </div>
        ),
        code: `<GlassDataTable columns={columns} data={data} />`,
    },
    {
        id: 'compare',
        name: 'Compare',
        description: 'Side-by-side comparison',
        category: 'data',
        subcategory: 'Display',
        tags: ['compare', 'diff', 'side-by-side'],
        component: (
            <GlassCompare
                beforeDetails={<div className="p-4 text-white/80">Original content</div>}
                afterDetails={<div className="p-4 text-white/80">Modified content</div>}
            />
        ),
        code: `<GlassCompare before={original} after={modified} />`,
    },
    {
        id: 'code',
        name: 'Code Block',
        description: 'Syntax highlighted code display',
        category: 'data',
        subcategory: 'Display',
        tags: ['code', 'syntax', 'highlight', 'snippet'],
        isPopular: true,
        component: (
            <GlassCode language="typescript" code={`const greeting = (name: string) => {
    return \`Hello, \${name}!\`;
};`} />
        ),
        code: `<GlassCode language="typescript">
    {codeString}
</GlassCode>`,
    },
    {
        id: 'calculator',
        name: 'Calculator',
        description: 'Interactive calculator widget',
        category: 'complex',
        subcategory: 'Tools',
        tags: ['calculator', 'math', 'widget'],
        component: (
            <GlassCalculator />
        ),
        code: `<GlassCalculator onResult={handleResult} />`,
    },
    {
        id: 'weather',
        name: 'Weather Widget',
        description: 'Weather information display',
        category: 'data',
        subcategory: 'Widgets',
        tags: ['weather', 'widget', 'forecast'],
        component: (
            <GlassWeather
                location="San Francisco"
                temperature={72}
                humidity={45}
            />
        ),
        code: `<GlassWeather location="City" temperature={72} condition="sunny" />`,
    },
    {
        id: 'infinite-scroll',
        name: 'Infinite Scroll',
        description: 'Lazy loading list',
        category: 'data',
        subcategory: 'Lists',
        tags: ['infinite', 'scroll', 'lazy', 'loading'],
        component: (
            <div className="h-48 w-64 overflow-auto">
                <GlassInfiniteScroll
                    onLoadMore={async () => {}}
                    hasMore={false}
                >
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="p-2 text-white/80">Item {i + 1}</div>
                    ))}
                </GlassInfiniteScroll>
            </div>
        ),
        code: `<GlassInfiniteScroll
    items={items}
    renderItem={(item) => <div>{item}</div>}
    loadMore={loadMoreItems}
/>`,
    },
    {
        id: 'parallax',
        name: 'Parallax',
        description: 'Parallax scrolling effect',
        category: 'media',
        subcategory: 'Effects',
        tags: ['parallax', 'scroll', 'effect', 'visual'],
        component: (
            <div className="w-full h-32 overflow-hidden rounded-xl">
                <GlassParallax
                    text="Parallax Effect"
                    height={120}
                />
            </div>
        ),
        code: `<GlassParallax speed={0.5}>
    <div>Content</div>
</GlassParallax>`,
    },
    // ========================================
    // ADDITIONAL LAYOUT COMPONENTS
    // ========================================
    {
        id: 'accordion',
        name: 'Accordion',
        description: 'Collapsible content sections',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['accordion', 'collapse', 'expand', 'faq'],
        isPopular: true,
        component: (
            <div className="w-80">
                <GlassAccordion type="single" defaultValue="item-1">
                    <div data-value="item-1" className="border-b border-white/10">
                        <div className="py-2 px-3 text-white cursor-pointer">Section 1</div>
                        <div className="px-3 pb-2 text-white/60">Content for section 1</div>
                    </div>
                    <div data-value="item-2" className="border-b border-white/10">
                        <div className="py-2 px-3 text-white cursor-pointer">Section 2</div>
                        <div className="px-3 pb-2 text-white/60">Content for section 2</div>
                    </div>
                </GlassAccordion>
            </div>
        ),
        code: `<GlassAccordion items={sections} />`,
    },
    {
        id: 'tabs',
        name: 'Tabs',
        description: 'Tabbed content navigation',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['tabs', 'navigation', 'panels'],
        isPopular: true,
        component: (
            <GlassTabs defaultValue="tab1" className="w-80">
                <GlassTabsList>
                    <GlassTabsTrigger value="tab1">Overview</GlassTabsTrigger>
                    <GlassTabsTrigger value="tab2">Details</GlassTabsTrigger>
                    <GlassTabsTrigger value="tab3">Settings</GlassTabsTrigger>
                </GlassTabsList>
                <GlassTabsContent value="tab1">Overview content</GlassTabsContent>
                <GlassTabsContent value="tab2">Details content</GlassTabsContent>
                <GlassTabsContent value="tab3">Settings content</GlassTabsContent>
            </GlassTabs>
        ),
        code: `<GlassTabs defaultValue="tab1">
    <GlassTabsList>
        <GlassTabsTrigger value="tab1">Tab 1</GlassTabsTrigger>
    </GlassTabsList>
    <GlassTabsContent value="tab1">Content</GlassTabsContent>
</GlassTabs>`,
    },
    {
        id: 'collapsible',
        name: 'Collapsible',
        description: 'Toggle visibility of content',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['collapsible', 'toggle', 'expand'],
        component: (
            <GlassCollapsible trigger={<div className="p-2 text-white cursor-pointer">Click to expand</div>}>
                <p className="text-white/70 p-2">This content can be collapsed</p>
            </GlassCollapsible>
        ),
        code: `<GlassCollapsible title="Title">
    <p>Collapsible content</p>
</GlassCollapsible>`,
    },
    {
        id: 'scroll-area',
        name: 'Scroll Area',
        description: 'Custom scrollable container',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['scroll', 'overflow', 'container'],
        component: (
            <GlassScrollArea className="h-32 w-64">
                {Array.from({ length: 10 }, (_, i) => (
                    <p key={i} className="p-2 text-white/70">Scrollable item {i + 1}</p>
                ))}
            </GlassScrollArea>
        ),
        code: `<GlassScrollArea className="h-64">
    {items.map(item => <div>{item}</div>)}
</GlassScrollArea>`,
    },
    {
        id: 'resizable',
        name: 'Resizable',
        description: 'Resizable panel layout',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['resizable', 'panel', 'split'],
        component: (
            <div className="w-80 h-32">
                <GlassResizable>
                    <div className="p-4 text-white/70">Left Panel</div>
                    <div className="p-4 text-white/70">Right Panel</div>
                </GlassResizable>
            </div>
        ),
        code: `<GlassResizable>
    <div>Panel A</div>
    <div>Panel B</div>
</GlassResizable>`,
    },
    {
        id: 'pagination',
        name: 'Pagination',
        description: 'Page navigation controls',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['pagination', 'pages', 'navigation'],
        component: (
            <GlassPagination>
                <GlassPaginationContent>
                    <GlassPaginationItem><GlassPaginationPrevious /></GlassPaginationItem>
                    <GlassPaginationItem><GlassPaginationLink isActive>1</GlassPaginationLink></GlassPaginationItem>
                    <GlassPaginationItem><GlassPaginationLink>2</GlassPaginationLink></GlassPaginationItem>
                    <GlassPaginationItem><GlassPaginationEllipsis /></GlassPaginationItem>
                    <GlassPaginationItem><GlassPaginationNext /></GlassPaginationItem>
                </GlassPaginationContent>
            </GlassPagination>
        ),
        code: `<GlassPagination>
    <GlassPaginationContent>
        <GlassPaginationItem><GlassPaginationPrevious /></GlassPaginationItem>
        <GlassPaginationItem><GlassPaginationLink isActive>1</GlassPaginationLink></GlassPaginationItem>
        <GlassPaginationItem><GlassPaginationLink>2</GlassPaginationLink></GlassPaginationItem>
        <GlassPaginationItem><GlassPaginationNext /></GlassPaginationItem>
    </GlassPaginationContent>
</GlassPagination>`,
    },
    {
        id: 'navigation-menu',
        name: 'Navigation Menu',
        description: 'Dropdown navigation menu',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['navigation', 'menu', 'dropdown'],
        component: (
            <GlassNavigationMenu
                items={[
                    { label: 'Home', href: '#' },
                    { label: 'Products', href: '#', children: [
                        { title: 'Product 1', href: '#', description: 'First product' },
                        { title: 'Product 2', href: '#', description: 'Second product' },
                    ]},
                    { label: 'About', href: '#' },
                ]}
            />
        ),
        code: `<GlassNavigationMenu items={menuItems} />`,
    },
    {
        id: 'toggle-group',
        name: 'Toggle Group',
        description: 'Exclusive selection buttons',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['toggle', 'group', 'selection'],
        component: (
            <GlassToggleGroup type="single" value="center">
                <GlassToggleGroupItem value="left">Left</GlassToggleGroupItem>
                <GlassToggleGroupItem value="center">Center</GlassToggleGroupItem>
                <GlassToggleGroupItem value="right">Right</GlassToggleGroupItem>
            </GlassToggleGroup>
        ),
        code: `<GlassToggleGroup type="single" value={value} onValueChange={setValue}>
    <GlassToggleGroupItem value="a">A</GlassToggleGroupItem>
    <GlassToggleGroupItem value="b">B</GlassToggleGroupItem>
</GlassToggleGroup>`,
    },
    {
        id: 'floating-action',
        name: 'Floating Action Button',
        description: 'Floating action button',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['fab', 'floating', 'action', 'button'],
        component: (
            <div className="relative h-24 w-full">
                <GlassFloatingAction icon={<Plus />} onClick={() => {}} />
            </div>
        ),
        code: `<GlassFloatingAction icon={Plus} onClick={handleClick} />`,
    },
    {
        id: 'masonry',
        name: 'Masonry Grid',
        description: 'Pinterest-style layout',
        category: 'layout',
        subcategory: 'Grids',
        tags: ['masonry', 'grid', 'pinterest', 'layout'],
        component: (
            <div className="w-80">
                <GlassMasonry columns={{ default: 2 }} gap={8}>
                    {[80, 120, 90, 150, 100].map((h, i) => (
                        <div key={i} style={{ height: h }} className="bg-white/10 rounded-lg" />
                    ))}
                </GlassMasonry>
            </div>
        ),
        code: `<GlassMasonry columns={3} gap={16}>
    {items.map(item => <div>{item}</div>)}
</GlassMasonry>`,
    },
    {
        id: 'navbar',
        name: 'Navbar',
        description: 'Top navigation bar',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['navbar', 'header', 'navigation'],
        component: (
            <div className="w-full relative h-16">
                <GlassNavbar position="relative" />
            </div>
        ),
        code: `<GlassNavbar position="fixed" />`,
    },
    {
        id: 'page-header',
        name: 'Page Header',
        description: 'Page title and breadcrumb header',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['header', 'page', 'title', 'breadcrumb'],
        component: (
            <GlassPageHeader
                title="Dashboard"
                subtitle="Welcome back"
                breadcrumbs={[
                    { label: 'Home', href: '#' },
                    { label: 'Dashboard' },
                ]}
            />
        ),
        code: `<GlassPageHeader title="Page Title" breadcrumbs={crumbs} />`,
    },
    {
        id: 'sidebar',
        name: 'Sidebar',
        description: 'Collapsible sidebar navigation',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['sidebar', 'navigation', 'menu'],
        component: (
            <div className="h-64 w-64">
                <GlassSidebar width="w-full">
                    <nav className="flex flex-col gap-2 p-2">
                        <a href="#" className="flex items-center gap-2 px-3 py-2 text-white/70 hover:bg-white/5 rounded-lg">
                            <Settings size={16} /> Dashboard
                        </a>
                        <a href="#" className="flex items-center gap-2 px-3 py-2 text-white/70 hover:bg-white/5 rounded-lg">
                            <User size={16} /> Profile
                        </a>
                        <a href="#" className="flex items-center gap-2 px-3 py-2 text-white/70 hover:bg-white/5 rounded-lg">
                            <Mail size={16} /> Messages
                        </a>
                    </nav>
                </GlassSidebar>
            </div>
        ),
        code: `<GlassSidebar width="w-64">
    <nav>{menuItems}</nav>
</GlassSidebar>`,
    },
    {
        id: 'drag-drop',
        name: 'Drag & Drop',
        description: 'Draggable item container',
        category: 'layout',
        subcategory: 'Interactive',
        tags: ['drag', 'drop', 'sortable', 'reorder'],
        isNew: true,
        component: (
            <GlassSortableList
                items={[{ id: '1', content: 'Item 1' }, { id: '2', content: 'Item 2' }, { id: '3', content: 'Item 3' }]}
                keyField="id"
                onReorder={() => {}}
                renderItem={(item) => (
                    <GlassSortableItem id={item.id}>
                        <div className="p-2 text-white/80 bg-white/5 rounded-lg mb-2 flex items-center gap-2">
                            <GlassDragHandle />
                            {item.content}
                        </div>
                    </GlassSortableItem>
                )}
            />
        ),
        code: `<GlassDragDrop items={items} onReorder={setItems} />`,
    },
    // ========================================
    // FEEDBACK COMPONENTS
    // ========================================
    {
        id: 'alert',
        name: 'Alert',
        description: 'Contextual feedback message',
        category: 'overlays',
        subcategory: 'Feedback',
        tags: ['alert', 'message', 'notification', 'feedback'],
        component: (
            <div className="space-y-2 w-80">
                <GlassAlert variant="default" title="Info">Information message</GlassAlert>
                <GlassAlert variant="success" title="Success">Action completed</GlassAlert>
                <GlassAlert variant="warning" title="Warning">Caution needed</GlassAlert>
                <GlassAlert variant="destructive" title="Error">Something went wrong</GlassAlert>
            </div>
        ),
        code: `<GlassAlert variant="success" title="Success">
    Action completed successfully
</GlassAlert>`,
    },
    {
        id: 'skeleton',
        name: 'Skeleton',
        description: 'Loading placeholder',
        category: 'data',
        subcategory: 'Loading',
        tags: ['skeleton', 'loading', 'placeholder'],
        component: (
            <div className="space-y-2 w-64">
                <GlassSkeleton className="h-4 w-full" />
                <GlassSkeleton className="h-4 w-3/4" />
                <GlassSkeleton className="h-4 w-1/2" />
            </div>
        ),
        code: `<GlassSkeleton className="h-4 w-full" />`,
    },
    {
        id: 'status',
        name: 'Status Indicator',
        description: 'Status dot with label',
        category: 'data',
        subcategory: 'Display',
        tags: ['status', 'indicator', 'dot', 'state'],
        component: (
            <div className="flex gap-4">
                <GlassStatus status="online" label="Online" />
                <GlassStatus status="offline" label="Offline" />
                <GlassStatus status="busy" label="Busy" />
            </div>
        ),
        code: `<GlassStatus status="online" label="Online" />`,
    },
    {
        id: 'stepper',
        name: 'Stepper',
        description: 'Multi-step progress indicator',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['stepper', 'steps', 'progress', 'wizard'],
        isPopular: true,
        component: (
            <GlassStepper
                currentStep={1}
                steps={[
                    { label: 'Account' },
                    { label: 'Profile' },
                    { label: 'Review' },
                ]}
            />
        ),
        code: `<GlassStepper steps={steps} currentStep={1} />`,
    },
    {
        id: 'sticky',
        name: 'Sticky Header',
        description: 'Content that sticks when scrolling',
        category: 'layout',
        subcategory: 'Navigation',
        tags: ['sticky', 'header', 'scroll', 'fixed'],
        component: (
            <div className="h-32 overflow-auto rounded-lg bg-white/5">
                <div className="space-y-2 p-4">
                    <GlassSticky offsetTop={0} className="py-2 px-4">
                        <div className="text-sm font-semibold text-white/80">Sticky Header</div>
                    </GlassSticky>
                    <p className="text-white/40 text-xs">Scroll down to see the sticky behavior...</p>
                    <p className="text-white/40 text-xs">More content here...</p>
                    <p className="text-white/40 text-xs">And more...</p>
                    <p className="text-white/40 text-xs">Keep scrolling...</p>
                </div>
            </div>
        ),
        code: `<GlassSticky offsetTop={64}>
    <nav>Navigation content</nav>
</GlassSticky>`,
    },
    {
        id: 'toast',
        name: 'Toast',
        description: 'Temporary notification',
        category: 'overlays',
        subcategory: 'Notifications',
        tags: ['toast', 'notification', 'snackbar'],
        component: (
            <div className="text-white/60 text-sm p-4 bg-white/5 rounded-lg">
                <p className="mb-2">Toast notifications use a Provider pattern:</p>
                <code className="text-xs text-blue-400">
                    {`const { toast } = useToast();`}<br />
                    {`toast("Message", "success");`}
                </code>
            </div>
        ),
        code: `// Wrap app in GlassToastProvider
const { toast } = useToast();
toast("Action completed", "success");`,
    },
    {
        id: 'thinking',
        name: 'Thinking Indicator',
        description: 'AI processing animation',
        category: 'agentic',
        subcategory: 'Status',
        tags: ['thinking', 'loading', 'ai', 'processing'],
        component: (
            <GlassThinking stage="analyzing" />
        ),
        code: `<GlassThinking stage="analyzing" />`,
    },
    // ========================================
    // ADDITIONAL OVERLAYS
    // ========================================
    {
        id: 'alert-dialog',
        name: 'Alert Dialog',
        description: 'Confirmation dialog',
        category: 'overlays',
        subcategory: 'Modals',
        tags: ['alert', 'dialog', 'confirm', 'modal'],
        component: (
            <div className="text-white/60 text-sm p-4 bg-white/5 rounded-lg">
                <p className="mb-2">Alert Dialog requires controlled state:</p>
                <code className="text-xs text-blue-400">
                    {`<GlassAlertDialog`}<br />
                    {`    open={open}`}<br />
                    {`    onOpenChange={setOpen}`}<br />
                    {`    title="Confirm"`}<br />
                    {`    description="Are you sure?"`}<br />
                    {`/>`}
                </code>
            </div>
        ),
        code: `<GlassAlertDialog
    open={open}
    onOpenChange={setOpen}
    title="Confirm"
    description="Are you sure?"
    onConfirm={handleConfirm}
/>`,
    },
    {
        id: 'sheet',
        name: 'Sheet',
        description: 'Slide-out panel',
        category: 'overlays',
        subcategory: 'Modals',
        tags: ['sheet', 'panel', 'slide', 'drawer'],
        component: (
            <div className="text-white/60 text-sm p-4 bg-white/5 rounded-lg">
                <p className="mb-2">Sheet requires controlled state:</p>
                <code className="text-xs text-blue-400">
                    {`<GlassSheet`}<br />
                    {`    open={open}`}<br />
                    {`    onOpenChange={setOpen}`}<br />
                    {`    side="right"`}<br />
                    {`>`}<br />
                    {`    <Content />`}<br />
                    {`</GlassSheet>`}
                </code>
            </div>
        ),
        code: `<GlassSheet open={open} onOpenChange={setOpen} side="right">
    <div>Sheet content</div>
</GlassSheet>`,
    },
    {
        id: 'drawer',
        name: 'Drawer',
        description: 'Bottom sheet drawer',
        category: 'overlays',
        subcategory: 'Modals',
        tags: ['drawer', 'bottom', 'sheet', 'mobile'],
        component: (
            <div className="text-white/60 text-sm p-4 bg-white/5 rounded-lg">
                <p className="mb-2">Drawer requires controlled state:</p>
                <code className="text-xs text-blue-400">
                    {`<GlassDrawer`}<br />
                    {`    open={open}`}<br />
                    {`    onOpenChange={setOpen}`}<br />
                    {`>`}<br />
                    {`    <Content />`}<br />
                    {`</GlassDrawer>`}
                </code>
            </div>
        ),
        code: `<GlassDrawer open={open} onOpenChange={setOpen}>
    <div>Drawer content</div>
</GlassDrawer>`,
    },
    {
        id: 'popover',
        name: 'Popover',
        description: 'Floating content panel',
        category: 'overlays',
        subcategory: 'Popovers',
        tags: ['popover', 'floating', 'panel'],
        component: (
            <GlassPopover
                trigger={<GlassButton>Open Popover</GlassButton>}
            >
                <div className="p-2 text-white/70">Popover content</div>
            </GlassPopover>
        ),
        code: `<GlassPopover trigger={<Button>Open</Button>}>
    <div>Content</div>
</GlassPopover>`,
    },
    {
        id: 'hover-card',
        name: 'Hover Card',
        description: 'Content on hover',
        category: 'overlays',
        subcategory: 'Popovers',
        tags: ['hover', 'card', 'preview', 'tooltip'],
        component: (
            <GlassHoverCard
                trigger={<span className="text-blue-400 cursor-pointer">@username</span>}
            >
                <div className="flex items-center gap-3">
                    <GlassAvatar src="https://i.pravatar.cc/40" />
                    <div>
                        <p className="font-medium text-white">User Name</p>
                        <p className="text-sm text-white/60">@username</p>
                    </div>
                </div>
            </GlassHoverCard>
        ),
        code: `<GlassHoverCard trigger={<span>@user</span>}>
    <UserPreview />
</GlassHoverCard>`,
    },
    {
        id: 'context-menu',
        name: 'Context Menu',
        description: 'Right-click menu',
        category: 'overlays',
        subcategory: 'Menus',
        tags: ['context', 'menu', 'right-click'],
        component: (
            <GlassContextMenu
                trigger={
                    <div className="p-4 bg-white/5 rounded-lg text-white/60">
                        Right-click me
                    </div>
                }
                content={
                    <div className="py-1">
                        <button className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">Cut ⌘X</button>
                        <button className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">Copy ⌘C</button>
                        <button className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">Paste ⌘V</button>
                    </div>
                }
            />
        ),
        code: `<GlassContextMenu trigger={<div>Target</div>} content={<MenuItems />} />`,
    },
    {
        id: 'command',
        name: 'Command Menu',
        description: 'Command input with suggestions',
        category: 'overlays',
        subcategory: 'Menus',
        tags: ['command', 'palette', 'search', 'keyboard'],
        isPopular: true,
        component: (
            <div className="w-80">
                <GlassCommand />
            </div>
        ),
        code: `<GlassCommand
    placeholder="Type a command..."
    groups={commandGroups}
/>`,
    },
    {
        id: 'command-palette',
        name: 'Command Palette',
        description: 'Full command palette (⌘K)',
        category: 'overlays',
        subcategory: 'Menus',
        tags: ['command', 'palette', 'keyboard', 'spotlight'],
        isNew: true,
        component: (
            <GlassButton onClick={() => {}}>
                Open Command Palette (⌘K)
            </GlassButton>
        ),
        code: `<GlassCommandPalette
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    commands={commands}
/>`,
    },
    {
        id: 'tour',
        name: 'Tour',
        description: 'Guided product tour',
        category: 'overlays',
        subcategory: 'Guides',
        tags: ['tour', 'guide', 'onboarding', 'walkthrough'],
        component: (
            <GlassButton onClick={() => {}}>Start Tour</GlassButton>
        ),
        code: `<GlassTour
    steps={tourSteps}
    isActive={showTour}
    onComplete={() => setShowTour(false)}
/>`,
    },
    // ========================================
    // MEDIA COMPONENTS
    // ========================================
    {
        id: 'mini-player',
        name: 'Mini Player',
        description: 'Compact media player',
        category: 'media',
        subcategory: 'Audio',
        tags: ['player', 'mini', 'audio', 'music'],
        component: (
            <GlassMiniPlayer
                title="Current Track"
                artist="Artist Name"
                albumArt="https://picsum.photos/48"
                isPlaying={false}
            />
        ),
        code: `<GlassMiniPlayer
    title="Song Title"
    artist="Artist"
    isPlaying={playing}
    onPlayPause={togglePlay}
/>`,
    },
    {
        id: 'visualizer',
        name: 'Audio Visualizer',
        description: 'Audio frequency visualization',
        category: 'media',
        subcategory: 'Audio',
        tags: ['visualizer', 'audio', 'frequency', 'waveform'],
        isNew: true,
        component: (
            <div className="w-64 h-24">
                <GlassVisualizer />
            </div>
        ),
        code: `<GlassVisualizer audioRef={audioRef} />`,
    },
    {
        id: 'drawing-canvas',
        name: 'Drawing Canvas',
        description: 'Freehand drawing tool',
        category: 'media',
        subcategory: 'Creative',
        tags: ['canvas', 'draw', 'sketch', 'paint'],
        isNew: true,
        component: (
            <div className="w-64 h-48">
                <GlassDrawingCanvas />
            </div>
        ),
        code: `<GlassDrawingCanvas
    onSave={handleSave}
    brushColor="#ffffff"
/>`,
    },
    {
        id: 'image-editor',
        name: 'Image Editor',
        description: 'Basic image editing tools',
        category: 'media',
        subcategory: 'Creative',
        tags: ['image', 'editor', 'crop', 'filter'],
        isNew: true,
        component: (
            <GlassButton>Open Image Editor</GlassButton>
        ),
        code: `<GlassImageEditor
    src={imageUrl}
    onSave={handleSave}
/>`,
    },
    {
        id: 'scanner',
        name: 'QR Scanner',
        description: 'QR/Barcode scanner',
        category: 'media',
        subcategory: 'Utilities',
        tags: ['scanner', 'qr', 'barcode', 'camera'],
        component: (
            <GlassButton>Open Scanner</GlassButton>
        ),
        code: `<GlassScanner onScan={handleScan} />`,
    },
    // ========================================
    // FEATURES / COMPLEX COMPONENTS
    // ========================================
    {
        id: 'kanban',
        name: 'Kanban Board',
        description: 'Drag-and-drop task board',
        category: 'extensions',
        subcategory: 'Productivity',
        tags: ['kanban', 'board', 'tasks', 'drag-drop'],
        isPopular: true,
        component: (
            <div className="w-full h-64">
                <GlassKanban />
            </div>
        ),
        code: `<GlassKanban columns={columns} onMove={handleMove} />`,
    },
    {
        id: 'file-tree',
        name: 'File Tree',
        description: 'Hierarchical file explorer',
        category: 'extensions',
        subcategory: 'Files',
        tags: ['file', 'tree', 'explorer', 'folder'],
        component: (
            <div className="w-64">
                <GlassFileTree
                    data={[
                        { id: '1', name: 'src', type: 'folder', children: [
                            { id: '2', name: 'index.ts', type: 'file' },
                            { id: '3', name: 'App.tsx', type: 'file' },
                        ]},
                        { id: '4', name: 'package.json', type: 'file' },
                    ]}
                />
            </div>
        ),
        code: `<GlassFileTree data={fileStructure} />`,
    },
    {
        id: 'file-preview',
        name: 'File Preview',
        description: 'Quick Look-style file content preview modal',
        category: 'extensions',
        subcategory: 'Files',
        tags: ['file', 'preview', 'viewer', 'quicklook'],
        component: (
            <div className="relative w-80 h-48 overflow-hidden rounded-xl">
                <GlassFilePreview
                    file={{ id: '1', name: 'example.tsx', type: 'file' }}
                    onClose={() => {}}
                    content={`import React from 'react';

export const Example = () => {
    return <div>Hello World</div>;
};`}
                />
            </div>
        ),
        code: `<GlassFilePreview
    file={selectedFile}
    onClose={() => setFile(null)}
    content={fileContent}
/>`,
    },
    {
        id: 'editor',
        name: 'Rich Text Editor',
        description: 'WYSIWYG text editor',
        category: 'extensions',
        subcategory: 'Editors',
        tags: ['editor', 'wysiwyg', 'rich-text', 'markdown'],
        isPopular: true,
        component: (
            <div className="w-full h-48">
                <GlassEditor placeholder="Start writing..." />
            </div>
        ),
        code: `<GlassEditor
    value={content}
    onChange={setContent}
    placeholder="Start writing..."
/>`,
    },
    {
        id: 'chat',
        name: 'Chat Interface',
        description: 'Real-time chat UI',
        category: 'complex',
        subcategory: 'Chat',
        tags: ['chat', 'messages', 'conversation'],
        isPopular: true,
        component: (
            <div className="w-80 h-64 overflow-hidden rounded-lg">
                <GlassChatContainer>
                    <div className="flex-1 overflow-y-auto p-4">
                        <GlassChatMessage role="user">Hello!</GlassChatMessage>
                        <GlassChatMessage role="assistant">Hi there! How can I help?</GlassChatMessage>
                    </div>
                    <GlassChatInput onSend={() => {}} />
                </GlassChatContainer>
            </div>
        ),
        code: `<GlassChatContainer>
    <GlassChatMessage role="user">Hello</GlassChatMessage>
    <GlassChatInput onSend={handleSend} />
</GlassChatContainer>`,
    },
    {
        id: 'chat-window',
        name: 'Chat Window',
        description: 'Full-featured chat interface with messages',
        category: 'complex',
        subcategory: 'Chat',
        tags: ['chat', 'window', 'conversation', 'ai'],
        isNew: true,
        component: (
            <div className="w-80 h-72 overflow-hidden rounded-2xl">
                <GlassChatWindow
                    title="AI Assistant"
                    messages={[
                        { id: '1', role: 'assistant', content: 'Hello! How can I help you today?' },
                        { id: '2', role: 'user', content: 'Can you explain glassmorphism?' },
                        { id: '3', role: 'assistant', content: 'Glassmorphism is a design trend featuring frosted glass effects with blur, transparency, and subtle borders.' },
                    ]}
                    onSend={() => {}}
                />
            </div>
        ),
        code: `<GlassChatWindow
    title="AI Assistant"
    messages={messages}
    onSend={handleSend}
    isLoading={isLoading}
/>`,
    },
    {
        id: 'voice',
        name: 'Voice Input',
        description: 'Speech-to-text input',
        category: 'agentic',
        subcategory: 'Input',
        tags: ['voice', 'speech', 'microphone', 'audio'],
        component: (
            <GlassVoice />
        ),
        code: `<GlassVoice />`,
    },
    {
        id: 'payment',
        name: 'Payment Form',
        description: 'Credit card payment form',
        category: 'forms',
        subcategory: 'Extended',
        tags: ['payment', 'credit-card', 'checkout'],
        component: (
            <div className="w-80">
                <GlassPayment />
            </div>
        ),
        code: `<GlassPayment onSubmit={handlePayment} />`,
    },
    // ========================================
    // GENERATIVE / SMART COMPONENTS
    // ========================================
    {
        id: 'smart-card',
        name: 'Smart Card',
        description: 'AI-generated content card (requires LiquidProvider)',
        category: 'agentic',
        subcategory: 'Generative',
        tags: ['smart', 'ai', 'generative', 'card'],
        isBeta: true,
        component: (
            <GlassContainer className="p-4 w-64" border>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-medium text-white/80">AI-Generated</span>
                </div>
                <p className="text-white/60 text-sm">Smart Card content would be generated by AI based on your prompt...</p>
            </GlassContainer>
        ),
        code: `<GlassSmartCard prompt="Generate a card for..." />`,
    },
    {
        id: 'smart-list',
        name: 'Smart List',
        description: 'AI-generated list items (requires LiquidProvider)',
        category: 'agentic',
        subcategory: 'Generative',
        tags: ['smart', 'ai', 'list', 'generative'],
        isBeta: true,
        component: (
            <GlassContainer className="p-4 w-64" border>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-medium text-white/80">AI-Generated List</span>
                </div>
                <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2"><Check size={12} /> Item generated by AI</li>
                    <li className="flex items-center gap-2"><Check size={12} /> Dynamic content</li>
                    <li className="flex items-center gap-2"><Check size={12} /> Based on prompt</li>
                </ul>
            </GlassContainer>
        ),
        code: `<GlassSmartList prompt="List items for..." />`,
    },
    {
        id: 'smart-badge',
        name: 'Smart Badge',
        description: 'AI-categorized badge (requires LiquidProvider)',
        category: 'agentic',
        subcategory: 'Generative',
        tags: ['smart', 'ai', 'badge', 'tag'],
        isBeta: true,
        component: (
            <div className="flex flex-wrap gap-2">
                <GlassBadge variant="outline" className="text-purple-400 border-purple-400/30">
                    <Sparkles size={12} className="mr-1" /> AI Category
                </GlassBadge>
                <GlassBadge variant="outline" className="text-blue-400 border-blue-400/30">
                    Auto-tagged
                </GlassBadge>
            </div>
        ),
        code: `<GlassSmartBadge content="Text to analyze..." />`,
    },
    {
        id: 'smart-chart',
        name: 'Smart Chart',
        description: 'AI-recommended visualization (requires LiquidProvider)',
        category: 'agentic',
        subcategory: 'Generative',
        tags: ['smart', 'ai', 'chart', 'visualization'],
        isBeta: true,
        component: (
            <GlassContainer className="p-4 w-64 h-48" border>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-medium text-white/80">AI-Recommended Chart</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <GlassChart data={[20, 35, 28, 45, 38, 52]} type="line" height={80} />
                </div>
                <p className="text-xs text-white/40 text-center mt-2">Chart type auto-selected by AI</p>
            </GlassContainer>
        ),
        code: `<GlassSmartChart data={rawData} />`,
    },
    // ========================================
    // TRADING COMPONENTS
    // ========================================
    {
        id: 'market-ticker',
        name: 'Market Ticker',
        description: 'Live market price ticker',
        category: 'data',
        subcategory: 'Trading',
        tags: ['ticker', 'market', 'price', 'trading'],
        component: (
            <GlassMarketTicker
                items={[
                    { symbol: 'BTC', price: 42150.00, change: 2.5 },
                    { symbol: 'ETH', price: 2280.00, change: -1.2 },
                    { symbol: 'SOL', price: 98.50, change: 5.8 },
                ]}
            />
        ),
        code: `<GlassMarketTicker items={marketData} />`,
    },
    {
        id: 'order-entry',
        name: 'Order Entry',
        description: 'Trading order form',
        category: 'forms',
        subcategory: 'Trading',
        tags: ['order', 'trading', 'buy', 'sell'],
        component: (
            <div className="w-64">
                <GlassOrderEntry symbol="BTC/USD" onOrder={() => {}} />
            </div>
        ),
        code: `<GlassOrderEntry symbol="BTC/USD" onSubmit={handleOrder} />`,
    },
    {
        id: 'positions-list',
        name: 'Positions List',
        description: 'Open trading positions',
        category: 'data',
        subcategory: 'Trading',
        tags: ['positions', 'trading', 'portfolio'],
        component: (
            <GlassPositionsList
                positions={[
                    { id: '1', symbol: 'BTC', side: 'long', size: 0.5, entryPrice: 40000, markPrice: 42150, pnl: 1075, pnlPercent: 5.37, leverage: 2, margin: 10750 },
                    { id: '2', symbol: 'ETH', side: 'long', size: 2.0, entryPrice: 2300, markPrice: 2280, pnl: -40, pnlPercent: -1.74, leverage: 1, margin: 4600 },
                ]}
            />
        ),
        code: `<GlassPositionsList positions={positions} />`,
    },
    // ========================================
    // COMPOUND COMPONENTS
    // ========================================
    {
        id: 'split-button',
        name: 'Split Button',
        description: 'Button with dropdown actions',
        category: 'compound',
        subcategory: 'Buttons',
        tags: ['split', 'button', 'dropdown', 'actions'],
        isNew: true,
        component: (
            <GlassSplitButton
                label="Save"
                onMainAction={() => {}}
                options={[
                    { label: 'Save as Draft', onClick: () => {} },
                    { label: 'Save & Publish', onClick: () => {} },
                ]}
            />
        ),
        code: `<GlassSplitButton
    label="Save"
    options={saveOptions}
    onClick={handleSave}
/>`,
    },
    {
        id: 'button-dropdown',
        name: 'Button Dropdown',
        description: 'Button that opens a dropdown',
        category: 'compound',
        subcategory: 'Buttons',
        tags: ['button', 'dropdown', 'menu'],
        component: (
            <GlassButtonDropdown
                label="Actions"
                options={[
                    { label: 'Edit', icon: Settings, onClick: () => {} },
                    { label: 'Delete', icon: X, onClick: () => {} },
                ]}
            />
        ),
        code: `<GlassButtonDropdown
    label="Actions"
    items={actionItems}
/>`,
    },
    // ========================================
    // WINDOW / CONTAINER
    // ========================================
    {
        id: 'window',
        name: 'Window',
        description: 'Draggable window container',
        category: 'layout',
        subcategory: 'Containers',
        tags: ['window', 'draggable', 'modal', 'container'],
        component: (
            <div className="relative h-64 w-full overflow-hidden">
                <GlassWindow
                    id="showcase-window"
                    title="Example Window"
                    initialPosition={{ x: 20, y: 20 }}
                    initialSize={{ width: 300, height: 180 }}
                    isActive
                >
                    <div className="p-4 text-white/60 text-sm">
                        Drag the title bar to move this window
                    </div>
                </GlassWindow>
            </div>
        ),
        code: `<GlassWindow
    id="my-window"
    title="Window Title"
    initialPosition={{ x: 100, y: 100 }}
    onClose={handleClose}
>
    <div>Window content</div>
</GlassWindow>`,
    },
];

// ============================================
// Sub-Components
// ============================================

const SearchInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)] focus:border-transparent"
        />
        {value && (
            <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X size={14} />
            </button>
        )}
    </div>
);

const CategoryButton: React.FC<{
    category: Category;
    isActive: boolean;
    onClick: () => void;
    count: number;
}> = ({ category, isActive, onClick, count }) => {
    const Icon = category.icon;
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                isActive
                    ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                    : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
            )}
        >
            <Icon size={18} className={isActive ? "text-[var(--glass-accent)]" : "text-white/40 group-hover:text-white/60"} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.label}</span>
                    {category.badge && (
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            category.badgeVariant === 'new' && "bg-emerald-500/20 text-emerald-400",
                            category.badgeVariant === 'beta' && "bg-amber-500/20 text-amber-400",
                            category.badgeVariant === 'count' && "bg-white/10 text-white/60",
                        )}>
                            {category.badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-white/40 truncate">{category.description}</p>
            </div>
            <span className="text-xs text-white/30">{count}</span>
        </button>
    );
};

const ComponentCard: React.FC<{
    example: ComponentExample;
    onSelect: (example: ComponentExample) => void;
    isSelected: boolean;
}> = ({ example, onSelect, isSelected }) => (
    <motion.button
        layout
        onClick={() => onSelect(example)}
        className={cn(
            "w-full text-left p-4 rounded-xl border transition-all",
            isSelected
                ? "bg-[var(--glass-accent)]/10 border-[var(--glass-accent)]/50"
                : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
    >
        <div className="flex items-start justify-between mb-3">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-white">{example.name}</h4>
                    {example.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">New</span>
                    )}
                    {example.isBeta && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">Beta</span>
                    )}
                    {example.isPopular && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">Popular</span>
                    )}
                </div>
                <p className="text-xs text-white/50 mt-0.5">{example.description}</p>
            </div>
            <ChevronRight size={16} className={cn("text-white/30 transition-transform flex-shrink-0", isSelected && "rotate-90 text-[var(--glass-accent)]")} />
        </div>
        {/* Preview */}
        <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center min-h-[80px] overflow-hidden">
            <div className="scale-90 origin-center">
                {example.component}
            </div>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
            {example.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/40">
                    {tag}
                </span>
            ))}
            {example.tags.length > 4 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/40">
                    +{example.tags.length - 4}
                </span>
            )}
        </div>
    </motion.button>
);

const CodeViewer: React.FC<{ code: string; language?: string }> = ({ code, language = 'tsx' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-xs text-white/40 font-mono">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
                <code className="text-white/80 font-mono whitespace-pre">{code}</code>
            </pre>
        </div>
    );
};

const PropsPlayground: React.FC<{ props: PropDefinition[]; onChange: (name: string, value: unknown) => void; values: Record<string, unknown> }> = ({ props, onChange, values }) => (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Settings2 size={14} />
            Props Playground
        </div>
        <div className="space-y-3">
            {props.map((prop) => (
                <div key={prop.name} className="flex items-center justify-between gap-4">
                    <div>
                        <label className="text-xs font-medium text-white/70">{prop.name}</label>
                        {prop.description && <p className="text-[10px] text-white/40">{prop.description}</p>}
                    </div>
                    {prop.type === 'boolean' && (
                        <GlassSwitch
                            checked={values[prop.name] as boolean ?? prop.default as boolean}
                            onCheckedChange={(v) => onChange(prop.name, v)}
                        />
                    )}
                    {prop.type === 'select' && prop.options && (
                        <select
                            value={values[prop.name] as string ?? prop.default as string}
                            onChange={(e) => onChange(prop.name, e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                        >
                            {prop.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}
                    {prop.type === 'string' && (
                        <input
                            type="text"
                            value={values[prop.name] as string ?? prop.default as string}
                            onChange={(e) => onChange(prop.name, e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white w-32 focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                        />
                    )}
                    {prop.type === 'number' && (
                        <input
                            type="number"
                            value={values[prop.name] as number ?? prop.default as number}
                            onChange={(e) => onChange(prop.name, Number(e.target.value))}
                            className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white w-20 focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                        />
                    )}
                </div>
            ))}
        </div>
    </div>
);

const DetailPanel: React.FC<{ example: ComponentExample | null; onClose: () => void }> = ({ example, onClose }) => {
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [propValues, setPropValues] = useState<Record<string, unknown>>({});

    if (!example) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">{example.name}</h3>
                        {example.isNew && <GlassBadge variant="glass" className="text-[10px]">New</GlassBadge>}
                        {example.isBeta && <GlassBadge variant="outline" className="text-[10px]">Beta</GlassBadge>}
                    </div>
                    <p className="text-sm text-white/50 mt-0.5">{example.description}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10">
                <button
                    onClick={() => setViewMode('preview')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        viewMode === 'preview'
                            ? "bg-[var(--glass-accent)] text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Eye size={14} />
                    Preview
                </button>
                <button
                    onClick={() => setViewMode('code')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        viewMode === 'code'
                            ? "bg-[var(--glass-accent)] text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Code2 size={14} />
                    Code
                </button>
                <div className="flex-1" />
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <ExternalLink size={12} />
                    Open in Docs
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {viewMode === 'preview' ? (
                    <>
                        {/* Live Preview */}
                        <div className="p-8 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 flex items-center justify-center min-h-[200px]">
                            {example.component}
                        </div>

                        {/* Props Playground */}
                        {example.props && example.props.length > 0 && (
                            <PropsPlayground
                                props={example.props}
                                values={propValues}
                                onChange={(name, value) => setPropValues((prev) => ({ ...prev, [name]: value }))}
                            />
                        )}

                        {/* Tags */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {example.tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60 border border-white/10">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <CodeViewer code={example.code} />
                )}
            </div>
        </motion.div>
    );
};

// ============================================
// Main Component
// ============================================

interface GlassShowcasePanelProps {
    onClose?: () => void;
}

export const GlassShowcasePanel: React.FC<GlassShowcasePanelProps> = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedExample, setSelectedExample] = useState<ComponentExample | null>(null);
    const [viewFilter, setViewFilter] = useState<'all' | 'new' | 'popular'>('all');

    // Filter examples
    const filteredExamples = useMemo(() => {
        let examples = COMPONENT_EXAMPLES;

        // Category filter
        if (activeCategory) {
            examples = examples.filter((e) => e.category === activeCategory);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            examples = examples.filter(
                (e) =>
                    e.name.toLowerCase().includes(query) ||
                    e.description.toLowerCase().includes(query) ||
                    e.tags.some((t) => t.toLowerCase().includes(query))
            );
        }

        // View filter
        if (viewFilter === 'new') {
            examples = examples.filter((e) => e.isNew || e.isBeta);
        } else if (viewFilter === 'popular') {
            examples = examples.filter((e) => e.isPopular);
        }

        return examples;
    }, [activeCategory, searchQuery, viewFilter]);

    // Category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        COMPONENT_EXAMPLES.forEach((e) => {
            counts[e.category] = (counts[e.category] || 0) + 1;
        });
        return counts;
    }, []);

    return (
        <div className="flex h-full bg-[#0a0a0a]/50 text-white font-sans">
            {/* Sidebar */}
            <div className="w-72 border-r border-white/10 flex flex-col bg-black/20">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Component Library</h2>
                            <p className="text-xs text-white/40">Liquid Glass Design System</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} />
                </div>

                {/* Quick Filters */}
                <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'All', icon: Grid2X2 },
                            { id: 'new', label: 'New', icon: Sparkles },
                            { id: 'popular', label: 'Popular', icon: TrendingUp },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setViewFilter(filter.id as 'all' | 'new' | 'popular')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    viewFilter === filter.id
                                        ? "bg-[var(--glass-accent)] text-white"
                                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <filter.icon size={12} />
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left",
                            activeCategory === null
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <BookOpen size={16} />
                        <span className="text-sm font-medium">All Components</span>
                        <span className="ml-auto text-xs text-white/30">{COMPONENT_EXAMPLES.length}</span>
                    </button>

                    <div className="pt-2 pb-1">
                        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Categories</p>
                    </div>

                    {CATEGORIES.map((category) => (
                        <CategoryButton
                            key={category.id}
                            category={category}
                            isActive={activeCategory === category.id}
                            onClick={() => setActiveCategory(category.id)}
                            count={categoryCounts[category.id] || 0}
                        />
                    ))}
                </div>

                {/* Footer Stats */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-lg font-bold text-white">{COMPONENT_EXAMPLES.length}</p>
                            <p className="text-[10px] text-white/40">Components</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-400">{COMPONENT_EXAMPLES.filter((e) => e.isNew).length}</p>
                            <p className="text-[10px] text-white/40">New</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{CATEGORIES.length}</p>
                            <p className="text-[10px] text-white/40">Categories</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Component Grid */}
                <div className={cn("flex-1 overflow-y-auto p-6 custom-scrollbar", selectedExample && "w-1/2")}>
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-white">
                                {activeCategory
                                    ? CATEGORIES.find((c) => c.id === activeCategory)?.label
                                    : 'All Components'}
                            </h3>
                            <p className="text-sm text-white/50">
                                {filteredExamples.length} component{filteredExamples.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                                <Filter size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredExamples.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredExamples.map((example) => (
                                    <ComponentCard
                                        key={example.id}
                                        example={example}
                                        onSelect={setSelectedExample}
                                        isSelected={selectedExample?.id === example.id}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Search className="w-12 h-12 text-white/20 mb-4" />
                            <h4 className="text-lg font-medium text-white/60">No components found</h4>
                            <p className="text-sm text-white/40 mt-1">Try adjusting your search or filters</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory(null);
                                    setViewFilter('all');
                                }}
                                className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selectedExample && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '50%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-white/10 bg-black/20 overflow-hidden"
                        >
                            <DetailPanel example={selectedExample} onClose={() => setSelectedExample(null)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GlassShowcasePanel;
