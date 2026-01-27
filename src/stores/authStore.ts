/**
 * Auth Store
 *
 * Manages optional login authentication state for LiquidOS.
 * Supports biometric (WebAuthn) and Google OAuth credentials.
 * Single-user, local-only lock screen model.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type AuthMethod = 'biometric' | 'google';

export interface BiometricCredential {
  credentialId: string;
  publicKey: string;
  createdAt: number;
  label: string;
}

export interface GoogleCredential {
  email: string;
  name?: string;
  avatarUrl?: string;
  linkedAt: number;
}

export interface EmailCredential {
  email: string;
  name?: string;
  avatarUrl?: string;
  linkedAt: number;
}

export interface AuthState {
  authEnabled: boolean;
  biometricEnabled: boolean;
  googleEnabled: boolean;
  emailEnabled: boolean;
  autoLoginEnabled: boolean;
  biometricCredentials: BiometricCredential[];
  googleCredential: GoogleCredential | null;
  emailCredential: EmailCredential | null;
  authToken: string | null;
  isUnlocked: boolean;
  lastUnlockedAt: number | null;
  sessionTimeoutMinutes: number;
  setupCompleted: boolean;
  _hydrated: boolean;
}

export interface AuthActions {
  setAuthEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setGoogleEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
  setAutoLoginEnabled: (enabled: boolean) => void;
  addBiometricCredential: (credential: BiometricCredential) => void;
  removeBiometricCredential: (credentialId: string) => void;
  setGoogleCredential: (credential: GoogleCredential | null) => void;
  setEmailCredential: (credential: EmailCredential | null) => void;
  setAuthToken: (token: string | null) => void;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  checkSessionTimeout: () => boolean;
  completeSetup: () => void;
  setSessionTimeout: (minutes: number) => void;
  resetAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_STATE: AuthState = {
  authEnabled: true, // Force enabled by default
  biometricEnabled: false,
  googleEnabled: false,
  emailEnabled: true, // Email/password enabled by default
  autoLoginEnabled: true, // Auto-login enabled by default
  biometricCredentials: [],
  googleCredential: null,
  emailCredential: null,
  authToken: null,
  isUnlocked: false, // Default to locked
  lastUnlockedAt: null,
  sessionTimeoutMinutes: 0,
  setupCompleted: true, // Assume setup is complete so lock screen shows
  _hydrated: false,
};

// ============================================================================
// Store
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...DEFAULT_STATE,

        setAuthEnabled: (enabled) => {
          set((state) => {
            state.authEnabled = enabled;
            if (!enabled) {
              state.isUnlocked = true;
            }
          });
        },

        setBiometricEnabled: (enabled) => {
          set((state) => { state.biometricEnabled = enabled; });
        },

        setGoogleEnabled: (enabled) => {
          set((state) => { state.googleEnabled = enabled; });
        },

        addBiometricCredential: (credential) => {
          set((state) => {
            state.biometricCredentials.push(credential);
          });
        },

        removeBiometricCredential: (credentialId) => {
          set((state) => {
            state.biometricCredentials = state.biometricCredentials.filter(
              (c) => c.credentialId !== credentialId
            );
            // Auto-disable auth if no credentials remain
            if (
              state.biometricCredentials.length === 0 &&
              !state.googleCredential
            ) {
              state.authEnabled = false;
              state.isUnlocked = true;
            }
          });
        }, setGoogleCredential: (credential) => {
          set((state) => {
            state.googleCredential = credential;
            // Auto-disable auth if no credentials remain
            if (!credential && state.biometricCredentials.length === 0 && !state.emailCredential) {
              state.authEnabled = false;
              state.isUnlocked = true;
            }
          });
        },

        setEmailEnabled: (enabled) => {
          set((state) => { state.emailEnabled = enabled; });
        },

        setAutoLoginEnabled: (enabled) => {
          set((state) => { state.autoLoginEnabled = enabled; });
        },

        setEmailCredential: (credential) => {
          set((state) => {
            state.emailCredential = credential;
            // Auto-disable auth if no credentials remain
            if (!credential && state.biometricCredentials.length === 0 && !state.googleCredential) {
              state.authEnabled = false;
              state.isUnlocked = true;
            }
          });
        },

        setAuthToken: (token) => {
          set((state) => { state.authToken = token; });
        },

        loginWithEmail: async (email, password) => {
          try {
            const response = await fetch('/api/auth/email/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              return false;
            }

            const data = await response.json();

            if (data.success && data.token && data.user) {
              // Store credential and token
              set((state) => {
                state.emailCredential = {
                  email: data.user.email,
                  name: data.user.name,
                  avatarUrl: data.user.avatar_url,
                  linkedAt: Date.now(),
                };
                state.authToken = data.token;
                state.isUnlocked = true;
                state.lastUnlockedAt = Date.now();
              });

              return true;
            }

            return false;
          } catch (error) {
            console.error('Email login error:', error);
            return false;
          }
        },


        unlock: () => {
          set((state) => {
            state.isUnlocked = true;
            state.lastUnlockedAt = Date.now();
          });
        },

        lock: () => {
          set((state) => {
            state.isUnlocked = false;
            state.lastUnlockedAt = null;
          });
        },

        checkSessionTimeout: () => {
          const state = get();
          if (!state.authEnabled) return true;
          if (state.sessionTimeoutMinutes === 0) return true;
          if (!state.lastUnlockedAt) return false;
          const elapsed = (Date.now() - state.lastUnlockedAt) / 60000;
          if (elapsed > state.sessionTimeoutMinutes) {
            get().lock();
            return false;
          }
          return true;
        },

        completeSetup: () => {
          set((state) => { state.setupCompleted = true; });
        },

        setSessionTimeout: (minutes) => {
          set((state) => { state.sessionTimeoutMinutes = minutes; });
        },

        resetAuth: () => {
          set(() => ({ ...DEFAULT_STATE, _hydrated: true }));
        },
      })),
      {
        name: 'liquid-auth-store',
        version: 1,
        partialize: (state) => ({
          authEnabled: state.authEnabled,
          biometricEnabled: state.biometricEnabled,
          googleEnabled: state.googleEnabled,
          emailEnabled: state.emailEnabled,
          autoLoginEnabled: state.autoLoginEnabled,
          biometricCredentials: state.biometricCredentials,
          googleCredential: state.googleCredential,
          emailCredential: state.emailCredential,
          authToken: state.authToken,
          sessionTimeoutMinutes: state.sessionTimeoutMinutes,
          setupCompleted: state.setupCompleted,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state._hydrated = true;



            // Lock if auth is enabled and we are ensuring security
            if (state.authEnabled) {
              // If hydration happens, we default to LOCKED to prevent bypass
              // Unless we want to persist "isUnlocked" state (unlikely for strict security)
              // But for user convenience we often persist it. 
              // However, "setupCompleted" check is important.

              if (state.setupCompleted && !state.isUnlocked) {
                // already locked, do nothing
              } else if (state.setupCompleted && state.isUnlocked) {
                // Check session timeout immediately on hydration
                const now = Date.now();
                const elapsed = state.lastUnlockedAt ? (now - state.lastUnlockedAt) / 60000 : Infinity;
                if (state.sessionTimeoutMinutes > 0 && elapsed > state.sessionTimeoutMinutes) {
                  state.isUnlocked = false;
                  state.lastUnlockedAt = null;
                }
              }
            }
          }
        },
      }
    ),
    { name: 'AuthStore' }
  )
);

// ============================================================================
// Selectors (primitive return values to avoid infinite loops)
// ============================================================================

export const selectRequiresAuth = (state: AuthStore) =>
  state._hydrated && state.authEnabled && state.setupCompleted && !state.isUnlocked;

export const selectHasAnyCredentials = (state: AuthStore) =>
  state.biometricCredentials.length > 0 || state.googleCredential !== null || state.emailCredential !== null;

export const selectBiometricMethodAvailable = (state: AuthStore) =>
  state.biometricEnabled && state.biometricCredentials.length > 0;

export const selectGoogleMethodAvailable = (state: AuthStore) =>
  state.googleEnabled && state.googleCredential !== null;
