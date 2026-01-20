import { useState, useCallback, useEffect } from "react";
import { useGoogleAuth } from "./useGoogleAuth";

// Types are provided by src/types/google.d.ts

interface PickerOptions {
    onSelect: (file: { id: string, name: string, url: string }) => void;
    onCancel?: () => void;
}

interface UseGoogleDriveResult {
    openPicker: (options: PickerOptions) => void;
    isApiLoaded: boolean;
    error: string | null;
    isAuthenticated: boolean;
    signIn: () => void;
    signOut: () => void;
    isAuthLoading: boolean;
    accessToken: string | null;
}

export const useGoogleDrive = (): UseGoogleDriveResult => {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use the Google Auth hook for OAuth
    const {
        accessToken,
        isAuthenticated,
        signIn,
        signOut,
        isLoading: isAuthLoading,
        error: authError
    } = useGoogleAuth(['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly']);

    // Load the Google API script for Picker
    useEffect(() => {
        if (window.gapi) {
            setIsApiLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load("picker", { callback: () => setIsApiLoaded(true) });
        };
        script.onerror = () => {
            setError("Failed to load Google API");
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Propagate auth errors
    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const openPicker = useCallback((options: PickerOptions) => {
        if (!isApiLoaded) {
            console.warn("Google Picker API not loaded yet");
            setError("Google Picker API is loading, please wait...");
            return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!apiKey || !clientId) {
            setError("Missing Google API Key or Client ID in environment variables");
            console.error("Missing Google API Key or Client ID");
            return;
        }

        // Check if user is authenticated
        if (!accessToken) {
            setError("Please sign in with Google to browse your Drive files");
            // Trigger sign-in flow
            signIn();
            return;
        }

        try {
            const view = new window.google!.picker!.View(window.google!.picker!.ViewId.SPREADSHEETS);
            view.setMimeTypes("application/vnd.google-apps.spreadsheet");

            const picker = new window.google!.picker!.PickerBuilder()
                .enableFeature(window.google!.picker!.Feature.NAV_HIDDEN)
                .enableFeature(window.google!.picker!.Feature.MULTISELECT_ENABLED)
                .setAppId(clientId.split('-')[0]) // Extract project number from client ID
                .setOAuthToken(accessToken) // Use the real OAuth token
                .addView(view)
                .setDeveloperKey(apiKey)
                .setCallback((data: any) => {
                    if (data[window.google!.picker!.Response.ACTION] === window.google!.picker!.Action.PICKED) {
                        const doc = data[window.google!.picker!.Response.DOCUMENTS][0];
                        options.onSelect({
                            id: doc[window.google!.picker!.Document.ID],
                            name: doc[window.google!.picker!.Document.NAME],
                            url: doc[window.google!.picker!.Document.URL],
                        });
                    } else if (data[window.google!.picker!.Response.ACTION] === window.google!.picker!.Action.CANCEL) {
                        options.onCancel?.();
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (e: any) {
            setError(`Failed to open Drive Picker: ${e.message}`);
            console.error("Picker error:", e);
        }

    }, [isApiLoaded, accessToken, signIn]);

    return {
        openPicker,
        isApiLoaded,
        error,
        isAuthenticated,
        signIn,
        signOut,
        isAuthLoading,
        accessToken
    };
};

