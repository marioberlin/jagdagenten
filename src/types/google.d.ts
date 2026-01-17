export { };

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: TokenClientConfig) => TokenClient;
                    revoke: (accessToken: string, done?: () => void) => void;
                };
            };
            picker?: {
                ViewId: { SPREADSHEETS: string };
                Feature: { NAV_HIDDEN: string; MULTISELECT_ENABLED: string };
                Action: { PICKED: string; CANCEL: string };
                Response: { ACTION: string; DOCUMENTS: string; DOC: string };
                Document: { ID: string; NAME: string; URL: string };
                View: new (viewId: string) => any;
                PickerBuilder: new () => any;
            };
        };
        gapi: any;
    }
}

interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message: string }) => void;
}

interface TokenClient {
    requestAccessToken: (config?: { prompt?: string }) => void;
}

interface TokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
    expires_in?: number;
}
