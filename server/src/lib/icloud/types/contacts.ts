/**
 * Contact types for iCloud Contacts API
 */

export interface Contact {
  contactId: string;
  etag: string;
  isCompany?: boolean;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  nickname?: string;
  companyName?: string;
  department?: string;
  jobTitle?: string;
  birthday?: string;
  notes?: string;
  phones?: ContactField[];
  emails?: ContactField[];
  urls?: ContactField[];
  addresses?: ContactAddress[];
  dates?: ContactDate[];
  relatedNames?: ContactField[];
  profiles?: ContactProfile[];
  IMs?: ContactField[];
  photo?: ContactPhoto;
}

export interface ContactField {
  field: string;
  label: string;
}

export interface ContactAddress {
  label: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
}

export interface ContactDate {
  field: string; // YYYY-MM-DD format
  label: string;
}

export interface ContactProfile {
  user: string;
  label: string;
  service?: string;
}

export interface ContactPhoto {
  url?: string;
  isMe?: boolean;
}

export interface ContactGroup {
  groupId: string;
  name: string;
  etag: string;
  contactIds: string[];
}

export interface ContactListResponse {
  contacts: Contact[];
  groups: ContactGroup[];
  syncToken: string;
  prefToken: string;
  meContactId?: string;
}

export interface ContactModifyResponse {
  contacts: Contact[];
  syncToken: string;
  prefToken: string;
}

export interface ContactListResult {
  contacts: Contact[];
  groups: ContactGroup[];
  syncToken: string;
  meContactId?: string;
}

export interface ContactCreateInput extends Omit<Contact, 'contactId' | 'etag'> {}

export interface ContactUpdateInput extends Contact {}

export interface ContactDeleteInput {
  contactId: string;
  etag: string;
}

export interface ContactGroupCreateInput {
  name: string;
  contactIds?: string[];
}

export interface ContactGroupUpdateInput extends ContactGroup {}

export interface ContactSearchOptions {
  query: string;
  fields?: ('firstName' | 'lastName' | 'companyName' | 'emails' | 'phones')[];
}
