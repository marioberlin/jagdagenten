/**
 * A2UI (Agent-to-User Interface) Types
 *
 * A2UI is an open-source standard enabling AI agents to generate rich,
 * interactive user interfaces through declarative JSON.
 *
 * A2UI components are declarative data (not executable code), restricting
 * agents to pre-approved components from a trusted catalog maintained by
 * the client application.
 *
 * @see https://github.com/google/a2ui
 */

// ============================================================================
// Core Component Types
// ============================================================================

/**
 * Supported A2UI component types
 *
 * These map to Glass components in the LiquidCrypto component library.
 * Components are organized by category for easy reference.
 */
export type A2UIComponentType =
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMITIVES - Base building blocks
  // ═══════════════════════════════════════════════════════════════════════════
  | 'text'              // GlassLabel - Plain text display
  | 'heading'           // Text with level prop (h1-h6)
  | 'paragraph'         // Text block
  | 'button'            // GlassButton - Interactive button
  | 'button-group'      // GlassButtonGroup - Button collection
  | 'icon'              // GlassIcon - Icon display
  | 'link'              // Hyperlink
  | 'label'             // GlassLabel - Form label
  | 'chip'              // GlassChip - Tag/chip element

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT - Structure and containers
  // ═══════════════════════════════════════════════════════════════════════════
  | 'container'         // GlassContainer - Generic container
  | 'card'              // GlassCard - Card container
  | 'row'               // Horizontal flex layout
  | 'column'            // Vertical flex layout
  | 'grid'              // CSS grid layout
  | 'stack'             // Stack layout
  | 'bento'             // GlassBento - Bento grid layout
  | 'masonry'           // GlassMasonry - Masonry layout
  | 'resizable'         // GlassResizable - Resizable container
  | 'scroll-area'       // GlassScrollArea - Scrollable container
  | 'divider'           // GlassSeparator - Visual divider
  | 'spacer'            // Spacing element
  | 'collapsible'       // GlassCollapsible - Collapsible section
  | 'window'            // GlassWindow - Window container

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION - Nav and routing
  // ═══════════════════════════════════════════════════════════════════════════
  | 'navbar'            // GlassNavbar - Top navigation bar
  | 'sidebar'           // GlassSidebar - Side navigation
  | 'top-nav'           // GlassTopNav - Top navigation
  | 'bottom-nav'        // GlassBottomNav - Bottom navigation
  | 'dock'              // GlassDock - macOS-style dock
  | 'tabs'              // GlassTabs - Tab navigation
  | 'tab'               // Individual tab
  | 'accordion'         // GlassAccordion - Expandable sections
  | 'breadcrumb'        // GlassBreadcrumb - Breadcrumb nav
  | 'pagination'        // GlassPagination - Page navigation
  | 'navigation-menu'   // GlassNavigationMenu - Dropdown nav
  | 'floating-action'   // GlassFloatingAction - FAB button

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMS - Input controls
  // ═══════════════════════════════════════════════════════════════════════════
  | 'form'              // GlassForm - Form container
  | 'text-field'        // GlassInput - Text input
  | 'text-area'         // GlassTextarea - Multi-line input
  | 'autosize-textarea' // GlassAutosizeTextarea - Auto-growing textarea
  | 'number-input'      // GlassNumberInput - Numeric input
  | 'select'            // GlassSelect - Dropdown select
  | 'combobox'          // GlassCombobox - Searchable select
  | 'checkbox'          // GlassCheckbox - Checkbox input
  | 'radio'             // GlassRadio - Radio button
  | 'radio-group'       // GlassRadioGroup - Radio group
  | 'switch'            // GlassSwitch - Toggle switch
  | 'slider'            // GlassSlider - Range slider
  | 'date-picker'       // GlassDatePicker - Date selection
  | 'time-picker'       // GlassTimePicker - Time selection
  | 'calendar'          // GlassCalendar - Calendar picker
  | 'color-picker'      // GlassColorPicker - Color selection
  | 'file-upload'       // GlassUpload - File upload
  | 'search-bar'        // GlassSearchBar - Search input
  | 'otp-input'         // GlassInputOTP - OTP/PIN input
  | 'rating'            // GlassRating - Star rating
  | 'emoji-picker'      // GlassEmojiPicker - Emoji selection
  | 'captcha'           // GlassCaptcha - CAPTCHA verification

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA DISPLAY - Content presentation
  // ═══════════════════════════════════════════════════════════════════════════
  | 'table'             // GlassTable - Data table
  | 'data-table'        // GlassDataTable - Advanced data table
  | 'list'              // List container
  | 'list-item'         // List item
  | 'badge'             // GlassBadge - Badge/tag
  | 'avatar'            // GlassAvatar - User avatar
  | 'image'             // Image display
  | 'carousel'          // GlassCarousel - Image/content carousel
  | 'timeline'          // GlassTimeline - Timeline display
  | 'code-block'        // GlassCode - Code display with syntax
  | 'markdown'          // Markdown content renderer
  | 'metric'            // GlassMetric - Single metric display
  | 'kpi-card'          // GlassKPICard - KPI metric card
  | 'stats-bar'         // GlassStatsBar - Stats row
  | 'product-card'      // GlassProductCard - Product display
  | 'profile-card'      // GlassProfileCard - User profile
  | 'media-card'        // GlassMediaCard - Media content card
  | 'media-list'        // GlassMediaList - Media list
  | 'compare'           // GlassCompare - Comparison view
  | 'infinite-scroll'   // GlassInfiniteScroll - Infinite loading

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARTS - Data visualization
  // ═══════════════════════════════════════════════════════════════════════════
  | 'chart'             // GlassChart - Generic chart
  | 'line-chart'        // GlassLineChart - Line chart
  | 'bar-chart'         // Bar chart (via GlassChart)
  | 'pie-chart'         // Pie chart (via GlassChart)
  | 'donut-chart'       // GlassDonutChart - Donut chart
  | 'area-chart'        // Area chart (via GlassChart)
  | 'scatter-chart'     // GlassScatterChart - Scatter plot
  | 'radar-chart'       // GlassRadarChart - Radar/spider chart
  | 'polar-chart'       // GlassPolarAreaChart - Polar area
  | 'candlestick-chart' // GlassCandlestickChart - OHLC chart
  | 'heatmap'           // GlassHeatmap - Heat map
  | 'treemap'           // GlassTreemap - Treemap
  | 'funnel-chart'      // GlassFunnelChart - Funnel
  | 'gauge'             // GlassGauge - Gauge/meter
  | 'sankey'            // GlassSankey - Sankey diagram
  | 'stacked-bar-chart' // GlassStackedBarChart - Stacked bars

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK - Status and notifications
  // ═══════════════════════════════════════════════════════════════════════════
  | 'alert'             // GlassAlert - Alert message
  | 'toast'             // GlassToast - Toast notification
  | 'progress'          // GlassProgress - Progress bar
  | 'spinner'           // Loading spinner
  | 'skeleton'          // GlassSkeleton - Loading placeholder
  | 'status'            // GlassStatus - Status indicator
  | 'stepper'           // GlassStepper - Step progress
  | 'sparkles'          // GlassSparkles - Sparkle effect

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERLAYS - Modals and popovers
  // ═══════════════════════════════════════════════════════════════════════════
  | 'dialog'            // GlassModal - Modal dialog
  | 'modal'             // GlassModal - Alias for dialog
  | 'drawer'            // GlassDrawer - Slide-out panel
  | 'sheet'             // GlassSheet - Bottom sheet
  | 'popover'           // GlassPopover - Popover content
  | 'tooltip'           // GlassTooltip - Tooltip
  | 'hover-card'        // GlassHoverCard - Hover preview
  | 'context-menu'      // GlassContextMenu - Right-click menu
  | 'dropdown'          // GlassDropdown - Dropdown menu
  | 'command'           // GlassCommand - Command menu
  | 'command-palette'   // GlassCommandPalette - Cmd+K palette
  | 'tour'              // GlassTour - Guided tour

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA - Audio, video, and visuals
  // ═══════════════════════════════════════════════════════════════════════════
  | 'video'             // GlassVideo - Video player
  | 'audio'             // GlassAudio - Audio player
  | 'mini-player'       // GlassMiniPlayer - Mini media player
  | 'visualizer'        // GlassVisualizer - Audio visualizer
  | 'drawing-canvas'    // GlassDrawingCanvas - Drawing surface
  | 'image-editor'      // GlassImageEditor - Image editing
  | 'screenshot'        // GlassScreenshot - Screenshot capture
  | 'scanner'           // GlassScanner - QR/barcode scanner
  | 'iframe'            // Embedded iframe
  | 'map'               // GlassMap - Geographic map

  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURES - Complex applications
  // ═══════════════════════════════════════════════════════════════════════════
  | 'chat'              // GlassChat - Chat interface
  | 'editor'            // GlassEditor - Rich text editor
  | 'kanban'            // GlassKanban - Kanban board
  | 'terminal'          // GlassTerminal - Terminal emulator
  | 'file-tree'         // GlassFileTree - File browser
  | 'file-preview'      // GlassFilePreview - File preview
  | 'spreadsheet'       // GlassSpreadsheet - Spreadsheet
  | 'smart-sheet'       // GlassSmartSheet - AI spreadsheet
  | 'flow'              // GlassFlow - Flow diagram
  | 'payment'           // GlassPayment - Payment form
  | 'calculator'        // GlassCalculator - Calculator
  | 'weather'           // GlassWeather - Weather display

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENTIC - AI-powered components
  // ═══════════════════════════════════════════════════════════════════════════
  | 'agent'             // GlassAgent - AI agent interface
  | 'copilot'           // GlassCopilot - AI assistant
  | 'prompt'            // GlassPrompt - AI prompt input
  | 'thinking'          // GlassThinking - AI thinking state
  | 'dynamic-ui'        // GlassDynamicUI - AI-generated UI
  | 'file-search'       // GlassFileSearch - AI file search
  | 'voice'             // GlassVoice - Voice interface

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATIVE - AI-enhanced smart components
  // ═══════════════════════════════════════════════════════════════════════════
  | 'smart-card'        // GlassSmartCard - AI-enhanced card
  | 'smart-chart'       // GlassSmartChart - AI-enhanced chart
  | 'smart-dashboard'   // GlassSmartDashboard - AI dashboard
  | 'smart-kanban'      // GlassSmartKanban - AI kanban
  | 'smart-list'        // GlassSmartList - AI-enhanced list
  | 'smart-modal'       // GlassSmartModal - AI modal
  | 'smart-tabs'        // GlassSmartTabs - AI tabs
  | 'smart-badge'       // GlassSmartBadge - AI badge
  | 'smart-weather'     // GlassSmartWeather - AI weather

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING - Finance and crypto (domain-specific)
  // ═══════════════════════════════════════════════════════════════════════════
  | 'trading-grid'      // GlassTradingGrid - Trading layout
  | 'order-entry'       // GlassOrderEntry - Order form
  | 'positions-list'    // GlassPositionsList - Open positions
  | 'recent-trades'     // GlassRecentTrades - Trade history
  | 'market-ticker'     // GlassMarketTicker - Price ticker
  | 'alert-panel'       // GlassAlertPanel - Trading alerts

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTIFACTS - Content management
  // ═══════════════════════════════════════════════════════════════════════════
  | 'artifact-card'     // GlassArtifactCard - Artifact display
  | 'artifact-dock'     // GlassArtifactDock - Artifact dock
  | 'artifact-explorer' // GlassArtifactExplorer - Browse artifacts
  | 'artifact-quicklook'// GlassArtifactQuickLook - Quick preview

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLABORATION - Multi-user features
  // ═══════════════════════════════════════════════════════════════════════════
  | 'collaborators'     // GlassCollaborators - User presence
  | 'collaborative-chat'// GlassCollaborativeChat - Team chat
  | 'cowork-panel'      // GlassCoworkPanel - Cowork interface
  | 'file-picker'       // GlassFilePicker - File selection

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL
  // ═══════════════════════════════════════════════════════════════════════════
  | 'hero'              // GlassHero - Hero section
  | 'parallax'          // GlassParallax - Parallax effect
  | 'drag-drop'         // GlassDragDrop - Drag and drop
  | 'sticky'            // GlassSticky - Sticky element
  | 'responsive'        // GlassResponsive - Responsive wrapper
  | 'playground'        // GlassPlayground - Code playground
  | 'custom';           // Custom/extension component

// ============================================================================
// Component Base Interface
// ============================================================================

/** Base interface for all A2UI components */
export interface A2UIComponentBase {
  /** Unique identifier for this component */
  id: string;

  /** Component type (determines rendering) */
  type: A2UIComponentType | string;

  /** Component properties (type-specific) */
  props?: A2UIComponentProps;

  /** Child components (for container types) */
  children?: A2UIComponent[];

  /** Styling information */
  style?: A2UIStyle;

  /** Event handlers */
  events?: A2UIEventBinding[];

  /** Data bindings for dynamic content */
  bindings?: Record<string, string>;

  /** Accessibility attributes */
  accessibility?: A2UIAccessibility;
}

/** Full component type (may be extended) */
export type A2UIComponent = A2UIComponentBase;

// ============================================================================
// Component Properties
// ============================================================================

/** Generic component properties */
export interface A2UIComponentProps {
  // ═══════════════════════════════════════════════════════════════════════════
  // BASIC CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  text?: string;
  label?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  value?: unknown;
  defaultValue?: unknown;
  content?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // APPEARANCE
  // ═══════════════════════════════════════════════════════════════════════════
  variant?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  active?: boolean;
  selected?: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  glassMaterial?: 'standard' | 'frosted' | 'clear' | 'tinted';
  glassIntensity?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  flex?: number;
  alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: boolean;
  gap?: string | number;
  columns?: number | A2UITableColumn[];
  gridColumns?: number;
  gridRows?: number;
  span?: number;
  sticky?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM INPUTS
  // ═══════════════════════════════════════════════════════════════════════════
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  options?: A2UISelectOption[];
  multiple?: boolean;
  accept?: string;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'search';
  name?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA
  // ═══════════════════════════════════════════════════════════════════════════
  src?: string;
  alt?: string;
  aspectRatio?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  volume?: number;
  duration?: number;
  currentTime?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE & DATA
  // ═══════════════════════════════════════════════════════════════════════════
  rows?: unknown[];
  items?: unknown[];
  selectable?: boolean;
  multiSelect?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  virtualScroll?: boolean;
  emptyMessage?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARTS & DATA VIZ
  // ═══════════════════════════════════════════════════════════════════════════
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'donut' | 'radar' | 'candlestick' | 'heatmap' | 'treemap' | 'funnel' | 'gauge' | 'sankey';
  data?: unknown;
  xAxis?: string;
  yAxis?: string;
  series?: A2UIChartSeries[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  stacked?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION & LINKS
  // ═══════════════════════════════════════════════════════════════════════════
  href?: string;
  target?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  ordered?: boolean;
  activeTab?: string;
  defaultTab?: string;
  orientation?: 'horizontal' | 'vertical';
  currentStep?: number;
  totalSteps?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERLAY & MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  open?: boolean;
  modal?: boolean;
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  trigger?: 'click' | 'hover' | 'focus' | 'manual';

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════
  severity?: 'info' | 'success' | 'warning' | 'error';
  progress?: number;
  indeterminate?: boolean;
  dismissible?: boolean;
  autoClose?: number;
  status?: 'online' | 'offline' | 'busy' | 'away';

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  tradingVolume?: number;
  side?: 'buy' | 'sell';
  orderType?: 'market' | 'limit' | 'stop' | 'stop-limit';
  quantity?: number;
  positions?: unknown[];
  trades?: unknown[];
  ohlc?: Array<{ open: number; high: number; low: number; close: number; time: number }>;

  // ═══════════════════════════════════════════════════════════════════════════
  // AI / AGENTIC
  // ═══════════════════════════════════════════════════════════════════════════
  agentId?: string;
  agentName?: string;
  messages?: unknown[];
  prompt?: string;
  streaming?: boolean;
  thinking?: boolean;
  context?: unknown;
  capabilities?: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLABORATION
  // ═══════════════════════════════════════════════════════════════════════════
  users?: Array<{ id: string; name: string; avatar?: string; color?: string }>;
  presence?: boolean;
  cursor?: boolean;
  maxUsers?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTIFACTS
  // ═══════════════════════════════════════════════════════════════════════════
  artifactId?: string;
  artifactType?: string;
  artifactName?: string;
  artifactVersion?: number;
  artifacts?: unknown[];

  // ═══════════════════════════════════════════════════════════════════════════
  // OTHER
  // ═══════════════════════════════════════════════════════════════════════════
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
  timezone?: string;
  format?: string;

  // Allow additional custom properties
  [key: string]: unknown;
}

/** Select option */
export interface A2UISelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  icon?: string;
}

/** Table column definition */
export interface A2UITableColumn {
  id: string;
  header: string;
  accessor?: string;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
}

/** Chart series definition */
export interface A2UIChartSeries {
  name: string;
  data: Array<{ x: unknown; y: number }>;
  color?: string;
}

// ============================================================================
// Styling
// ============================================================================

/** Component styling */
export interface A2UIStyle {
  // Colors
  backgroundColor?: string;
  color?: string;
  borderColor?: string;

  // Spacing
  padding?: string | number;
  paddingTop?: string | number;
  paddingRight?: string | number;
  paddingBottom?: string | number;
  paddingLeft?: string | number;
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  gap?: string | number;

  // Border
  borderWidth?: string | number;
  borderRadius?: string | number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';

  // Layout
  display?: 'flex' | 'block' | 'inline' | 'grid' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';

  // Sizing
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;

  // Typography
  fontSize?: string | number;
  fontWeight?: string | number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string | number;
  textDecoration?: string;

  // Effects
  opacity?: number;
  boxShadow?: string;
  transform?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';

  // Allow additional custom properties
  [key: string]: unknown;
}

// ============================================================================
// Events
// ============================================================================

/** Event binding for interactivity */
export interface A2UIEventBinding {
  /** Event type (e.g., 'click', 'change', 'submit') */
  event: string;

  /** Action to perform */
  action: A2UIEventAction;
}

/** Event action types */
export type A2UIEventAction =
  | A2UICallbackAction
  | A2UINavigateAction
  | A2UISetModelAction
  | A2UISubmitAction;

/** Callback action - sends data back to agent */
export interface A2UICallbackAction {
  type: 'callback';
  callbackId: string;
  data?: Record<string, unknown>;
}

/** Navigate action - client-side navigation */
export interface A2UINavigateAction {
  type: 'navigate';
  target: string;
}

/** Set model action - updates local state */
export interface A2UISetModelAction {
  type: 'set-model';
  path: string;
  value: unknown;
}

/** Submit action - submits form data */
export interface A2UISubmitAction {
  type: 'submit';
  endpoint?: string;
}

// ============================================================================
// Accessibility
// ============================================================================

/** Accessibility attributes */
export interface A2UIAccessibility {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  ariaHidden?: boolean;
  tabIndex?: number;
}

// ============================================================================
// Surface and Message Types
// ============================================================================

/** Surface styling configuration */
export interface A2UISurfaceStyling {
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: string | number;
  spacing?: string | number;
  [key: string]: unknown;
}

/** Base message interface */
export interface A2UIMessage {
  surfaceId: string;
  type: string;
}

/** Begin rendering message - initializes a new surface */
export interface BeginRenderingMessage extends A2UIMessage {
  type: 'begin-rendering';
  rootComponentId: string;
  styling?: A2UISurfaceStyling;
}

/** Surface update message - updates components on a surface */
export interface SurfaceUpdateMessage extends A2UIMessage {
  type: 'surface-update';
  components: A2UIComponent[];
}

/** Set model message - updates surface data model */
export interface SetModelMessage extends A2UIMessage {
  type: 'set-model';
  model: Record<string, unknown>;
}

/** End rendering message - finalizes surface rendering */
export interface EndRenderingMessage extends A2UIMessage {
  type: 'end-rendering';
}

/** Clear surface message - clears all components */
export interface ClearSurfaceMessage extends A2UIMessage {
  type: 'clear-surface';
}

/** User action message - sent from client to agent */
export interface UserActionMessage {
  surfaceId: string;
  type: 'user-action';
  componentId: string;
  action: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// A2A Integration
// ============================================================================

/** A2UI part for embedding in A2A artifacts */
export interface A2UIPart {
  data: {
    a2ui_messages?: A2UIMessage[];
    a2uiMessages?: A2UIMessage[];
  };
}

/** Check if artifact contains A2UI content */
export function isA2UIArtifact(artifact: unknown): boolean {
  if (!artifact || typeof artifact !== 'object') return false;
  const a = artifact as Record<string, unknown>;

  // Check extensions array (A2A v1.0 format)
  if (Array.isArray(a.extensions)) {
    const hasA2UI = a.extensions.some(
      (ext: unknown) => typeof ext === 'string' && ext.includes('a2ui')
    );
    if (hasA2UI) return true;
  }

  // Check parts for a2ui content
  if (Array.isArray(a.parts)) {
    for (const part of a.parts) {
      if (!part || typeof part !== 'object') continue;
      const p = part as Record<string, unknown>;

      // Check data.a2ui_messages or data.a2uiMessages
      if (p.data && typeof p.data === 'object') {
        const data = p.data as Record<string, unknown>;
        if (Array.isArray(data.a2ui_messages) || Array.isArray(data.a2uiMessages)) {
          return true;
        }
      }

      // Legacy format
      if (p.type === 'a2ui' && Array.isArray(p.a2ui)) {
        return true;
      }
    }
  }

  return false;
}

/** Extract A2UI messages from an artifact */
export function extractA2UIMessages(artifact: unknown): A2UIMessage[] {
  if (!artifact || typeof artifact !== 'object') return [];
  const a = artifact as Record<string, unknown>;
  if (!Array.isArray(a.parts)) return [];

  const messages: A2UIMessage[] = [];

  for (const part of a.parts) {
    if (!part || typeof part !== 'object') continue;
    const p = part as Record<string, unknown>;

    // Official A2A v1.0 format: data parts with a2ui_messages or a2uiMessages
    if (p.data && typeof p.data === 'object') {
      const data = p.data as Record<string, unknown>;
      const a2uiMsgs = data.a2ui_messages || data.a2uiMessages;
      if (Array.isArray(a2uiMsgs)) {
        messages.push(...(a2uiMsgs as A2UIMessage[]));
      }
    }

    // Legacy format: type: 'a2ui' with a2ui array
    if (p.type === 'a2ui' && Array.isArray(p.a2ui)) {
      messages.push(...(p.a2ui as A2UIMessage[]));
    }
  }

  return messages;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isBeginRenderingMessage(msg: A2UIMessage): msg is BeginRenderingMessage {
  return msg.type === 'begin-rendering';
}

export function isSurfaceUpdateMessage(msg: A2UIMessage): msg is SurfaceUpdateMessage {
  return msg.type === 'surface-update';
}

export function isSetModelMessage(msg: A2UIMessage): msg is SetModelMessage {
  return msg.type === 'set-model';
}

export function isEndRenderingMessage(msg: A2UIMessage): msg is EndRenderingMessage {
  return msg.type === 'end-rendering';
}

export function isClearSurfaceMessage(msg: A2UIMessage): msg is ClearSurfaceMessage {
  return msg.type === 'clear-surface';
}

// ============================================================================
// Component Builder Helpers
// ============================================================================

/** Create a text component */
export function text(id: string, content: string, style?: A2UIStyle): A2UIComponent {
  return { id, type: 'text', props: { text: content }, style };
}

/** Create a button component */
export function button(
  id: string,
  label: string,
  onClick?: A2UIEventAction,
  props?: Partial<A2UIComponentProps>
): A2UIComponent {
  return {
    id,
    type: 'button',
    props: { label, ...props },
    events: onClick ? [{ event: 'click', action: onClick }] : undefined,
  };
}

/** Create a card component */
export function card(
  id: string,
  children: A2UIComponent[],
  props?: Partial<A2UIComponentProps>,
  style?: A2UIStyle
): A2UIComponent {
  return { id, type: 'card', children, props, style };
}

/** Create a list component */
export function list(
  id: string,
  items: A2UIComponent[],
  ordered = false
): A2UIComponent {
  return { id, type: 'list', props: { ordered }, children: items };
}

/** Create an image component */
export function image(
  id: string,
  src: string,
  alt?: string,
  style?: A2UIStyle
): A2UIComponent {
  return { id, type: 'image', props: { src, alt }, style };
}

/** Create a text field component */
export function textField(
  id: string,
  label: string,
  props?: Partial<A2UIComponentProps>
): A2UIComponent {
  return { id, type: 'text-field', props: { label, ...props } };
}

/** Create a form component */
export function form(
  id: string,
  children: A2UIComponent[],
  onSubmit?: A2UIEventAction
): A2UIComponent {
  return {
    id,
    type: 'form',
    children,
    events: onSubmit ? [{ event: 'submit', action: onSubmit }] : undefined,
  };
}

/** Create a row (horizontal) layout */
export function row(
  id: string,
  children: A2UIComponent[],
  style?: A2UIStyle
): A2UIComponent {
  return { id, type: 'row', children, style };
}

/** Create a column (vertical) layout */
export function column(
  id: string,
  children: A2UIComponent[],
  style?: A2UIStyle
): A2UIComponent {
  return { id, type: 'column', children, style };
}

/** Create a callback action */
export function callback(callbackId: string, data?: Record<string, unknown>): A2UICallbackAction {
  return { type: 'callback', callbackId, data };
}

/** Create a begin-rendering message */
export function beginRendering(
  surfaceId: string,
  rootComponentId: string,
  styling?: A2UISurfaceStyling
): BeginRenderingMessage {
  return { surfaceId, type: 'begin-rendering', rootComponentId, styling };
}

/** Create a surface-update message */
export function surfaceUpdate(
  surfaceId: string,
  components: A2UIComponent[]
): SurfaceUpdateMessage {
  return { surfaceId, type: 'surface-update', components };
}

/** Create a set-model message */
export function setModel(
  surfaceId: string,
  model: Record<string, unknown>
): SetModelMessage {
  return { surfaceId, type: 'set-model', model };
}

/** Create an A2UI artifact part for embedding in A2A artifacts */
export function createA2UIPart(messages: A2UIMessage[]): A2UIPart {
  return {
    data: {
      a2ui_messages: messages,
    },
  };
}
