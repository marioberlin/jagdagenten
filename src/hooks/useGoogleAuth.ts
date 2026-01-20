import { useState, useCallback, useEffect, useRef } from "react";

// Types are provided by src/types/google.d.ts

interface UseGoogleAuthResult {
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    signIn: () => void;
    signOut: () => void;
}

/**
 * Hook for Google OAuth 2.0 authentication using Google Identity Services (GIS)
 * 
 * This hook handles:
 * 1. Loading the GIS library
 * 2. Initiating OAuth popup flow
 * 3. Storing and managing access tokens
 * 4. Token expiration handling
 */
export const useGoogleAuth = (
    scopes: string[] = ['https://www.googleapis.com/auth/drive.file']
): UseGoogleAuthResult => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGisLoaded, setIsGisLoaded] = useState(false);
    const tokenClientRef = useRef<ReturnType<typeof window.google.accounts.oauth2.initTokenClient> | null>(null);
    const tokenExpiryRef = useRef<number | null>(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Load Google Identity Services script
    useEffect(() => {
        // Check if already loaded
        if (window.google?.accounts?.oauth2) {
            setIsGisLoaded(true);
            return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsGisLoaded(true));
            return;
        }

        // Load the GIS script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setIsGisLoaded(true);
        };
        script.onerror = () => {
            setError('Failed to load Google Identity Services');
        };
        document.head.appendChild(script);
    }, []);

    // Initialize token client when GIS is loaded
    useEffect(() => {
        if (!isGisLoaded || !clientId) return;

        try {
            tokenClientRef.current = window.google!.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: scopes.join(' '),
                callback: (response) => {
                    setIsLoading(false);
                    if (response.error) {
                        setError(response.error_description || response.error);
                        return;
                    }
                    if (response.access_token) {
                        setAccessToken(response.access_token);
                        setError(null);
                        // Set token expiry (typically 3600 seconds = 1 hour)
                        if (response.expires_in) {
                            tokenExpiryRef.current = Date.now() + response.expires_in * 1000;
                        }
                    }
                },
                error_callback: (err) => {
                    setIsLoading(false);
                    setError(err.message || 'Authentication failed');
                },
            });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(`Failed to initialize OAuth client: ${message}`);
        }
    }, [isGisLoaded, clientId, scopes.join(' ')]);

    const signIn = useCallback(() => {
        if (!clientId) {
            setError('Missing VITE_GOOGLE_CLIENT_ID environment variable');
            return;
        }

        if (!tokenClientRef.current) {
            setError('OAuth client not initialized. Please try again.');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Request access token - this opens the Google sign-in popup
        tokenClientRef.current.requestAccessToken({ prompt: '' });
    }, [clientId]);

    const signOut = useCallback(() => {
        setAccessToken(null);
        tokenExpiryRef.current = null;
        // Optionally revoke the token
        // window.google?.accounts.oauth2.revoke(accessToken);
    }, []);

    // Check if token is expired
    const isAuthenticated = !!(
        accessToken &&
        tokenExpiryRef.current &&
        Date.now() < tokenExpiryRef.current
    );

    return {
        accessToken,
        isLoading,
        error,
        isAuthenticated,
        signIn,
        signOut,
    };
};

export default useGoogleAuth;
