# LiquidCrypto - UX/UI Implementation Plan

> **Plan Version:** 1.0  
> **Based On:** UX/UI Design Audit (January 2026)  
> **Status:** Ready for Implementation  
> **Estimated Duration:** 12 weeks

---

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Phase 1: Core Navigation & Homepage](#phase-1-core-navigation--homepage)
3. [Phase 2: Trading Dashboard Redesign](#phase-2-trading-dashboard-redesign)
4. [Phase 3: Settings & Analytics](#phase-3-settings--analytics)
5. [Phase 4: Demo Pages & Documentation](#phase-4-demo-pages--documentation)
6. [Phase 5: Mobile & Polish](#phase-5-mobile--polish)
7. [Component Changes](#component-changes)
8. [Design Token Updates](#design-token-updates)
9. [Testing Strategy](#testing-strategy)
10. [Rollout Plan](#rollout-plan)

---

## Implementation Overview

### Guiding Principles

1. **Progressive Enhancement** - Improve pages incrementally, never breaking existing functionality
2. **Component-First** - Build new components before integrating them into pages
3. **Data-Driven** - Track metrics before/after each phase
4. **Accessibility-First** - Every improvement must maintain or improve a11y
5. **Performance-Bound** - New features must not degrade Core Web Vitals

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Lighthouse Performance | 92 | 95 | PageSpeed Insights |
| Lighthouse Accessibility | 88 | 95 | PageSpeed Insights |
| Time on Page (Homepage) | 45s | 90s | Analytics |
| Task Completion (Trading) | 65% | 85% | User testing |
| Mobile Bounce Rate | 55% | 35% | Analytics |

### Dependencies

```
Phase 1 ──────────┬────────────> Phase 2
   │              │                │
   ▼              ▼                ▼
New Components ──► Integration ──► Polish
   │                │               │
   └────────────────┴───────────────┘
            Phase 3-5
```

---

## Phase 1: Core Navigation & Homepage

**Duration:** 2 weeks  
**Priority:** Critical  
**Files Affected:** 12

### 1.1 New Components Required

#### A. `GlassHero.tsx`
```typescript
// NEW FILE: src/components/hero/GlassHero.tsx
interface GlassHeroProps {
  title: string;
  subtitle: string;
  ctaPrimary?: { label: string; onClick: () => void };

### 2.3 Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/components/trading/GlassTradingGrid.tsx` | Create | Component |
| `src/components/trading/GlassOrderEntry.tsx` | Create | Component |
| `src/components/trading/GlassPositionsList.tsx` | Create | Component |
| `src/components/trading/GlassAlertPanel.tsx` | Create | Component |
| `src/components/trading/GlassRecentTrades.tsx` | Create | Component |
| `src/components/trading/GlassMarketTicker.tsx` | Create | Component |
| `src/components/trading/OrderTypeSelector.tsx` | Create | Subcomponent |
| `src/components/trading/PriceInput.tsx` | Create | Subcomponent |
| `src/components/trading/AmountInput.tsx` | Create | Subcomponent |
| `src/components/trading/OrderSummary.tsx` | Create | Subcomponent |
| `src/pages/trading/Dashboard.tsx` | Modify | Page |
| `src/pages/trading/RiskSettings.tsx` | Modify | Page |
| `src/pages/trading/BotConfig.tsx` | Modify | Page |
| `src/components/index.ts` | Modify | Exports |

### 2.4 Implementation Checklist

- [ ] Create trading directory structure
- [ ] Build GlassMarketTicker with live data
- [ ] Build GlassTradingGrid with responsive spans
- [ ] Build GlassOrderEntry with all subcomponents
- [ ] Build GlassPositionsList with expansion
- [ ] Build GlassRecentTrades with animation
- [ ] Build GlassAlertPanel with inline creation
- [ ] Rewrite Trading Dashboard
- [ ] Add wizard-style Bot Config
- [ ] Add presets to Risk Settings
- [ ] Add backtest preview to Bot Config
- [ ] Add unit tests for all trading components
- [ ] Verify accessibility (keyboard, screen reader)
- [ ] Test with real-time data
- [ ] Measure trading task completion rate

---

## Phase 3: Settings & Analytics

**Duration:** 2 weeks  
**Priority:** Medium  
**Files Affected:** 14

### 3.1 New Components Required

#### A. `GlassSettingsLayout.tsx`
```typescript
// NEW FILE: src/components/settings/GlassSettingsLayout.tsx
interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface GlassSettingsLayoutProps {
  children: ReactNode;
  navItems: SettingsNavItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}
```

#### B. `GlassThemePreview.tsx`
```typescript
// NEW FILE: src/components/settings/GlassThemePreview.tsx
interface GlassThemePreviewProps {
  variant: 'light' | 'dark' | 'auto';
  selected?: boolean;
  onClick?: () => void;
}
```

#### C. `GlassDataNarrative.tsx`
```typescript
// NEW FILE: src/components/data-display/GlassDataNarrative.tsx
interface NarrativeSection {
  type: 'positive' | 'warning' | 'info' | 'negative';
  children: ReactNode;
}

interface GlassDataNarrativeProps {
  children: NarrativeSection[];
}
```

#### D. `GlassDateRangeSelector.tsx`
```typescript
// NEW FILE: src/components/forms/GlassDateRangeSelector.tsx
interface DateRange {
  label: string;
  value: string;
  comparison?: boolean;
}

interface GlassDateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showComparison?: boolean;
}
```

### 3.2 Settings Page Rewrite (`src/pages/Settings.tsx`)

#### Current Issues
- 10+ tabs with unclear hierarchy
- No search functionality
- No live preview

#### New Layout
```tsx
// AFTER
export const Settings = () => {
  const [activeSection, setActiveSection] = useState('appearance');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <GlassSettingsLayout
      navItems={[
        { id: 'appearance', label: 'Appearance', icon: Sun, badge: '3' },
        { id: 'ai', label: 'AI & Agents', icon: Bot },
        { id: 'account', label: 'Account', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing', icon: CreditCard },
      ]}
      activeItem={activeSection}
      onItemChange={setActiveSection}
    >
      {/* Search Header */}
      <GlassSearchBar
        placeholder="Search settings..."
        shortcut="⌘K"
        onSearch={setSearchQuery}
      />
      
      {/* Settings Content with Live Preview */}
      <GlassCard>
        <GlassCard.Header>
          <GlassCard.Title>Theme Selection</GlassCard.Title>
          <GlassCard.Description>
            Choose your preferred color scheme
          </GlassCard.Description>
        </GlassCard.Header>
        
        <GlassCard.Content>
          {/* Live Preview Pane */}
          <ThemePreviewPane>
            <GlassButton>Preview Button</GlassButton>
            <GlassMetric value="42" label="Preview" />
          </ThemePreviewPane>
          
          {/* Theme Options */}
          <ThemeGrid>
            <GlassThemePreview variant="light" selected />
            <GlassThemePreview variant="dark" />
            <GlassThemePreview variant="auto" />
          </ThemeGrid>
        </GlassCard.Content>
      </GlassCard>
    </GlassSettingsLayout>
  );
};
```

### 3.3 Analytics Page Rewrite (`src/pages/analytics/SmartAnalytics.tsx`)

#### New Layout
```tsx
// AFTER
export const SmartAnalytics = () => {
  const [dateRange, setDateRange] = useState('7d');

  return (
    <div className="min-h-screen">
      {/* Header with Export */}
      <AnalyticsHeader>
        <GlassDateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          showComparison={true}
        />
        <ExportButton format="pdf" />
      </AnalyticsHeader>
      
      {/* KPI Grid */}
      <KPIGrid>
        <GlassKPICard label="Total Return" value="+24.5%" trend="up" />
        <GlassKPICard label="Win Rate" value="68%" trend="up" />
        <GlassKPICard label="Max Drawdown" value="-8.2%" trend="down" />
        <GlassKPICard label="Sharpe Ratio" value="2.4" trend="stable" />
      </KPIGrid>
      
      {/* AI Narrative */}
      <GlassDataNarrative>
        <NarrativeSection type="positive">
          Your BTC position outperformed the market by 12% this week.
        </NarrativeSection>
        <NarrativeSection type="warning">
          Consider taking profits at $100,000 resistance.
        </NarrativeSection>
      </GlassDataNarrative>
      
      {/* Chart Grid */}
      <AnalyticsGrid>
        <ChartCard title="Portfolio Performance">
          <AreaChart data={portfolio} />
        </ChartCard>
        <ChartCard title="Asset Allocation">
          <DonutChart data={allocation} />
        </ChartCard>
      </AnalyticsGrid>
    </div>
  );
};
```

### 3.4 Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/components/settings/GlassSettingsLayout.tsx` | Create | Component |
| `src/components/settings/GlassThemePreview.tsx` | Create | Component |
| `src/components/data-display/GlassDataNarrative.tsx` | Create | Component |
| `src/components/forms/GlassDateRangeSelector.tsx` | Create | Component |
| `src/pages/Settings.tsx` | Modify | Page |
| `src/pages/analytics/SmartAnalytics.tsx` | Modify | Page |
| `src/components/index.ts` | Modify | Exports |

---

## Phase 4: Demo Pages & Documentation

**Duration:** 2 weeks  
**Priority:** Medium  
**Files Affected:** 24

### 4.1 New Components Required

#### A. `GlassDemoLayout.tsx`
```typescript
// NEW FILE: src/components/demo/GlassDemoLayout.tsx
interface DemoLayoutProps {
  title: string;
  description: string;
  category: 'ai' | 'forms' | 'dashboard' | 'other';
  features: string[];
  children: ReactNode;
}
```

#### B. `GlassCodeTabs.tsx`
```typescript
// NEW FILE: src/components/demo/GlassCodeTabs.tsx
interface CodeTab {
  id: string;
  label: string;
  language: string;
  code: string;
}

interface GlassCodeTabsProps {
  tabs: CodeTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}
```

#### C. `GlassRelatedDemos.tsx`
```typescript
// NEW FILE: src/components/demo/GlassRelatedDemos.tsx
interface RelatedDemo {
  href: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}

interface GlassRelatedDemosProps {
  demos: RelatedDemo[];
}
```

### 4.2 Demo Page Template

```tsx
// NEW: src/pages/demos/DemoTemplate.tsx
export const DemoTemplate = () => (
  <GlassDemoLayout
    title="AI Research Agent"
    description="Autonomous research assistant for market analysis"
    category="ai"
    features={['Web Search', 'Data Analysis', 'Report Generation']}
  >
    {/* Breadcrumb */}
    <Breadcrumb>
      <Crumb href="/showcase">Showcase</Crumb>
      <Crumb>AI Research Agent</Crumb>
    </Breadcrumb>
    
    {/* Interactive Demo */}
    <DemoSection>
      <GlassCard>
        <GlassCard.Header>
          <GlassCard.Title>Try it yourself</GlassCard.Title>
        </GlassCard.Header>
        <AIResearchInterface />
      </GlassCard>
    </DemoSection>
    
    {/* Code Example */}
    <CodeSection>
      <GlassCodeTabs
        tabs={codeTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </CodeSection>
    
    {/* Related Demos */}
    <RelatedDemosSection>
      <GlassRelatedDemos demos={relatedDemos} />
    </RelatedDemosSection>
  </GlassDemoLayout>
);
```

### 4.3 Design Guide Updates (`src/pages/DesignGuide.tsx`)

```tsx
// AFTER
export const DesignGuide = () => (
  <DesignGuideLayout>
    {/* Search */}
    <GlassSearchBar
      placeholder="Search design tokens..."
      shortcut="⌘J"
    />
    
    <div className="flex gap-6">
      {/* Sticky TOC */}
      <DesignGuideNav>
        <NavSection title="Foundations">
          <NavItem icon={Colors} selected>Colors</NavItem>
          <NavItem icon={Type}>Typography</NavItem>
          <NavItem icon={Spacing}>Spacing</NavItem>
          <NavItem icon={Motion}>Motion</NavItem>
        </NavSection>
      </DesignGuideNav>
      
      {/* Content */}
      <DesignGuideContent>
        {/* Interactive Color Palette */}
        <ColorSection>
          <ColorSwatch name="Primary" copyable />
          <ColorPalette interactive />
        </ColorSection>
        
        {/* Live Type Preview */}
        <TypographySection>
          <TypeScale interactive />
        </TypographySection>
        
        {/* Visual Spacing Guide */}
        <SpacingSection>
          <SpacingVisualizer />
        </SpacingSection>
      </DesignGuideContent>
    </div>
  </DesignGuideLayout>
);
```

### 4.4 Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/components/demo/GlassDemoLayout.tsx` | Create | Component |
| `src/components/demo/GlassCodeTabs.tsx` | Create | Component |
| `src/components/demo/GlassRelatedDemos.tsx` | Create | Component |
| `src/pages/demos/AIResearcherDemo.tsx` | Modify | Page |
| `src/pages/demos/CopilotFormDemo.tsx` | Modify | Page |
| `src/pages/demos/DynamicDashboardDemo.tsx` | Modify | Page |
| `src/pages/demos/StateMachineDemo.tsx` | Modify | Page |
| `src/pages/demos/QAAgentDemo.tsx` | Modify | Page |
| `src/pages/demos/ResearchCanvasDemo.tsx` | Modify | Page |
| `src/pages/demos/TravelPlannerDemo.tsx` | Modify | Page |
| `src/pages/DesignGuide.tsx` | Modify | Page |
| `src/components/index.ts` | Modify | Exports |

---

## Phase 5: Mobile & Polish

**Duration:** 3 weeks  
**Priority:** Medium  
**Files Affected:** All

### 5.1 Mobile Navigation System

```tsx
// NEW: src/components/navigation/GlassMobileNav.tsx
export const GlassMobileNav = () => (
  <>
    {/* Slide-out Sidebar (Tablet) */}
    <GlassSidebar
      position="left"
      collapsed={!sidebarOpen}
      breakpoint="lg"
    >
      <NavList>
        <NavItem href="/" icon={Home}>Home</NavItem>
        <NavItem href="/trading" icon={Chart}>Trading</NavItem>
        <NavItem href="/analytics" icon={Bot}>Analytics</NavItem>
        <NavItem href="/showcase" icon={Layers}>Showcase</NavItem>
        <NavItem href="/settings" icon={Settings}>Settings</NavItem>
      </NavList>
    </GlassSidebar>
    
    {/* Bottom Tab Bar (Mobile) */}
    <GlassBottomNav className="md:hidden">
      <Tab icon={Home} href="/" label="Home" />
      <Tab icon={Chart} href="/trading" label="Trade" />
      <Tab icon={Plus} action primary />
      <Tab icon={Bot} href="/analytics" label="AI" />
      <Tab icon={Settings} href="/settings" label="Settings" />
    </GlassBottomNav>
  </>
);
```

### 5.2 Empty States Component

```tsx
// NEW: src/components/feedback/GlassEmptyState.tsx
interface GlassEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const GlassEmptyState = ({
  icon: Icon,
  title,
  description,
  action
}: GlassEmptyStateProps) => (
  <GlassCard className="text-center py-16">
    <div className="mx-auto w-16 h-16 rounded-full bg-[var(--glass-surface)] flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-[var(--text-secondary)]" />
    </div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    {description && (
      <p className="text-[var(--text-secondary)] mb-4">{description}</p>
    )}
    {action}
  </GlassCard>
);
```

### 5.3 Loading States

```tsx
// NEW: src/components/feedback/GlassSkeleton.tsx
interface GlassSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const GlassSkeleton = ({
  variant = 'text',
  width,
  height,
  animation = 'wave'
}: GlassSkeletonProps) => (
  <div
    className={cn(
      'bg-[var(--glass-surface)]',
      variant === 'circular' && 'rounded-full',
      variant === 'rectangular' && 'rounded-lg',
      animation === 'pulse' && 'animate-pulse',
      animation === 'wave' && 'animate-shimmer'
    )}
    style={{ width, height }}
  />
);

// Usage
<GlassSkeleton variant="card" height={200} />
<GlassSkeleton variant="text" width="100%" />
<GlassSkeleton variant="circular" width={48} height={48} />
```

### 5.4 Toast Notifications

```tsx
// NEW: src/components/feedback/GlassToast.tsx
interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface GlassToastContainerProps {
  position?: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export const useToast = () => {
  const toast = (config: Omit<ToastConfig, 'id'>) => {
    // Add toast to state
  };
  
  return {
    success: (title: string, message?: string) => 
      toast({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      toast({ type: 'error', title, message }),
    // ...
  };
};
```

### 5.5 Responsive Breakpoints Update

```css
/* Update: src/styles/tailwind.css */

/* Current breakpoints - ADD mobile-specific */
@theme {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  
  /* Add container queries */
  @plugin "@tailwindcss/container-queries";
}

/* Touch target sizes */
@layer utilities {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 5.6 Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/components/navigation/GlassMobileNav.tsx` | Create | Component |
| `src/components/navigation/GlassSidebar.tsx` | Create | Component |
| `src/components/navigation/GlassBottomNav.tsx` | Create | Component |
| `src/components/feedback/GlassEmptyState.tsx` | Create | Component |
| `src/components/feedback/GlassSkeleton.tsx` | Create | Component |
| `src/components/feedback/GlassToast
  ctaSecondary?: { label: string; onClick: () => void };
  background?: 'particles' | 'gradient' | 'mesh';
  showTicker?: boolean;
}
```

**Implementation Steps:**
1. Create `src/components/hero/` directory
2. Build `GlassHero.tsx` with ambient background animation
3. Add particle system using Canvas API
4. Implement gradient mesh with WebGL
5. Add live ticker component
6. Create TypeScript types
7. Add unit tests
8. Export from `src/components/index.ts`

**Subcomponents:**
- `AmbientBackground.tsx` - Particle/gradient animation
- `HeroContent.tsx` - Centered text with glass overlay
- `HeroCTA.tsx` - Animated button group
- `LiveTicker.tsx` - Scrolling market data

#### B. `GlassKPICard.tsx`
```typescript
// NEW FILE: src/components/data-display/GlassKPICard.tsx
interface GlassKPICardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  sparkline?: number[];
  icon?: LucideIcon;
}
```

**Implementation Steps:**
1. Create `src/components/data-display/GlassKPICard.tsx`
2. Implement sparkline SVG rendering
3. Add trend indicator with color coding
4. Support multiple sizes (sm, md, lg)
5. Add shimmer loading state
6. Export from index

#### C. `GlassSearchBar.tsx`
```typescript
// NEW FILE: src/components/forms/GlassSearchBar.tsx
interface GlassSearchBarProps {
  placeholder?: string;
  shortcut?: string;
  onSearch: (query: string) => void;
  results?: SearchResult[];
  showResults?: boolean;
}
```

**Implementation Steps:**
1. Create `src/components/forms/GlassSearchBar.tsx`
2. Add keyboard shortcut support (⌘K / ⌘J)
3. Implement dropdown results
4. Add keyboard navigation
5. Connect to existing search API
6. Export from index

#### D. `GlassCategorySection.tsx`
```typescript
// NEW FILE: src/components/layout/GlassCategorySection.tsx
interface GlassCategorySectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  viewAllHref?: string;
  count?: number;
}
```

### 1.2 Homepage Redesign (`src/pages/Home.tsx`)

#### Current Layout
```tsx
// BEFORE
export const Home = () => (
  <div className="p-8">
    <h1>LiquidCrypto</h1>
    <p>A crypto trading platform</p>
    <FeatureCards />
  </div>
);
```

#### New Layout
```tsx
// AFTER - Complete rewrite
export const Home = () => (
  <div className="min-h-screen">
    {/* Immersive Hero Section */}
    <GlassHero
      title="Trading, Evolved"
      subtitle="AI-powered analytics meet Apple's Liquid Glass"
      ctaPrimary={{ label: 'Start Trading', onClick: () => navigate('/trading') }}
      ctaSecondary={{ label: 'Watch Demo', onClick: () => navigate('/showcase') }}
      background="particles"
      showTicker={true}
    />
    
    {/* Value Proposition - Bento Grid */}
    <section className="py-20 px-8">
      <h2 className="text-3xl font-bold mb-12 text-center">
        Why LiquidCrypto?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <GlassKPICard
          label="Active Traders"
          value="50K+"
          icon={Users}
        />
        <GlassKPICard
          label="Daily Volume"
          value="$2.5B"
          icon={TrendingUp}
        />
        <GlassKPICard
          label="Uptime"
          value="99.99%"
          icon={Clock}
        />
      </div>
    </section>
    
    {/* Feature Showcase - Bento Grid */}
    <section className="py-20 px-8 bg-[var(--glass-surface)]">
      <h2 className="text-3xl font-bold mb-12 text-center">
        Everything You Need
      </h2>
      
      <FeatureBentoGrid />
    </section>
    
    {/* Live Demo Preview */}
    <section className="py-20 px-8">
      <h2 className="text-3xl font-bold mb-12 text-center">
        Try It Now
      </h2>
      <GlassCopilotPreview />
    </section>
    
    {/* Testimonials / Social Proof */}
    <section className="py-20 px-8">
      <TestimonialCarousel />
    </section>
  </div>
);
```

### 1.3 Navigation Updates (`src/components/GlassTopNav.tsx`)

#### Changes Required

1. **Responsive Breakpoints**
```tsx
// Add mobile menu toggle
<GlassButton 
  variant="ghost" 
  icon={Menu} 
  onClick={() => setMobileMenuOpen(true)}
  className="md:hidden"
/>
```

2. **Bottom Navigation (Mobile)**
```tsx
// NEW: src/components/navigation/GlassBottomNav.tsx
export const GlassBottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50">
    <GlassBottomNav>
      <NavItem icon={Home} href="/" label="Home" />
      <NavItem icon={Chart} href="/trading" label="Trade" />
      <NavItem icon={Bot} href="/analytics" label="AI" />
      <NavItem icon={Settings} href="/settings" label="Settings" />
    </GlassBottomNav>
  </nav>
);
```

3. **Command Palette Enhancement**
```tsx
// Extend existing GlassCommandPalette
// Add:
- Search within settings
- Quick actions for demos
- Keyboard shortcuts cheat sheet
```

### 1.4 Files to Create/Modify

| File | Action | Type |
|------|--------|------|
| `src/components/hero/GlassHero.tsx` | Create | Component |
| `src/components/hero/AmbientBackground.tsx` | Create | Component |
| `src/components/hero/HeroContent.tsx` | Create | Component |
| `src/components/hero/LiveTicker.tsx` | Create | Component |
| `src/components/data-display/GlassKPICard.tsx` | Create | Component |
| `src/components/forms/GlassSearchBar.tsx` | Create | Component |
| `src/components/navigation/GlassBottomNav.tsx` | Create | Component |
| `src/components/layout/GlassCategorySection.tsx` | Create | Component |
| `src/pages/Home.tsx` | Modify | Page |
| `src/components/GlassTopNav.tsx` | Modify | Component |
| `src/components/GlassCommandPalette.tsx` | Modify | Component |
| `src/components/index.ts` | Modify | Exports |

### 1.5 Implementation Checklist

- [ ] Create hero directory structure
- [ ] Build AmbientBackground with particle system
- [ ] Build LiveTicker with real data
- [ ] Build GlassHero with all variants
- [ ] Create GlassKPICard with sparklines
- [ ] Build GlassSearchBar with ⌘K support
- [ ] Create bottom navigation
- [ ] Rewrite Homepage with new layout
- [ ] Add FeatureBentoGrid component
- [ ] Add TestimonialCarousel
- [ ] Update GlassTopNav for mobile
- [ ] Extend command palette
- [ ] Add unit tests for all components
- [ ] Update snapshots
- [ ] Verify accessibility (keyboard, screen reader)
- [ ] Test on mobile devices
- [ ] Measure Core Web Vitals

---

## Phase 2: Trading Dashboard Redesign

**Duration:** 3 weeks  
**Priority:** Critical  
**Files Affected:** 18

### 2.1 New Components Required

#### A. `GlassTradingGrid.tsx` (Bento Grid)
```typescript
// NEW FILE: src/components/trading/GlassTradingGrid.tsx
interface GridItem {
  id: string;
  span?: 'small' | 'medium' | 'large' | 'full';
  children: ReactNode;
}

interface GlassTradingGridProps {
  children: GridItem[];
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
}
```

#### B. `GlassOrderEntry.tsx`
```typescript
// NEW FILE: src/components/trading/GlassOrderEntry.tsx
interface GlassOrderEntryProps {
  symbol: string;
  onOrder: (order: Order) => void;
  currentPrice?: number;
}
```

**Subcomponents:**
- `OrderTypeSelector.tsx` - Buy/Sell toggle
- `PriceInput.tsx` - Limit/Market/Stop inputs
- `AmountInput.tsx` - Size input with slider
- `OrderSummary.tsx` - Estimated cost/amount
- `OrderButton.tsx` - Large CTA button

#### C. `GlassPositionsList.tsx`
```typescript
// NEW FILE: src/components/trading/GlassPositionsList.tsx
interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface GlassPositionsListProps {
  positions: Position[];
  onClose?: (symbol: string) => void;
  expandable?: boolean;
}
```

#### D. `GlassAlertPanel.tsx`
```typescript
// NEW FILE: src/components/trading/GlassAlertPanel.tsx
interface Alert {
  id: string;
  type: 'price' | 'volume' | 'percent';
  target: number;
  current: number;
  triggered?: boolean;
}

interface GlassAlertPanelProps {
  alerts: Alert[];
  onCreate?: () => void;
  onEdit?: (id: string) => void;
}
```

#### E. `GlassRecentTrades.tsx`
```typescript
// NEW FILE: src/components/trading/GlassRecentTrades.tsx
interface Trade {
  id: string;
  side: 'buy' | 'sell';
  symbol: string;
  price: number;
  amount: number;
  time: string;
}

interface GlassRecentTradesProps {
  trades: Trade[];
  maxItems?: number;
}
```

#### F. `GlassMarketTicker.tsx`
```typescript
// NEW FILE: src/components/trading/GlassMarketTicker.tsx
interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

interface GlassMarketTickerProps {
  items: TickerItem[];
  scroll?: boolean;
}
```

### 2.2 Trading Dashboard Rewrite (`src/pages/trading/Dashboard.tsx`)

#### Current Layout
```tsx
// BEFORE
export const Dashboard = () => (
  <div className="p-6">
    <h1>Trading Dashboard</h1>
    <GlassCandlestickChart data={data} />
    <PositionsTable positions={positions} />
  </div>
);
```

#### New Layout
```tsx
// AFTER - Complete rewrite
export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('candlestick');

  return (
    <div className="min-h-screen pb-24">
      {/* Market Ticker */}
      <GlassMarketTicker items={tickerData} scroll={true} />
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BTC/USD</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-3xl font-mono">$96,234.50</span>
              <GlassBadge type="success">+2.4%</GlassBadge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <GlassButtonGroup>
              <GlassButton size="sm" variant="ghost">1H</GlassButton>
              <GlassButton size="sm" variant="secondary">4H</GlassButton>
              <GlassButton size="sm" variant="ghost">1D</GlassButton>
            </GlassButtonGroup>
            
            <GlassButton variant="glass" size="sm" icon={Settings}>
              Layout
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="p-6">
        <GlassTradingGrid columns={4} gap="md">
          {/* Primary Chart - 2x2 */}
          <GridItem span="large">
            <GlassCard className="h-full">
              <GlassCard.Header>
                <div className="flex items-center justify-between">
                  <GlassTabs
                    items={[
                      { id: 'candlestick', label: 'Candles' },
                      { id: 'line', label: 'Line' },
                      { id: 'depth', label: 'Depth' },
                    ]}
                    value={chartType}
                    onChange={setChartType}
                    variant="pills"
                    size="sm"
                  />
                  
                  <GlassButtonGroup size="sm">
                    <GlassButton variant="ghost" icon={Plus} />
                    <GlassButton variant="ghost" icon={Minus} />
                    <GlassButton variant="ghost" icon={Maximize2} />
                  </GlassButtonGroup>
                </div>
              </GlassCard.Header>
              
              <GlassCard.Content>
                <GlassCandlestickChart
                  data={ohlcvData}
                  interactive={true}
                  annotations={annotations}
                  patterns={detectedPatterns}
                  height={400}
                />
              </GlassCard.Content>
            </GlassCard>
          </GridItem>
          
          {/* Order Entry */}
          <GridItem>
            <GlassOrderEntry
              symbol="BTC"
              currentPrice={96234.50}
              onOrder={handleOrder}
            />
          </GridItem>
          
          {/* Positions */}
          <GridItem>
            <GlassCard className="h-full">
              <GlassCard.Header>
                <GlassCard.Title>Positions</GlassCard.Title>
                <GlassBadge type="info">3 Active</GlassBadge>
              </GlassCard.Header>
              
              <GlassCard.Content className="p-0">
                <GlassPositionsList
                  positions={positions}
                  expandable={true}
                  onClose={handleClosePosition}
                />
              </GlassCard.Content>
            </GlassCard>
          </GridItem>
          
          {/* Recent Trades */}
          <GridItem>
            <GlassCard className="h-full">
              <GlassCard.Header>
                <GlassCard.Title>Recent Trades</GlassCard.Title>
                <GlassBadge type="default">Live</GlassBadge>
              </GlassCard.Header>
              
              <GlassCard.Content className="p-0">
                <GlassRecentTrades
                  trades={recentTrades}
                  maxItems={10}
                />
              </GlassCard.Content>
            </GlassCard>
          </GridItem>
          
          {/* Alerts */}
          <GridItem>
            <GlassCard className="h-full">
              <GlassCard.Header>
                <GlassCard.Title>Price Alerts</GlassCard.Title>
                <GlassButton variant="ghost" size="sm" icon={Plus}>
                  Add
                </GlassButton>
              </GlassCard.Header>
              
              <GlassCard.Content className="p-0">
                <GlassAlertPanel
                  alerts={alerts}
                  onCreate={handleCreateAlert}
                  onEdit={handleEditAlert}
                />
              </GlassCard.Content>
            </GlassCard>
          </GridItem>
        </GlassTradingGrid>
      </div>
    </div>
  );
};
