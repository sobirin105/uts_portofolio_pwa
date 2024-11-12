const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/style.css',
  '/styles/responsive.css',
  '/images/Birin_3.png',
  '/images/portfolios/portfolio-1.png',
  '/images/portfolios/portfolio-2.png',
  '/images/portfolios/portfolio-3.jpeg',
  '/resume.pdf'
];

// Install event - cache semua aset saat pertama kali service worker diinstal
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('Service Worker: Caching failed', error))
  );
  self.skipWaiting(); // Agar service worker segera aktif setelah instalasi
});

// Activate event - membersihkan cache lama yang tidak diperlukan
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Service Worker: Deleting old cache ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Mengambil kontrol dari semua halaman yang dibuka
});

// Fetch event - mencoba mengambil dari cache terlebih dahulu, kemudian dari jaringan
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, kembalikan response dari cache
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        // Jika tidak ada di cache, ambil dari jaringan dan cache secara dinamis
        return fetch(event.request).then(networkResponse => {
          // Pastikan response valid sebelum menambahkannya ke cache
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone response untuk dimasukkan ke cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching new resource:', event.request.url);
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      }).catch(error => {
        console.error('Service Worker: Fetching failed; returning offline page instead.', error);
        // Fallback ke halaman offline jika jaringan tidak tersedia dan tidak ada di cache
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
