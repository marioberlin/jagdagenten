/**
 * Find My types for iCloud Find My API
 */

export interface Device {
  id: string;
  name: string;
  deviceDisplayName: string;
  deviceModel: string;
  modelDisplayName: string;
  deviceClass: DeviceClass;
  rawDeviceModel: string;
  batteryLevel: number;
  batteryStatus: BatteryStatus;
  location?: DeviceLocation;
  locationEnabled: boolean;
  locFoundEnabled: boolean;
  lostModeEnabled: boolean;
  lostModeCapable: boolean;
  isLocating: boolean;
  fmlyShare: boolean;
  lostDevice?: LostDeviceInfo;
  canWipeAfterLock: boolean;
  wipeInProgress: boolean;
  darkWake: boolean;
  deviceDiscoveryId: string;
  activationLocked: boolean;
  passcodeLength: number;
  maxMsgChar: number;
  prsId: string;
  rm2State: number;
  lockedTimestamp?: number;
  locationCapable: boolean;
  trackingInfo?: TrackingInfo;
  msg?: DeviceMessage;
  snd?: SoundInfo;
  features?: Record<string, boolean>;
  deviceColor?: string;
  deviceStatus?: string;
  lowPowerMode?: boolean;
  thisDevice?: boolean;
}

export type DeviceClass =
  | 'iPhone'
  | 'iPad'
  | 'iPod'
  | 'Mac'
  | 'MacBook'
  | 'iMac'
  | 'MacPro'
  | 'MacMini'
  | 'AppleWatch'
  | 'AirPods'
  | 'AirPodsMax'
  | 'AirPodsCase'
  | 'AppleTV'
  | 'HomePod'
  | 'HomePodMini'
  | 'AirTag';

export type BatteryStatus =
  | 'NotCharging'
  | 'Charging'
  | 'Charged'
  | 'Unknown';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  positionType: PositionType;
  timeStamp: number;
  locationType?: string;
  floorLevel?: number;
  isInaccurate?: boolean;
  isOld?: boolean;
  locationFinished?: boolean;
}

export type PositionType =
  | 'GPS'
  | 'Wifi'
  | 'Cellular'
  | 'Offline'
  | 'Crowdsourced';

export interface LostDeviceInfo {
  text?: string;
  ownerNbr?: string;
  createTimestamp?: number;
  statusCode?: string;
  stopLostMode?: boolean;
  emailUpdates?: boolean;
  emailSent?: boolean;
  footnote?: string;
  soundEnabled?: boolean;
}

export interface TrackingInfo {
  isInvalidated: boolean;
  beaconExpirationDate?: number;
  crowdsourcedLocation?: DeviceLocation;
}

export interface DeviceMessage {
  statusCode?: string;
  userText?: string;
}

export interface SoundInfo {
  statusCode?: string;
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  location?: FriendLocation;
  locationEnabled: boolean;
  labels?: string[];
  avatar?: string;
  invitation?: FriendInvitation;
}

export interface FriendLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  horizontalAccuracy: number;
  timestamp: number;
  address?: FriendAddress;
  isOld: boolean;
  locSource?: string;
}

export interface FriendAddress {
  formattedAddressLines?: string[];
  streetName?: string;
  streetAddress?: string;
  locality?: string;
  administrativeArea?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface FriendInvitation {
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  direction: 'incoming' | 'outgoing';
  timestamp: number;
  expirationTimestamp?: number;
}

export interface Item {
  id: string;
  name: string;
  serialNumber?: string;
  productType: ItemType;
  productInfo: ProductInfo;
  location?: ItemLocation;
  address?: FriendAddress;
  role: ItemRole;
  safeLocations?: SafeLocation[];
  lostModeMetadata?: LostModeMetadata;
  capabilities: number;
  isFirmwareUpdateMandatory: boolean;
  owner?: string;
  batteryStatus?: number;
  crowdSourcedLocation?: ItemLocation;
  groupIdentifier?: string;
  systemVersion?: string;
  isAppleAudioAccessory?: boolean;
}

export type ItemType =
  | 'b389'      // AirTag
  | 'iPhone'
  | 'iPad'
  | 'MacBook'
  | 'AirPods'
  | 'AppleWatch'
  | 'thirdParty';

export type ItemRole =
  | 'owner'
  | 'borrower'
  | 'shared'
  | 'nfc'
  | 'unknown';

export interface ProductInfo {
  manufacturerName: string;
  modelName: string;
  productIdentifier: number;
  vendorIdentifier: number;
  antennaPower: number;
}

export interface ItemLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  floorLevel?: number;
  timeStamp: number;
  positionType: PositionType;
  isInaccurate: boolean;
  isOld: boolean;
  locationFinished: boolean;
}

export interface SafeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'home' | 'work' | 'custom';
}

export interface LostModeMetadata {
  enabled: boolean;
  message?: string;
  phoneNumber?: string;
  email?: string;
  timestamp?: number;
}

export interface FindMyListResponse {
  devices: Device[];
  content?: Device[];
  serverContext?: ServerContext;
}

export interface FindMyFriendsResponse {
  friends: Friend[];
  following?: Friend[];
  followers?: Friend[];
}

export interface FindMyItemsResponse {
  items: Item[];
  rawItems?: Item[];
}

export interface ServerContext {
  minCallbackIntervalInMS: number;
  enableMapStats: boolean;
  preferredLanguage: string;
  lastSessionExtensionTime?: number;
  validRegion: boolean;
  timezone: TimezoneInfo;
  authToken: string;
  maxCallbackIntervalInMS: number;
  classicDeviceCount: number;
  deviceLoadStatus: string;
  sessionLifespan: number;
  callbackIntervalInMS: number;
  prsId: number;
  isHSA: boolean;
  cloudUser: boolean;
  prefsUpdateTime: number;
}

export interface TimezoneInfo {
  currentOffset: number;
  previousOffset: number;
  previousTransition: number;
  tzName: string;
}

export interface PlaySoundInput {
  deviceId: string;
  subject?: string;
}

export interface LostModeInput {
  deviceId: string;
  enable: boolean;
  phoneNumber?: string;
  text?: string;
  emailUpdates?: boolean;
}

export interface RefreshLocationInput {
  deviceId?: string;
  selectedDevice?: string;
  fmly?: boolean;
}

export interface LocationRefreshResponse {
  device?: Device;
  serverContext?: ServerContext;
  statusCode?: string;
}

export interface SendMessageInput {
  deviceId: string;
  subject: string;
  text?: string;
  sound?: boolean;
}

export interface RemoteLockInput {
  deviceId: string;
  passcode: string;
  ownerNbr?: string;
  text?: string;
}

export interface RemoteWipeInput {
  deviceId: string;
}

export interface ShareLocationInput {
  email: string;
  duration?: number; // in hours
  label?: string;
}

export interface FindMyQueryOptions {
  includeItems?: boolean;
  includeFriends?: boolean;
  includeFamily?: boolean;
  refreshLocations?: boolean;
}

export interface GeofenceAlert {
  id: string;
  type: 'enter' | 'leave' | 'both';
  deviceId?: string;
  friendId?: string;
  itemId?: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  name: string;
  enabled: boolean;
  lastTriggered?: number;
}
