/**
 * useICloudService Hook
 * 
 * Handles fetching and mutating iCloud service data.
 * Provides typed methods for each service (contacts, calendar, etc.)
 */

import { useCallback, useMemo } from 'react';
import { useICloudStore, type ICloudServiceType } from '../stores/icloudStore';

const API_BASE = '/api/v1/icloud';

export function useICloudService() {
    const {
        sessionId,
        isDemoMode,
        setContacts,
        setEvents,
        setMessages,
        setDriveItems,
        setNotes,
        setReminders,
        setPhotos,
        setDevices,
        setLoading,
    } = useICloudStore();

    const headers: Record<string, string> = useMemo(() => {
        const h: Record<string, string> = {};
        if (sessionId) h['X-ICloud-Session-Id'] = sessionId;
        return h;
    }, [sessionId]);

    /**
     * Generic fetch helper with loading state
     */
    const fetchService = useCallback(async <T>(
        service: ICloudServiceType,
        endpoint: string,
        setter: (data: T) => void
    ): Promise<T | null> => {
        if (isDemoMode) {
            // Return demo data
            return getDemoData(service) as T | null;
        }

        if (!sessionId) return null;

        setLoading(service, true);
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const result = data[service] || data.items || data;
            setter(result);
            return result;
        } catch (error) {
            console.error(`Failed to fetch ${service}:`, error);
            return null;
        } finally {
            setLoading(service, false);
        }
    }, [sessionId, isDemoMode, headers, setLoading]);

    // ============================================================================
    // Contacts
    // ============================================================================

    const fetchContacts = useCallback(() =>
        fetchService('contacts', '/contacts', setContacts),
        [fetchService, setContacts]);

    const createContact = useCallback(async (contact: Record<string, unknown>) => {
        if (!sessionId) return null;
        const response = await fetch(`${API_BASE}/contacts`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(contact),
        });
        if (response.ok) {
            await fetchContacts();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchContacts]);

    const deleteContact = useCallback(async (contactId: string) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
            method: 'DELETE',
            headers,
        });
        if (response.ok) {
            await fetchContacts();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchContacts]);

    // ============================================================================
    // Calendar
    // ============================================================================

    const fetchCalendars = useCallback(async () => {
        if (!sessionId) return null;
        const response = await fetch(`${API_BASE}/calendar/calendars`, { headers });
        return response.ok ? (await response.json()).calendars : null;
    }, [sessionId, headers]);

    const fetchEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
        if (isDemoMode) {
            setEvents(getDemoEvents());
            return getDemoEvents();
        }
        if (!sessionId) return null;
        setLoading('calendar', true);
        try {
            let url = `${API_BASE}/calendar/events`;
            const params = new URLSearchParams();
            if (startDate) params.set('startDate', startDate.toISOString());
            if (endDate) params.set('endDate', endDate.toISOString());
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events);
                return data.events;
            }
            return null;
        } finally {
            setLoading('calendar', false);
        }
    }, [sessionId, isDemoMode, headers, setEvents, setLoading]);

    const createEvent = useCallback(async (event: Record<string, unknown>) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/calendar/events`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        if (response.ok) {
            await fetchEvents();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchEvents]);

    // ============================================================================
    // Mail
    // ============================================================================

    const fetchMailFolders = useCallback(async () => {
        if (!sessionId) return null;
        const response = await fetch(`${API_BASE}/mail/folders`, { headers });
        return response.ok ? (await response.json()).folders : null;
    }, [sessionId, headers]);

    const fetchMessages = useCallback(async (folder?: string, limit = 50) => {
        if (isDemoMode) {
            setMessages(getDemoMessages());
            return getDemoMessages();
        }
        if (!sessionId) return null;
        setLoading('mail', true);
        try {
            const params = new URLSearchParams();
            if (folder) params.set('folder', folder);
            params.set('limit', limit.toString());

            const response = await fetch(`${API_BASE}/mail/messages?${params.toString()}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages);
                return data.messages;
            }
            return null;
        } finally {
            setLoading('mail', false);
        }
    }, [sessionId, isDemoMode, headers, setMessages, setLoading]);

    const sendMail = useCallback(async (email: {
        to: string[];
        subject: string;
        body: string;
        cc?: string[];
        bcc?: string[];
    }) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/mail/send`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(email),
        });
        return response.ok;
    }, [sessionId, headers]);

    // ============================================================================
    // Drive
    // ============================================================================

    const fetchDriveItems = useCallback(async (path = '/') => {
        if (isDemoMode) {
            setDriveItems(getDemoDriveItems());
            return getDemoDriveItems();
        }
        if (!sessionId) return null;
        setLoading('drive', true);
        try {
            const response = await fetch(`${API_BASE}/drive/items?path=${encodeURIComponent(path)}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setDriveItems(data.items);
                return data.items;
            }
            return null;
        } finally {
            setLoading('drive', false);
        }
    }, [sessionId, isDemoMode, headers, setDriveItems, setLoading]);

    const createFolder = useCallback(async (name: string, parentId?: string) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/drive/folders`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId }),
        });
        if (response.ok) {
            await fetchDriveItems();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchDriveItems]);

    // ============================================================================
    // Notes
    // ============================================================================

    const fetchNotes = useCallback(() =>
        fetchService('notes', '/notes', setNotes),
        [fetchService, setNotes]);

    const createNote = useCallback(async (note: { title: string; content: string }) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(note),
        });
        if (response.ok) {
            await fetchNotes();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchNotes]);

    // ============================================================================
    // Reminders
    // ============================================================================

    const fetchReminders = useCallback(() =>
        fetchService('reminders', '/reminders', setReminders),
        [fetchService, setReminders]);

    const createReminder = useCallback(async (reminder: { title: string; dueDate?: string }) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/reminders`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(reminder),
        });
        if (response.ok) {
            await fetchReminders();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchReminders]);

    const completeReminder = useCallback(async (reminderId: string, completed: boolean) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/reminders/${reminderId}/complete`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed }),
        });
        if (response.ok) {
            await fetchReminders();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchReminders]);

    // ============================================================================
    // Photos
    // ============================================================================

    const fetchPhotos = useCallback(async (limit = 100) => {
        if (isDemoMode) {
            setPhotos(getDemoPhotos());
            return getDemoPhotos();
        }
        if (!sessionId) return null;
        setLoading('photos', true);
        try {
            const response = await fetch(`${API_BASE}/photos?limit=${limit}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setPhotos(data.photos);
                return data.photos;
            }
            return null;
        } finally {
            setLoading('photos', false);
        }
    }, [sessionId, isDemoMode, headers, setPhotos, setLoading]);

    const fetchPhotoAlbums = useCallback(async () => {
        if (!sessionId) return null;
        const response = await fetch(`${API_BASE}/photos/albums`, { headers });
        return response.ok ? (await response.json()).albums : null;
    }, [sessionId, headers]);

    // ============================================================================
    // Find My
    // ============================================================================

    const fetchDevices = useCallback(() =>
        fetchService('findmy', '/findmy/devices', setDevices),
        [fetchService, setDevices]);

    const playSound = useCallback(async (deviceId: string) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/findmy/devices/${deviceId}/play-sound`, {
            method: 'POST',
            headers,
        });
        return response.ok;
    }, [sessionId, headers]);

    const refreshDeviceLocation = useCallback(async (deviceId: string) => {
        if (!sessionId) return false;
        const response = await fetch(`${API_BASE}/findmy/devices/${deviceId}/refresh`, {
            method: 'POST',
            headers,
        });
        if (response.ok) {
            await fetchDevices();
            return true;
        }
        return false;
    }, [sessionId, headers, fetchDevices]);

    return {
        // Contacts
        fetchContacts,
        createContact,
        deleteContact,

        // Calendar
        fetchCalendars,
        fetchEvents,
        createEvent,

        // Mail
        fetchMailFolders,
        fetchMessages,
        sendMail,

        // Drive
        fetchDriveItems,
        createFolder,

        // Notes
        fetchNotes,
        createNote,

        // Reminders
        fetchReminders,
        createReminder,
        completeReminder,

        // Photos
        fetchPhotos,
        fetchPhotoAlbums,

        // Find My
        fetchDevices,
        playSound,
        refreshDeviceLocation,
    };
}

// ============================================================================
// Demo Data
// ============================================================================

function getDemoData(service: ICloudServiceType) {
    switch (service) {
        case 'contacts': return getDemoContacts();
        case 'calendar': return getDemoEvents();
        case 'mail': return getDemoMessages();
        case 'drive': return getDemoDriveItems();
        case 'notes': return getDemoNotes();
        case 'reminders': return getDemoReminders();
        case 'photos': return getDemoPhotos();
        case 'findmy': return getDemoDevices();
        default: return [];
    }
}

function getDemoContacts() {
    return [
        { id: '1', firstName: 'Tim', lastName: 'Cook', company: 'Apple Inc.' },
        { id: '2', firstName: 'Craig', lastName: 'Federighi', company: 'Apple Inc.' },
        { id: '3', firstName: 'Jony', lastName: 'Ive', company: 'LoveFrom' },
    ];
}

function getDemoEvents() {
    const now = new Date();
    return [
        { id: '1', title: 'Team Meeting', startDate: now.toISOString(), endDate: new Date(now.getTime() + 3600000).toISOString() },
        { id: '2', title: 'Product Review', startDate: new Date(now.getTime() + 86400000).toISOString(), endDate: new Date(now.getTime() + 90000000).toISOString() },
    ];
}

function getDemoMessages() {
    return [
        { id: '1', subject: 'Welcome to iCloud', from: 'noreply@apple.com', to: ['demo@icloud.com'], date: new Date().toISOString(), isRead: false, hasAttachments: false },
        { id: '2', subject: 'Your Apple ID', from: 'support@apple.com', to: ['demo@icloud.com'], date: new Date(Date.now() - 86400000).toISOString(), isRead: true, hasAttachments: true },
    ];
}

function getDemoDriveItems() {
    return [
        { id: '1', name: 'Documents', type: 'folder' as const },
        { id: '2', name: 'Photos', type: 'folder' as const },
        { id: '3', name: 'Notes.txt', type: 'file' as const, size: 1024 },
    ];
}

function getDemoNotes() {
    return [
        { id: '1', title: 'Welcome Note', content: 'Welcome to iCloud Notes!', modifiedDate: new Date().toISOString() },
        { id: '2', title: 'Shopping List', content: '- Apples\n- Milk\n- Bread', modifiedDate: new Date().toISOString() },
    ];
}

function getDemoReminders() {
    return [
        { id: '1', title: 'Review code', completed: false, dueDate: new Date().toISOString() },
        { id: '2', title: 'Send report', completed: true },
    ];
}

function getDemoPhotos() {
    return [
        { id: '1', filename: 'photo_001.jpg', createdDate: new Date().toISOString() },
        { id: '2', filename: 'photo_002.jpg', createdDate: new Date().toISOString() },
    ];
}

function getDemoDevices() {
    return [
        { id: '1', name: 'iPhone 15 Pro', deviceDisplayName: 'Mario\'s iPhone', batteryLevel: 85, batteryStatus: 'NotCharging' },
        { id: '2', name: 'MacBook Pro', deviceDisplayName: 'Mario\'s MacBook', batteryLevel: 100, batteryStatus: 'Charged' },
        { id: '3', name: 'Apple Watch', deviceDisplayName: 'Mario\'s Watch', batteryLevel: 45, batteryStatus: 'Charging' },
    ];
}
