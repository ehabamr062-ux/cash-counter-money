// ===== رقم الإصدار - غيّره مع كل تحديث =====
const APP_VERSION = '4.2.14'; // <-- غيّر هذا الرقم مع كل رفع جديد
const CACHE_NAME = `cash-calc-v${APP_VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// ===== تثبيت Service Worker - يفعّل فوراً بدون انتظار =====
self.addEventListener('install', event => {
    console.log(`[SW v${APP_VERSION}] Installing...`);
    // skipWaiting يجعل الـ SW الجديد يأخذ التحكم فوراً
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log(`[SW v${APP_VERSION}] Caching assets`);
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

// ===== تفعيل - يحذف كل الكاشات القديمة فوراً =====
self.addEventListener('activate', event => {
    console.log(`[SW v${APP_VERSION}] Activating - clearing old caches...`);
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
        }).then(() => {
            console.log(`[SW v${APP_VERSION}] Now controlling all clients`);
            // يأخذ تحكم كل التبويبات المفتوحة فوراً
            return self.clients.claim();
        }).then(() => {
            // يخبر كل التبويبات بالتحديث
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
                });
            });
        })
    );
});

// ===== استراتيجية Network First - دايماً يجيب من النت أولاً =====
self.addEventListener('fetch', event => {
    // تجاهل chrome-extension وغيره
    if (!event.request.url.startsWith('http')) return;
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // API calls (سعر الصرف) - Network Only
    if (url.hostname.includes('exchangerate') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // الملفات المحلية (HTML, CSS, JS) - Network First مع Cache Fallback
    event.respondWith(
        fetch(event.request, { cache: 'no-cache' })
            .then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // أوفلاين - يرجع من الكاش
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
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => {
            if (event.ports[0]) event.ports[0].postMessage({ success: true });
        });
    }
});
