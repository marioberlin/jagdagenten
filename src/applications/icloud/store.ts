/**
 * iCloud Store (Zustand)
 * 
 * Centralized state management for iCloud GlassApp.
 * Replaces the old iCloudAgentProvider "GOD component".
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type AuthStatus = 'disconnected' | 'connecting' | 'requires_2fa' | 'authenticated' | 'error';

export interface ICloudAccount {
    username: string;
    firstName?: string;
    lastName?: string;
}

export interface ICloudContact {
    id: string;
    firstName?: string;
    lastName?: string;
    emailAddresses?: { label: string; value: string }[];
    phoneNumbers?: { label: string; value: string }[];
    company?: string;
}

export interface ICloudCalendarEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    isAllDay?: boolean;
}

export interface ICloudMailMessage {
    id: string;
    subject: string;
    from: string;
    to: string[];
    date: string;
    body?: string;
    isRead: boolean;
    hasAttachments: boolean;
}

export interface ICloudDriveItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    modifiedDate?: string;
    parentId?: string;
}

export interface ICloudNote {
    id: string;
    title: string;
    content: string;
    modifiedDate: string;
    folderId?: string;
}

export interface ICloudReminder {
    id: string;
    title: string;
    dueDate?: string;
    completed: boolean;
    priority?: number;
    listId?: string;
}

export interface ICloudPhoto {
    id: string;
    filename: string;
    thumbnailUrl?: string;
    createdDate: string;
    albumId?: string;
}

export interface ICloudDevice {
    id: string;
    name: string;
    deviceDisplayName: string;
    batteryLevel?: number;
    batteryStatus?: string;
    location?: {
        latitude: number;
        longitude: number;
        timestamp: number;
    };
    isLocating?: boolean;
}

export interface ICloudMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    toolCalls?: ICloudToolCall[];
}

export interface ICloudToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'running' | 'success' | 'error';
}

export type ICloudServiceType =
    | 'contacts'
    | 'calendar'
    | 'mail'
    | 'drive'
    | 'notes'
    | 'reminders'
    | 'photos'
    | 'findmy';

// ============================================================================
// Store State
// ============================================================================

interface ICloudState {
    // Auth state
    authStatus: AuthStatus;
    sessionId: string | null;
    account: ICloudAccount | null;
    availableServices: string[];
    error: string | null;

    // Demo mode
    isDemoMode: boolean;

    // Active service view
    activeService: ICloudServiceType | null;

    // Service data caches
    contacts: ICloudContact[];
    events: ICloudCalendarEvent[];
    messages: ICloudMailMessage[];
    driveItems: ICloudDriveItem[];
    notes: ICloudNote[];
    reminders: ICloudReminder[];
    photos: ICloudPhoto[];
    devices: ICloudDevice[];

    // Loading states per service
    loading: Record<ICloudServiceType, boolean>;

    // Agent conversation
    conversation: ICloudMessage[];
    isAgentThinking: boolean;

    // Actions
    setAuthStatus: (status: AuthStatus) => void;
    setSession: (sessionId: string | null, account: ICloudAccount | null, services: string[]) => void;
    setError: (error: string | null) => void;
    setDemoMode: (enabled: boolean) => void;
    setActiveService: (service: ICloudServiceType | null) => void;

    // Data actions
    setContacts: (contacts: ICloudContact[]) => void;
    setEvents: (events: ICloudCalendarEvent[]) => void;
    setMessages: (messages: ICloudMailMessage[]) => void;
    setDriveItems: (items: ICloudDriveItem[]) => void;
    setNotes: (notes: ICloudNote[]) => void;
    setReminders: (reminders: ICloudReminder[]) => void;
    setPhotos: (photos: ICloudPhoto[]) => void;
    setDevices: (devices: ICloudDevice[]) => void;

    setLoading: (service: ICloudServiceType, loading: boolean) => void;

    // Agent actions
    addMessage: (message: Omit<ICloudMessage, 'id' | 'timestamp'>) => void;
    setAgentThinking: (thinking: boolean) => void;
    clearConversation: () => void;

    // Reset
    logout: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

const initialLoadingState: Record<ICloudServiceType, boolean> = {
    contacts: false,
    calendar: false,
    mail: false,
    drive: false,
    notes: false,
    reminders: false,
    photos: false,
    findmy: false,
};

export const useICloudStore = create<ICloudState>()(
    persist(
        (set, get) => ({
            // Initial state
            authStatus: 'disconnected',
            sessionId: null,
            account: null,
            availableServices: [],
            error: null,
            isDemoMode: false,
            activeService: null,

            contacts: [],
            events: [],
            messages: [],
            driveItems: [],
            notes: [],
            reminders: [],
            photos: [],
            devices: [],

            loading: { ...initialLoadingState },

            conversation: [],
            isAgentThinking: false,

            // Actions
            setAuthStatus: (status) => set({ authStatus: status, error: status === 'error' ? get().error : null }),

            setSession: (sessionId, account, services) => set({
                sessionId,
                account,
                availableServices: services,
                authStatus: sessionId ? 'authenticated' : 'disconnected',
            }),

            setError: (error) => set({ error, authStatus: error ? 'error' : get().authStatus }),

            setDemoMode: (enabled) => set({ isDemoMode: enabled }),

            setActiveService: (service) => set({ activeService: service }),

            // Data setters
            setContacts: (contacts) => set({ contacts }),
            setEvents: (events) => set({ events }),
            setMessages: (messages) => set({ messages }),
            setDriveItems: (items) => set({ driveItems: items }),
            setNotes: (notes) => set({ notes }),
            setReminders: (reminders) => set({ reminders }),
            setPhotos: (photos) => set({ photos }),
            setDevices: (devices) => set({ devices }),

            setLoading: (service, loading) => set((state) => ({
                loading: { ...state.loading, [service]: loading },
            })),

            // Agent actions
            addMessage: (message) => set((state) => ({
                conversation: [
                    ...state.conversation,
                    {
                        ...message,
                        id: crypto.randomUUID(),
                        timestamp: new Date(),
                    },
                ],
            })),

            setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),

            clearConversation: () => set({ conversation: [] }),

            // Logout - reset all state
            logout: () => set({
                authStatus: 'disconnected',
                sessionId: null,
                account: null,
                availableServices: [],
                error: null,
                isDemoMode: false,
                activeService: null,
                contacts: [],
                events: [],
                messages: [],
                driveItems: [],
                notes: [],
                reminders: [],
                photos: [],
                devices: [],
                loading: { ...initialLoadingState },
                conversation: [],
                isAgentThinking: false,
            }),
        }),
        {
            name: 'icloud-store',
            partialize: (state) => ({
                // Only persist session info, not cached data
                sessionId: state.sessionId,
                account: state.account,
                isDemoMode: state.isDemoMode,
            }),
        }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectIsAuthenticated = (state: ICloudState) =>
    state.authStatus === 'authenticated';

export const selectIsLoading = (state: ICloudState) =>
    Object.values(state.loading).some(Boolean);

export const selectServiceLoading = (service: ICloudServiceType) =>
    (state: ICloudState) => state.loading[service];
