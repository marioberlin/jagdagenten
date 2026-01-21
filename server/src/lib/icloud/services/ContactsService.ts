/**
 * Contacts Service for iCloud API
 */

import { BaseService } from './BaseService';
import type {
  Contact,
  ContactGroup,
  ContactListResponse,
  ContactModifyResponse,
  ContactListResult,
  ContactCreateInput,
  ContactUpdateInput,
  ContactDeleteInput,
  ContactGroupCreateInput,
  ContactGroupUpdateInput,
  ContactSearchOptions,
} from '../types/contacts';
import { generateContactId, generateEtag } from '../utils/ids';
import { ICloudError } from '../errors/ICloudError';

export class ContactsService extends BaseService {
  private syncToken?: string;
  private prefToken?: string;

  protected getServiceConfig() {
    return this.client.account?.webservices.contacts;
  }

  /**
   * List all contacts and groups
   */
  async list(): Promise<ContactListResult> {
    const response = await this.get<ContactListResponse>(
      'contacts',
      '/co/startup',
      {
        clientVersion: '2.1',
        locale: 'en_US',
        order: 'first,last',
      }
    );

    this.syncToken = response.syncToken;
    this.prefToken = response.prefToken;

    return {
      contacts: response.contacts || [],
      groups: response.groups || [],
      syncToken: response.syncToken,
      meContactId: response.meContactId,
    };
  }

  /**
   * Get a specific contact by ID
   */
  async getContact(contactId: string): Promise<Contact | null> {
    const { contacts } = await this.list();
    return contacts.find(c => c.contactId === contactId) || null;
  }

  /**
   * Create a new contact
   */
  async create(contact: ContactCreateInput): Promise<Contact> {
    this.ensureInitialized();

    const newContact: Contact = {
      ...contact,
      contactId: generateContactId(),
      etag: generateEtag(),
    };

    const result = await this.modifyContacts([newContact], 'POST');
    return result[0];
  }

  /**
   * Update an existing contact
   */
  async update(contact: ContactUpdateInput): Promise<Contact> {
    this.ensureInitialized();

    const result = await this.modifyContacts([contact], 'PUT');
    return result[0];
  }

  /**
   * Delete a contact
   */
  async deleteContact(input: ContactDeleteInput): Promise<void> {
    this.ensureInitialized();

    await this.modifyContacts([input as Contact], 'DELETE');
  }

  /**
   * Create multiple contacts
   */
  async createMany(contacts: ContactCreateInput[]): Promise<Contact[]> {
    this.ensureInitialized();

    const newContacts = contacts.map(contact => ({
      ...contact,
      contactId: generateContactId(),
      etag: generateEtag(),
    }));

    return this.modifyContacts(newContacts, 'POST');
  }

  /**
   * Update multiple contacts
   */
  async updateMany(contacts: ContactUpdateInput[]): Promise<Contact[]> {
    this.ensureInitialized();

    return this.modifyContacts(contacts, 'PUT');
  }

  /**
   * Delete multiple contacts
   */
  async deleteMany(inputs: ContactDeleteInput[]): Promise<void> {
    this.ensureInitialized();

    await this.modifyContacts(inputs as Contact[], 'DELETE');
  }

  /**
   * Search contacts
   */
  async search(options: ContactSearchOptions): Promise<Contact[]> {
    const { contacts } = await this.list();
    const { query, fields = ['firstName', 'lastName', 'companyName', 'emails', 'phones'] } = options;
    const lowerQuery = query.toLowerCase();

    return contacts.filter(contact => {
      for (const field of fields) {
        if (field === 'emails' && contact.emails) {
          if (contact.emails.some(e => e.field.toLowerCase().includes(lowerQuery))) {
            return true;
          }
        } else if (field === 'phones' && contact.phones) {
          if (contact.phones.some(p => p.field.toLowerCase().includes(lowerQuery))) {
            return true;
          }
        } else {
          const value = contact[field as keyof Contact];
          if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
            return true;
          }
        }
      }
      return false;
    });
  }

  /**
   * Get all groups
   */
  async listGroups(): Promise<ContactGroup[]> {
    const { groups } = await this.list();
    return groups;
  }

  /**
   * Get a specific group by ID
   */
  async getGroup(groupId: string): Promise<ContactGroup | null> {
    const groups = await this.listGroups();
    return groups.find(g => g.groupId === groupId) || null;
  }

  /**
   * Create a new group
   */
  async createGroup(input: ContactGroupCreateInput): Promise<ContactGroup> {
    this.ensureInitialized();

    const response = await this.post<{ groups: ContactGroup[] }>(
      'contacts',
      '/co/groups/card/',
      {
        groups: [{
          groupId: generateContactId(),
          name: input.name,
          contactIds: input.contactIds || [],
        }],
      },
      {
        clientVersion: '2.1',
        locale: 'en_US',
        prefToken: this.prefToken,
        syncToken: this.syncToken,
      }
    );

    if (response.groups?.length) {
      this.updateTokens(response as unknown as { syncToken?: string; prefToken?: string });
      return response.groups[0];
    }

    throw new ICloudError('Failed to create group', 'UNKNOWN_ERROR');
  }

  /**
   * Update a group
   */
  async updateGroup(input: ContactGroupUpdateInput): Promise<ContactGroup> {
    this.ensureInitialized();

    const response = await this.post<{ groups: ContactGroup[] }>(
      'contacts',
      '/co/groups/card/',
      {
        groups: [input],
      },
      {
        clientVersion: '2.1',
        locale: 'en_US',
        method: 'PUT',
        prefToken: this.prefToken,
        syncToken: this.syncToken,
      }
    );

    if (response.groups?.length) {
      this.updateTokens(response as unknown as { syncToken?: string; prefToken?: string });
      return response.groups[0];
    }

    throw new ICloudError('Failed to update group', 'UNKNOWN_ERROR');
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string, etag: string): Promise<void> {
    this.ensureInitialized();

    await this.post(
      'contacts',
      '/co/groups/card/',
      {
        groups: [{ groupId, etag }],
      },
      {
        clientVersion: '2.1',
        locale: 'en_US',
        method: 'DELETE',
        prefToken: this.prefToken,
        syncToken: this.syncToken,
      }
    );
  }

  /**
   * Add contacts to a group
   */
  async addToGroup(groupId: string, contactIds: string[]): Promise<ContactGroup> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new ICloudError('Group not found', 'NOT_FOUND');
    }

    const updatedContactIds = [...new Set([...group.contactIds, ...contactIds])];

    return this.updateGroup({
      ...group,
      contactIds: updatedContactIds,
    });
  }

  /**
   * Remove contacts from a group
   */
  async removeFromGroup(groupId: string, contactIds: string[]): Promise<ContactGroup> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new ICloudError('Group not found', 'NOT_FOUND');
    }

    const contactIdSet = new Set(contactIds);
    const updatedContactIds = group.contactIds.filter(id => !contactIdSet.has(id));

    return this.updateGroup({
      ...group,
      contactIds: updatedContactIds,
    });
  }

  /**
   * Get contacts in a group
   */
  async getGroupContacts(groupId: string): Promise<Contact[]> {
    const [group, { contacts }] = await Promise.all([
      this.getGroup(groupId),
      this.list(),
    ]);

    if (!group) {
      throw new ICloudError('Group not found', 'NOT_FOUND');
    }

    const contactIdSet = new Set(group.contactIds);
    return contacts.filter(c => contactIdSet.has(c.contactId));
  }

  // Private methods
  private ensureInitialized(): void {
    if (!this.syncToken || !this.prefToken) {
      throw new ICloudError(
        'Contacts not initialized. Call list() first.',
        'NOT_INITIALIZED'
      );
    }
  }

  private async modifyContacts(
    contacts: Partial<Contact>[],
    method: 'POST' | 'PUT' | 'DELETE'
  ): Promise<Contact[]> {
    const response = await this.post<ContactModifyResponse>(
      'contacts',
      '/co/contacts/card/',
      { contacts },
      {
        clientVersion: '2.1',
        locale: 'en_US',
        method: method === 'POST' ? '' : method,
        order: 'first,last',
        prefToken: this.prefToken,
        syncToken: this.syncToken,
      }
    );

    this.updateTokens(response);
    return response.contacts || [];
  }

  private updateTokens(response: { syncToken?: string; prefToken?: string }): void {
    if (response.syncToken) {
      this.syncToken = response.syncToken;
    }
    if (response.prefToken) {
      this.prefToken = response.prefToken;
    }
  }
}
