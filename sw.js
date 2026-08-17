// ===== رقم الإصدار ونظام الـ Cache - غيّره مع كل تحديث رئيسي =====
const APP_VERSION = '5.3.0';
const CACHE_NAME = `cash-calc-v${APP_VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './index.html?v=' + APP_VERSION,
    './style.css',
    './style.css?v=' + APP_VERSION,
    './script.js',
    './script.js?v=' + APP_VERSION,
    './manifest.json',
    './manifest.json?v=' + APP_VERSION,
    './version.json',
    './version.json?v=' + APP_VERSION,
    './icons/icon-72.png',
    './icons/icon-72.png?v=' + APP_VERSION,
    './icons/icon-96.png',
    './icons/icon-96.png?v=' + APP_VERSION,
    './icons/icon-128.png',
    './icons/icon-128.png?v=' + APP_VERSION,
    './icons/icon-144.png',
    './icons/icon-144.png?v=' + APP_VERSION,
    './icons/icon-152.png',
    './icons/icon-152.png?v=' + APP_VERSION,
    './icons/icon-192.png',
    './icons/icon-192.png?v=' + APP_VERSION,
    './icons/icon-384.png',
    './icons/icon-384.png?v=' + APP_VERSION,
    './icons/icon-512.png',
    './icons/icon-512.png?v=' + APP_VERSION,
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap'
];

// ===== تثبيت Service Worker - يفعّل ويخزن كافة الأصول أوفلاين 100% =====
self.addEventListener('install', event => {
    console.log(`[SW v${APP_VERSION}] 🚀 تثبيت Service Worker الجديد...`);
    // التخطي الفوري للانتظار لتفعيل الكود الجديد فوراً
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            console.log(`[SW v${APP_VERSION}] 📦 التخزين المسبق لكافة ملفات وأيقونات التطبيق...`);
            for (const url of STATIC_ASSETS) {
                try {
                    const req = new Request(url, { cache: 'reload' });
                    const response = await fetch(req, { 
                        mode: url.startsWith('http') && !url.includes(location.hostname) ? 'cors' : 'same-origin' 
                    });
                    if (response && (response.ok || response.type === 'opaque')) {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    console.warn('[SW] Offline caching fallback for:', url, err);
                }
            }
        })
    );
});

// ===== تفعيل - تنظيف الكاش القديم بالكامل واستلام التحكم فوراً =====
self.addEventListener('activate', event => {
    console.log(`[SW v${APP_VERSION}] ⚡ تفعيل الخدمة وتنظيف الكاش القديم...`);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log(`[SW v${APP_VERSION}] 🗑️ حذف كاش قديم:`, name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log(`[SW v${APP_VERSION}] 🎯 استلام التحكم الفوري (clients.claim)`);
            return self.clients.claim();
        })
    );
});

// ===== استراتيجيات جلب الموارد والتعامل مع الشبكة والكاش =====
self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 1. ملف فحص الإصدار (version.json) - Network Only دائمًا مع منع الكاش تمامًا
    if (url.pathname.includes('version.json')) {
        event.respondWith(
            fetch(new Request(event.request.url, { cache: 'no-store' }))
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. أسعار الصرف ومصادر الـ API الخارجية - Network First
    if (url.hostname.includes('exchangerate') || url.hostname.includes('api.')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. الأيقونات والمانفيست والملفات الحيوية - Network First مع التحديث الفوري للكاش
    if (url.pathname.includes('/icons/') || url.pathname.includes('manifest.json')) {
        event.respondWith(
            fetch(new Request(event.request.url, { cache: 'no-cache' })).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                        // تخزين النسخة المجردة من البارامترات أيضاً لضمان العمل Offline
                        const cleanUrl = url.origin + url.pathname;
                        if (cleanUrl !== event.request.url) {
                            cache.put(cleanUrl, networkResponse.clone());
                        }
                    });
                }
                return networkResponse;
            }).catch(() => {
                // إذا كان المستخدم Offline يقرأ من الكاش فوراً
                return caches.match(event.request).then(res => {
                    if (res) return res;
                    const cleanUrl = url.origin + url.pathname;
                    return caches.match(cleanUrl);
                });
            })
        );
        return;
    }

    // 4. باقي ملفات التطبيق (HTML, CSS, JS, Fonts, Libs) - Cache First فائق السرعة (0ms) مع Background Revalidation
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // تحديث صامت في الخلفية عند توفر اتصال
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
                    }
                }).catch(() => { /* وضع عدم الاتصال */ });

                return cachedResponse;
            }

            // في حال لم يكن في الكاش، يجلبه من الشبكة ويخزنه
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // في حالة التنقل الكامل وأوفلاين تام، العودة لـ index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html').then(r => r || caches.match('./'));
                }
            });
        })
    );
});

// ===== استقبال الرسائل من الواجهة =====
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log(`[SW v${APP_VERSION}] ⏭️ تنفيذ أمر SKIP_WAITING فوراً`);
        self.skipWaiting();
    }
});
