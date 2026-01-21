/**
 * Calendar types for iCloud Calendar API
 */

export interface Calendar {
  guid: string;
  ctag: string;
  title: string;
  order: number;
  color: string;
  symbolicColor: string;
  enabled: boolean;
  isFamily: boolean;
  shareTitle?: string;
  isDefault?: boolean;
  readOnly?: boolean;
  ownerId?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  publishedUrl?: string;
  supportedType: 'Event' | 'Birthday';
  objectType: 'calendar';
}

export interface CalendarEvent {
  guid: string;
  pGuid: string;
  etag: string;
  title: string;
  location?: string;
  description?: string;
  url?: string;
  startDate: ICloudDateArray;
  endDate: ICloudDateArray;
  allDay: boolean;
  tz: string;
  duration: number;
  localStartDate: ICloudDateArray;
  localEndDate: ICloudDateArray;
  alarms?: Alarm[];
  recurrence?: Recurrence;
  recurrenceMaster?: string;
  recurrenceException?: boolean;
  invitees?: Invitee[];
  organizer?: string;
  hasAttachments?: boolean;
  attachments?: Attachment[];
  readOnly?: boolean;
  changeRecurring?: 'THIS' | 'ALL' | 'FUTURE';
  extendedDetailsAreIncluded?: boolean;
  icon?: number;
  objectType: 'Event';
}

/**
 * iCloud date array format:
 * [dateNumber, year, month, day, hour, minute, offset]
 * - dateNumber: YYYYMMDD as integer
 * - year: 4-digit year
 * - month: 1-12
 * - day: 1-31
 * - hour: 0-23
 * - minute: 0-59
 * - offset: timezone offset in minutes (e.g., 720 for UTC)
 */
export type ICloudDateArray = [number, number, number, number, number, number, number];

export interface Alarm {
  guid: string;
  messageType: 'message' | 'sound' | 'email';
  isLocationBased: boolean;
  measurement?: 'minutes' | 'hours' | 'days' | 'weeks';
  measuredValue?: number;
  absoluteDate?: ICloudDateArray;
  proximity?: 'enter' | 'leave';
  structuredLocation?: {
    title: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  description?: string;
}

export interface Recurrence {
  guid: string;
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: ICloudDateArray;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
  bySetPos?: number[];
  weekStart?: 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
}

export interface Invitee {
  cn: string;
  email: string;
  cutype: 'INDIVIDUAL' | 'GROUP' | 'RESOURCE' | 'ROOM';
  role: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'NON-PARTICIPANT' | 'CHAIR';
  partstat: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
  isMe?: boolean;
  isOrganizer?: boolean;
}

export interface Attachment {
  guid: string;
  name: string;
  fileType: string;
  size: number;
  url: string;
}

export interface CalendarListResponse {
  Collection: Calendar[];
}

export interface EventListResponse {
  Event: CalendarEvent[];
  Alarm: Alarm[];
}

export interface EventDetailResponse {
  Event: CalendarEvent[];
  Alarm?: Alarm[];
}

export interface CalendarStartupResponse {
  Collection: Calendar[];
  Event: CalendarEvent[];
  Alarm: Alarm[];
  Reminder?: unknown[];
}

export interface EventCreateInput extends Omit<CalendarEvent, 'guid' | 'etag' | 'objectType'> {
  guid?: string;
}

export interface EventUpdateInput extends CalendarEvent {}

export interface EventDeleteInput {
  guid: string;
  pGuid: string;
  etag: string;
  changeRecurring?: 'THIS' | 'ALL' | 'FUTURE';
}

export interface CalendarDateRange {
  startDate: Date;
  endDate: Date;
}

export interface CalendarQueryOptions {
  calendarGuids?: string[];
  includeRecurring?: boolean;
  expandRecurring?: boolean;
}
