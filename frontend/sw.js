self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('ems-store').then((cache) => cache.addAll([
            '/dashboard.html',
            '/js/app.js',
            '/css/styles.css',
            '/login.html',
            '/manifest.json'
        ]))
    );
});

self.addEventListener('fetch', (e) => {
    // Basic offline support
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
