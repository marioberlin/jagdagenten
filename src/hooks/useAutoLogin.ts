/**
 * Auto-Login Hook
 *
 * Automatically logs in with default credentials when auto-login is enabled
 * Works in both dev and production environments
 *
 * In development mode (localhost), it can bypass backend authentication
 * and directly unlock the system for faster testing.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

const DEFAULT_EMAIL = 'mario.tiedemann@showheroes.com';
const DEFAULT_PASSWORD = 'Heroes0071!';

// Enable dev bypass when running on localhost
const DEV_BYPASS_ENABLED = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export function useAutoLogin() {
    const {
        autoLoginEnabled,
        emailEnabled,
        isUnlocked,
        _hydrated,
        loginWithEmail,
        unlock,
    } = useAuthStore();

    // Track if we've already attempted auto-login
    const attemptedRef = useRef(false);
    const loggingInRef = useRef(false);

    useEffect(() => {
        console.log('[AutoLogin] Effect triggered. State:', {
            _hydrated,
            autoLoginEnabled,
            emailEnabled,
            isUnlocked,
            attempted: attemptedRef.current,
            loggingIn: loggingInRef.current,
            devBypass: DEV_BYPASS_ENABLED
        });

        // Only run after store is hydrated
        if (!_hydrated) {
            console.log('[AutoLogin] Skipping auto-login: Store not yet hydrated.');
            return;
        }

        // Only auto-login if enabled and email auth is enabled
        if (!autoLoginEnabled || !emailEnabled) {
            console.log(`[AutoLogin] Skipping auto-login: autoLoginEnabled=${autoLoginEnabled}, emailEnabled=${emailEnabled}.`);
            return;
        }

        // Don't auto-login if already unlocked
        if (isUnlocked) {
            console.log('[AutoLogin] Skipping auto-login: Already unlocked.');
            return;
        }

        // Only attempt once
        if (attemptedRef.current || loggingInRef.current) {
            console.log(`[AutoLogin] Skipping auto-login: Already attempted=${attemptedRef.current} or logging in=${loggingInRef.current}.`);
            return;
        }

        attemptedRef.current = true;
        loggingInRef.current = true;

        // Dev bypass: directly unlock without backend call
        if (DEV_BYPASS_ENABLED) {
            console.log('[AutoLogin] 🚀 Dev bypass: Unlocking directly without backend...');
            unlock();
            loggingInRef.current = false;
            return;
        }

        console.log('[AutoLogin] Attempting auto-login...');

        // Attempt login via backend
        loginWithEmail(DEFAULT_EMAIL, DEFAULT_PASSWORD)
            .then((success) => {
                if (success) {
                    console.log('[AutoLogin] ✅ Login successful');
                } else {
                    console.log('[AutoLogin] ❌ Login failed');
                }
            })
            .catch((error) => {
                console.error('[AutoLogin] Error:', error);
            })
            .finally(() => {
                loggingInRef.current = false;
            });
    }, [autoLoginEnabled, emailEnabled, isUnlocked, _hydrated, loginWithEmail, unlock]);
}
