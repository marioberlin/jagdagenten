/**
 * Reminders Service for iCloud Reminders API
 */

import { BaseService } from './BaseService';
import type {
  Reminder,
  ReminderCollection,
  ReminderStartupResponse,
  ReminderCreateInput,
  ReminderUpdateInput,
  ReminderDeleteInput,
  ReminderCompleteInput,
  ReminderMoveInput,
  CollectionCreateInput,
  CollectionUpdateInput,
  CollectionDeleteInput,
  ReminderQueryOptions,
  ReminderSearchOptions,
  ReminderSummary,
} from '../types/reminders';
import { ICloudError } from '../errors/ICloudError';
import { generateReminderGuid, generateEtag } from '../utils/ids';
import { dateToArray, arrayToDate, getDayBounds } from '../utils/dates';

export class RemindersService extends BaseService {
  private collections: ReminderCollection[] = [];
  private reminders: Reminder[] = [];
  private initialized = false;

  protected getServiceConfig() {
    return this.client.account?.webservices.reminders;
  }

  /**
   * Initialize Reminders service
   */
  async startup(): Promise<{
    collections: ReminderCollection[];
    reminders: Reminder[];
  }> {
    const response = await this.get<ReminderStartupResponse>(
      'reminders',
      '/rd/startup',
      {
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    this.collections = response.Collection || [];
    this.reminders = response.Reminder || [];
    this.initialized = true;

    return {
      collections: this.collections,
      reminders: this.reminders,
    };
  }

  /**
   * Get all collections (reminder lists)
   */
  async listCollections(): Promise<ReminderCollection[]> {
    if (!this.initialized) {
      await this.startup();
    }
    return this.collections;
  }

  /**
   * Get a specific collection
   */
  async getCollection(guid: string): Promise<ReminderCollection | null> {
    const collections = await this.listCollections();
    return collections.find(c => c.guid === guid) || null;
  }

  /**
   * Get the default collection
   */
  async getDefaultCollection(): Promise<ReminderCollection | null> {
    const collections = await this.listCollections();
    // Return first enabled collection
    return collections.find(c => c.enabled) || collections[0] || null;
  }

  /**
   * Get all reminders
   */
  async listReminders(options: ReminderQueryOptions = {}): Promise<Reminder[]> {
    if (!this.initialized) {
      await this.startup();
    }

    let reminders = [...this.reminders];

    // Filter by collection
    if (options.collectionGuids?.length) {
      const guids = new Set(options.collectionGuids);
      reminders = reminders.filter(r => guids.has(r.pGuid));
    }

    // Filter completed
    if (options.includeCompleted === false) {
      reminders = reminders.filter(r => !r.isCompleted);
    }

    // Filter by due date
    if (options.dueBefore) {
      const beforeTime = options.dueBefore.getTime();
      reminders = reminders.filter(r => {
        if (!r.dueDate) return false;
        const dueTime = arrayToDate(r.dueDate)?.getTime();
        return dueTime && dueTime <= beforeTime;
      });
    }

    if (options.dueAfter) {
      const afterTime = options.dueAfter.getTime();
      reminders = reminders.filter(r => {
        if (!r.dueDate) return false;
        const dueTime = arrayToDate(r.dueDate)?.getTime();
        return dueTime && dueTime >= afterTime;
      });
    }

    // Limit
    if (options.limit) {
      reminders = reminders.slice(0, options.limit);
    }

    return reminders;
  }

  /**
   * Get a specific reminder
   */
  async getReminder(guid: string): Promise<Reminder | null> {
    const reminders = await this.listReminders();
    return reminders.find(r => r.guid === guid) || null;
  }

  /**
   * Get reminders due today
   */
  async getTodayReminders(): Promise<Reminder[]> {
    const { start, end } = getDayBounds(new Date());
    return this.listReminders({
      dueBefore: arrayToDate(end)!,
      dueAfter: arrayToDate(start)!,
      includeCompleted: false,
    });
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(): Promise<Reminder[]> {
    const now = new Date();
    const reminders = await this.listReminders({ includeCompleted: false });

    return reminders.filter(r => {
      if (!r.dueDate) return false;
      const dueTime = arrayToDate(r.dueDate)?.getTime();
      return dueTime && dueTime < now.getTime();
    });
  }

  /**
   * Get upcoming reminders
   */
  async getUpcomingReminders(days: number = 7): Promise<Reminder[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.listReminders({
      dueAfter: now,
      dueBefore: future,
      includeCompleted: false,
    });
  }

  /**
   * Create a new reminder
   */
  async createReminder(input: ReminderCreateInput): Promise<Reminder> {
    const collection = input.collectionGuid
      ? await this.getCollection(input.collectionGuid)
      : await this.getDefaultCollection();

    if (!collection) {
      throw new ICloudError('No collection available', 'NOT_FOUND');
    }

    const guid = generateReminderGuid();
    const etag = generateEtag();

    const reminder: Reminder = {
      guid,
      pGuid: collection.guid,
      etag,
      title: input.title,
      description: input.description,
      priority: input.priority || 0,
      dueDate: input.dueDate ? dateToArray(input.dueDate) ?? undefined : undefined,
      dueDateIsAllDay: input.dueDateIsAllDay,
      alarms: input.alarms,
      recurrence: input.recurrence,
      location: input.location,
      url: input.url,
      order: this.getNextOrder(collection.guid),
      isCompleted: false,
      objectType: 'Reminder',
    };

    const response = await this.post<{ Reminder: Reminder[] }>(
      'reminders',
      '/rd/reminders/tasks',
      {
        Reminder: [reminder],
        ClientState: { Collections: this.collections },
      },
      {
        methodOverride: 'PUT',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Reminder?.length) {
      throw new ICloudError('Failed to create reminder', 'UNKNOWN_ERROR');
    }

    // Update local cache
    this.reminders.push(response.Reminder[0]);

    return response.Reminder[0];
  }

  /**
   * Update a reminder
   */
  async updateReminder(reminder: ReminderUpdateInput): Promise<Reminder> {
    const response = await this.post<{ Reminder: Reminder[] }>(
      'reminders',
      '/rd/reminders/tasks',
      {
        Reminder: [reminder],
        ClientState: { Collections: this.collections },
      },
      {
        methodOverride: 'PUT',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Reminder?.length) {
      throw new ICloudError('Failed to update reminder', 'UNKNOWN_ERROR');
    }

    // Update local cache
    const index = this.reminders.findIndex(r => r.guid === reminder.guid);
    if (index !== -1) {
      this.reminders[index] = response.Reminder[0];
    }

    return response.Reminder[0];
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(input: ReminderDeleteInput): Promise<void> {
    await this.post(
      'reminders',
      '/rd/reminders/tasks',
      {
        Reminder: [{
          guid: input.guid,
          pGuid: input.pGuid,
          etag: input.etag,
        }],
        ClientState: { Collections: this.collections },
      },
      {
        methodOverride: 'DELETE',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    // Update local cache
    this.reminders = this.reminders.filter(r => r.guid !== input.guid);
  }

  /**
   * Complete or uncomplete a reminder
   */
  async completeReminder(input: ReminderCompleteInput): Promise<Reminder> {
    const reminder = await this.getReminder(input.guid);
    if (!reminder) {
      throw new ICloudError('Reminder not found', 'NOT_FOUND');
    }

    return this.updateReminder({
      ...reminder,
      isCompleted: input.isCompleted,
      completedDate: input.isCompleted
        ? (dateToArray(input.completedDate || new Date()) ?? undefined)
        : undefined,
    });
  }

  /**
   * Quick complete - mark a reminder as done
   */
  async markAsDone(guid: string): Promise<Reminder> {
    const reminder = await this.getReminder(guid);
    if (!reminder) {
      throw new ICloudError('Reminder not found', 'NOT_FOUND');
    }

    return this.completeReminder({
      guid: reminder.guid,
      pGuid: reminder.pGuid,
      etag: reminder.etag,
      isCompleted: true,
    });
  }

  /**
   * Move reminders to a different collection
   */
  async moveReminders(input: ReminderMoveInput): Promise<void> {
    const reminders = await Promise.all(
      input.guids.map(guid => this.getReminder(guid))
    );

    const updates = reminders
      .filter((r): r is Reminder => r !== null)
      .map(r => ({
        ...r,
        pGuid: input.toCollection,
      }));

    await Promise.all(updates.map(r => this.updateReminder(r)));
  }

  /**
   * Search reminders
   */
  async search(options: ReminderSearchOptions): Promise<Reminder[]> {
    const reminders = await this.listReminders({
      collectionGuids: options.collectionGuids,
      includeCompleted: options.includeCompleted,
    });

    const lowerQuery = options.query.toLowerCase();

    return reminders.filter(r =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create a new collection
   */
  async createCollection(input: CollectionCreateInput): Promise<ReminderCollection> {
    const guid = generateReminderGuid();

    const collection: ReminderCollection = {
      guid,
      title: input.title,
      ctag: generateEtag(),
      order: this.collections.length,
      color: input.color || '#007AFF',
      symbolicColor: input.symbolicColor || 'blue',
      enabled: true,
      isFamily: false,
      objectType: 'Collection',
    };

    const response = await this.post<{ Collection: ReminderCollection[] }>(
      'reminders',
      '/rd/reminders/collections',
      {
        Collection: [collection],
      },
      {
        methodOverride: 'PUT',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Collection?.length) {
      throw new ICloudError('Failed to create collection', 'UNKNOWN_ERROR');
    }

    // Update local cache
    this.collections.push(response.Collection[0]);

    return response.Collection[0];
  }

  /**
   * Update a collection
   */
  async updateCollection(input: CollectionUpdateInput): Promise<ReminderCollection> {
    const existing = await this.getCollection(input.guid);
    if (!existing) {
      throw new ICloudError('Collection not found', 'NOT_FOUND');
    }

    const collection: ReminderCollection = {
      ...existing,
      title: input.title || existing.title,
      color: input.color || existing.color,
      symbolicColor: input.symbolicColor || existing.symbolicColor,
      ctag: input.ctag,
    };

    const response = await this.post<{ Collection: ReminderCollection[] }>(
      'reminders',
      '/rd/reminders/collections',
      {
        Collection: [collection],
      },
      {
        methodOverride: 'PUT',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    if (!response.Collection?.length) {
      throw new ICloudError('Failed to update collection', 'UNKNOWN_ERROR');
    }

    // Update local cache
    const index = this.collections.findIndex(c => c.guid === input.guid);
    if (index !== -1) {
      this.collections[index] = response.Collection[0];
    }

    return response.Collection[0];
  }

  /**
   * Delete a collection
   */
  async deleteCollection(input: CollectionDeleteInput): Promise<void> {
    await this.post(
      'reminders',
      '/rd/reminders/collections',
      {
        Collection: [{
          guid: input.guid,
          ctag: input.ctag,
        }],
      },
      {
        methodOverride: 'DELETE',
        lang: 'en-US',
        usertz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    );

    // Update local cache
    this.collections = this.collections.filter(c => c.guid !== input.guid);
    this.reminders = this.reminders.filter(r => r.pGuid !== input.guid);
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<ReminderSummary> {
    const reminders = await this.listReminders();
    const collections = await this.listCollections();
    const now = new Date().getTime();

    const completed = reminders.filter(r => r.isCompleted);
    const incomplete = reminders.filter(r => !r.isCompleted);

    const overdue = incomplete.filter(r => {
      if (!r.dueDate) return false;
      const dueTime = arrayToDate(r.dueDate)?.getTime();
      return dueTime && dueTime < now;
    });

    const { start, end } = getDayBounds(new Date());
    const today = incomplete.filter(r => {
      if (!r.dueDate) return false;
      const dueTime = arrayToDate(r.dueDate)?.getTime();
      return dueTime &&
        dueTime >= arrayToDate(start)!.getTime() &&
        dueTime <= arrayToDate(end)!.getTime();
    });

    const scheduled = incomplete.filter(r => r.dueDate);

    return {
      totalCount: reminders.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      todayCount: today.length,
      scheduledCount: scheduled.length,
      collections: collections.map(c => {
        const collReminders = reminders.filter(r => r.pGuid === c.guid);
        return {
          guid: c.guid,
          title: c.title,
          count: collReminders.length,
          completedCount: collReminders.filter(r => r.isCompleted).length,
        };
      }),
    };
  }

  // Private helpers
  private getNextOrder(collectionGuid: string): number {
    const collectionReminders = this.reminders.filter(r => r.pGuid === collectionGuid);
    if (collectionReminders.length === 0) return 0;
    return Math.max(...collectionReminders.map(r => r.order)) + 1;
  }
}
