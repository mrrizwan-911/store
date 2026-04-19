const CACHE_NAME = 'store-cache-v1'
const STATIC_ASSETS = ['/', '/manifest.json']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', event => {
  // Network-first for API calls, cache-first for static
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached ?? fetch(event.request))
  )
})
