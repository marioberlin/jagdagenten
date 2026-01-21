/**
 * Calendar Service for iCloud API
 */

import { BaseService } from './BaseService';
import type {
  Calendar,
  CalendarEvent,
  CalendarStartupResponse,
  EventListResponse,
  EventDetailResponse,
  EventCreateInput,
  EventUpdateInput,
  EventDeleteInput,
  CalendarDateRange,
  CalendarQueryOptions,
  ICloudDateArray,
} from '../types/calendar';
import {
  dateToArray,
  arrayToDate,
  getMonthBounds,
  getDayBounds,
} from '../utils/dates';
import { generateEventGuid } from '../utils/ids';
import { ICloudError } from '../errors/ICloudError';

export class CalendarService extends BaseService {
  private calendars: Calendar[] = [];
  private initialized = false;

  protected getServiceConfig() {
    return this.client.account?.webservices.calendar;
  }

  /**
   * Initialize the calendar service and get all calendars
   */
  async startup(): Promise<{ calendars: Calendar[]; events: CalendarEvent[] }> {
    const now = new Date();
    const { start, end } = getMonthBounds(now);

    const response = await this.get<CalendarStartupResponse>(
      'calendar',
      '/ca/startup',
      {
        startDate: start[0],
        endDate: end[0],
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    this.calendars = response.Collection || [];
    this.initialized = true;

    return {
      calendars: this.calendars,
      events: response.Event || [],
    };
  }

  /**
   * Get all calendars
   */
  async listCalendars(): Promise<Calendar[]> {
    if (!this.initialized) {
      await this.startup();
    }
    return this.calendars;
  }

  /**
   * Get a specific calendar by GUID
   */
  async getCalendar(guid: string): Promise<Calendar | null> {
    const calendars = await this.listCalendars();
    return calendars.find(c => c.guid === guid) || null;
  }

  /**
   * Get the default calendar
   */
  async getDefaultCalendar(): Promise<Calendar | null> {
    const calendars = await this.listCalendars();
    return calendars.find(c => c.isDefault) || calendars[0] || null;
  }

  /**
   * Get events for a date range
   */
  async getEvents(
    range: CalendarDateRange,
    options: CalendarQueryOptions = {}
  ): Promise<CalendarEvent[]> {
    const startArray = dateToArray(range.startDate)!;
    const endArray = dateToArray(range.endDate)!;

    const params: Record<string, string | number | boolean | undefined> = {
      startDate: startArray[0],
      endDate: endArray[0],
      lang: 'en-US',
      usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (options.calendarGuids?.length) {
      params.guid = options.calendarGuids.join(',');
    }

    const response = await this.get<EventListResponse>(
      'calendar',
      '/ca/events',
      params
    );

    return response.Event || [];
  }

  /**
   * Get events for today
   */
  async getTodayEvents(options: CalendarQueryOptions = {}): Promise<CalendarEvent[]> {
    const today = new Date();
    const { start, end } = getDayBounds(today);

    return this.getEvents(
      {
        startDate: arrayToDate(start)!,
        endDate: arrayToDate(end)!,
      },
      options
    );
  }

  /**
   * Get events for a specific month
   */
  async getMonthEvents(
    year: number,
    month: number, // 1-12
    options: CalendarQueryOptions = {}
  ): Promise<CalendarEvent[]> {
    const date = new Date(year, month - 1, 1);
    const { start, end } = getMonthBounds(date);

    return this.getEvents(
      {
        startDate: arrayToDate(start)!,
        endDate: arrayToDate(end)!,
      },
      options
    );
  }

  /**
   * Get event details
   */
  async getEvent(guid: string, calendarGuid: string): Promise<CalendarEvent | null> {
    const response = await this.get<EventDetailResponse>(
      'calendar',
      `/ca/eventdetail/${calendarGuid}/${guid}`,
      {
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    return response.Event?.[0] || null;
  }

  /**
   * Create a new event
   */
  async createEvent(input: EventCreateInput): Promise<CalendarEvent> {
    const guid = input.guid || generateEventGuid();

    const event: CalendarEvent = {
      ...input,
      guid,
      etag: `C=${Date.now()}`,
      objectType: 'Event',
    };

    const response = await this.post<{ Event: CalendarEvent[] }>(
      'calendar',
      '/ca/events',
      {
        Event: [event],
        MethodType: 'add',
      },
      {
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Event?.length) {
      throw new ICloudError('Failed to create event', 'UNKNOWN_ERROR');
    }

    return response.Event[0];
  }

  /**
   * Update an event
   */
  async updateEvent(event: EventUpdateInput): Promise<CalendarEvent> {
    const response = await this.post<{ Event: CalendarEvent[] }>(
      'calendar',
      '/ca/events',
      {
        Event: [event],
        MethodType: 'modify',
      },
      {
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Event?.length) {
      throw new ICloudError('Failed to update event', 'UNKNOWN_ERROR');
    }

    return response.Event[0];
  }

  /**
   * Delete an event
   */
  async deleteEvent(input: EventDeleteInput): Promise<void> {
    await this.post(
      'calendar',
      '/ca/events',
      {
        Event: [{
          guid: input.guid,
          pGuid: input.pGuid,
          etag: input.etag,
          changeRecurring: input.changeRecurring || 'THIS',
        }],
        MethodType: 'delete',
      },
      {
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );
  }

  /**
   * Create a quick event from natural language
   */
  async createQuickEvent(
    title: string,
    startDate: Date,
    endDate?: Date,
    calendarGuid?: string
  ): Promise<CalendarEvent> {
    const calendar = calendarGuid
      ? await this.getCalendar(calendarGuid)
      : await this.getDefaultCalendar();

    if (!calendar) {
      throw new ICloudError('No calendar available', 'NOT_FOUND');
    }

    const start = dateToArray(startDate)!;
    const end = endDate ? dateToArray(endDate)! : [...start] as ICloudDateArray;

    // If no end date, default to 1 hour later
    if (!endDate) {
      const endDateObj = new Date(startDate);
      endDateObj.setHours(endDateObj.getHours() + 1);
      const endArray = dateToArray(endDateObj)!;
      end[3] = endArray[3];
      end[4] = endArray[4];
    }

    return this.createEvent({
      title,
      pGuid: calendar.guid,
      startDate: start,
      endDate: end,
      localStartDate: start,
      localEndDate: end,
      allDay: false,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration: Math.round(
        (arrayToDate(end)!.getTime() - arrayToDate(start)!.getTime()) / (1000 * 60)
      ),
    });
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(
    days: number = 7,
    options: CalendarQueryOptions = {}
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const events = await this.getEvents({ startDate: now, endDate: future }, options);

    // Filter to only future events and sort by start date
    const nowTime = now.getTime();
    return events
      .filter(e => {
        const eventStart = arrayToDate(e.startDate);
        return eventStart && eventStart.getTime() >= nowTime;
      })
      .sort((a, b) => {
        const aDate = arrayToDate(a.startDate)!.getTime();
        const bDate = arrayToDate(b.startDate)!.getTime();
        return aDate - bDate;
      });
  }

  /**
   * Search events by title
   */
  async searchEvents(
    query: string,
    range: CalendarDateRange,
    options: CalendarQueryOptions = {}
  ): Promise<CalendarEvent[]> {
    const events = await this.getEvents(range, options);
    const lowerQuery = query.toLowerCase();

    return events.filter(e =>
      e.title.toLowerCase().includes(lowerQuery) ||
      e.location?.toLowerCase().includes(lowerQuery) ||
      e.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all-day events for a date
   */
  async getAllDayEvents(date: Date): Promise<CalendarEvent[]> {
    const { start, end } = getDayBounds(date);
    const events = await this.getEvents({
      startDate: arrayToDate(start)!,
      endDate: arrayToDate(end)!,
    });

    return events.filter(e => e.allDay);
  }

  /**
   * Move an event to a different calendar
   */
  async moveEvent(
    event: CalendarEvent,
    toCalendarGuid: string
  ): Promise<CalendarEvent> {
    // Delete from original calendar
    await this.deleteEvent({
      guid: event.guid,
      pGuid: event.pGuid,
      etag: event.etag,
    });

    // Create in new calendar
    return this.createEvent({
      ...event,
      pGuid: toCalendarGuid,
      guid: undefined, // Generate new GUID
    });
  }

  /**
   * Duplicate an event
   */
  async duplicateEvent(
    event: CalendarEvent,
    newStartDate?: Date
  ): Promise<CalendarEvent> {
    let startDate = event.startDate;
    let endDate = event.endDate;
    let localStartDate = event.localStartDate;
    let localEndDate = event.localEndDate;

    if (newStartDate) {
      const diff = arrayToDate(event.endDate)!.getTime() - arrayToDate(event.startDate)!.getTime();
      const newEnd = new Date(newStartDate.getTime() + diff);

      startDate = dateToArray(newStartDate)!;
      endDate = dateToArray(newEnd)!;
      localStartDate = startDate;
      localEndDate = endDate;
    }

    return this.createEvent({
      title: event.title,
      location: event.location,
      description: event.description,
      url: event.url,
      pGuid: event.pGuid,
      startDate,
      endDate,
      localStartDate,
      localEndDate,
      allDay: event.allDay,
      tz: event.tz,
      duration: event.duration,
      alarms: event.alarms,
      recurrence: event.recurrence,
    });
  }
}
