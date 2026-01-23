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
                ViewId: { SPREADSHEETS: string; DOCS: string; PRESENTATIONS: string };
                Feature: { NAV_HIDDEN: string; MULTISELECT_ENABLED: string };
                Action: { PICKED: string; CANCEL: string };
                Response: { ACTION: string; DOCUMENTS: string; DOC: string };
                Document: { ID: string; NAME: string; URL: string; MIME_TYPE: string };
                View: new (viewId: string) => any;
                DocsView: new () => DocsViewInstance;
                PickerBuilder: new () => any;
            };
        };
        gapi: any;
    }
}

interface DocsViewInstance {
    setIncludeFolders: (include: boolean) => DocsViewInstance;
    setSelectFolderEnabled: (enabled: boolean) => DocsViewInstance;
    setStarred: (starred: boolean) => DocsViewInstance;
    setMimeTypes: (mimeTypes: string) => DocsViewInstance;
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
