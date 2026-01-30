# Subscription & Analytics System

> Mock subscription tiers with paywall toggle and key metrics tracking.

---

## Subscription Tiers

| Tier | Name | Price | Key Features |
|------|------|-------|--------------|
| `beater` | Treiber | Free | Daily Cockpit, Basic Journal, Offline Maps |
| `paechter` | Pächter | €49/yr | Scout AI, Bureaucracy, Exports, Waidmann-Feed |
| `forst` | Forst | €199/yr | Multi-Revier, Team Admin, API Access |

---

## Usage

### Store

```typescript
import { useSubscriptionStore, useSubscription, useFeatureAccess } from '@/applications/jagd-agenten/stores';

// Get current subscription info
const { tier, plan, isPremium, paywallEnabled } = useSubscription();

// Check feature access
const hasScoutAccess = useFeatureAccess('scout_recommendations');

// Modify subscription (mock)
const { setPaywallEnabled, upgradeTo, setTier } = useSubscriptionStore();
```

### Paywall Toggle

```typescript
// Enable paywall (premium features gated)
setPaywallEnabled(true);

// Disable paywall (all features accessible for testing)
setPaywallEnabled(false);
```

### Feature Gating

```tsx
import { PremiumGate, PremiumBadge } from '@/applications/jagd-agenten/components';

// Wrap premium content
<PremiumGate feature="weekly_explore">
  <WeeklyExploreDashboard />
</PremiumGate>

// With custom fallback
<PremiumGate feature="scout_recommendations" fallback={<BasicRecommendations />}>
  <AIRecommendations />
</PremiumGate>

// Show premium badge
<h3>Scout <PremiumBadge /></h3>
```

### Premium Features

| Feature ID | Required Tier |
|------------|---------------|
| `scout_recommendations` | paechter |
| `bureaucracy_automation` | paechter |
| `export_packs` | paechter |
| `pack_events` | paechter |
| `weekly_explore` | paechter |
| `waidmann_feed_full` | paechter |
| `gear_health` | paechter |
| `multi_revier` | forst |
| `team_admin` | forst |
| `api_access` | forst |

---

## Settings UI

```tsx
import { SubscriptionSettings } from '@/applications/jagd-agenten/components';

<SubscriptionSettings />
```

**Features:**
- Paywall toggle (yellow warning box)
- Current plan display
- Mock tier selector (for testing)
- Feature list per tier

---

## Analytics

### Tracked Metrics

| Category | Metrics |
|----------|---------|
| **Hunts** | Started, Completed, Completion Rate |
| **Safety** | Events, Check-in Rate, Check-out Rate, Adoption Rate |
| **Trust** | Sightings Shared, Stories Published, Insights Opt-in |

### Store Usage

```typescript
import { useAnalyticsStore, useAnalyticsSummary } from '@/applications/jagd-agenten/stores';

// Record events
const { recordHuntStarted, recordHuntCompleted, recordEventCheckIn } = useAnalyticsStore();

recordHuntStarted();
recordHuntCompleted(true); // true = with end time

// Get summary
const { hunts, safety, trust } = useAnalyticsSummary();
console.log(`Completion rate: ${hunts.completionRate}%`);
```

### Dashboard

```tsx
import { AnalyticsDashboard } from '@/applications/jagd-agenten/components';

<AnalyticsDashboard />
```

**Sections:**
- Jagden (hunts started/completed/rate)
- Sicherheit (events/check-in/adoption rate)
- Vertrauen & Community (sightings/stories/sharing rate)

---

## Files

| File | Purpose |
|------|---------|
| `stores/subscriptionStore.ts` | Subscription state + paywall toggle |
| `stores/analyticsStore.ts` | Metrics tracking |
| `components/PremiumGate.tsx` | Feature wrapper |
| `components/SubscriptionSettings.tsx` | Settings UI |
| `components/AnalyticsDashboard.tsx` | Metrics display |
