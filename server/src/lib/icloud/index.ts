/**
 * iCloud API Client for TypeScript
 *
 * A comprehensive TypeScript library for interacting with iCloud services.
 *
 * @example
 * ```typescript
 * import { ICloud, createICloudClient } from './icloud-api';
 *
 * // Create client with stored session
 * const client = createICloudClient({
 *   session: storedSession,
 *   onSessionUpdate: (session) => saveSession(session),
 * });
 *
 * // Or create client for fresh login
 * const client = createICloudClient({
 *   credentials: { username: 'user@icloud.com', password: 'password' },
 *   onTwoFactorRequired: async (state) => {
 *     return prompt('Enter 2FA code:');
 *   },
 * });
 *
 * // Sign in
 * await client.signIn();
 *
 * // Use services
 * const contacts = await client.Contacts.list();
 * const events = await client.Calendar.getTodayEvents();
 * const reminders = await client.Reminders.getTodayReminders();
 *
 * // Listen for real-time updates
 * client.Push.connect();
 * client.Push.subscribe('CALENDAR_EVENT_ADDED', (notification) => {
 *   console.log('New calendar event:', notification);
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { ICloud, createICloudClient } from './ICloud';
export type { ICloudConfig, ICloudEvents } from './ICloud';

// Types
export * from './types';

// Services
export {
  BaseService,
  ContactsService,
  CalendarService,
  MailService,
  DriveService,
  NotesService,
  RemindersService,
  PhotosService,
  FindMyService,
  PushService,
  DEFAULT_PUSH_CONFIG,
} from './services';

// Errors
export {
  ICloudError,
  AuthenticationError,
  TwoFactorRequiredError,
  RateLimitError,
  NotFoundError,
  ConflictError,
  PermissionDeniedError,
  NetworkError,
  parseErrorResponse,
} from './errors/ICloudError';

// Utilities
export {
  // Date utilities
  dateToArray,
  arrayToDate,
  arrayToISOString,
  isoStringToArray,
  dateToAllDayArray,
  calculateDuration,
  addMinutes,
  isAllDayDate,
  formatDateArray,
  getDayBounds,
  getWeekBounds,
  getMonthBounds,
  parseTimestamp,
  now,
  compareDateArrays,

  // Cookie utilities
  parseCookie,
  parseCookies,
  cookiesToString,
  mergeCookies,
  isExpired,
  getCookiesForDomain,
  getCookiesForPath,
  getCookiesForUrl,
  serializeCookie,
  getCookieByName,
  removeExpiredCookies,
  cookiesToObject,

  // ID utilities
  generateUUID,
  generateShortId,
  generateClientId,
  generateDeviceId,
  generateContactId,
  generateEventGuid,
  generateReminderGuid,
  generateDriveItemId,
  generateRecordName,
  generateSessionId,
  generateEtag,
  parseCompoundId,
  createCompoundId,
  isValidUUID,
  normalizeUUID,
  generateCorrelationId,
  generateIdempotencyKey,

  // Helper utilities
  getHostFromWebservice,
  buildUrl,
  deepClone,
  deepMerge,
  sleep,
  retry,
  debounce,
  throttle,
  chunk,
  pick,
  omit,
  isDefined,
  createDeferred,
  encodeBase64,
  decodeBase64,
  safeJsonParse,
  formatBytes,
  truncate,
  hashCode,

  // HTTP client
  HttpClient,
  createHttpClient,
} from './utils';
export type { HttpClientConfig, RequestConfig, HttpResponse } from './utils/http';

// Default export
export { ICloud as default } from './ICloud';
