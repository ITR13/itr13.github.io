const CACHE_NAME = "dynamic-cache-v8";

const ALLOWED_ORIGINS = [
    self.location.origin,
    "https://unpkg.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net"
];

self.addEventListener("install", event => self.skipWaiting());

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME) // keep the current cache only
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (!["http:", "https:"].includes(url.protocol)) return;

    if (!ALLOWED_ORIGINS.includes(url.origin)) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request)
                .then(response => {
                    if (
                        response &&
                        response.status === 200 &&
                        response.type !== "opaque"
                    ) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    }

                    return response;
                })
                .catch(() => caches.match("/offline.html"));
        })
    );
});