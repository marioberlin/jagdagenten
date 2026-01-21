/**
 * Reminders types for iCloud Reminders API
 */

import type { ICloudDateArray, Alarm, Recurrence } from './calendar';

export interface Reminder {
  guid: string;
  pGuid: string;
  etag: string;
  title: string;
  description?: string;
  priority: ReminderPriority;
  dueDate?: ICloudDateArray;
  dueDateIsAllDay?: boolean;
  startDate?: ICloudDateArray;
  startDateIsAllDay?: boolean;
  startDateTz?: string;
  dueDateTz?: string;
  completedDate?: ICloudDateArray;
  createdDate?: ICloudDateArray;
  lastModifiedDate?: ICloudDateArray;
  alarms?: Alarm[];
  recurrence?: Recurrence;
  order: number;
  isCompleted: boolean;
  isFamily?: boolean;
  hasSubtasks?: boolean;
  parentGuid?: string;
  subtasks?: Reminder[];
  url?: string;
  location?: ReminderLocation;
  objectType: 'Reminder';
}

export type ReminderPriority = 0 | 1 | 5 | 9;
// 0 = None
// 1 = High (!!!)
// 5 = Medium (!!)
// 9 = Low (!)

export interface ReminderLocation {
  title?: string;
  address?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
  proximity?: 'enter' | 'leave';
  isProximityEnabled?: boolean;
}

export interface ReminderCollection {
  guid: string;
  title: string;
  ctag: string;
  order: number;
  color: string;
  symbolicColor: string;
  enabled: boolean;
  isFamily: boolean;
  shareTitle?: string;
  readOnly?: boolean;
  ownerId?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  completedCount?: number;
  objectType: 'Collection';
}

export interface ReminderListResponse {
  Reminder: Reminder[];
  Collection: ReminderCollection[];
}

export interface ReminderStartupResponse {
  Reminder: Reminder[];
  Collection: ReminderCollection[];
  InboxCollection?: ReminderCollection;
}

export interface ReminderCreateInput {
  title: string;
  description?: string;
  priority?: ReminderPriority;
  dueDate?: Date;
  dueDateIsAllDay?: boolean;
  collectionGuid: string;
  alarms?: Alarm[];
  recurrence?: Recurrence;
  location?: ReminderLocation;
  url?: string;
}

export interface ReminderUpdateInput extends Reminder {}

export interface ReminderDeleteInput {
  guid: string;
  pGuid: string;
  etag: string;
}

export interface ReminderCompleteInput {
  guid: string;
  pGuid: string;
  etag: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface ReminderMoveInput {
  guids: string[];
  fromCollection: string;
  toCollection: string;
}

export interface ReminderReorderInput {
  guid: string;
  pGuid: string;
  etag: string;
  newOrder: number;
}

export interface CollectionCreateInput {
  title: string;
  color?: string;
  symbolicColor?: string;
}

export interface CollectionUpdateInput {
  guid: string;
  ctag: string;
  title?: string;
  color?: string;
  symbolicColor?: string;
}

export interface CollectionDeleteInput {
  guid: string;
  ctag: string;
}

export interface ReminderQueryOptions {
  collectionGuids?: string[];
  includeCompleted?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  modifiedAfter?: Date;
  limit?: number;
}

export interface ReminderSearchOptions {
  query: string;
  collectionGuids?: string[];
  includeCompleted?: boolean;
}

// Smart lists / filters
export interface ReminderSmartList {
  type: 'today' | 'scheduled' | 'flagged' | 'all' | 'completed';
  count: number;
}

export interface ReminderSummary {
  totalCount: number;
  completedCount: number;
  overdueCount: number;
  todayCount: number;
  scheduledCount: number;
  collections: {
    guid: string;
    title: string;
    count: number;
    completedCount: number;
  }[];
}
