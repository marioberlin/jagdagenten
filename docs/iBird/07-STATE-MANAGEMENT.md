# iBird State Management

## Overview

iBird uses Zustand for state management with the following stores:
- **mailStore** - Mail accounts, folders, messages, compose state
- **calendarStore** - Calendars, events, views, modals
- **appointmentsStore** - Appointment types, bookings, availability
- **ibirdStore** - Global app state, module navigation, settings

---

## 1. Global iBird Store

```typescript
// client/src/stores/ibird/ibirdStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IBirdState {
  // Module navigation
  activeModule: 'mail' | 'calendar' | 'appointments';
  setActiveModule: (module: IBirdState['activeModule']) => void;

  // Layout
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // User settings
  settings: IBirdSettings;
  updateSettings: (updates: Partial<IBirdSettings>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Sync status
  syncStatus: Record<string, SyncStatus>;
  setSyncStatus: (key: string, status: SyncStatus) => void;
}

interface IBirdSettings {
  theme: 'dark' | 'light' | 'system';
  defaultModule: 'mail' | 'calendar' | 'appointments';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  createdAt: Date;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

export const useIBirdStore = create<IBirdState>()(
  persist(
    (set, get) => ({
      // Module navigation
      activeModule: 'mail',
      setActiveModule: (module) => set({ activeModule: module }),

      // Layout
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // User settings
      settings: {
        theme: 'dark',
        defaultModule: 'mail',
        notificationsEnabled: true,
        soundEnabled: true,
        compactMode: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          },
          ...state.notifications.slice(0, 49), // Keep max 50
        ]
      })),
      dismissNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),

      // Sync status
      syncStatus: {},
      setSyncStatus: (key, status) => set((state) => ({
        syncStatus: { ...state.syncStatus, [key]: status }
      })),
    }),
    {
      name: 'ibird-store',
      partialize: (state) => ({
        activeModule: state.activeModule,
        sidebarCollapsed: state.sidebarCollapsed,
        settings: state.settings,
      }),
    }
  )
);
```

---

## 2. Mail Store

```typescript
// client/src/stores/ibird/mailStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MailState {
  // Accounts
  accounts: MailAccount[];
  selectedAccountId: string | null;
  setSelectedAccount: (id: string | null) => void;

  // Folders
  folders: MailFolder[];
  selectedFolderId: string | null;
  setSelectedFolder: (id: string | null) => void;
  expandedFolderIds: Set<string>;
  toggleFolderExpanded: (id: string) => void;

  // Messages
  messages: MailMessage[];
  selectedMessageId: string | null;
  setSelectedMessage: (id: string | null) => void;
  selectedMessageIds: Set<string>;
  toggleMessageSelection: (id: string) => void;
  selectAllMessages: () => void;
  clearSelection: () => void;

  // Threading
  threadView: boolean;
  setThreadView: (enabled: boolean) => void;

  // Sorting & Filtering
  sortBy: 'date' | 'from' | 'subject' | 'size';
  sortOrder: 'asc' | 'desc';
  setSorting: (by: MailState['sortBy'], order: MailState['sortOrder']) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: MailFilters;
  setFilters: (filters: MailFilters) => void;

  // Compose
  isComposeOpen: boolean;
  composeDraft: ComposeDraft | null;
  openCompose: (draft?: Partial<ComposeDraft>) => void;
  closeCompose: () => void;
  updateDraft: (updates: Partial<ComposeDraft>) => void;

  // Layout
  sidebarWidth: number;
  listWidth: number;
  setSidebarWidth: (width: number) => void;
  setListWidth: (width: number) => void;

  // Actions
  fetchAccounts: () => Promise<void>;
  fetchFolders: (accountId: string) => Promise<void>;
  fetchMessages: (folderId: string, options?: FetchOptions) => Promise<void>;
  fetchMessage: (messageId: string) => Promise<MailMessage>;
  sendMessage: () => Promise<void>;
  saveDraft: () => Promise<void>;
  deleteMessages: (ids: string[]) => Promise<void>;
  moveMessages: (ids: string[], folderId: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleRead: (id: string) => Promise<void>;
  markAsRead: (ids: string[]) => Promise<void>;
  markAsUnread: (ids: string[]) => Promise<void>;

  // Loading states
  isLoadingAccounts: boolean;
  isLoadingFolders: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

interface MailFilters {
  unreadOnly: boolean;
  starredOnly: boolean;
  hasAttachments: boolean;
  labelIds: string[];
  dateRange: { start: Date; end: Date } | null;
}

interface ComposeDraft {
  id?: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: Attachment[];
  replyTo?: string; // message ID
  forwardFrom?: string; // message ID
  identityId?: string;
}

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      // Accounts
      accounts: [],
      selectedAccountId: null,
      setSelectedAccount: (id) => set({ selectedAccountId: id }),

      // Folders
      folders: [],
      selectedFolderId: null,
      setSelectedFolder: (id) => {
        set({ selectedFolderId: id, selectedMessageId: null });
        if (id) get().fetchMessages(id);
      },
      expandedFolderIds: new Set(),
      toggleFolderExpanded: (id) => set((state) => {
        const expanded = new Set(state.expandedFolderIds);
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
        return { expandedFolderIds: expanded };
      }),

      // Messages
      messages: [],
      selectedMessageId: null,
      setSelectedMessage: async (id) => {
        set({ selectedMessageId: id });
        if (id) {
          const message = await get().fetchMessage(id);
          if (!message.isRead) {
            await get().markAsRead([id]);
          }
        }
      },
      selectedMessageIds: new Set(),
      toggleMessageSelection: (id) => set((state) => {
        const selected = new Set(state.selectedMessageIds);
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        return { selectedMessageIds: selected };
      }),
      selectAllMessages: () => set((state) => ({
        selectedMessageIds: new Set(state.messages.map(m => m.id))
      })),
      clearSelection: () => set({ selectedMessageIds: new Set() }),

      // Threading
      threadView: true,
      setThreadView: (enabled) => set({ threadView: enabled }),

      // Sorting & Filtering
      sortBy: 'date',
      sortOrder: 'desc',
      setSorting: (by, order) => set({ sortBy: by, sortOrder: order }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      activeFilters: {
        unreadOnly: false,
        starredOnly: false,
        hasAttachments: false,
        labelIds: [],
        dateRange: null,
      },
      setFilters: (filters) => set({ activeFilters: filters }),

      // Compose
      isComposeOpen: false,
      composeDraft: null,
      openCompose: (draft) => set({
        isComposeOpen: true,
        composeDraft: {
          to: [],
          cc: [],
          bcc: [],
          subject: '',
          bodyHtml: '',
          bodyText: '',
          attachments: [],
          ...draft,
        },
      }),
      closeCompose: () => set({ isComposeOpen: false, composeDraft: null }),
      updateDraft: (updates) => set((state) => ({
        composeDraft: state.composeDraft ? { ...state.composeDraft, ...updates } : null
      })),

      // Layout
      sidebarWidth: 220,
      listWidth: 350,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setListWidth: (width) => set({ listWidth: width }),

      // Loading states
      isLoadingAccounts: false,
      isLoadingFolders: false,
      isLoadingMessages: false,
      isSending: false,

      // Actions
      fetchAccounts: async () => {
        set({ isLoadingAccounts: true });
        try {
          const res = await fetch('/api/ibird/mail/accounts');
          const accounts = await res.json();
          set({ accounts });
          if (accounts.length > 0 && !get().selectedAccountId) {
            set({ selectedAccountId: accounts[0].id });
            get().fetchFolders(accounts[0].id);
          }
        } finally {
          set({ isLoadingAccounts: false });
        }
      },

      fetchFolders: async (accountId) => {
        set({ isLoadingFolders: true });
        try {
          const res = await fetch(`/api/ibird/mail/accounts/${accountId}/folders`);
          const folders = await res.json();
          set({ folders });
          const inbox = folders.find((f: MailFolder) => f.type === 'inbox');
          if (inbox && !get().selectedFolderId) {
            get().setSelectedFolder(inbox.id);
          }
        } finally {
          set({ isLoadingFolders: false });
        }
      },

      fetchMessages: async (folderId, options) => {
        set({ isLoadingMessages: true });
        try {
          const params = new URLSearchParams();
          if (options?.page) params.set('page', options.page.toString());
          if (options?.limit) params.set('limit', options.limit.toString());

          const res = await fetch(`/api/ibird/mail/folders/${folderId}/messages?${params}`);
          const data = await res.json();
          set({ messages: data.messages });
        } finally {
          set({ isLoadingMessages: false });
        }
      },

      fetchMessage: async (messageId) => {
        const res = await fetch(`/api/ibird/mail/messages/${messageId}`);
        const message = await res.json();

        // Update message in list
        set((state) => ({
          messages: state.messages.map(m =>
            m.id === messageId ? message : m
          )
        }));

        return message;
      },

      sendMessage: async () => {
        const { composeDraft } = get();
        if (!composeDraft) return;

        set({ isSending: true });
        try {
          await fetch('/api/ibird/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(composeDraft),
          });
          get().closeCompose();
        } finally {
          set({ isSending: false });
        }
      },

      saveDraft: async () => {
        const { composeDraft } = get();
        if (!composeDraft) return;

        const res = await fetch('/api/ibird/mail/drafts', {
          method: composeDraft.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(composeDraft),
        });
        const saved = await res.json();
        set((state) => ({
          composeDraft: state.composeDraft ? { ...state.composeDraft, id: saved.id } : null
        }));
      },

      deleteMessages: async (ids) => {
        await fetch('/api/ibird/mail/messages/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        set((state) => ({
          messages: state.messages.filter(m => !ids.includes(m.id)),
          selectedMessageId: ids.includes(state.selectedMessageId || '') ? null : state.selectedMessageId,
        }));
      },

      moveMessages: async (ids, folderId) => {
        await fetch('/api/ibird/mail/messages/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, folderId }),
        });
        set((state) => ({
          messages: state.messages.filter(m => !ids.includes(m.id)),
        }));
      },

      toggleStar: async (id) => {
        const message = get().messages.find(m => m.id === id);
        if (!message) return;

        await fetch(`/api/ibird/mail/messages/${id}/star`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ starred: !message.isStarred }),
        });

        set((state) => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, isStarred: !m.isStarred } : m
          ),
        }));
      },

      toggleRead: async (id) => {
        const message = get().messages.find(m => m.id === id);
        if (!message) return;

        if (message.isRead) {
          await get().markAsUnread([id]);
        } else {
          await get().markAsRead([id]);
        }
      },

      markAsRead: async (ids) => {
        await fetch('/api/ibird/mail/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, read: true }),
        });

        set((state) => ({
          messages: state.messages.map(m =>
            ids.includes(m.id) ? { ...m, isRead: true } : m
          ),
        }));
      },

      markAsUnread: async (ids) => {
        await fetch('/api/ibird/mail/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, read: false }),
        });

        set((state) => ({
          messages: state.messages.map(m =>
            ids.includes(m.id) ? { ...m, isRead: false } : m
          ),
        }));
      },
    }),
    {
      name: 'ibird-mail-store',
      partialize: (state) => ({
        selectedAccountId: state.selectedAccountId,
        selectedFolderId: state.selectedFolderId,
        threadView: state.threadView,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        sidebarWidth: state.sidebarWidth,
        listWidth: state.listWidth,
      }),
    }
  )
);
```

---

## 3. Calendar Store

```typescript
// client/src/stores/ibird/calendarStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CalendarState {
  // Calendars
  calendars: Calendar[];
  visibleCalendarIds: Set<string>;
  toggleCalendarVisibility: (id: string) => void;

  // View
  currentView: 'day' | 'week' | 'month' | 'year' | 'agenda';
  setCurrentView: (view: CalendarState['currentView']) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  navigateToday: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;

  // Events
  events: CalendarEvent[];
  selectedEventId: string | null;

  // Event Popover
  popoverEvent: CalendarEvent | null;
  popoverPosition: { x: number; y: number };
  showPopover: (event: CalendarEvent, position: { x: number; y: number }) => void;
  closePopover: () => void;

  // Event Modal
  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  openEventModal: (event?: CalendarEvent) => void;
  closeEventModal: () => void;

  // Layout
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // Actions
  fetchCalendars: () => Promise<void>;
  fetchEvents: (start: Date, end: Date) => Promise<void>;
  saveEvent: (event: EventFormData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  duplicateEvent: (id: string) => Promise<void>;

  // Quick interactions
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onDateClick: (date: Date) => void;

  // Loading
  isLoadingCalendars: boolean;
  isLoadingEvents: boolean;
  isSaving: boolean;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Calendars
      calendars: [],
      visibleCalendarIds: new Set(),
      toggleCalendarVisibility: (id) => set((state) => {
        const visible = new Set(state.visibleCalendarIds);
        if (visible.has(id)) visible.delete(id);
        else visible.add(id);
        return { visibleCalendarIds: visible };
      }),

      // View
      currentView: 'week',
      setCurrentView: (view) => set({ currentView: view }),
      selectedDate: new Date(),
      setSelectedDate: (date) => set({ selectedDate: date }),
      navigateToday: () => set({ selectedDate: new Date() }),
      navigatePrevious: () => set((state) => {
        const { currentView, selectedDate } = state;
        let newDate: Date;
        switch (currentView) {
          case 'day': newDate = subDays(selectedDate, 1); break;
          case 'week': newDate = subWeeks(selectedDate, 1); break;
          case 'month': newDate = subMonths(selectedDate, 1); break;
          case 'year': newDate = subYears(selectedDate, 1); break;
          default: newDate = subWeeks(selectedDate, 1);
        }
        return { selectedDate: newDate };
      }),
      navigateNext: () => set((state) => {
        const { currentView, selectedDate } = state;
        let newDate: Date;
        switch (currentView) {
          case 'day': newDate = addDays(selectedDate, 1); break;
          case 'week': newDate = addWeeks(selectedDate, 1); break;
          case 'month': newDate = addMonths(selectedDate, 1); break;
          case 'year': newDate = addYears(selectedDate, 1); break;
          default: newDate = addWeeks(selectedDate, 1);
        }
        return { selectedDate: newDate };
      }),

      // Events
      events: [],
      selectedEventId: null,

      // Event Popover
      popoverEvent: null,
      popoverPosition: { x: 0, y: 0 },
      showPopover: (event, position) => set({
        popoverEvent: event,
        popoverPosition: position,
      }),
      closePopover: () => set({ popoverEvent: null }),

      // Event Modal
      isEventModalOpen: false,
      editingEvent: null,
      openEventModal: (event) => set({
        isEventModalOpen: true,
        editingEvent: event || null,
        popoverEvent: null,
      }),
      closeEventModal: () => set({
        isEventModalOpen: false,
        editingEvent: null,
      }),

      // Layout
      sidebarWidth: 220,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // Loading
      isLoadingCalendars: false,
      isLoadingEvents: false,
      isSaving: false,

      // Actions
      fetchCalendars: async () => {
        set({ isLoadingCalendars: true });
        try {
          const res = await fetch('/api/ibird/calendars');
          const calendars = await res.json();
          const visibleIds = new Set(calendars.map((c: Calendar) => c.id));
          set({ calendars, visibleCalendarIds: visibleIds });
        } finally {
          set({ isLoadingCalendars: false });
        }
      },

      fetchEvents: async (start, end) => {
        set({ isLoadingEvents: true });
        try {
          const params = new URLSearchParams({
            start: start.toISOString(),
            end: end.toISOString(),
          });
          const res = await fetch(`/api/ibird/events?${params}`);
          const events = await res.json();
          set({ events });
        } finally {
          set({ isLoadingEvents: false });
        }
      },

      saveEvent: async (eventData) => {
        set({ isSaving: true });
        try {
          const isNew = !eventData.id;
          const res = await fetch(
            isNew ? '/api/ibird/events' : `/api/ibird/events/${eventData.id}`,
            {
              method: isNew ? 'POST' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData),
            }
          );
          const savedEvent = await res.json();

          set((state) => ({
            events: isNew
              ? [...state.events, savedEvent]
              : state.events.map(e => e.id === savedEvent.id ? savedEvent : e),
          }));
        } finally {
          set({ isSaving: false });
        }
      },

      deleteEvent: async (id) => {
        await fetch(`/api/ibird/events/${id}`, { method: 'DELETE' });
        set((state) => ({
          events: state.events.filter(e => e.id !== id && e.originalEventId !== id),
          popoverEvent: state.popoverEvent?.id === id ? null : state.popoverEvent,
        }));
      },

      duplicateEvent: async (id) => {
        const event = get().events.find(e => e.id === id);
        if (!event) return;

        const duplicate = {
          ...event,
          id: undefined,
          title: `${event.title} (copy)`,
        };
        await get().saveEvent(duplicate);
      },

      // Quick interactions
      onEventClick: (event) => {
        get().showPopover(event, { x: 0, y: 0 }); // Position would be calculated from click event
      },

      onTimeSlotClick: (date, hour) => {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = addHours(startTime, 1);

        get().openEventModal({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAllDay: false,
        } as CalendarEvent);
      },

      onDateClick: (date) => {
        get().openEventModal({
          startTime: date.toISOString(),
          endTime: addDays(date, 1).toISOString(),
          isAllDay: true,
        } as CalendarEvent);
      },
    }),
    {
      name: 'ibird-calendar-store',
      partialize: (state) => ({
        currentView: state.currentView,
        sidebarWidth: state.sidebarWidth,
        visibleCalendarIds: Array.from(state.visibleCalendarIds),
      }),
    }
  )
);
```

---

## 4. Appointments Store

```typescript
// client/src/stores/ibird/appointmentsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppointmentsState {
  // Navigation
  currentView: 'dashboard' | 'type-editor' | 'availability' | 'booking-detail';
  setCurrentView: (view: AppointmentsState['currentView']) => void;

  // Appointment Types
  appointmentTypes: AppointmentType[];
  selectedTypeId: string | null;
  setSelectedType: (id: string | null) => void;

  // Bookings
  bookings: Booking[];
  selectedBookingId: string | null;
  setSelectedBooking: (id: string | null) => void;
  bookingFilters: BookingFilters;
  setBookingFilters: (filters: BookingFilters) => void;

  // Availability Schedules
  schedules: AvailabilitySchedule[];
  selectedScheduleId: string | null;
  setSelectedSchedule: (id: string | null) => void;

  // Layout
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // Actions
  fetchAppointmentTypes: () => Promise<void>;
  saveAppointmentType: (type: AppointmentTypeForm) => Promise<void>;
  deleteAppointmentType: (id: string) => Promise<void>;
  toggleTypeActive: (id: string) => Promise<void>;

  fetchBookings: (filters?: BookingFilters) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  rescheduleBooking: (id: string, newDate: string, newTime: string) => Promise<void>;

  fetchSchedules: () => Promise<void>;
  saveSchedule: (schedule: AvailabilityScheduleForm) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Loading
  isLoadingTypes: boolean;
  isLoadingBookings: boolean;
  isLoadingSchedules: boolean;
  isSaving: boolean;
}

interface BookingFilters {
  status: ('pending' | 'confirmed' | 'cancelled' | 'completed')[];
  typeId: string | null;
  dateRange: { start: Date; end: Date } | null;
  searchQuery: string;
}

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),

      // Appointment Types
      appointmentTypes: [],
      selectedTypeId: null,
      setSelectedType: (id) => {
        set({ selectedTypeId: id });
        if (id) set({ currentView: 'type-editor' });
      },

      // Bookings
      bookings: [],
      selectedBookingId: null,
      setSelectedBooking: (id) => {
        set({ selectedBookingId: id });
        if (id) set({ currentView: 'booking-detail' });
      },
      bookingFilters: {
        status: ['pending', 'confirmed'],
        typeId: null,
        dateRange: null,
        searchQuery: '',
      },
      setBookingFilters: (filters) => set({ bookingFilters: filters }),

      // Availability Schedules
      schedules: [],
      selectedScheduleId: null,
      setSelectedSchedule: (id) => {
        set({ selectedScheduleId: id });
        if (id) set({ currentView: 'availability' });
      },

      // Layout
      sidebarWidth: 260,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // Loading
      isLoadingTypes: false,
      isLoadingBookings: false,
      isLoadingSchedules: false,
      isSaving: false,

      // Actions
      fetchAppointmentTypes: async () => {
        set({ isLoadingTypes: true });
        try {
          const res = await fetch('/api/ibird/appointments/types');
          const types = await res.json();
          set({ appointmentTypes: types });
        } finally {
          set({ isLoadingTypes: false });
        }
      },

      saveAppointmentType: async (typeData) => {
        set({ isSaving: true });
        try {
          const isNew = !typeData.id;
          const res = await fetch(
            isNew ? '/api/ibird/appointments/types' : `/api/ibird/appointments/types/${typeData.id}`,
            {
              method: isNew ? 'POST' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(typeData),
            }
          );
          const savedType = await res.json();

          set((state) => ({
            appointmentTypes: isNew
              ? [...state.appointmentTypes, savedType]
              : state.appointmentTypes.map(t => t.id === savedType.id ? savedType : t),
            selectedTypeId: savedType.id,
          }));
        } finally {
          set({ isSaving: false });
        }
      },

      deleteAppointmentType: async (id) => {
        await fetch(`/api/ibird/appointments/types/${id}`, { method: 'DELETE' });
        set((state) => ({
          appointmentTypes: state.appointmentTypes.filter(t => t.id !== id),
          selectedTypeId: state.selectedTypeId === id ? null : state.selectedTypeId,
          currentView: state.selectedTypeId === id ? 'dashboard' : state.currentView,
        }));
      },

      toggleTypeActive: async (id) => {
        const type = get().appointmentTypes.find(t => t.id === id);
        if (!type) return;

        await fetch(`/api/ibird/appointments/types/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !type.isActive }),
        });

        set((state) => ({
          appointmentTypes: state.appointmentTypes.map(t =>
            t.id === id ? { ...t, isActive: !t.isActive } : t
          ),
        }));
      },

      fetchBookings: async (filters) => {
        set({ isLoadingBookings: true });
        try {
          const params = new URLSearchParams();
          const f = filters || get().bookingFilters;
          if (f.status.length) params.set('status', f.status.join(','));
          if (f.typeId) params.set('typeId', f.typeId);
          if (f.dateRange) {
            params.set('start', f.dateRange.start.toISOString());
            params.set('end', f.dateRange.end.toISOString());
          }
          if (f.searchQuery) params.set('q', f.searchQuery);

          const res = await fetch(`/api/ibird/bookings?${params}`);
          const bookings = await res.json();
          set({ bookings });
        } finally {
          set({ isLoadingBookings: false });
        }
      },

      confirmBooking: async (id) => {
        await fetch(`/api/ibird/bookings/${id}/confirm`, { method: 'POST' });
        set((state) => ({
          bookings: state.bookings.map(b =>
            b.id === id ? { ...b, status: 'confirmed' } : b
          ),
        }));
      },

      cancelBooking: async (id, reason) => {
        await fetch(`/api/ibird/bookings/${id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        set((state) => ({
          bookings: state.bookings.map(b =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        }));
      },

      rescheduleBooking: async (id, newDate, newTime) => {
        const res = await fetch(`/api/ibird/bookings/${id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: newDate, startTime: newTime }),
        });
        const updated = await res.json();
        set((state) => ({
          bookings: state.bookings.map(b => b.id === id ? updated : b),
        }));
      },

      fetchSchedules: async () => {
        set({ isLoadingSchedules: true });
        try {
          const res = await fetch('/api/ibird/availability/schedules');
          const schedules = await res.json();
          set({ schedules });
          if (schedules.length && !get().selectedScheduleId) {
            set({ selectedScheduleId: schedules[0].id });
          }
        } finally {
          set({ isLoadingSchedules: false });
        }
      },

      saveSchedule: async (scheduleData) => {
        set({ isSaving: true });
        try {
          const isNew = !scheduleData.id;
          const res = await fetch(
            isNew ? '/api/ibird/availability/schedules' : `/api/ibird/availability/schedules/${scheduleData.id}`,
            {
              method: isNew ? 'POST' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(scheduleData),
            }
          );
          const saved = await res.json();

          set((state) => ({
            schedules: isNew
              ? [...state.schedules, saved]
              : state.schedules.map(s => s.id === saved.id ? saved : s),
          }));
        } finally {
          set({ isSaving: false });
        }
      },

      deleteSchedule: async (id) => {
        await fetch(`/api/ibird/availability/schedules/${id}`, { method: 'DELETE' });
        set((state) => ({
          schedules: state.schedules.filter(s => s.id !== id),
          selectedScheduleId: state.selectedScheduleId === id ? null : state.selectedScheduleId,
        }));
      },
    }),
    {
      name: 'ibird-appointments-store',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        bookingFilters: state.bookingFilters,
      }),
    }
  )
);
```

---

## 5. Custom Hooks

```typescript
// client/src/hooks/ibird/useMailSync.ts

export function useMailSync() {
  const { accounts, fetchAccounts, fetchFolders, fetchMessages, selectedFolderId } = useMailStore();
  const { setSyncStatus } = useIBirdStore();

  const syncAccount = useCallback(async (accountId: string) => {
    setSyncStatus(`mail-${accountId}`, { isSyncing: true, lastSyncedAt: null, error: null });
    try {
      await fetch(`/api/ibird/mail/accounts/${accountId}/sync`, { method: 'POST' });
      await fetchFolders(accountId);
      if (selectedFolderId) {
        await fetchMessages(selectedFolderId);
      }
      setSyncStatus(`mail-${accountId}`, {
        isSyncing: false,
        lastSyncedAt: new Date(),
        error: null,
      });
    } catch (err: any) {
      setSyncStatus(`mail-${accountId}`, {
        isSyncing: false,
        lastSyncedAt: null,
        error: err.message,
      });
    }
  }, [fetchFolders, fetchMessages, selectedFolderId, setSyncStatus]);

  const syncAll = useCallback(async () => {
    await Promise.all(accounts.map(a => syncAccount(a.id)));
  }, [accounts, syncAccount]);

  // Auto-sync on mount and interval
  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const interval = setInterval(syncAll, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [syncAll]);

  return { syncAccount, syncAll };
}


// client/src/hooks/ibird/useCalendarSync.ts

export function useCalendarSync() {
  const { calendars, fetchCalendars, fetchEvents, selectedDate, currentView } = useCalendarStore();
  const { setSyncStatus } = useIBirdStore();

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    switch (currentView) {
      case 'day':
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
      case 'week':
        return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
      case 'month':
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      case 'year':
        return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
      default:
        return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
    }
  }, [selectedDate, currentView]);

  // Fetch events when date range changes
  useEffect(() => {
    fetchEvents(dateRange.start, dateRange.end);
  }, [dateRange.start.getTime(), dateRange.end.getTime()]);

  const syncCalendar = useCallback(async (calendarId: string) => {
    setSyncStatus(`calendar-${calendarId}`, { isSyncing: true, lastSyncedAt: null, error: null });
    try {
      await fetch(`/api/ibird/calendars/${calendarId}/sync`, { method: 'POST' });
      await fetchEvents(dateRange.start, dateRange.end);
      setSyncStatus(`calendar-${calendarId}`, {
        isSyncing: false,
        lastSyncedAt: new Date(),
        error: null,
      });
    } catch (err: any) {
      setSyncStatus(`calendar-${calendarId}`, {
        isSyncing: false,
        lastSyncedAt: null,
        error: err.message,
      });
    }
  }, [fetchEvents, dateRange, setSyncStatus]);

  // Initial fetch
  useEffect(() => {
    fetchCalendars();
  }, []);

  return { syncCalendar, dateRange };
}


// client/src/hooks/ibird/useBookingsCount.ts

export function useBookingsCount(typeId: string): number {
  const { bookings } = useAppointmentsStore();
  return useMemo(() =>
    bookings.filter(b =>
      b.appointmentTypeId === typeId &&
      ['pending', 'confirmed'].includes(b.status)
    ).length,
    [bookings, typeId]
  );
}


// client/src/hooks/ibird/useAppointmentStats.ts

export function useAppointmentStats() {
  const { bookings, fetchBookings } = useAppointmentsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings({
      status: ['pending', 'confirmed', 'cancelled', 'completed'],
      typeId: null,
      dateRange: {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date()),
      },
      searchQuery: '',
    }).finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => ({
    upcoming: bookings.filter(b => b.status === 'confirmed' && new Date(b.scheduledAt) > new Date()).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    total: bookings.length,
  }), [bookings]);

  return { stats, isLoading };
}
```

---

## Next Document

Continue to [08-IMPLEMENTATION-PHASES.md](./08-IMPLEMENTATION-PHASES.md) for detailed implementation phases.
