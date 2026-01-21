/**
 * Authentication types for iCloud API
 */

import type { Cookie } from './session';

export interface AuthState {
  cookies: Cookie[];
  token: string;
  sessionId: string;
  scnt: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface TwoFactorState {
  required: boolean;
  methods: TwoFactorMethod[];
  phoneNumbers?: MaskedPhoneNumber[];
}

export type TwoFactorMethod = 'sms' | 'voice' | 'trustedDevice';

export interface MaskedPhoneNumber {
  id: number;
  numberWithDialCode: string;
  obfuscatedNumber: string;
  pushMode: string;
}

export interface AuthResponse {
  authType: 'hsa' | 'hsa2' | 'non-hsa';
  dsInfo?: {
    dsid: string;
    [key: string]: unknown;
  };
}

export interface SignInRequest {
  accountName: string;
  password: string;
  rememberMe: boolean;
  trustTokens: string[];
}

export interface SignInResponse {
  authType?: string;
  dsInfo?: {
    dsid: string;
    lastName: string;
    firstName: string;
    fullName: string;
    appleId: string;
    primaryEmail: string;
    [key: string]: unknown;
  };
  hasMinimumDeviceForPhotosWeb?: boolean;
  hsaChallengeRequired?: boolean;
  hsaTrustedBrowser?: boolean;
}

export interface TwoFactorVerifyRequest {
  securityCode: {
    code: string;
  };
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  phoneNumber?: MaskedPhoneNumber;
}

export interface TrustBrowserRequest {
  extended_login: boolean;
}

export interface ValidateSessionResponse {
  dsInfo: {
    dsid: string;
    [key: string]: unknown;
  };
  webservices: Record<string, {
    url: string;
    status: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface ClientSettings {
  clientBuildNumber: string;
  clientMasteringNumber: string;
  clientId: string;
  defaultHeaders: Record<string, string>;
}

export const DEFAULT_CLIENT_SETTINGS: ClientSettings = {
  clientBuildNumber: '2420Hotfix43',
  clientMasteringNumber: '2420Hotfix43',
  clientId: '', // Generated at runtime
  defaultHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://www.icloud.com',
    'Referer': 'https://www.icloud.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
};

export interface AuthEndpoints {
  signIn: string;
  signOut: string;
  twoFactorVerify: string;
  twoFactorSendCode: string;
  trustBrowser: string;
  accountLogin: string;
  validateSession: string;
}

export const AUTH_ENDPOINTS: AuthEndpoints = {
  signIn: 'https://idmsa.apple.com/appleauth/auth/signin',
  signOut: 'https://idmsa.apple.com/appleauth/auth/signout',
  twoFactorVerify: 'https://idmsa.apple.com/appleauth/auth/verify/trusteddevice/securitycode',
  twoFactorSendCode: 'https://idmsa.apple.com/appleauth/auth/verify/phone',
  trustBrowser: 'https://idmsa.apple.com/appleauth/auth/2sv/trust',
  accountLogin: 'https://setup.icloud.com/setup/ws/1/accountLogin',
  validateSession: 'https://setup.icloud.com/setup/ws/1/validate',
};
