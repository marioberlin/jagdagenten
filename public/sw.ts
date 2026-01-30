/// <reference lib="webworker" />

/**
 * Jagd-Agenten Service Worker
 * 
 * Provides offline-first capabilities for hunting areas where
 * connectivity is unreliable:
 * - Caches app shell and static assets
 * - Proxies API requests with stale-while-revalidate
 * - Queues mutations for sync when offline
 */

declare const self: ServiceWorkerGlobalScope;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CACHE_NAME = 'jagd-agenten-v1';
const API_CACHE_NAME = 'jagd-agenten-api-v1';

// Assets to precache for app shell
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// API paths that can be cached for offline use
const CACHEABLE_API_PATHS = [
    '/api/v1/jagd/packs',
    '/api/v1/jagd/events',
    '/api/v1/jagd/weather',
    '/api/v1/jagd/equipment',
];

// API paths that require online requests (mutations)
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ---------------------------------------------------------------------------
// Install Event
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching app shell');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Activate immediately without waiting
                return self.skipWaiting();
            })
    );
});

// ---------------------------------------------------------------------------
// Activate Event
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
            // Take control of all pages immediately
            self.clients.claim(),
        ])
    );
});

// ---------------------------------------------------------------------------
// Fetch Event
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests (mutations)
    if (MUTATION_METHODS.includes(event.request.method)) {
        // For mutations when offline, we'll let the client handle queueing
        return;
    }

    // API requests: stale-while-revalidate
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
    }

    // Static assets: cache-first
    event.respondWith(handleStaticRequest(event.request));
});

// ---------------------------------------------------------------------------
// Request Handlers
// ---------------------------------------------------------------------------

async function handleApiRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const isCacheable = CACHEABLE_API_PATHS.some((path) =>
        url.pathname.startsWith(path)
    );

    if (!isCacheable) {
        return fetch(request);
    }

    // Stale-while-revalidate strategy
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Start network fetch in background
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                // Clone and cache the fresh response
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[SW] Network fetch failed:', error);
            // Return cached version if available
            if (cachedResponse) {
                return cachedResponse;
            }
            // Return offline fallback response for API
            return new Response(
                JSON.stringify({
                    error: 'Offline',
                    message: 'Sie sind offline. Daten werden synchronisiert sobald eine Verbindung besteht.',
                    offline: true,
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        });

    // Return cached response immediately if available
    if (cachedResponse) {
        console.log('[SW] Serving from cache:', url.pathname);
        return cachedResponse;
    }

    // Otherwise wait for network
    return fetchPromise;
}

async function handleStaticRequest(request: Request): Promise<Response> {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        // Return offline page if available
        const offlinePage = await cache.match('/');
        if (offlinePage) {
            return offlinePage;
        }
        // Last resort
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
        });
    }
}

// ---------------------------------------------------------------------------
// Background Sync
// ---------------------------------------------------------------------------

self.addEventListener('sync', (event: SyncEvent) => {
    if (event.tag === 'jagd-sync') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SYNC_REQUESTED' });
                });
            })
        );
    }
});

// ---------------------------------------------------------------------------
// Push Notifications (for emergency alerts)
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || 'Jagd-Agenten';
        const options: NotificationOptions = {
            body: data.body || 'Neue Benachrichtigung',
            icon: '/jagd-icon-192.png',
            badge: '/jagd-badge-72.png',
            tag: data.tag || 'jagd-notification',
            data: data.data || {},
            requireInteraction: data.type === 'emergency',
            vibrate: data.type === 'emergency' ? [200, 100, 200, 100, 200] : [100],
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error('[SW] Push notification error:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    const urlToOpen = data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Focus existing window if available
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if needed
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// ---------------------------------------------------------------------------
// Message Handler
// ---------------------------------------------------------------------------

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Type declaration for SyncEvent (not in standard lib)
interface SyncEvent extends ExtendableEvent {
    tag: string;
    lastChance: boolean;
}
