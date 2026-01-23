/**
 * iBird API Hooks
 *
 * React hooks for interacting with the iBird backend API.
 */

import { useCallback } from 'react';
import { useIBirdStore } from '@/stores/ibirdStore';
import type {
  MailAccount,
  MailFolder,
  MailMessage,
  MailMessageListItem,
  MailLabel,
  Calendar,
  CalendarEvent,
  AppointmentType,
  AvailabilitySchedule,
  Booking,
  AvailableSlot,
  IBirdUserSettings,
} from '@/stores/ibirdStore';

const API_BASE = '/api/v1/ibird';

// Helper to get headers (temporary user ID approach)
// Use a valid UUID format for demo since the backend expects UUID type
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

function getHeaders(userId = DEMO_USER_ID): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  };
}

// =============================================================================
// Settings API
// =============================================================================

export function useSettingsApi() {
  const { updateSettings } = useIBirdStore();

  const fetchSettings = useCallback(async (userId?: string) => {
    const response = await fetch(`${API_BASE}/settings`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    updateSettings(data);
    return data as IBirdUserSettings;
  }, [updateSettings]);

  const saveSettings = useCallback(async (settings: Partial<IBirdUserSettings>, userId?: string) => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to save settings');
    const data = await response.json();
    updateSettings(data);
    return data as IBirdUserSettings;
  }, [updateSettings]);

  return { fetchSettings, saveSettings };
}

// =============================================================================
// Mail API
// =============================================================================

export function useMailApi() {
  const {
    setAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    setFolders,
    setMessages,
    cacheMessage,
    setSelectedMessage,
    setLabels,
    setLoadingMessages,
    setSyncing,
  } = useIBirdStore();

  // Account methods
  const fetchAccounts = useCallback(async (userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch accounts');
    const accounts = await response.json();
    setAccounts(accounts);
    return accounts as MailAccount[];
  }, [setAccounts]);

  const createAccount = useCallback(async (accountData: {
    email: string;
    displayName?: string;
    provider?: string;
    imapHost: string;
    imapPort?: number;
    imapSecure?: boolean;
    smtpHost: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    authType: 'password' | 'oauth2';
    password?: string;
    oauthTokens?: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
    };
  }, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(accountData),
    });
    if (!response.ok) throw new Error('Failed to create account');
    const account = await response.json();
    addAccount(account);
    return account as MailAccount;
  }, [addAccount]);

  const deleteAccount = useCallback(async (accountId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to delete account');
    removeAccount(accountId);
  }, [removeAccount]);

  const syncAccount = useCallback(async (accountId: string, userId?: string) => {
    setSyncing(true);
    try {
      const response = await fetch(`${API_BASE}/mail/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: getHeaders(userId),
      });
      if (!response.ok) throw new Error('Failed to sync account');
      return await response.json() as { synced: number; errors: string[] };
    } finally {
      setSyncing(false);
    }
  }, [setSyncing]);

  // Folder methods
  const fetchFolders = useCallback(async (accountId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts/${accountId}/folders`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch folders');
    const folders = await response.json();
    setFolders(accountId, folders);
    return folders as MailFolder[];
  }, [setFolders]);

  // Message methods
  const fetchMessages = useCallback(async (
    accountId: string,
    folderId: string,
    options: { page?: number; limit?: number } = {},
    userId?: string
  ) => {
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(
        `${API_BASE}/mail/accounts/${accountId}/folders/${folderId}/messages?${params}`,
        { headers: getHeaders(userId) }
      );
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.data);
      return data as { data: MailMessageListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
    } finally {
      setLoadingMessages(false);
    }
  }, [setMessages, setLoadingMessages]);

  const fetchMessage = useCallback(async (messageId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/messages/${messageId}`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch message');
    const message = await response.json();
    cacheMessage(message);
    setSelectedMessage(message);
    return message as MailMessage;
  }, [cacheMessage, setSelectedMessage]);

  const markAsRead = useCallback(async (messageIds: string[], read: boolean, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/messages/read`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ ids: messageIds, read }),
    });
    if (!response.ok) throw new Error('Failed to update read status');
    return response.json();
  }, []);

  const toggleStar = useCallback(async (messageId: string, starred: boolean, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/messages/${messageId}/star`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ starred }),
    });
    if (!response.ok) throw new Error('Failed to toggle star');
    return response.json();
  }, []);

  const moveMessages = useCallback(async (messageIds: string[], targetFolderId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/messages/move`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ messageIds, targetFolderId }),
    });
    if (!response.ok) throw new Error('Failed to move messages');
    return response.json();
  }, []);

  const deleteMessages = useCallback(async (messageIds: string[], permanent = false, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/messages`, {
      method: 'DELETE',
      headers: getHeaders(userId),
      body: JSON.stringify({ messageIds, permanent }),
    });
    if (!response.ok) throw new Error('Failed to delete messages');
    return response.json();
  }, []);

  const searchMessages = useCallback(async (query: string, options: {
    accountId?: string;
    folderId?: string;
    from?: string;
    to?: string;
    hasAttachments?: boolean;
    isUnread?: boolean;
    isStarred?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}, userId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (options.accountId) params.set('accountId', options.accountId);
    if (options.folderId) params.set('folderId', options.folderId);
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    if (options.hasAttachments !== undefined) params.set('hasAttachments', String(options.hasAttachments));
    if (options.isUnread !== undefined) params.set('isUnread', String(options.isUnread));
    if (options.isStarred !== undefined) params.set('isStarred', String(options.isStarred));
    if (options.dateFrom) params.set('dateFrom', options.dateFrom);
    if (options.dateTo) params.set('dateTo', options.dateTo);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));

    const response = await fetch(`${API_BASE}/mail/search?${params}`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to search messages');
    return response.json();
  }, []);

  // Label methods
  const fetchLabels = useCallback(async (accountId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts/${accountId}/labels`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch labels');
    const labels = await response.json();
    setLabels(accountId, labels);
    return labels as MailLabel[];
  }, [setLabels]);

  const createLabel = useCallback(async (accountId: string, label: { name: string; color: string }, userId?: string) => {
    const response = await fetch(`${API_BASE}/mail/accounts/${accountId}/labels`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(label),
    });
    if (!response.ok) throw new Error('Failed to create label');
    return response.json() as Promise<MailLabel>;
  }, []);

  return {
    // Accounts
    fetchAccounts,
    createAccount,
    deleteAccount,
    syncAccount,
    // Folders
    fetchFolders,
    // Messages
    fetchMessages,
    fetchMessage,
    markAsRead,
    toggleStar,
    moveMessages,
    deleteMessages,
    searchMessages,
    // Labels
    fetchLabels,
    createLabel,
  };
}

// =============================================================================
// Calendar API
// =============================================================================

export function useCalendarApi() {
  const {
    setCalendars,
    addCalendar,
    updateCalendar,
    removeCalendar,
    setEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setLoadingEvents,
  } = useIBirdStore();

  // Calendar methods
  const fetchCalendars = useCallback(async (userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch calendars');
    const calendars = await response.json();
    setCalendars(calendars);
    return calendars as Calendar[];
  }, [setCalendars]);

  const createCalendar = useCallback(async (calendar: {
    name: string;
    description?: string;
    color?: string;
    timezone?: string;
    isPrimary?: boolean;
  }, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(calendar),
    });
    if (!response.ok) throw new Error('Failed to create calendar');
    const newCalendar = await response.json();
    addCalendar(newCalendar);
    return newCalendar as Calendar;
  }, [addCalendar]);

  const editCalendar = useCallback(async (calendarId: string, updates: Partial<Calendar>, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars/${calendarId}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update calendar');
    const updated = await response.json();
    updateCalendar(calendarId, updated);
    return updated as Calendar;
  }, [updateCalendar]);

  const deleteCalendar = useCallback(async (calendarId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars/${calendarId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to delete calendar');
    removeCalendar(calendarId);
  }, [removeCalendar]);

  // Event methods
  const fetchEvents = useCallback(async (options: {
    calendarId?: string;
    start?: string;
    end?: string;
  } = {}, userId?: string) => {
    setLoadingEvents(true);
    try {
      const params = new URLSearchParams();
      if (options.calendarId) params.set('calendarId', options.calendarId);
      if (options.start) params.set('start', options.start);
      if (options.end) params.set('end', options.end);

      const response = await fetch(`${API_BASE}/calendars/events?${params}`, {
        headers: getHeaders(userId),
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const events = await response.json();
      setEvents(events);
      return events as CalendarEvent[];
    } finally {
      setLoadingEvents(false);
    }
  }, [setEvents, setLoadingEvents]);

  const createEvent = useCallback(async (event: {
    calendarId: string;
    title: string;
    description?: string;
    location?: string;
    videoLink?: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    isAllDay?: boolean;
    recurrence?: CalendarEvent['recurrence'];
    attendees?: CalendarEvent['attendees'];
    color?: string;
  }, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars/events`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to create event');
    const newEvent = await response.json();
    addEvent(newEvent);
    return newEvent as CalendarEvent;
  }, [addEvent]);

  const editEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars/events/${eventId}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update event');
    const updated = await response.json();
    updateEvent(eventId, updated);
    return updated as CalendarEvent;
  }, [updateEvent]);

  const deleteEvent = useCallback(async (eventId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/calendars/events/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to delete event');
    removeEvent(eventId);
  }, [removeEvent]);

  return {
    // Calendars
    fetchCalendars,
    createCalendar,
    editCalendar,
    deleteCalendar,
    // Events
    fetchEvents,
    createEvent,
    editEvent,
    deleteEvent,
  };
}

// =============================================================================
// Appointments API
// =============================================================================

export function useAppointmentsApi() {
  const {
    setAppointmentTypes,
    addAppointmentType,
    updateAppointmentType,
    removeAppointmentType,
    setAvailabilitySchedules,
    addAvailabilitySchedule,
    updateAvailabilitySchedule,
    removeAvailabilitySchedule,
    setBookings,
    addBooking,
    updateBooking,
    setAvailableSlots,
    setLoadingBookings,
  } = useIBirdStore();

  // Appointment Type methods
  const fetchAppointmentTypes = useCallback(async (userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/types`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch appointment types');
    const types = await response.json();
    setAppointmentTypes(types);
    return types as AppointmentType[];
  }, [setAppointmentTypes]);

  const createAppointmentType = useCallback(async (type: {
    name: string;
    slug: string;
    description?: string;
    durationMinutes?: number;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
    locationType?: string;
    locationAddress?: string;
    videoProvider?: string;
    color?: string;
    customFields?: AppointmentType['customFields'];
  }, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/types`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(type),
    });
    if (!response.ok) throw new Error('Failed to create appointment type');
    const newType = await response.json();
    addAppointmentType(newType);
    return newType as AppointmentType;
  }, [addAppointmentType]);

  const editAppointmentType = useCallback(async (typeId: string, updates: Partial<AppointmentType>, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/types/${typeId}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update appointment type');
    const updated = await response.json();
    updateAppointmentType(typeId, updated);
    return updated as AppointmentType;
  }, [updateAppointmentType]);

  const deleteAppointmentType = useCallback(async (typeId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/types/${typeId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to delete appointment type');
    removeAppointmentType(typeId);
  }, [removeAppointmentType]);

  // Availability methods
  const fetchAvailabilitySchedules = useCallback(async (userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/availability/schedules`, {
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to fetch availability schedules');
    const schedules = await response.json();
    setAvailabilitySchedules(schedules);
    return schedules as AvailabilitySchedule[];
  }, [setAvailabilitySchedules]);

  const createAvailabilitySchedule = useCallback(async (schedule: {
    name: string;
    timezone?: string;
    weeklyHours: AvailabilitySchedule['weeklyHours'];
    isDefault?: boolean;
  }, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/availability/schedules`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(schedule),
    });
    if (!response.ok) throw new Error('Failed to create availability schedule');
    const newSchedule = await response.json();
    addAvailabilitySchedule(newSchedule);
    return newSchedule as AvailabilitySchedule;
  }, [addAvailabilitySchedule]);

  const editAvailabilitySchedule = useCallback(async (scheduleId: string, updates: Partial<AvailabilitySchedule>, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/availability/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update availability schedule');
    const updated = await response.json();
    updateAvailabilitySchedule(scheduleId, updated);
    return updated as AvailabilitySchedule;
  }, [updateAvailabilitySchedule]);

  const deleteAvailabilitySchedule = useCallback(async (scheduleId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/availability/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to delete availability schedule');
    removeAvailabilitySchedule(scheduleId);
  }, [removeAvailabilitySchedule]);

  // Slot availability
  const fetchAvailableSlots = useCallback(async (typeId: string, date: string) => {
    const response = await fetch(`${API_BASE}/appointments/types/${typeId}/slots?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch available slots');
    const data = await response.json();
    setAvailableSlots(date, data.slots);
    return data.slots as AvailableSlot[];
  }, [setAvailableSlots]);

  // Booking methods
  const fetchBookings = useCallback(async (options: {
    status?: string;
    typeId?: string;
    startDate?: string;
    endDate?: string;
  } = {}, userId?: string) => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.typeId) params.set('typeId', options.typeId);
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);

      const response = await fetch(`${API_BASE}/appointments/bookings?${params}`, {
        headers: getHeaders(userId),
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const bookings = await response.json();
      setBookings(bookings);
      return bookings as Booking[];
    } finally {
      setLoadingBookings(false);
    }
  }, [setBookings, setLoadingBookings]);

  const confirmBooking = useCallback(async (bookingId: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: getHeaders(userId),
    });
    if (!response.ok) throw new Error('Failed to confirm booking');
    const updated = await response.json();
    updateBooking(bookingId, updated);
    return updated as Booking;
  }, [updateBooking]);

  const cancelBooking = useCallback(async (bookingId: string, reason?: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
    const updated = await response.json();
    updateBooking(bookingId, updated);
    return updated as Booking;
  }, [updateBooking]);

  const rescheduleBooking = useCallback(async (bookingId: string, newDate: string, newStartTime: string, userId?: string) => {
    const response = await fetch(`${API_BASE}/appointments/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ newDate, newStartTime }),
    });
    if (!response.ok) throw new Error('Failed to reschedule booking');
    const newBooking = await response.json();
    addBooking(newBooking);
    return newBooking as Booking;
  }, [addBooking]);

  return {
    // Appointment Types
    fetchAppointmentTypes,
    createAppointmentType,
    editAppointmentType,
    deleteAppointmentType,
    // Availability
    fetchAvailabilitySchedules,
    createAvailabilitySchedule,
    editAvailabilitySchedule,
    deleteAvailabilitySchedule,
    fetchAvailableSlots,
    // Bookings
    fetchBookings,
    confirmBooking,
    cancelBooking,
    rescheduleBooking,
  };
}

// =============================================================================
// Public Booking API (for external booking pages)
// =============================================================================

export function usePublicBookingApi() {
  const fetchPublicProfile = useCallback(async (username: string) => {
    const response = await fetch(`${API_BASE}/public/${username}`);
    if (!response.ok) throw new Error('User not found');
    return response.json();
  }, []);

  const fetchPublicAppointmentTypes = useCallback(async (username: string) => {
    const response = await fetch(`${API_BASE}/public/${username}/types`);
    if (!response.ok) throw new Error('Failed to fetch appointment types');
    return response.json();
  }, []);

  const fetchPublicAppointmentType = useCallback(async (username: string, typeId: string) => {
    const response = await fetch(`${API_BASE}/public/${username}/types/${typeId}`);
    if (!response.ok) throw new Error('Failed to fetch appointment type');
    return response.json();
  }, []);

  const fetchAvailableDates = useCallback(async (username: string, typeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const response = await fetch(`${API_BASE}/public/${username}/types/${typeId}/dates?${params}`);
    if (!response.ok) throw new Error('Failed to fetch available dates');
    const data = await response.json();
    return data.availableDates as string[];
  }, []);

  const fetchAvailableSlots = useCallback(async (username: string, typeId: string, date: string) => {
    const response = await fetch(`${API_BASE}/public/${username}/types/${typeId}/slots?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch available slots');
    const data = await response.json();
    return data.slots as AvailableSlot[];
  }, []);

  const createBooking = useCallback(async (username: string, booking: {
    typeId: string;
    date: string;
    startTime: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    inviteeTimezone?: string;
    notes?: string;
    customFieldResponses?: Record<string, string>;
  }) => {
    const response = await fetch(`${API_BASE}/public/${username}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    return response.json() as Promise<Booking>;
  }, []);

  const cancelPublicBooking = useCallback(async (bookingId: string, reason?: string) => {
    const response = await fetch(`${API_BASE}/public/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
    return response.json();
  }, []);

  return {
    fetchPublicProfile,
    fetchPublicAppointmentTypes,
    fetchPublicAppointmentType,
    fetchAvailableDates,
    fetchAvailableSlots,
    createBooking,
    cancelPublicBooking,
  };
}
