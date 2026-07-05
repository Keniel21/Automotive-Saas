// ==========================================================================
// AUTO DRIVE CRM - SERVICE WORKER (PWA OFFLINE)
// ==========================================================================
const CACHE_NAME = 'autodrive-crm-v2';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    // CDN Libraries
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// --------------------------------------------------------------------------
// INSTALL — Cache all essential resources
// --------------------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching essential assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            // Activate immediately, don't wait for old SW to die
            return self.skipWaiting();
        })
    );
});

// --------------------------------------------------------------------------
// ACTIVATE — Clean old caches on update
// --------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all open tabs immediately
            return self.clients.claim();
        })
    );
});

// --------------------------------------------------------------------------
// FETCH — Cache First, Network Fallback
// --------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests (POST, PUT, DELETE go straight to network)
    if (event.request.method !== 'GET') return;

    // Skip Supabase API calls — they must always hit the network
    if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/rest')) return;
    if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/storage')) return;
    if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/auth')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // Only cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If both cache and network fail, show a fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
