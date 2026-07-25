// Minimal Stopwatch Service Worker

const CACHE_NAME = 'minimal-stopwatch-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/main.js',
  '/src/stopwatch.js',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((netRes) => {
        if (!netRes || netRes.status !== 200 || netRes.type !== 'basic') return netRes;
        const resClone = netRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return netRes;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
