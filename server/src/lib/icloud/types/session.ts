/**
 * Session types for iCloud API
 */

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface Session {
  cookies: Cookie[];
  authToken: string;
  twoFactorToken?: string;
  account: Account;
  username: string;
  expiresAt: Date;
}

export interface SessionInput {
  /** Path to session JSON file */
  path?: string;
  /** Direct session object */
  session?: Session;
  /** For fresh login */
  username?: string;
  /** For fresh login */
  password?: string;
}

export interface Account {
  dsInfo: DSInfo;
  webservices: WebServices;
  hasMinimumDeviceForPhotosWeb: boolean;
  iCDPEnabled: boolean;
  hsaTrustedBrowser: boolean;
  appleIdEntries: AppleIdEntry[];
  pcsEnabled: boolean;
  configBag: ConfigBag;
  hsaChallengeRequired: boolean;
  requestInfo: RequestInfo;
  pcsServiceIdentitiesIncluded: boolean;
  hsaVersion: number;
  pcsDeleted: boolean;
  iCloudAppleIdAlias: string;
  apps: AppInfo[];
}

export interface DSInfo {
  dsid: string;
  lastName: string;
  firstName: string;
  fullName: string;
  appleId: string;
  primaryEmail: string;
  appleIdAliases: string[];
  locale: string;
  languageCode: string;
  countryCode: string;
  primaryEmailVerified: boolean;
  locked: boolean;
  hasPaymentInfo: boolean;
  birthDay: number;
  birthMonth: number;
  aDsID: string;
  isPaidDeveloper: boolean;
  isCustomDomainsFeatureEnabled: boolean;
  isHideMyEmailFeatureEnabled: boolean;
  trustdDeviceList: TrustedDevice[];
  notificationId: string;
  statusCode: number;
}

export interface TrustedDevice {
  deviceName: string;
  deviceClass: string;
  deviceId: string;
  serialNumber: string;
  pushToken: string;
  lastLoggedIn?: Date;
}

export interface WebServices {
  reminders: WebService;
  notes: WebService;
  mail: WebService;
  contacts: WebService;
  calendar: WebService;
  photos: WebService;
  drive: WebService;
  findme: WebService;
  fmf: WebService;
  push: WebService;
  settings: WebService;
  ubiquity: WebService;
  ckdatabasews: WebService;
  cksharews: WebService;
  docws: WebService;
  [key: string]: WebService;
}

export interface WebService {
  url: string;
  status: 'active' | 'inactive';
  pcsRequired?: boolean;
}

export interface AppleIdEntry {
  isPrimary: boolean;
  type: string;
  value: string;
}

export interface ConfigBag {
  urls: Record<string, string>;
  accountCreateEnabled: boolean;
}

export interface RequestInfo {
  country: string;
  timeZone: string;
  isAppleInternal: boolean;
}

export interface AppInfo {
  canLaunchWithOneFactor: boolean;
  isQualifiedForBeta: boolean;
  name: string;
}
