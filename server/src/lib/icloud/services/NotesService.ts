/**
 * Notes Service for iCloud Notes API
 */

import { BaseService } from './BaseService';
import type {
  Note,
  NoteFolder,
  NoteCreateInput,
  NoteUpdateInput,
  NoteDeleteInput,
  NoteMoveInput,
  NoteSearchOptions,
  ParsedNote,
  ChecklistItem,
} from '../types/notes';
import { ICloudError } from '../errors/ICloudError';
import { generateRecordName } from '../utils/ids';

export class NotesService extends BaseService {
  private folders: NoteFolder[] = [];
  private _syncToken?: string;
  private initialized = false;

  get syncToken(): string | undefined {
    return this._syncToken;
  }

  protected getServiceConfig() {
    return this.client.account?.webservices.notes;
  }

  /**
   * Initialize Notes service and get folders
   */
  async startup(): Promise<{ folders: NoteFolder[]; notes: Note[] }> {
    // Get folders
    const foldersResponse = await this.cloudKitQuery<NoteFolder>(
      'folders',
      'Folder',
      []
    );

    this.folders = foldersResponse.records || [];

    // Get notes
    const notesResponse = await this.cloudKitQuery<Note>(
      'notes',
      'Note',
      []
    );

    this.initialized = true;

    return {
      folders: this.folders,
      notes: notesResponse.records || [],
    };
  }

  /**
   * List all folders
   */
  async listFolders(): Promise<NoteFolder[]> {
    if (!this.initialized) {
      await this.startup();
    }
    return this.folders;
  }

  /**
   * Get all notes
   */
  async listNotes(folderRecordName?: string): Promise<Note[]> {
    const filters = folderRecordName
      ? [{
          fieldName: 'Folder',
          comparator: 'EQUALS',
          fieldValue: { value: { recordName: folderRecordName } },
        }]
      : [];

    const response = await this.cloudKitQuery<Note>('notes', 'Note', filters);
    return response.records || [];
  }

  /**
   * Get a specific note
   */
  async getNote(recordName: string): Promise<Note | null> {
    try {
      const response = await this.cloudKitLookup<Note>([recordName]);
      return response.records?.[0] || null;
    } catch (error) {
      if (error instanceof ICloudError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get parsed note content (decrypted and formatted)
   */
  async getParsedNote(recordName: string): Promise<ParsedNote | null> {
    const note = await this.getNote(recordName);
    if (!note) return null;

    return this.parseNote(note);
  }

  /**
   * Create a new note
   */
  async createNote(input: NoteCreateInput): Promise<Note> {
    const recordName = generateRecordName();

    // Get default folder if not specified
    let folderRecordName = input.folder;
    if (!folderRecordName) {
      const folders = await this.listFolders();
      const defaultFolder = folders.find(f =>
        f.fields.DefaultFolder?.value === 1
      );
      folderRecordName = defaultFolder?.recordName || folders[0]?.recordName;
    }

    if (!folderRecordName) {
      throw new ICloudError('No folder available', 'NOT_FOUND');
    }

    // Create note record
    const noteFields: Record<string, unknown> = {
      TitleEncrypted: {
        value: this.encryptText(input.title),
        type: 'ENCRYPTED_BYTES',
      },
      TextDataEncrypted: {
        value: this.encryptText(input.body),
        type: 'ENCRYPTED_BYTES',
      },
      Snippet: {
        value: input.body.substring(0, 200),
        type: 'STRING',
      },
      Folder: {
        value: {
          recordName: folderRecordName,
          action: 'NONE',
        },
        type: 'REFERENCE',
      },
      IsPinned: {
        value: input.isPinned ? 1 : 0,
        type: 'INT64',
      },
    };

    const response = await this.cloudKitModify<Note>([{
      recordType: 'Note',
      recordName,
      fields: noteFields,
    }]);

    if (!response.records?.length) {
      throw new ICloudError('Failed to create note', 'UNKNOWN_ERROR');
    }

    return response.records[0];
  }

  /**
   * Update an existing note
   */
  async updateNote(input: NoteUpdateInput): Promise<Note> {
    const existingNote = await this.getNote(input.recordName);
    if (!existingNote) {
      throw new ICloudError('Note not found', 'NOT_FOUND');
    }

    const fields: Record<string, unknown> = {};

    if (input.title !== undefined) {
      fields.TitleEncrypted = {
        value: this.encryptText(input.title),
        type: 'ENCRYPTED_BYTES',
      };
    }

    if (input.body !== undefined) {
      fields.TextDataEncrypted = {
        value: this.encryptText(input.body),
        type: 'ENCRYPTED_BYTES',
      };
      fields.Snippet = {
        value: input.body.substring(0, 200),
        type: 'STRING',
      };
    }

    if (input.isPinned !== undefined) {
      fields.IsPinned = {
        value: input.isPinned ? 1 : 0,
        type: 'INT64',
      };
    }

    if (input.folder !== undefined) {
      fields.Folder = {
        value: {
          recordName: input.folder,
          action: 'NONE',
        },
        type: 'REFERENCE',
      };
    }

    const response = await this.cloudKitModify<Note>([{
      recordType: 'Note',
      recordName: input.recordName,
      recordChangeTag: existingNote.recordChangeTag,
      fields,
    }]);

    if (!response.records?.length) {
      throw new ICloudError('Failed to update note', 'UNKNOWN_ERROR');
    }

    return response.records[0];
  }

  /**
   * Delete a note
   */
  async deleteNote(input: NoteDeleteInput): Promise<void> {
    await this.cloudKitModify([{
      recordType: 'Note',
      recordName: input.recordName,
      desiredKeys: ['__delete__'],
    }]);
  }

  /**
   * Move notes to a folder
   */
  async moveNotes(input: NoteMoveInput): Promise<void> {
    const operations = input.recordNames.map(recordName => ({
      recordType: 'Note',
      recordName,
      fields: {
        Folder: {
          value: {
            recordName: input.folder,
            action: 'NONE',
          },
          type: 'REFERENCE' as const,
        },
      },
    }));

    await this.cloudKitModify(operations);
  }

  /**
   * Pin/unpin a note
   */
  async togglePin(recordName: string, isPinned: boolean): Promise<Note> {
    return this.updateNote({ recordName, isPinned });
  }

  /**
   * Search notes
   */
  async search(options: NoteSearchOptions): Promise<Note[]> {
    const notes = await this.listNotes(options.folder);
    const lowerQuery = options.query.toLowerCase();

    return notes.filter(note => {
      const parsed = this.parseNote(note);
      if (!parsed) return false;

      return (
        parsed.title.toLowerCase().includes(lowerQuery) ||
        parsed.body.toLowerCase().includes(lowerQuery)
      );
    }).slice(0, options.limit || 50);
  }

  /**
   * Get recently modified notes
   */
  async getRecentNotes(limit: number = 20): Promise<Note[]> {
    const notes = await this.listNotes();

    return notes
      .sort((a, b) => b.modified.timestamp - a.modified.timestamp)
      .slice(0, limit);
  }

  /**
   * Get pinned notes
   */
  async getPinnedNotes(): Promise<Note[]> {
    const notes = await this.listNotes();
    return notes.filter(note => note.fields.IsPinned?.value === 1);
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string): Promise<NoteFolder> {
    const recordName = generateRecordName();

    const response = await this.cloudKitModify<NoteFolder>([{
      recordType: 'Folder',
      recordName,
      fields: {
        Name: {
          value: name,
          type: 'STRING',
        },
      },
    }]);

    if (!response.records?.length) {
      throw new ICloudError('Failed to create folder', 'UNKNOWN_ERROR');
    }

    // Update local cache
    this.folders.push(response.records[0]);

    return response.records[0];
  }

  /**
   * Delete a folder
   */
  async deleteFolder(recordName: string): Promise<void> {
    // First, get all notes in the folder
    const notes = await this.listNotes(recordName);

    // Delete all notes in the folder
    if (notes.length > 0) {
      await Promise.all(
        notes.map(note => this.deleteNote({ recordName: note.recordName }))
      );
    }

    // Delete the folder
    await this.cloudKitModify([{
      recordType: 'Folder',
      recordName,
      desiredKeys: ['__delete__'],
    }]);

    // Update local cache
    this.folders = this.folders.filter(f => f.recordName !== recordName);
  }

  // Private helpers

  private async cloudKitQuery<T>(
    _operation: string,
    recordType: string,
    filters: Array<{
      fieldName: string;
      comparator: string;
      fieldValue: unknown;
    }>
  ): Promise<{ records: T[]; continuationMarker?: string }> {
    const response = await this.post<{ records: T[]; continuationMarker?: string }>(
      'ckdatabasews',
      '/database/1/com.apple.notes/production/private/records/query',
      {
        query: {
          recordType,
          filterBy: filters,
        },
        zoneID: {
          zoneName: 'Notes',
          ownerRecordName: '_defaultOwner',
        },
      }
    );

    if (response.continuationMarker) {
      this._syncToken = response.continuationMarker;
    }

    return response;
  }

  private async cloudKitLookup<T>(
    recordNames: string[]
  ): Promise<{ records: T[] }> {
    return this.post<{ records: T[] }>(
      'ckdatabasews',
      '/database/1/com.apple.notes/production/private/records/lookup',
      {
        records: recordNames.map(recordName => ({ recordName })),
        zoneID: {
          zoneName: 'Notes',
          ownerRecordName: '_defaultOwner',
        },
      }
    );
  }

  private async cloudKitModify<T>(
    operations: Array<{
      recordType: string;
      recordName: string;
      recordChangeTag?: string;
      fields?: Record<string, unknown>;
      desiredKeys?: string[];
    }>
  ): Promise<{ records: T[] }> {
    return this.post<{ records: T[] }>(
      'ckdatabasews',
      '/database/1/com.apple.notes/production/private/records/modify',
      {
        operations: operations.map(op => ({
          operationType: op.desiredKeys?.includes('__delete__') ? 'delete' : 'create',
          record: op,
        })),
        zoneID: {
          zoneName: 'Notes',
          ownerRecordName: '_defaultOwner',
        },
      }
    );
  }

  private parseNote(note: Note): ParsedNote | null {
    try {
      const title = note.fields.TitleEncrypted?.value
        ? this.decryptText(note.fields.TitleEncrypted.value)
        : note.title || '';

      const body = note.fields.TextDataEncrypted?.value
        ? this.decryptText(note.fields.TextDataEncrypted.value)
        : note.textContent || '';

      const folderRef = note.fields.Folder?.value;

      return {
        title,
        body,
        attachments: [],
        checklists: this.parseChecklists(body),
        createdAt: new Date(note.created.timestamp),
        modifiedAt: new Date(note.modified.timestamp),
        folder: typeof folderRef === 'object' && folderRef !== null
          ? (folderRef as { recordName: string }).recordName
          : '',
        isPinned: note.fields.IsPinned?.value === 1,
        isLocked: note.isLocked || false,
      };
    } catch {
      return null;
    }
  }

  private parseChecklists(body: string): ChecklistItem[] {
    const items: ChecklistItem[] = [];
    const lines = body.split('\n');

    for (const line of lines) {
      // Match checklist items: [ ] or [x] followed by text
      const match = line.match(/^(\s*)\[([ x])\]\s*(.*)$/i);
      if (match) {
        items.push({
          id: generateRecordName(),
          text: match[3],
          done: match[2].toLowerCase() === 'x',
          indent: Math.floor(match[1].length / 2),
        });
      }
    }

    return items;
  }

  // Note: Real encryption would require the user's iCloud keys
  // These are placeholder implementations
  private encryptText(text: string): string {
    // In a real implementation, this would use protobuf + encryption
    return btoa(unescape(encodeURIComponent(text)));
  }

  private decryptText(encrypted: string): string {
    // In a real implementation, this would use protobuf + decryption
    try {
      return decodeURIComponent(escape(atob(encrypted)));
    } catch {
      return encrypted;
    }
  }
}
