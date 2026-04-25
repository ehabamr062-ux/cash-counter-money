const CACHE_NAME = 'cash-calc-gold-v3-network-first';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// ===== تثبيت Service Worker =====
self.addEventListener('install', event => {
    console.log('[SW] Installing Cash Calc SW...');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching static assets');
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('[SW] Failed to cache:', url, err);
                    })
                )
            );
        })
    );
});

// ===== تفعيل Service Worker =====
self.addEventListener('activate', event => {
    console.log('[SW] Activating Cash Calc SW...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ===== استراتيجية Cache First للملفات المحلية، Network First للـ API =====
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // تجاهل طلبات chrome-extension
    if (event.request.url.startsWith('chrome-extension://')) return;

    // API calls (سعر الصرف) - Network First
    if (url.hostname.includes('exchangerate-api') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // باقي الملفات - Network First (لضمان الحصول على التحديثات فوراً)
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // إذا تم جلب الملف من الشبكة بنجاح، نحدث الكاش
                if (response && response.status === 200 && response.type !== 'opaque') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // إذا فشل الاتصال بالشبكة (أوفلاين)، نرجع الملف من الكاش
                return caches.match(event.request);
            })
    );
});

// ===== رسائل من التطبيق =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});
