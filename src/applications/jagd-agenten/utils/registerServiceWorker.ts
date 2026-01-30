/**
 * Service Worker Registration
 *
 * Registers the Jagd-Agenten service worker for offline-first capabilities.
 * Call this once from the main app entry point.
 */

export interface ServiceWorkerRegistrationResult {
    success: boolean;
    registration?: ServiceWorkerRegistration;
    error?: Error;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
    // Only register in production and on HTTPS
    if (!('serviceWorker' in navigator)) {
        console.log('[SW] Service workers not supported');
        return { success: false, error: new Error('Service workers not supported') };
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('[SW] Service worker registered:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[SW] New version available');
                    // Optionally show update prompt to user
                    dispatchEvent(new CustomEvent('sw-update-available'));
                }
            });
        });

        // Listen for sync requests from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_REQUESTED') {
                console.log('[SW] Sync requested by service worker');
                // Import dynamically to avoid circular deps
                import('@/stores/offlineStore').then(({ useOfflineStore }) => {
                    useOfflineStore.getState().processQueue();
                });
            }
        });

        return { success: true, registration };
    } catch (error) {
        console.error('[SW] Registration failed:', error);
        return { success: false, error: error as Error };
    }
}

/**
 * Request notification permission for emergency alerts
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Check if app can work offline
 */
export function isOfflineCapable(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
}

/**
 * Get cached API data size (approximate)
 */
export async function getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;

        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();

            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }

        return totalSize;
    } catch {
        return 0;
    }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] All caches cleared');
}

export default registerServiceWorker;
