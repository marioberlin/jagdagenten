/**
 * Notes types for iCloud Notes API
 */

export interface Note {
  recordName: string;
  recordType: string;
  recordChangeTag: string;
  fields: NoteFields;
  zoneID: ZoneID;
  created: Timestamp;
  modified: Timestamp;
  deleted?: boolean;
  title?: string;
  snippet?: string;
  textContent?: string;
  folder?: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface NoteFields {
  TitleEncrypted?: EncryptedValue;
  TextDataEncrypted?: EncryptedValue;
  Snippet?: StringValue;
  Note?: ReferenceValue;
  Folder?: ReferenceValue;
  Attachments?: AssetListValue;
  ModifiedByDevice?: StringValue;
  MinimumSupportedNotesVersion?: NumberValue;
  IsPinned?: NumberValue;
  Account?: ReferenceValue;
}

export interface EncryptedValue {
  value: string;
  type: 'ENCRYPTED_BYTES';
}

export interface StringValue {
  value: string;
  type: 'STRING';
}

export interface NumberValue {
  value: number;
  type: 'INT64' | 'DOUBLE';
}

export interface ReferenceValue {
  value: {
    recordName: string;
    action: 'DELETE_SELF' | 'NONE' | 'VALIDATE';
    zoneID: ZoneID;
  };
  type: 'REFERENCE';
}

export interface AssetListValue {
  value: AssetValue[];
  type: 'ASSET_LIST';
}

export interface AssetValue {
  value: {
    downloadURL: string;
    fileChecksum: string;
    size: number;
    wrappingKey?: string;
    referenceChecksum?: string;
  };
}

export interface ZoneID {
  zoneName: string;
  ownerRecordName: string;
  zoneType: string;
}

export interface Timestamp {
  timestamp: number;
  userRecordName?: string;
  deviceID?: string;
}

export interface NoteFolder {
  recordName: string;
  recordType: string;
  recordChangeTag: string;
  fields: NoteFolderFields;
  zoneID: ZoneID;
  created: Timestamp;
  modified: Timestamp;
  deleted?: boolean;
}

export interface NoteFolderFields {
  Name?: StringValue;
  SortOrder?: NumberValue;
  Identifier?: StringValue;
  DefaultFolder?: NumberValue;
  ParentFolder?: ReferenceValue;
}

export interface NoteAttachment {
  recordName: string;
  recordType: string;
  fields: NoteAttachmentFields;
  created: Timestamp;
  modified: Timestamp;
}

export interface NoteAttachmentFields {
  Type?: StringValue;
  MimeType?: StringValue;
  Size?: NumberValue;
  PreviewSize?: NumberValue;
  Filename?: StringValue;
  Media?: AssetValue;
  Preview?: AssetValue;
}

export interface NoteListResponse {
  records: Note[];
  continuationMarker?: string;
  syncToken?: string;
}

export interface NoteFolderListResponse {
  records: NoteFolder[];
}

export interface NoteCreateInput {
  title: string;
  body: string;
  folder?: string;
  isPinned?: boolean;
}

export interface NoteUpdateInput {
  recordName: string;
  title?: string;
  body?: string;
  folder?: string;
  isPinned?: boolean;
}

export interface NoteDeleteInput {
  recordName: string;
}

export interface NoteMoveInput {
  recordNames: string[];
  folder: string;
}

export interface NoteSearchOptions {
  query: string;
  folder?: string;
  limit?: number;
  includeTrash?: boolean;
}

// Protobuf-related types for note content parsing
export interface NoteDocument {
  version: number;
  text: NoteText;
  attributeRun?: AttributeRun[];
}

export interface NoteText {
  string: string;
  paragraphStyles?: ParagraphStyle[];
}

export interface AttributeRun {
  length: number;
  font?: FontInfo;
  fontWeight?: number;
  underlined?: boolean;
  strikethrough?: boolean;
  superscript?: number;
  link?: string;
  attachmentInfo?: AttachmentInfo;
  paragraphStyle?: ParagraphStyle;
}

export interface FontInfo {
  fontName?: string;
  pointSize?: number;
  fontHints?: number;
}

export interface ParagraphStyle {
  styleType?: number;
  alignment?: number;
  indent?: number;
  checklist?: ChecklistInfo;
}

export interface ChecklistInfo {
  done: boolean;
  uuid: string;
}

export interface AttachmentInfo {
  attachmentIdentifier: string;
  typeUti: string;
}

// Parsed note content (after protobuf decoding)
export interface ParsedNote {
  title: string;
  body: string;
  attachments: ParsedNoteAttachment[];
  checklists: ChecklistItem[];
  createdAt: Date;
  modifiedAt: Date;
  folder: string;
  isPinned: boolean;
  isLocked: boolean;
}

export interface ParsedNoteAttachment {
  id: string;
  type: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  downloadUrl?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  indent: number;
}
