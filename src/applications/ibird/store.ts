/**
 * iBird Store - Email, Calendar & Appointments System
 *
 * Zustand store following Sparkles patterns for the iBird application.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// =============================================================================
// Type Definitions (Frontend)
// =============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export type FolderType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
export type CalendarSource = 'local' | 'google' | 'microsoft' | 'caldav';
export type LocationType = 'in_person' | 'phone' | 'video' | 'custom';
export type VideoProvider = 'zoom' | 'google_meet' | 'teams' | 'custom';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Mail Types
export interface MailAccount {
  id: string;
  email: string;
  displayName?: string;
  provider?: string;
  status: 'active' | 'error' | 'disabled';
  lastSyncAt?: string;
  lastError?: string;
}

export interface MailFolder {
  id: string;
  accountId: string;
  parentId?: string;
  name: string;
  path: string;
  folderType: FolderType;
  totalCount: number;
  unreadCount: number;
  children?: MailFolder[];
}

export interface MailMessage {
  id: string;
  accountId: string;
  folderId: string;
  messageId?: string;
  threadId?: string;
  subject?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo?: EmailAddress;
  sentAt?: string;
  receivedAt: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  labels?: MailLabel[];
}

export interface MailMessageListItem {
  id: string;
  threadId?: string;
  subject?: string;
  from: EmailAddress;
  snippet?: string;
  receivedAt: string;
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  labels?: MailLabel[];
}

export interface MailLabel {
  id: string;
  name: string;
  color: string;
}

export interface MailThread {
  id: string;
  messages: MailMessage[];
  subject?: string;
  latestDate: string;
  unreadCount: number;
  messageCount: number;
}

// Calendar Types
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  source: CalendarSource;
  isVisible: boolean;
  isPrimary: boolean;
  timezone: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  videoLink?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  status: EventStatus;
  attendees: EventAttendee[];
  organizer?: EmailAddress;
  color?: string;
  calendarName?: string;
  calendarColor?: string;
}

export interface EventAttendee extends EmailAddress {
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  required: boolean;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  until?: string;
  count?: number;
  byDayOfWeek?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
}

// Appointments Types
export interface AppointmentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  locationType: LocationType;
  locationAddress?: string;
  videoProvider?: VideoProvider;
  color: string;
  isActive: boolean;
  customFields: CustomField[];
}

export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

export interface AvailabilitySchedule {
  id: string;
  name: string;
  timezone: string;
  weeklyHours: WeeklyHours;
  isDefault: boolean;
}

export interface WeeklyHours {
  sunday: TimeSlot[];
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
}

export interface Booking {
  id: string;
  appointmentTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviteeTimezone?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  locationType?: LocationType;
  locationDetails?: string;
  notes?: string;
  customFieldResponses?: Record<string, string>;
  appointmentType?: AppointmentType;
}

export interface AvailableSlot {
  start: string;
  end: string;
}

// User Settings
export interface IBirdUserSettings {
  defaultModule: 'mail' | 'calendar' | 'appointments';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  mailSignatureHtml?: string;
  mailSignatureText?: string;
  mailPreviewLines: number;
  mailThreadView: boolean;
  mailAutoMarkRead: boolean;
  calendarWeekStart: number;
  calendarDefaultView: 'day' | 'week' | 'month' | 'year' | 'agenda';
  calendarDefaultDuration: number;
  calendarDefaultReminder: number;
  appointmentsBookingPageUsername?: string;
  appointmentsDefaultTimezone?: string;
  notificationsEmailEnabled: boolean;
  notificationsBrowserEnabled: boolean;
  notificationsSoundEnabled: boolean;
}

// UI State Types
export type IBirdModule = 'mail' | 'calendar' | 'appointments';
export type MailViewMode = 'list' | 'conversation';
export type CalendarViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

export interface ComposeState {
  id: string;
  mode: 'new' | 'reply' | 'replyAll' | 'forward' | 'draft';
  fromAccountId: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: Array<{ id: string; name: string; size: number; type: string }>;
  replyToMessageId?: string;
  forwardedMessageId?: string;
  draftId?: string;
  threadId?: string;
  isDirty: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface IBirdUIState {
  // Active module
  activeModule: IBirdModule;

  // Mail UI
  activeAccountId: string | null;
  activeFolderId: string | null;
  activeFolderType: FolderType;
  selectedMessageId: string | null;
  selectedThreadId: string | null;
  multiSelectMessageIds: string[];
  mailViewMode: MailViewMode;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mailListWidth: number;
  composeWindows: ComposeState[];
  activeComposeId: string | null;

  // Calendar UI
  calendarViewMode: CalendarViewMode;
  calendarViewDate: string;
  selectedEventId: string | null;
  eventEditorOpen: boolean;
  editingEvent: Partial<CalendarEvent> | null;

  // Appointments UI
  selectedAppointmentTypeId: string | null;
  selectedBookingId: string | null;
  appointmentTypeEditorOpen: boolean;
  availabilityEditorOpen: boolean;
  editingAppointmentType: Partial<AppointmentType> | null;

  // Search
  searchQuery: string;
  searchFocused: boolean;
  recentSearches: string[];

  // Loading states
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingEvents: boolean;
  isLoadingBookings: boolean;
  isSending: boolean;
  isSyncing: boolean;

  // Modals
  activeModal: string | null;
}

// =============================================================================
// Default Values
// =============================================================================

const defaultSettings: IBirdUserSettings = {
  defaultModule: 'mail',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  mailPreviewLines: 2,
  mailThreadView: true,
  mailAutoMarkRead: true,
  calendarWeekStart: 0, // Sunday
  calendarDefaultView: 'week',
  calendarDefaultDuration: 60,
  calendarDefaultReminder: 30,
  notificationsEmailEnabled: true,
  notificationsBrowserEnabled: true,
  notificationsSoundEnabled: true,
};

const defaultUIState: IBirdUIState = {
  activeModule: 'mail',
  activeAccountId: null,
  activeFolderId: null,
  activeFolderType: 'inbox',
  selectedMessageId: null,
  selectedThreadId: null,
  multiSelectMessageIds: [],
  mailViewMode: 'list',
  sidebarCollapsed: false,
  sidebarWidth: 220,
  mailListWidth: 350,
  composeWindows: [],
  activeComposeId: null,
  calendarViewMode: 'week',
  calendarViewDate: new Date().toISOString().split('T')[0],
  selectedEventId: null,
  eventEditorOpen: false,
  editingEvent: null,
  selectedAppointmentTypeId: null,
  selectedBookingId: null,
  appointmentTypeEditorOpen: false,
  availabilityEditorOpen: false,
  editingAppointmentType: null,
  searchQuery: '',
  searchFocused: false,
  recentSearches: [],
  isLoading: false,
  isLoadingMessages: false,
  isLoadingEvents: false,
  isLoadingBookings: false,
  isSending: false,
  isSyncing: false,
  activeModal: null,
};

// =============================================================================
// State Interface
// =============================================================================

interface IBirdState {
  // Mail
  accounts: MailAccount[];
  folders: Record<string, MailFolder[]>; // by accountId
  messages: MailMessageListItem[];
  messageCache: Record<string, MailMessage>;
  selectedMessage: MailMessage | null;
  threads: MailThread[];
  labels: Record<string, MailLabel[]>; // by accountId

  // Calendar
  calendars: Calendar[];
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;

  // Appointments
  appointmentTypes: AppointmentType[];
  availabilitySchedules: AvailabilitySchedule[];
  bookings: Booking[];
  selectedBooking: Booking | null;
  availableSlots: Record<string, AvailableSlot[]>; // by date

  // Settings
  settings: IBirdUserSettings;

  // UI State
  ui: IBirdUIState;
}

interface IBirdActions {
  // =========================================================================
  // Module Navigation
  // =========================================================================
  setActiveModule: (module: IBirdModule) => void;

  // =========================================================================
  // Mail Account Actions
  // =========================================================================
  setAccounts: (accounts: MailAccount[]) => void;
  addAccount: (account: MailAccount) => void;
  updateAccount: (accountId: string, updates: Partial<MailAccount>) => void;
  removeAccount: (accountId: string) => void;
  setActiveAccount: (accountId: string | null) => void;

  // =========================================================================
  // Mail Folder Actions
  // =========================================================================
  setFolders: (accountId: string, folders: MailFolder[]) => void;
  setActiveFolder: (folderId: string | null, folderType: FolderType) => void;

  // =========================================================================
  // Mail Message Actions
  // =========================================================================
  setMessages: (messages: MailMessageListItem[]) => void;
  addMessages: (messages: MailMessageListItem[]) => void;
  updateMessage: (messageId: string, updates: Partial<MailMessageListItem>) => void;
  removeMessages: (messageIds: string[]) => void;
  selectMessage: (messageId: string | null) => void;
  cacheMessage: (message: MailMessage) => void;
  setSelectedMessage: (message: MailMessage | null) => void;

  // =========================================================================
  // Mail Label Actions
  // =========================================================================
  setLabels: (accountId: string, labels: MailLabel[]) => void;

  // =========================================================================
  // Mail Compose Actions
  // =========================================================================
  openCompose: (mode: ComposeState['mode'], options?: Partial<ComposeState>) => string;
  updateCompose: (composeId: string, updates: Partial<ComposeState>) => void;
  closeCompose: (composeId: string) => void;

  // =========================================================================
  // Calendar Actions
  // =========================================================================
  setCalendars: (calendars: Calendar[]) => void;
  addCalendar: (calendar: Calendar) => void;
  updateCalendar: (calendarId: string, updates: Partial<Calendar>) => void;
  removeCalendar: (calendarId: string) => void;
  toggleCalendarVisibility: (calendarId: string) => void;

  // =========================================================================
  // Calendar Event Actions
  // =========================================================================
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (eventId: string) => void;
  selectEvent: (eventId: string | null) => void;
  openEventEditor: (event?: Partial<CalendarEvent>) => void;
  closeEventEditor: () => void;

  // =========================================================================
  // Calendar View Actions
  // =========================================================================
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setCalendarViewDate: (date: string) => void;
  navigateCalendar: (direction: 'prev' | 'next' | 'today') => void;

  // =========================================================================
  // Appointments Type Actions
  // =========================================================================
  setAppointmentTypes: (types: AppointmentType[]) => void;
  addAppointmentType: (type: AppointmentType) => void;
  updateAppointmentType: (typeId: string, updates: Partial<AppointmentType>) => void;
  removeAppointmentType: (typeId: string) => void;
  selectAppointmentType: (typeId: string | null) => void;
  openAppointmentTypeEditor: (type?: Partial<AppointmentType>) => void;
  closeAppointmentTypeEditor: () => void;

  // =========================================================================
  // Availability Actions
  // =========================================================================
  setAvailabilitySchedules: (schedules: AvailabilitySchedule[]) => void;
  addAvailabilitySchedule: (schedule: AvailabilitySchedule) => void;
  updateAvailabilitySchedule: (scheduleId: string, updates: Partial<AvailabilitySchedule>) => void;
  removeAvailabilitySchedule: (scheduleId: string) => void;
  openAvailabilityEditor: () => void;
  closeAvailabilityEditor: () => void;

  // =========================================================================
  // Booking Actions
  // =========================================================================
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  removeBooking: (bookingId: string) => void;
  selectBooking: (bookingId: string | null) => void;
  setAvailableSlots: (date: string, slots: AvailableSlot[]) => void;

  // =========================================================================
  // Settings Actions
  // =========================================================================
  updateSettings: (updates: Partial<IBirdUserSettings>) => void;

  // =========================================================================
  // UI Actions
  // =========================================================================
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setMailListWidth: (width: number) => void;
  setMailViewMode: (mode: MailViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  addRecentSearch: (query: string) => void;
  toggleMessageSelection: (messageId: string) => void;
  selectAllMessages: () => void;
  deselectAllMessages: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setLoadingEvents: (loading: boolean) => void;
  setLoadingBookings: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;

  // =========================================================================
  // Reset
  // =========================================================================
  reset: () => void;
}

type IBirdStore = IBirdState & IBirdActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const useIBirdStore = create<IBirdStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        accounts: [],
        folders: {},
        messages: [],
        messageCache: {},
        selectedMessage: null,
        threads: [],
        labels: {},
        calendars: [],
        events: [],
        selectedEvent: null,
        appointmentTypes: [],
        availabilitySchedules: [],
        bookings: [],
        selectedBooking: null,
        availableSlots: {},
        settings: defaultSettings,
        ui: defaultUIState,

        // =====================================================================
        // Module Navigation
        // =====================================================================

        setActiveModule: (module) =>
          set((state) => ({
            ui: { ...state.ui, activeModule: module },
          })),

        // =====================================================================
        // Mail Account Actions
        // =====================================================================

        setAccounts: (accounts) =>
          set({
            accounts,
            ui: get().ui.activeAccountId
              ? get().ui
              : { ...get().ui, activeAccountId: accounts[0]?.id ?? null },
          }),

        addAccount: (account) =>
          set((state) => ({
            accounts: [...state.accounts, account],
            ui: {
              ...state.ui,
              activeAccountId: state.ui.activeAccountId ?? account.id,
            },
          })),

        updateAccount: (accountId, updates) =>
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === accountId ? { ...a, ...updates } : a
            ),
          })),

        removeAccount: (accountId) =>
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== accountId),
            folders: Object.fromEntries(
              Object.entries(state.folders).filter(([key]) => key !== accountId)
            ),
            messages: state.messages.filter((m) => m.id.split(':')[0] !== accountId),
            ui: {
              ...state.ui,
              activeAccountId:
                state.ui.activeAccountId === accountId
                  ? state.accounts.find((a) => a.id !== accountId)?.id ?? null
                  : state.ui.activeAccountId,
            },
          })),

        setActiveAccount: (accountId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              activeAccountId: accountId,
              activeFolderId: null,
              activeFolderType: 'inbox',
              selectedMessageId: null,
            },
          })),

        // =====================================================================
        // Mail Folder Actions
        // =====================================================================

        setFolders: (accountId, folders) =>
          set((state) => ({
            folders: { ...state.folders, [accountId]: folders },
          })),

        setActiveFolder: (folderId, folderType) =>
          set((state) => ({
            ui: {
              ...state.ui,
              activeFolderId: folderId,
              activeFolderType: folderType,
              selectedMessageId: null,
              multiSelectMessageIds: [],
            },
          })),

        // =====================================================================
        // Mail Message Actions
        // =====================================================================

        setMessages: (messages) => set({ messages }),

        addMessages: (messages) =>
          set((state) => ({
            messages: [...state.messages, ...messages],
          })),

        updateMessage: (messageId, updates) =>
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
            messageCache: state.messageCache[messageId]
              ? {
                ...state.messageCache,
                [messageId]: { ...state.messageCache[messageId], ...updates },
              }
              : state.messageCache,
          })),

        removeMessages: (messageIds) =>
          set((state) => ({
            messages: state.messages.filter((m) => !messageIds.includes(m.id)),
            ui: {
              ...state.ui,
              selectedMessageId: messageIds.includes(state.ui.selectedMessageId ?? '')
                ? null
                : state.ui.selectedMessageId,
              multiSelectMessageIds: state.ui.multiSelectMessageIds.filter(
                (id) => !messageIds.includes(id)
              ),
            },
          })),

        selectMessage: (messageId) =>
          set((state) => ({
            ui: { ...state.ui, selectedMessageId: messageId },
          })),

        cacheMessage: (message) =>
          set((state) => ({
            messageCache: { ...state.messageCache, [message.id]: message },
          })),

        setSelectedMessage: (message) => set({ selectedMessage: message }),

        // =====================================================================
        // Mail Label Actions
        // =====================================================================

        setLabels: (accountId, labels) =>
          set((state) => ({
            labels: { ...state.labels, [accountId]: labels },
          })),

        // =====================================================================
        // Mail Compose Actions
        // =====================================================================

        openCompose: (mode, options = {}) => {
          const composeId = crypto.randomUUID();
          const { ui, accounts } = get();

          const newCompose: ComposeState = {
            id: composeId,
            mode,
            fromAccountId: options.fromAccountId ?? ui.activeAccountId ?? accounts[0]?.id ?? '',
            to: options.to ?? [],
            cc: options.cc ?? [],
            bcc: options.bcc ?? [],
            subject: options.subject ?? '',
            bodyHtml: options.bodyHtml ?? '',
            bodyText: options.bodyText ?? '',
            attachments: [],
            replyToMessageId: options.replyToMessageId,
            forwardedMessageId: options.forwardedMessageId,
            draftId: options.draftId,
            threadId: options.threadId,
            isDirty: false,
            isMinimized: false,
            isMaximized: false,
          };

          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: [...state.ui.composeWindows, newCompose],
              activeComposeId: composeId,
            },
          }));

          return composeId;
        },

        updateCompose: (composeId, updates) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.map((c) =>
                c.id === composeId ? { ...c, ...updates, isDirty: true } : c
              ),
            },
          })),

        closeCompose: (composeId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.filter((c) => c.id !== composeId),
              activeComposeId:
                state.ui.activeComposeId === composeId
                  ? state.ui.composeWindows.find((c) => c.id !== composeId)?.id ?? null
                  : state.ui.activeComposeId,
            },
          })),

        // =====================================================================
        // Calendar Actions
        // =====================================================================

        setCalendars: (calendars) => set({ calendars }),

        addCalendar: (calendar) =>
          set((state) => ({
            calendars: [...state.calendars, calendar],
          })),

        updateCalendar: (calendarId, updates) =>
          set((state) => ({
            calendars: state.calendars.map((c) =>
              c.id === calendarId ? { ...c, ...updates } : c
            ),
          })),

        removeCalendar: (calendarId) =>
          set((state) => ({
            calendars: state.calendars.filter((c) => c.id !== calendarId),
            events: state.events.filter((e) => e.calendarId !== calendarId),
          })),

        toggleCalendarVisibility: (calendarId) =>
          set((state) => ({
            calendars: state.calendars.map((c) =>
              c.id === calendarId ? { ...c, isVisible: !c.isVisible } : c
            ),
          })),

        // =====================================================================
        // Calendar Event Actions
        // =====================================================================

        setEvents: (events) => set({ events }),

        addEvent: (event) =>
          set((state) => ({
            events: [...state.events, event],
          })),

        updateEvent: (eventId, updates) =>
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, ...updates } : e
            ),
            selectedEvent:
              state.selectedEvent?.id === eventId
                ? { ...state.selectedEvent, ...updates }
                : state.selectedEvent,
          })),

        removeEvent: (eventId) =>
          set((state) => ({
            events: state.events.filter((e) => e.id !== eventId),
            selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent,
            ui: {
              ...state.ui,
              selectedEventId:
                state.ui.selectedEventId === eventId ? null : state.ui.selectedEventId,
            },
          })),

        selectEvent: (eventId) =>
          set((state) => {
            const event = eventId ? state.events.find((e) => e.id === eventId) ?? null : null;
            return {
              selectedEvent: event,
              ui: { ...state.ui, selectedEventId: eventId },
            };
          }),

        openEventEditor: (event = {}) =>
          set((state) => ({
            ui: {
              ...state.ui,
              eventEditorOpen: true,
              editingEvent: event,
            },
          })),

        closeEventEditor: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              eventEditorOpen: false,
              editingEvent: null,
            },
          })),

        // =====================================================================
        // Calendar View Actions
        // =====================================================================

        setCalendarViewMode: (mode) =>
          set((state) => ({
            ui: { ...state.ui, calendarViewMode: mode },
          })),

        setCalendarViewDate: (date) =>
          set((state) => ({
            ui: { ...state.ui, calendarViewDate: date },
          })),

        navigateCalendar: (direction) =>
          set((state) => {
            const current = new Date(state.ui.calendarViewDate);
            const mode = state.ui.calendarViewMode;

            if (direction === 'today') {
              return {
                ui: {
                  ...state.ui,
                  calendarViewDate: new Date().toISOString().split('T')[0],
                },
              };
            }

            const delta = direction === 'prev' ? -1 : 1;

            switch (mode) {
              case 'day':
                current.setDate(current.getDate() + delta);
                break;
              case 'week':
                current.setDate(current.getDate() + delta * 7);
                break;
              case 'month':
                current.setMonth(current.getMonth() + delta);
                break;
              case 'year':
                current.setFullYear(current.getFullYear() + delta);
                break;
              case 'agenda':
                current.setDate(current.getDate() + delta * 7);
                break;
            }

            return {
              ui: {
                ...state.ui,
                calendarViewDate: current.toISOString().split('T')[0],
              },
            };
          }),

        // =====================================================================
        // Appointments Type Actions
        // =====================================================================

        setAppointmentTypes: (types) => set({ appointmentTypes: types }),

        addAppointmentType: (type) =>
          set((state) => ({
            appointmentTypes: [...state.appointmentTypes, type],
          })),

        updateAppointmentType: (typeId, updates) =>
          set((state) => ({
            appointmentTypes: state.appointmentTypes.map((t) =>
              t.id === typeId ? { ...t, ...updates } : t
            ),
          })),

        removeAppointmentType: (typeId) =>
          set((state) => ({
            appointmentTypes: state.appointmentTypes.filter((t) => t.id !== typeId),
            ui: {
              ...state.ui,
              selectedAppointmentTypeId:
                state.ui.selectedAppointmentTypeId === typeId
                  ? null
                  : state.ui.selectedAppointmentTypeId,
            },
          })),

        selectAppointmentType: (typeId) =>
          set((state) => ({
            ui: { ...state.ui, selectedAppointmentTypeId: typeId },
          })),

        openAppointmentTypeEditor: (type = {}) =>
          set((state) => ({
            ui: {
              ...state.ui,
              appointmentTypeEditorOpen: true,
              editingAppointmentType: type,
            },
          })),

        closeAppointmentTypeEditor: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              appointmentTypeEditorOpen: false,
              editingAppointmentType: null,
            },
          })),

        // =====================================================================
        // Availability Actions
        // =====================================================================

        setAvailabilitySchedules: (schedules) => set({ availabilitySchedules: schedules }),

        addAvailabilitySchedule: (schedule) =>
          set((state) => ({
            availabilitySchedules: [...state.availabilitySchedules, schedule],
          })),

        updateAvailabilitySchedule: (scheduleId, updates) =>
          set((state) => ({
            availabilitySchedules: state.availabilitySchedules.map((s) =>
              s.id === scheduleId ? { ...s, ...updates } : s
            ),
          })),

        removeAvailabilitySchedule: (scheduleId) =>
          set((state) => ({
            availabilitySchedules: state.availabilitySchedules.filter(
              (s) => s.id !== scheduleId
            ),
          })),

        openAvailabilityEditor: () =>
          set((state) => ({
            ui: { ...state.ui, availabilityEditorOpen: true },
          })),

        closeAvailabilityEditor: () =>
          set((state) => ({
            ui: { ...state.ui, availabilityEditorOpen: false },
          })),

        // =====================================================================
        // Booking Actions
        // =====================================================================

        setBookings: (bookings) => set({ bookings }),

        addBooking: (booking) =>
          set((state) => ({
            bookings: [...state.bookings, booking],
          })),

        updateBooking: (bookingId, updates) =>
          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === bookingId ? { ...b, ...updates } : b
            ),
            selectedBooking:
              state.selectedBooking?.id === bookingId
                ? { ...state.selectedBooking, ...updates }
                : state.selectedBooking,
          })),

        removeBooking: (bookingId) =>
          set((state) => ({
            bookings: state.bookings.filter((b) => b.id !== bookingId),
            selectedBooking:
              state.selectedBooking?.id === bookingId ? null : state.selectedBooking,
          })),

        selectBooking: (bookingId) =>
          set((state) => {
            const booking = bookingId
              ? state.bookings.find((b) => b.id === bookingId) ?? null
              : null;
            return {
              selectedBooking: booking,
              ui: { ...state.ui, selectedBookingId: bookingId },
            };
          }),

        setAvailableSlots: (date, slots) =>
          set((state) => ({
            availableSlots: { ...state.availableSlots, [date]: slots },
          })),

        // =====================================================================
        // Settings Actions
        // =====================================================================

        updateSettings: (updates) =>
          set((state) => ({
            settings: { ...state.settings, ...updates },
          })),

        // =====================================================================
        // UI Actions
        // =====================================================================

        toggleSidebar: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
          })),

        setSidebarWidth: (width) =>
          set((state) => ({
            ui: { ...state.ui, sidebarWidth: Math.max(180, Math.min(300, width)) },
          })),

        setMailListWidth: (width) =>
          set((state) => ({
            ui: { ...state.ui, mailListWidth: Math.max(250, Math.min(500, width)) },
          })),

        setMailViewMode: (mode) =>
          set((state) => ({
            ui: { ...state.ui, mailViewMode: mode },
          })),

        setSearchQuery: (query) =>
          set((state) => ({
            ui: { ...state.ui, searchQuery: query },
          })),

        setSearchFocused: (focused) =>
          set((state) => ({
            ui: { ...state.ui, searchFocused: focused },
          })),

        addRecentSearch: (query) =>
          set((state) => ({
            ui: {
              ...state.ui,
              recentSearches: [
                query,
                ...state.ui.recentSearches.filter((s) => s !== query),
              ].slice(0, 10),
            },
          })),

        toggleMessageSelection: (messageId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectMessageIds: state.ui.multiSelectMessageIds.includes(messageId)
                ? state.ui.multiSelectMessageIds.filter((id) => id !== messageId)
                : [...state.ui.multiSelectMessageIds, messageId],
            },
          })),

        selectAllMessages: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectMessageIds: state.messages.map((m) => m.id),
            },
          })),

        deselectAllMessages: () =>
          set((state) => ({
            ui: { ...state.ui, multiSelectMessageIds: [] },
          })),

        setLoading: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoading: loading },
          })),

        setLoadingMessages: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingMessages: loading },
          })),

        setLoadingEvents: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingEvents: loading },
          })),

        setLoadingBookings: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingBookings: loading },
          })),

        setSending: (sending) =>
          set((state) => ({
            ui: { ...state.ui, isSending: sending },
          })),

        setSyncing: (syncing) =>
          set((state) => ({
            ui: { ...state.ui, isSyncing: syncing },
          })),

        openModal: (modal) =>
          set((state) => ({
            ui: { ...state.ui, activeModal: modal },
          })),

        closeModal: () =>
          set((state) => ({
            ui: { ...state.ui, activeModal: null },
          })),

        // =====================================================================
        // Reset
        // =====================================================================

        reset: () =>
          set({
            accounts: [],
            folders: {},
            messages: [],
            messageCache: {},
            selectedMessage: null,
            threads: [],
            labels: {},
            calendars: [],
            events: [],
            selectedEvent: null,
            appointmentTypes: [],
            availabilitySchedules: [],
            bookings: [],
            selectedBooking: null,
            availableSlots: {},
            settings: defaultSettings,
            ui: defaultUIState,
          }),
      }),
      {
        name: 'ibird-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          settings: state.settings,
          ui: {
            activeModule: state.ui.activeModule,
            sidebarCollapsed: state.ui.sidebarCollapsed,
            sidebarWidth: state.ui.sidebarWidth,
            mailListWidth: state.ui.mailListWidth,
            mailViewMode: state.ui.mailViewMode,
            calendarViewMode: state.ui.calendarViewMode,
            recentSearches: state.ui.recentSearches,
          },
        }),
        // Merge persisted state with defaults to handle schema migrations
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<IBirdState> | undefined;
          return {
            ...currentState,
            settings: {
              ...currentState.settings,
              ...persisted?.settings,
            },
            ui: {
              ...currentState.ui,
              ...persisted?.ui,
            },
          };
        },
      }
    ),
    { name: 'IBirdStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

// Stable empty arrays to prevent infinite re-renders
const EMPTY_FOLDERS: MailFolder[] = [];
const EMPTY_LABELS: MailLabel[] = [];

export const useActiveAccount = () =>
  useIBirdStore((state) =>
    state.accounts.find((a) => a.id === state.ui.activeAccountId)
  );

export const useAccountFolders = (accountId: string) =>
  useIBirdStore((state) => state.folders[accountId] || EMPTY_FOLDERS);

export const useAccountLabels = (accountId: string) =>
  useIBirdStore((state) => state.labels[accountId] || EMPTY_LABELS);

export const useUnreadCount = () =>
  useIBirdStore((state) => state.messages.filter((m) => !m.isRead).length);

export const useInboxUnreadCount = () =>
  useIBirdStore((state) => {
    const inboxFolderIds = Object.values(state.folders)
      .flat()
      .filter((f) => f.folderType === 'inbox')
      .map((f) => f.id);
    return state.messages.filter(
      (m) => !m.isRead && inboxFolderIds.some((fid) => m.id.includes(fid))
    ).length;
  });

export const useFilteredMessages = () => {
  const messages = useIBirdStore((state) => state.messages);
  const searchQuery = useIBirdStore((state) => state.ui.searchQuery);

  return useMemo(() => {
    let filtered = [...messages];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.subject?.toLowerCase().includes(query) ||
          m.from.email.toLowerCase().includes(query) ||
          m.from.name?.toLowerCase().includes(query) ||
          m.snippet?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return filtered;
  }, [messages, searchQuery]);
};

export const useVisibleCalendars = () => {
  const calendars = useIBirdStore((state) => state.calendars);
  return useMemo(() => calendars.filter((c) => c.isVisible), [calendars]);
};

export const useVisibleEvents = () => {
  const calendars = useIBirdStore((state) => state.calendars);
  const events = useIBirdStore((state) => state.events);
  return useMemo(() => {
    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);
    return events.filter((e) => visibleCalendarIds.includes(e.calendarId));
  }, [calendars, events]);
};

export const useEventsForDate = (date: string) => {
  const calendars = useIBirdStore((state) => state.calendars);
  const events = useIBirdStore((state) => state.events);
  return useMemo(() => {
    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);

    return events.filter((e) => {
      if (!visibleCalendarIds.includes(e.calendarId)) return false;
      const eventDate = e.startTime.split('T')[0];
      return eventDate === date;
    });
  }, [calendars, events, date]);
};

export const useEventsInRange = (startDate: string, endDate: string) => {
  const calendars = useIBirdStore((state) => state.calendars);
  const events = useIBirdStore((state) => state.events);
  return useMemo(() => {
    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return events.filter((e) => {
      if (!visibleCalendarIds.includes(e.calendarId)) return false;
      const eventStart = new Date(e.startTime).getTime();
      const eventEnd = new Date(e.endTime).getTime();
      return eventStart <= end && eventEnd >= start;
    });
  }, [calendars, events, startDate, endDate]);
};

export const useTodayEvents = () => {
  const calendars = useIBirdStore((state) => state.calendars);
  const events = useIBirdStore((state) => state.events);
  return useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const visibleCalendarIds = calendars
      .filter((c) => c.isVisible)
      .map((c) => c.id);

    return events
      .filter((e) => {
        if (!visibleCalendarIds.includes(e.calendarId)) return false;
        const eventDate = e.startTime.split('T')[0];
        return eventDate === todayStr;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [calendars, events]);
};

export const useUpcomingBookings = () => {
  const bookings = useIBirdStore((state) => state.bookings);
  return useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => {
        const bookingDate = new Date(`${b.scheduledDate}T${b.startTime}`);
        return bookingDate >= now && b.status !== 'cancelled';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.startTime}`);
        const dateB = new Date(`${b.scheduledDate}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [bookings]);
};

export const useActiveAppointmentTypes = () => {
  const appointmentTypes = useIBirdStore((state) => state.appointmentTypes);
  return useMemo(() => appointmentTypes.filter((t) => t.isActive), [appointmentTypes]);
};

export const useDefaultAvailabilitySchedule = () =>
  useIBirdStore((state) => state.availabilitySchedules.find((s) => s.isDefault));
