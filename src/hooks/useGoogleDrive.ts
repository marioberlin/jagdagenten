import { useState, useCallback, useEffect } from "react";

// Types for Google Picker API
// In a real project, you might install @types/google.picker or define these locally
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}



interface PickerOptions {
    onSelect: (file: { id: string, name: string, url: string }) => void;
    onCancel?: () => void;
}

export const useGoogleDrive = () => {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load the Google API script
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

    const openPicker = useCallback((options: PickerOptions) => {
        if (!isApiLoaded) {
            console.warn("Google API not loaded yet");
            return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!apiKey || !clientId) {
            setError("Missing Google API Key or Client ID in environment variables");
            console.error("Missing Google API Key or Client ID");
            return;
        }

        const view = new window.google.picker.View(window.google.picker.ViewId.SPREADSHEETS);
        view.setMimeTypes("application/vnd.google-apps.spreadsheet");

        const picker = new window.google.picker.PickerBuilder()
            .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(clientId) // Usually Project Number, but Client ID often works for OAuth association
            .setOAuthToken("YOUR_OAUTH_TOKEN") // Ideally we'd have a token, but for public sheets or implicit flow we might need more setup.
            // For now, let's assume standard picker setup. NOTE: Picker requires an OAuth token! 
            // This is a known hurdle. We might need a separate auth flow "useGoogleLogin".
            .addView(view)
            // .addView(new window.google.picker.DocsUploadView()) // Optional upload
            .setDeveloperKey(apiKey)
            .setCallback((data: any) => {
                if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                    const doc = data[window.google.picker.Response.DOCUMENTS][0];
                    options.onSelect({
                        id: doc[window.google.picker.Document.ID],
                        name: doc[window.google.picker.Document.NAME],
                        url: doc[window.google.picker.Document.URL],
                    });
                } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
                    options.onCancel?.();
                }
            })
            .build();

        picker.setVisible(true);

    }, [isApiLoaded]);

    return { openPicker, isApiLoaded, error };
};
