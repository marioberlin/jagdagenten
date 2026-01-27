/**
 * Auto-Login Hook
 * 
 * Automatically logs in with default credentials when auto-login is enabled
 * Works in both dev and production environments
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

const DEFAULT_EMAIL = 'mario.tiedemann@showheroes.com';
const DEFAULT_PASSWORD = 'Heroes0071!';

export function useAutoLogin() {
    const {
        autoLoginEnabled,
        emailEnabled,
        isUnlocked,
        _hydrated,
        loginWithEmail,
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
            loggingIn: loggingInRef.current
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

        console.log('[AutoLogin] Attempting auto-login...');

        // Attempt login
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
    }, [autoLoginEnabled, emailEnabled, isUnlocked, _hydrated, loginWithEmail]);
}
