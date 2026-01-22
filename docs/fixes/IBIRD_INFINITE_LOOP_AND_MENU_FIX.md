# iBird Infinite Loop and Menu Duplication Fix

**Commit:** `5f08a8c` - fix(ibird): Fix infinite loops and simplify Gmail OAuth
**Date:** 2026-01-22
**Files Changed:** 7 files

---

## Summary of Issues

### Issue 1: Infinite Re-render Loops in Calendar and Appointments Views

**Root Cause:** Zustand selectors using `new Date()` inside selector functions caused infinite re-renders because:
- Every render created a new Date object
- The selector returned a new array reference each time
- React detected "new" data and re-rendered
- This created an infinite loop

**Affected Components:**
- `IBirdAppointmentsView.tsx`
- `IBirdCalendarView.tsx` (WeekView and MonthView)

**Original Problematic Pattern:**
```typescript
// In ibirdStore.ts - these selectors were unstable
export const useUpcomingBookings = () =>
  useIBirdStore((state) => {
    const now = new Date();  // NEW DATE EVERY RENDER = infinite loop
    return state.bookings.filter((b) => {
      const bookingDate = new Date(`${b.scheduledDate}T${b.startTime}`);
      return bookingDate >= now && b.status !== 'cancelled';
    });
  });

export const useEventsInRange = (startDate: string, endDate: string) =>
  useIBirdStore((state) => {
    // Creating new arrays every render
    return state.events.filter(...);
  });
```

**Fix Applied:** Move date-dependent computations into the component using `useMemo`:

```typescript
// IBirdAppointmentsView.tsx - FIXED
export function IBirdAppointmentsView() {
  const { bookings: allBookings, appointmentTypes: allAppointmentTypes } = useIBirdStore();

  // Compute locally with useMemo - stable reference
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return allBookings
      .filter((b) => {
        const bookingDate = new Date(`${b.scheduledDate}T${b.startTime}`);
        return bookingDate >= now && b.status !== 'cancelled';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.startTime}`);
        const dateB = new Date(`${b.scheduledDate}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [allBookings]);  // Only recompute when allBookings changes

  const appointmentTypes = useMemo(() => {
    return allAppointmentTypes.filter((t) => t.isActive);
  }, [allAppointmentTypes]);

  // ...
}
```

```typescript
// IBirdCalendarView.tsx WeekView - FIXED
function WeekView() {
  const { calendars, events: allStoreEvents } = useIBirdStore();
  const calendarViewDate = ui.calendarViewDate;  // Use string, not Date object

  const weekDays = useMemo(() => {
    const viewDate = new Date(calendarViewDate);  // Create Date inside useMemo
    // ... generate week days
  }, [calendarViewDate]);  // Depend on string, not Date

  const events = useMemo(() => {
    const startDate = weekDays[0].toISOString().split('T')[0];
    const endDate = weekDays[6].toISOString().split('T')[0];
    // ... filter events
  }, [weekDays, calendars, allStoreEvents]);
}
```

---

### Issue 2: Menu Bar Duplication (Two Menus Showing)

**Root Cause:** When iBird app was active, both:
1. System menus (File, Edit, View, Go, Agent, Memory, Context, Help) AND
2. App menus (iBird, File, Edit, View, Window, Help)

...were being displayed simultaneously, causing a confusing double menu bar.

**Location:** `src/components/menu-bar/zones/LeftZone.tsx`

**Original Problematic Code:**
```typescript
// All menus in order (standard + custom + context + help)
const allMenus = [
    ...standardMenus,      // System menus
    ...state.customMenus,  // App menus (iBird)
    { id: 'context', ... },
    { id: 'help', ... },
];
// Result: BOTH system and app menus shown = duplication
```

**Fix Applied:** Show EITHER system menus OR app menus, not both:

```typescript
// LeftZone.tsx - FIXED
const standardMenus = [
    { id: 'file', label: 'File', items: fileMenuItems },
    { id: 'edit', label: 'Edit', items: editMenuItems },
    // ... other system menus including context and help
];

// Determine if an app is active (has registered custom menus)
const isAppActive = state.appName !== 'LiquidOS' && state.customMenus.length > 0;

// When an app is active, show only its custom menus
// When no app is active, show the standard system menus
const allMenus = isAppActive ? state.customMenus : standardMenus;
```

---

### Issue 3: Zustand Persist Merge Handling Undefined

**Root Cause:** When loading persisted state, `ui.composeWindows` could be undefined, causing crashes when accessing `.length` or `.map()`.

**Locations:**
- `src/stores/ibirdStore.ts` (persist merge function)
- `src/components/features/ibird/IBirdApp.tsx` (accessing composeWindows)

**Fix Applied:**

```typescript
// ibirdStore.ts - Add merge function to persist config
persist(
  // ... store creation
  {
    name: 'ibird-storage',
    partialize: (state) => ({ /* ... */ }),
    merge: (persistedState, currentState) => {
      const persisted = persistedState as Partial<IBirdState>;
      return {
        ...currentState,
        settings: { ...currentState.settings, ...persisted.settings },
        ui: { ...currentState.ui, ...persisted.ui },
      };
    },
  }
)

// IBirdApp.tsx - Use optional chaining
// Before: ui.composeWindows.length
// After:  ui.composeWindows?.length

// Before: ui.composeWindows.map(...)
// After:  (ui.composeWindows ?? []).map(...)
```

---

### Issue 4: Selector Stability for Empty Arrays

**Root Cause:** Selectors returning `state.folders[accountId] ?? []` created a new empty array reference each time, causing unnecessary re-renders.

**Fix Applied:** Use stable empty array constants:

```typescript
// ibirdStore.ts - FIXED
const EMPTY_FOLDERS: MailFolder[] = [];
const EMPTY_LABELS: MailLabel[] = [];

export const useAccountFolders = (accountId: string) =>
  useIBirdStore((state) => state.folders[accountId] || EMPTY_FOLDERS);

export const useAccountLabels = (accountId: string) =>
  useIBirdStore((state) => state.labels[accountId] || EMPTY_LABELS);
```

---

### Additional Change: Simplified Gmail OAuth

**Change:** Removed Outlook, iCloud, and IMAP options from the Add Email Account modal. Now only Gmail OAuth is available.

**File:** `src/components/features/ibird/IBirdModals.tsx`

**Rationale:** User requested simplification to Gmail-only.

---

## Key Patterns to Avoid in Future

### Pattern 1: Never Use `new Date()` in Zustand Selectors
```typescript
// BAD - causes infinite loops
export const useUpcomingItems = () =>
  useIBirdStore((state) => {
    const now = new Date();  // Creates new reference every render
    return state.items.filter(item => item.date > now);
  });

// GOOD - compute in component with useMemo
function MyComponent() {
  const items = useIBirdStore(state => state.items);
  const upcomingItems = useMemo(() => {
    const now = new Date();
    return items.filter(item => item.date > now);
  }, [items]);
}
```

### Pattern 2: Use Stable Empty Array Constants
```typescript
// BAD - creates new array reference each call
export const useItems = (id: string) =>
  useStore(state => state.items[id] ?? []);

// GOOD - stable reference
const EMPTY_ARRAY: Item[] = [];
export const useItems = (id: string) =>
  useStore(state => state.items[id] || EMPTY_ARRAY);
```

### Pattern 3: App Menus Replace System Menus, Not Append
```typescript
// BAD - shows both
const allMenus = [...systemMenus, ...appMenus];

// GOOD - shows one or the other
const allMenus = isAppActive ? appMenus : systemMenus;
```

### Pattern 4: Always Handle Undefined in Persisted State
```typescript
// BAD - assumes property exists
{ui.composeWindows.map(...)}

// GOOD - handle undefined
{(ui.composeWindows ?? []).map(...)}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/features/ibird/IBirdApp.tsx` | Optional chaining for `composeWindows` |
| `src/components/features/ibird/IBirdModals.tsx` | Simplified to Gmail OAuth only |
| `src/components/features/ibird/appointments/IBirdAppointmentsView.tsx` | Local `useMemo` for bookings/types |
| `src/components/features/ibird/calendar/IBirdCalendarView.tsx` | Local `useMemo` for events in WeekView/MonthView |
| `src/components/features/ibird/hooks/useIBirdMenuBar.ts` | Updated to use MenuBarContext API |
| `src/components/menu-bar/zones/LeftZone.tsx` | Fixed menu duplication logic |
| `src/stores/ibirdStore.ts` | Added persist merge function, stable empty arrays |

---

## Testing Checklist

After making similar changes, verify:

1. [ ] Calendar WeekView renders without freezing
2. [ ] Calendar MonthView renders without freezing
3. [ ] Appointments view loads without infinite loop
4. [ ] Menu bar shows ONLY app menus when app is focused
5. [ ] Menu bar shows ONLY system menus when no app is focused
6. [ ] App survives page refresh (persisted state loads correctly)
7. [ ] Empty state (no emails/events) doesn't cause crashes
