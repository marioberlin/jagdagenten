// Component Registry for Showcase Search
// Maps component names to their sections and metadata

export interface ComponentInfo {
    name: string;
    displayName: string;
    description: string;
    section: 'typography' | 'buttons' | 'forms' | 'data' | 'layout' | 'overlays' | 'media' | 'complex';
    keywords: string[];
    phase?: number;
}

export const componentRegistry: ComponentInfo[] = [
    // Typography & Materials
    { name: 'VibrantText', displayName: 'Vibrant Text', description: 'Gradient animated text with shimmer effects', section: 'typography', keywords: ['text', 'gradient', 'animation', 'title'] },
    { name: 'GlassContainer', displayName: 'Glass Container', description: 'Base container with glass material effects', section: 'typography', keywords: ['container', 'card', 'glass', 'blur', 'material'] },

    // Buttons & Interactive
    { name: 'GlassButton', displayName: 'Glass Button', description: 'Button with multiple variants and loading states', section: 'buttons', keywords: ['button', 'action', 'click', 'submit', 'loading'] },
    { name: 'GlassToggle', displayName: 'Glass Toggle', description: 'Single toggle button with on/off state', section: 'buttons', keywords: ['toggle', 'switch', 'on', 'off', 'pressed'], phase: 2 },
    { name: 'GlassToggleGroup', displayName: 'Toggle Group', description: 'Group of toggle buttons for multi-select', section: 'buttons', keywords: ['toggle', 'group', 'multi', 'select'] },

    // Forms & Inputs
    { name: 'GlassInput', displayName: 'Glass Input', description: 'Text input with icon and error states', section: 'forms', keywords: ['input', 'text', 'field', 'form'] },
    { name: 'GlassTextarea', displayName: 'Glass Textarea', description: 'Multi-line text input', section: 'forms', keywords: ['textarea', 'multiline', 'text', 'form'] },
    { name: 'GlassSelect', displayName: 'Glass Select', description: 'Dropdown select with search', section: 'forms', keywords: ['select', 'dropdown', 'option', 'picker'] },
    { name: 'GlassCombobox', displayName: 'Glass Combobox', description: 'Searchable select with autocomplete', section: 'forms', keywords: ['combobox', 'autocomplete', 'search', 'select'], phase: 2 },
    { name: 'GlassCheckbox', displayName: 'Glass Checkbox', description: 'Checkbox with label support', section: 'forms', keywords: ['checkbox', 'check', 'tick', 'boolean'] },
    { name: 'GlassRadio', displayName: 'Glass Radio', description: 'Radio button for single selections', section: 'forms', keywords: ['radio', 'option', 'single', 'select'] },
    { name: 'GlassRadioGroup', displayName: 'Radio Group', description: 'Controlled radio button group', section: 'forms', keywords: ['radio', 'group', 'options'], phase: 2 },
    { name: 'GlassSwitch', displayName: 'Glass Switch', description: 'Toggle switch for boolean values', section: 'forms', keywords: ['switch', 'toggle', 'boolean', 'on', 'off'] },
    { name: 'GlassSlider', displayName: 'Glass Slider', description: 'Range slider for numeric values', section: 'forms', keywords: ['slider', 'range', 'value', 'numeric'] },
    { name: 'GlassInputOTP', displayName: 'OTP Input', description: 'One-time password input fields', section: 'forms', keywords: ['otp', 'code', 'pin', 'verification'] },
    { name: 'GlassCalendar', displayName: 'Glass Calendar', description: 'Date picker calendar', section: 'forms', keywords: ['calendar', 'date', 'picker', 'schedule'] },
    { name: 'GlassDatePicker', displayName: 'Date Picker', description: 'Date selection with dropdown', section: 'forms', keywords: ['date', 'picker', 'calendar'] },
    { name: 'GlassTimePicker', displayName: 'Time Picker', description: 'Time selection with 12/24h modes', section: 'forms', keywords: ['time', 'picker', 'clock', 'hour', 'minute'], phase: 4 },
    { name: 'GlassNumberInput', displayName: 'Number Input', description: 'Numeric input with increment/decrement', section: 'forms', keywords: ['number', 'input', 'increment', 'stepper'], phase: 4 },
    { name: 'GlassUpload', displayName: 'Glass Upload', description: 'File upload with drag and drop', section: 'forms', keywords: ['upload', 'file', 'drag', 'drop'] },
    { name: 'GlassEditor', displayName: 'Glass Editor', description: 'Rich text markdown editor', section: 'forms', keywords: ['editor', 'markdown', 'rich', 'text', 'wysiwyg'] },
    { name: 'GlassPayment', displayName: 'Payment Form', description: 'Credit card payment form', section: 'forms', keywords: ['payment', 'card', 'credit', 'checkout'] },
    { name: 'GlassCommand', displayName: 'Command Palette', description: 'Command palette with keyboard shortcuts', section: 'forms', keywords: ['command', 'palette', 'keyboard', 'shortcut', 'search'] },
    { name: 'GlassFormGroup', displayName: 'Form Group', description: 'Label + input + error wrapper', section: 'forms', keywords: ['form', 'group', 'label', 'error', 'accessibility'], phase: 1 },
    { name: 'GlassLabel', displayName: 'Glass Label', description: 'Accessible form label', section: 'forms', keywords: ['label', 'form', 'accessibility'], phase: 1 },
    { name: 'GlassChip', displayName: 'Glass Chip', description: 'Closeable tag/chip for multi-select', section: 'forms', keywords: ['chip', 'tag', 'badge', 'removable'], phase: 2 },

    // Data & Charts
    { name: 'GlassTable', displayName: 'Glass Table', description: 'Basic data table', section: 'data', keywords: ['table', 'data', 'grid', 'rows'] },
    { name: 'GlassDataTable', displayName: 'Data Table', description: 'Advanced table with sorting, search, pagination', section: 'data', keywords: ['table', 'data', 'sort', 'filter', 'pagination'], phase: 4 },
    { name: 'GlassChart', displayName: 'Glass Chart', description: 'Line and bar charts', section: 'data', keywords: ['chart', 'graph', 'line', 'bar', 'visualization'] },
    { name: 'GlassDonutChart', displayName: 'Donut Chart', description: 'Donut/pie chart visualization', section: 'data', keywords: ['chart', 'donut', 'pie', 'circular'] },
    { name: 'GlassMetric', displayName: 'Glass Metric', description: 'KPI metric card with trend', section: 'data', keywords: ['metric', 'kpi', 'number', 'trend', 'statistic'] },
    { name: 'GlassProgress', displayName: 'Glass Progress', description: 'Progress bar with label', section: 'data', keywords: ['progress', 'bar', 'loading', 'percentage'] },
    { name: 'GlassAvatar', displayName: 'Glass Avatar', description: 'User avatar with fallback', section: 'data', keywords: ['avatar', 'user', 'profile', 'image'] },
    { name: 'GlassBadge', displayName: 'Glass Badge', description: 'Status badges and labels', section: 'data', keywords: ['badge', 'tag', 'status', 'label'] },
    { name: 'GlassTimeline', displayName: 'Glass Timeline', description: 'Vertical timeline with icons', section: 'data', keywords: ['timeline', 'history', 'events', 'vertical'] },
    { name: 'GlassKanban', displayName: 'Kanban Board', description: 'Drag-and-drop kanban board', section: 'data', keywords: ['kanban', 'board', 'drag', 'drop', 'tasks'] },
    { name: 'GlassStatus', displayName: 'Glass Status', description: 'Online/offline status indicator', section: 'data', keywords: ['status', 'online', 'offline', 'indicator'] },
    { name: 'GlassFileTree', displayName: 'File Tree', description: 'Hierarchical file explorer', section: 'data', keywords: ['file', 'tree', 'folder', 'explorer', 'hierarchy'] },
    { name: 'GlassCode', displayName: 'Glass Code', description: 'Syntax highlighted code block with copy', section: 'data', keywords: ['code', 'syntax', 'highlight', 'copy'] },

    // Layout & Grids
    { name: 'GlassBento', displayName: 'Bento Grid', description: 'Masonry-style bento grid layout', section: 'layout', keywords: ['bento', 'grid', 'masonry', 'layout'] },
    { name: 'GlassMasonry', displayName: 'Masonry Layout', description: 'Pinterest-style masonry grid', section: 'layout', keywords: ['masonry', 'grid', 'pinterest', 'layout'] },
    { name: 'GlassResizable', displayName: 'Resizable Panels', description: 'Resizable split panels', section: 'layout', keywords: ['resizable', 'panel', 'split', 'drag'] },
    { name: 'GlassTabs', displayName: 'Glass Tabs', description: 'Tabbed content navigation', section: 'layout', keywords: ['tabs', 'navigation', 'switch', 'content'] },
    { name: 'GlassAccordion', displayName: 'Glass Accordion', description: 'Collapsible content sections', section: 'layout', keywords: ['accordion', 'collapse', 'expand', 'faq'] },
    { name: 'GlassCollapsible', displayName: 'Collapsible', description: 'Single collapsible section', section: 'layout', keywords: ['collapsible', 'collapse', 'expand'] },
    { name: 'GlassSeparator', displayName: 'Glass Separator', description: 'Horizontal/vertical divider', section: 'layout', keywords: ['separator', 'divider', 'line', 'hr'] },
    { name: 'GlassScrollArea', displayName: 'Scroll Area', description: 'Custom scrollbar container', section: 'layout', keywords: ['scroll', 'scrollbar', 'container', 'overflow'] },
    { name: 'GlassNavbar', displayName: 'Glass Navbar', description: 'Top navigation bar', section: 'layout', keywords: ['navbar', 'navigation', 'header', 'menu'] },
    { name: 'GlassPageHeader', displayName: 'Page Header', description: 'Page header with back navigation', section: 'layout', keywords: ['header', 'page', 'back', 'title'], phase: 3 },
    { name: 'GlassSidebar', displayName: 'Glass Sidebar', description: 'Side navigation with icons', section: 'layout', keywords: ['sidebar', 'navigation', 'menu', 'side'], phase: 3 },
    { name: 'GlassBreadcrumb', displayName: 'Breadcrumb', description: 'Navigation breadcrumb trail', section: 'layout', keywords: ['breadcrumb', 'navigation', 'path', 'trail'] },
    { name: 'GlassNavigationMenu', displayName: 'Navigation Menu', description: 'Dropdown navigation menu', section: 'layout', keywords: ['navigation', 'menu', 'dropdown', 'mega'] },
    { name: 'GlassPagination', displayName: 'Pagination', description: 'Page navigation controls', section: 'layout', keywords: ['pagination', 'page', 'next', 'previous'] },
    { name: 'GlassStepper', displayName: 'Glass Stepper', description: 'Multi-step form wizard', section: 'layout', keywords: ['stepper', 'wizard', 'steps', 'progress'] },
    { name: 'GlassCarousel', displayName: 'Glass Carousel', description: 'Image/content carousel slider', section: 'layout', keywords: ['carousel', 'slider', 'gallery', 'slides'] },

    // Overlays & Popovers
    { name: 'GlassModal', displayName: 'Glass Modal', description: 'Modal dialog with focus trap', section: 'overlays', keywords: ['modal', 'dialog', 'popup', 'overlay'] },
    { name: 'GlassAlertDialog', displayName: 'Alert Dialog', description: 'Confirmation dialog for actions', section: 'overlays', keywords: ['alert', 'dialog', 'confirm', 'warning'], phase: 2 },
    { name: 'GlassSheet', displayName: 'Glass Sheet', description: 'Slide-in side panel', section: 'overlays', keywords: ['sheet', 'panel', 'slide', 'drawer'] },
    { name: 'GlassDrawer', displayName: 'Glass Drawer', description: 'Bottom sheet with swipe', section: 'overlays', keywords: ['drawer', 'bottom', 'sheet', 'swipe', 'mobile'], phase: 2 },
    { name: 'GlassPopover', displayName: 'Glass Popover', description: 'Floating popover content', section: 'overlays', keywords: ['popover', 'popup', 'floating', 'tooltip'] },
    { name: 'GlassTooltip', displayName: 'Glass Tooltip', description: 'Hover tooltip hints', section: 'overlays', keywords: ['tooltip', 'hint', 'hover', 'info'] },
    { name: 'GlassHoverCard', displayName: 'Hover Card', description: 'Rich hover preview card', section: 'overlays', keywords: ['hover', 'card', 'preview', 'popup'] },
    { name: 'GlassDropdown', displayName: 'Glass Dropdown', description: 'Dropdown menu with items', section: 'overlays', keywords: ['dropdown', 'menu', 'options', 'select'] },
    { name: 'GlassContextMenu', displayName: 'Context Menu', description: 'Right-click context menu', section: 'overlays', keywords: ['context', 'menu', 'right-click', 'options'] },
    { name: 'GlassToast', displayName: 'Glass Toast', description: 'Toast notification alerts', section: 'overlays', keywords: ['toast', 'notification', 'alert', 'message'] },
    { name: 'GlassAlert', displayName: 'Glass Alert', description: 'Inline alert messages', section: 'overlays', keywords: ['alert', 'message', 'warning', 'error', 'info'] },
    { name: 'GlassTour', displayName: 'Glass Tour', description: 'Guided tour walkthrough', section: 'overlays', keywords: ['tour', 'guide', 'walkthrough', 'onboarding'] },

    // Media & Visuals
    { name: 'GlassVideo', displayName: 'Glass Video', description: 'Video player with controls', section: 'media', keywords: ['video', 'player', 'media', 'play'] },

    { name: 'GlassCompare', displayName: 'Image Compare', description: 'Before/after comparison slider', section: 'media', keywords: ['compare', 'before', 'after', 'slider', 'image'] },
    { name: 'GlassSparkles', displayName: 'Glass Sparkles', description: 'Sparkle animation effect', section: 'media', keywords: ['sparkles', 'animation', 'effect', 'stars'] },
    { name: 'LiquidBackground', displayName: 'Liquid Background', description: 'Animated gradient background', section: 'media', keywords: ['background', 'gradient', 'animation', 'liquid'] },

    // Complex Composites
    { name: 'GlassChat', displayName: 'Glass Chat', description: 'Chat interface with messages', section: 'complex', keywords: ['chat', 'message', 'conversation', 'ai'] },
    { name: 'GlassVoice', displayName: 'Voice Interface', description: 'Voice recording interface', section: 'complex', keywords: ['voice', 'audio', 'recording', 'microphone'] },
    { name: 'GlassTerminal', displayName: 'Glass Terminal', description: 'Terminal/console interface', section: 'complex', keywords: ['terminal', 'console', 'command', 'cli'] },
];

// Get all unique sections
export const getSections = () => {
    return [...new Set(componentRegistry.map(c => c.section))];
};

// Search components by query
export const searchComponents = (query: string): ComponentInfo[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return componentRegistry.filter(component => {
        // Check name
        if (component.name.toLowerCase().includes(lowerQuery)) return true;
        if (component.displayName.toLowerCase().includes(lowerQuery)) return true;
        // Check description
        if (component.description.toLowerCase().includes(lowerQuery)) return true;
        // Check keywords
        if (component.keywords.some(k => k.toLowerCase().includes(lowerQuery))) return true;
        return false;
    });
};

// Get components by section
export const getComponentsBySection = (section: string): ComponentInfo[] => {
    return componentRegistry.filter(c => c.section === section);
};

// Section display names
export const sectionNames: Record<string, string> = {
    typography: 'Typography & Materials',
    buttons: 'Buttons & Interactive',
    forms: 'Forms & Inputs',
    data: 'Data & Charts',
    layout: 'Layout & Grids',
    overlays: 'Overlays & Popovers',
    media: 'Media & Visuals',
    complex: 'Complex Composites',
};
