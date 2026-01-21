/**
 * Main iCloud API Client
 *
 * A TypeScript implementation of the iCloud API client.
 */

import type {
  Session,
  Account,
  Cookie,
} from './types/session';
import type {
  AuthCredentials,
  TwoFactorState,
  ClientSettings,
  SignInResponse,
  ValidateSessionResponse,
} from './types/auth';
import {
  AUTH_ENDPOINTS,
  DEFAULT_CLIENT_SETTINGS,
} from './types/auth';
import {
  ICloudError,
  AuthenticationError,
  TwoFactorRequiredError,
} from './errors/ICloudError';
import { createHttpClient } from './utils/http';
import type { HttpClient } from './utils/http';
import { generateClientId } from './utils/ids';

// Import services
import { ContactsService } from './services/ContactsService';
import { CalendarService } from './services/CalendarService';
import { MailService } from './services/MailService';
import { DriveService } from './services/DriveService';
import { NotesService } from './services/NotesService';
import { RemindersService } from './services/RemindersService';
import { PhotosService } from './services/PhotosService';
import { FindMyService } from './services/FindMyService';
import { PushService } from './services/PushService';

export interface ICloudConfig {
  /** Session data for restoring a previous session */
  session?: Session;
  /** Credentials for fresh login */
  credentials?: AuthCredentials;
  /** Client settings override */
  clientSettings?: Partial<ClientSettings>;
  /** Callback when session is updated (for persistence) */
  onSessionUpdate?: (session: Session) => void;
  /** Callback for 2FA code prompt */
  onTwoFactorRequired?: (state: TwoFactorState) => Promise<string>;
  /** Enable debug logging */
  debug?: boolean;
}

export interface ICloudEvents {
  ready: () => void;
  error: (error: ICloudError) => void;
  sessionUpdate: (session: Session) => void;
  twoFactorRequired: (state: TwoFactorState) => void;
}

type EventHandler<K extends keyof ICloudEvents> = ICloudEvents[K];

export class ICloud {
  // Public properties
  public readonly clientSettings: ClientSettings;
  public account: Account | null = null;
  public http: HttpClient;

  // Services (initialized after authentication)
  private _contacts: ContactsService | null = null;
  private _calendar: CalendarService | null = null;
  private _mail: MailService | null = null;
  private _drive: DriveService | null = null;
  private _notes: NotesService | null = null;
  private _reminders: RemindersService | null = null;
  private _photos: PhotosService | null = null;
  private _findMy: FindMyService | null = null;
  private _push: PushService | null = null;

  // Private state
  private cookies: Cookie[] = [];
  private session: Session | null = null;
  private config: ICloudConfig;
  private authenticated = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: ICloudConfig = {}) {
    this.config = config;

    // Initialize client settings
    this.clientSettings = {
      ...DEFAULT_CLIENT_SETTINGS,
      clientId: generateClientId(),
      ...config.clientSettings,
    };

    // Initialize HTTP client
    this.http = createHttpClient({
      timeout: 30000,
      clientSettings: this.clientSettings,
      onCookiesUpdate: (cookies) => {
        this.cookies = cookies;
        this.updateSession();
      },
      onError: (error) => {
        this.emit('error', error);
      },
    });

    // Restore session if provided
    if (config.session) {
      this.restoreSession(config.session);
    }
  }

  // Service getters
  get Contacts(): ContactsService {
    this.ensureAuthenticated();
    if (!this._contacts) {
      this._contacts = new ContactsService(this);
    }
    return this._contacts;
  }

  get Calendar(): CalendarService {
    this.ensureAuthenticated();
    if (!this._calendar) {
      this._calendar = new CalendarService(this);
    }
    return this._calendar;
  }

  get Mail(): MailService {
    this.ensureAuthenticated();
    if (!this._mail) {
      this._mail = new MailService(this);
    }
    return this._mail;
  }

  get Drive(): DriveService {
    this.ensureAuthenticated();
    if (!this._drive) {
      this._drive = new DriveService(this);
    }
    return this._drive;
  }

  get Notes(): NotesService {
    this.ensureAuthenticated();
    if (!this._notes) {
      this._notes = new NotesService(this);
    }
    return this._notes;
  }

  get Reminders(): RemindersService {
    this.ensureAuthenticated();
    if (!this._reminders) {
      this._reminders = new RemindersService(this);
    }
    return this._reminders;
  }

  get Photos(): PhotosService {
    this.ensureAuthenticated();
    if (!this._photos) {
      this._photos = new PhotosService(this);
    }
    return this._photos;
  }

  get FindMy(): FindMyService {
    this.ensureAuthenticated();
    if (!this._findMy) {
      this._findMy = new FindMyService(this);
    }
    return this._findMy;
  }

  get Push(): PushService {
    this.ensureAuthenticated();
    if (!this._push) {
      this._push = new PushService(this);
    }
    return this._push;
  }

  /**
   * Check if the client is authenticated
   */
  get isAuthenticated(): boolean {
    return this.authenticated && this.account !== null;
  }

  /**
   * Get the current session for persistence
   */
  getSession(): Session | null {
    return this.session;
  }

  /**
   * Sign in with credentials
   */
  async signIn(credentials?: AuthCredentials): Promise<void> {
    const creds = credentials || this.config.credentials;
    if (!creds) {
      throw new AuthenticationError(
        'No credentials provided',
        'AUTH_REQUIRED'
      );
    }

    this.log('Signing in...');

    try {
      // Step 1: Sign in to Apple ID
      const signInResponse = await this.http.post<SignInResponse>(
        AUTH_ENDPOINTS.signIn,
        {
          accountName: creds.username,
          password: creds.password,
          rememberMe: true,
          trustTokens: [],
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Apple-OAuth-Client-Id': 'd39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d',
            'X-Apple-OAuth-Client-Type': 'firstPartyAuth',
            'X-Apple-OAuth-Redirect-URI': 'https://www.icloud.com',
            'X-Apple-OAuth-Require-Grant-Code': 'true',
            'X-Apple-OAuth-Response-Mode': 'web_message',
            'X-Apple-OAuth-Response-Type': 'code',
            'X-Apple-OAuth-State': this.clientSettings.clientId,
            'X-Apple-Widget-Key': 'd39ba9916b7251055b22c7f910e2ea796ee65e98b2ddecea8f5dde8d9d1a815d',
          },
        }
      );

      // Check for 2FA requirement
      if (signInResponse.data.hsaChallengeRequired) {
        await this.handleTwoFactor();
      }

      // Trust the browser
      await this.trustBrowser();

      // Validate session and get account info
      await this.validateSession();

      this.authenticated = true;
      this.log('Sign in successful');
      this.emit('ready');
    } catch (error) {
      this.log('Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Handle two-factor authentication
   */
  private async handleTwoFactor(): Promise<void> {
    const twoFactorState: TwoFactorState = {
      required: true,
      methods: ['trustedDevice'],
    };

    this.emit('twoFactorRequired', twoFactorState);

    // Get code from callback or throw
    if (!this.config.onTwoFactorRequired) {
      throw new TwoFactorRequiredError(
        'Two-factor authentication required. Provide onTwoFactorRequired callback.',
        { methods: twoFactorState.methods }
      );
    }

    const code = await this.config.onTwoFactorRequired(twoFactorState);

    // Verify the code
    await this.verifyTwoFactorCode(code);
  }

  /**
   * Verify a 2FA code
   */
  async verifyTwoFactorCode(code: string): Promise<void> {
    this.log('Verifying 2FA code...');

    await this.http.post(
      AUTH_ENDPOINTS.twoFactorVerify,
      {
        securityCode: { code },
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Apple-ID-Session-Id': this.getSessionIdFromCookies(),
          'scnt': this.getScntFromCookies(),
        },
      }
    );

    this.log('2FA verification successful');
  }

  /**
   * Trust the browser to avoid 2FA on future logins
   */
  private async trustBrowser(): Promise<void> {
    this.log('Trusting browser...');

    try {
      await this.http.get(AUTH_ENDPOINTS.trustBrowser, {
        headers: {
          'X-Apple-ID-Session-Id': this.getSessionIdFromCookies(),
          'scnt': this.getScntFromCookies(),
        },
      });
    } catch (error) {
      // Trust request may fail, but login can still proceed
      this.log('Trust browser request failed (may be expected):', error);
    }
  }

  /**
   * Validate the session and get account info
   */
  private async validateSession(): Promise<void> {
    this.log('Validating session...');

    const response = await this.http.post<ValidateSessionResponse>(
      AUTH_ENDPOINTS.accountLogin,
      {
        dsWebAuthToken: this.getDsWebAuthToken(),
        extended_login: true,
      },
      {
        params: {
          clientBuildNumber: this.clientSettings.clientBuildNumber,
          clientMasteringNumber: this.clientSettings.clientMasteringNumber,
          clientId: this.clientSettings.clientId,
        },
      }
    );

    // Store account info
    this.account = response.data as unknown as Account;
    this.authenticated = true;
    this.updateSession();

    this.log('Session validated successfully');
  }

  /**
   * Restore a previous session
   */
  private restoreSession(session: Session): void {
    this.log('Restoring session...');

    this.session = session;
    this.cookies = session.cookies;
    this.account = session.account;
    this.http.setCookies(session.cookies);

    // Check if session is still valid
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      this.log('Session expired, will need to re-authenticate');
      this.authenticated = false;
    } else {
      this.authenticated = true;
    }
  }

  /**
   * Refresh the session if needed
   */
  async refreshSession(): Promise<void> {
    if (!this.cookies.length) {
      throw new AuthenticationError(
        'No session to refresh',
        'AUTH_REQUIRED'
      );
    }

    await this.validateSession();
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.log('Signing out...');

    try {
      await this.http.get(AUTH_ENDPOINTS.signOut);
    } catch (error) {
      // Ignore sign out errors
      this.log('Sign out request failed (may be expected):', error);
    }

    // Clear state
    this.cookies = [];
    this.session = null;
    this.account = null;
    this.authenticated = false;

    // Clear services
    this._contacts = null;
    this._calendar = null;
    this._mail = null;
    this._drive = null;
    this._notes = null;
    this._reminders = null;
    this._photos = null;
    this._findMy = null;
    this._push = null;

    this.log('Signed out successfully');
  }

  // Event handling
  on<K extends keyof ICloudEvents>(event: K, handler: EventHandler<K>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof ICloudEvents>(event: K, handler: EventHandler<K>): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit<K extends keyof ICloudEvents>(
    event: K,
    ...args: Parameters<ICloudEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as (...args: unknown[]) => void)(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  // Private helpers
  private ensureAuthenticated(): void {
    if (!this.authenticated) {
      throw new AuthenticationError(
        'Not authenticated. Call signIn() first.',
        'AUTH_REQUIRED'
      );
    }
  }

  private updateSession(): void {
    if (!this.account) return;

    this.session = {
      cookies: this.cookies,
      authToken: this.getDsWebAuthToken() || '',
      account: this.account,
      username: this.account.dsInfo.appleId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    this.config.onSessionUpdate?.(this.session);
    this.emit('sessionUpdate', this.session);
  }

  private getSessionIdFromCookies(): string {
    const cookie = this.cookies.find(c => c.name === 'X-APPLE-ID-SESSION-ID');
    return cookie?.value || '';
  }

  private getScntFromCookies(): string {
    const cookie = this.cookies.find(c => c.name === 'scnt');
    return cookie?.value || '';
  }

  private getDsWebAuthToken(): string | null {
    const cookie = this.cookies.find(c => c.name === 'X-APPLE-WEB-KB');
    return cookie?.value || null;
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ICloud]', ...args);
    }
  }
}

/**
 * Create a new iCloud client
 */
export function createICloudClient(config: ICloudConfig = {}): ICloud {
  return new ICloud(config);
}

// Default export
export default ICloud;
