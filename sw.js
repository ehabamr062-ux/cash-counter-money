// ===== رقم الإصدار - غيّره مع كل تحديث =====
const APP_VERSION = '5.0.0'; // PWA Stable Production Release
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
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// ===== تثبيت Service Worker - يفعّل وتخزين كافة الأصول أوفلاين =====
self.addEventListener('install', event => {
    console.log(`[SW v${APP_VERSION}] Installing Offline PWA...`);
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log(`[SW v${APP_VERSION}] Caching static assets`);
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    fetch(url, { mode: 'cors' }).then(response => {
                        if (response.ok) return cache.put(url, response);
                    }).catch(err => {
                        console.warn('[SW] Offline Cache notice for:', url, err);
                    })
                )
            );
        })
    );
});

// ===== تفعيل - تنظيف الكاش القديم واستلام التحكم فوراً =====
self.addEventListener('activate', event => {
    console.log(`[SW v${APP_VERSION}] Activating PWA Offline Mode...`);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// ===== استراتيجية Cache First الفورية (0ms) للعمل بدون إنترنت 100% =====
self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // أسعار الصرف الخارجية فقط (Network First)
    if (url.hostname.includes('exchangerate') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // لجميع أصول التطبيق والصفحات والمكتبات: Cache First للتشغيل السريع جداً 0ms بدون إنترنت
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // تحديث صامت في الخلفية عند توفر الإنترنت
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
                    }
                }).catch(() => { /* أوفلاين صامت دون أي تعطيل */ });

                return cachedResponse;
            }

            // جلب من الشبكة وحفظ في الكاش للاستخدام المستقبلي أوفلاين
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // إذا كان أوفلاين كلياً، ارجع للصفحة الرئيسية المحفوظة في الكاش
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// ===== إدارة الرسائل =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
