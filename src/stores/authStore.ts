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

export interface AuthState {
  authEnabled: boolean;
  biometricEnabled: boolean;
  googleEnabled: boolean;
  biometricCredentials: BiometricCredential[];
  googleCredential: GoogleCredential | null;
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
  addBiometricCredential: (credential: BiometricCredential) => void;
  removeBiometricCredential: (credentialId: string) => void;
  setGoogleCredential: (credential: GoogleCredential | null) => void;
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
  authEnabled: false,
  biometricEnabled: false,
  googleEnabled: false,
  biometricCredentials: [],
  googleCredential: null,
  isUnlocked: true,
  lastUnlockedAt: null,
  sessionTimeoutMinutes: 0,
  setupCompleted: false,
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
        },

        setGoogleCredential: (credential) => {
          set((state) => {
            state.googleCredential = credential;
            // Auto-disable auth if no credentials remain
            if (!credential && state.biometricCredentials.length === 0) {
              state.authEnabled = false;
              state.isUnlocked = true;
            }
          });
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
          biometricCredentials: state.biometricCredentials,
          googleCredential: state.googleCredential,
          sessionTimeoutMinutes: state.sessionTimeoutMinutes,
          setupCompleted: state.setupCompleted,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state._hydrated = true;
            if (state.authEnabled && state.setupCompleted) {
              state.isUnlocked = false;
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
  state.biometricCredentials.length > 0 || state.googleCredential !== null;

export const selectBiometricMethodAvailable = (state: AuthStore) =>
  state.biometricEnabled && state.biometricCredentials.length > 0;

export const selectGoogleMethodAvailable = (state: AuthStore) =>
  state.googleEnabled && state.googleCredential !== null;
